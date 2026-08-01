import { getSupabaseServerClient } from '@/lib/supabaseServer';

type SupabaseServerClient = ReturnType<typeof getSupabaseServerClient>;

interface UploadCardRow {
  id: string;
  file_name: string;
  original_file_path: string;
  processing_status: string;
  upload_date: string;
  source_type?: string;
}

interface StorageObjectEntry {
  path: string;
  name: string;
}

interface ObjectExistenceResult {
  exists: boolean;
  error?: string;
}

export interface StoragePathValidationResult {
  ok: boolean;
  objectExists: boolean;
  signedUrlGenerated: boolean;
  signedUrlFetchOk: boolean;
  signedUrl?: string;
  error?: string;
}

const trimPath = (value: string): string => value.trim();

const splitDirAndName = (path: string): { dir: string; fileName: string } => {
  const normalized = trimPath(path);
  const slash = normalized.lastIndexOf('/');
  if (slash <= 0 || slash === normalized.length - 1) {
    return { dir: '', fileName: normalized };
  }

  return {
    dir: normalized.slice(0, slash),
    fileName: normalized.slice(slash + 1),
  };
};

const fetchWithTimeout = async (url: string, timeoutMs: number): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      cache: 'no-store',
    });
  } finally {
    clearTimeout(timer);
  }
};

const validateSignedUrlReachability = async (signedUrl: string): Promise<StoragePathValidationResult | null> => {
  const attempts = [12000, 12000, 15000];

  for (let index = 0; index < attempts.length; index += 1) {
    try {
      const response = await fetchWithTimeout(signedUrl, attempts[index]);
      if (response.ok) {
        return null;
      }

      if (response.status >= 500 && index < attempts.length - 1) {
        continue;
      }

      return {
        ok: false,
        objectExists: true,
        signedUrlGenerated: true,
        signedUrlFetchOk: false,
        signedUrl,
        error: `Signed URL fetch failed with status ${response.status}.`,
      };
    } catch (error) {
      if (index < attempts.length - 1) {
        continue;
      }

      const message = error instanceof Error ? error.message : 'Unknown fetch error.';
      return {
        ok: false,
        objectExists: true,
        signedUrlGenerated: true,
        signedUrlFetchOk: false,
        signedUrl,
        error: `Signed URL fetch failed: ${message}`,
      };
    }
  }

  return null;
};

export const storageObjectExists = async (
  supabase: SupabaseServerClient,
  bucket: string,
  objectPath: string
): Promise<ObjectExistenceResult> => {
  const normalizedPath = trimPath(objectPath);
  if (!normalizedPath) {
    return {
      exists: false,
      error: 'Object path is blank.',
    };
  }

  const { dir, fileName } = splitDirAndName(normalizedPath);
  if (!dir || !fileName) {
    return {
      exists: false,
      error: 'Object path format is invalid.',
    };
  }

  const { data, error } = await supabase.storage.from(bucket).list(dir, {
    limit: 1000,
  });

  if (error) {
    return {
      exists: false,
      error: `Unable to list storage directory: ${error.message}`,
    };
  }

  return {
    exists: (data ?? []).some((entry) => entry.name === fileName),
  };
};

export const validateStoragePath = async (
  supabase: SupabaseServerClient,
  bucket: string,
  objectPath: string
): Promise<StoragePathValidationResult> => {
  const normalizedPath = trimPath(objectPath);
  if (!normalizedPath) {
    return {
      ok: false,
      objectExists: false,
      signedUrlGenerated: false,
      signedUrlFetchOk: false,
      error: 'original_file_path is blank.',
    };
  }

  const existence = await storageObjectExists(supabase, bucket, normalizedPath);
  if (!existence.exists) {
    return {
      ok: false,
      objectExists: false,
      signedUrlGenerated: false,
      signedUrlFetchOk: false,
      error: existence.error || 'Storage object does not exist.',
    };
  }

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(normalizedPath, 300);

  if (signedUrlError || !signedUrlData?.signedUrl) {
    return {
      ok: false,
      objectExists: true,
      signedUrlGenerated: false,
      signedUrlFetchOk: false,
      error: `Unable to generate signed URL: ${signedUrlError?.message ?? 'Unknown error.'}`,
    };
  }

  const signedUrlValidation = await validateSignedUrlReachability(signedUrlData.signedUrl);
  if (signedUrlValidation) {
    return signedUrlValidation;
  }

  return {
    ok: true,
    objectExists: true,
    signedUrlGenerated: true,
    signedUrlFetchOk: true,
    signedUrl: signedUrlData.signedUrl,
  };
};

const monthPrefix = (isoTimestamp: string): string => {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}/${month}`;
};

const pathPrefixFromPath = (fullPath: string): string => {
  const normalized = trimPath(fullPath);
  const slash = normalized.lastIndexOf('/');
  if (slash <= 0) {
    return '';
  }
  return normalized.slice(0, slash);
};

const parseCardIdFromObjectName = (objectName: string): string | null => {
  const match = objectName.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})-/i);
  return match ? match[1] : null;
};

export interface RepairIssue {
  id: string;
  fileName: string;
  issue: 'blank_original_file_path' | 'missing_storage_object' | 'broken_signed_url';
  detail: string;
}

export interface RepairAction {
  id: string;
  action: 'updated_original_file_path' | 'marked_failed';
  detail: string;
}

export interface RepairOrphan {
  objectPath: string;
  detail: string;
}

export interface RepairLibraryReport {
  scannedCards: number;
  scannedStorageObjects: number;
  issues: RepairIssue[];
  repaired: RepairAction[];
  orphanedStorageFiles: RepairOrphan[];
}

const FILE_SOURCE_TYPES = new Set([
  'pdf',
  'docx',
  'markdown',
  'text',
  'plaud_transcript',
]);

const validateStoragePathForRepair = async (
  supabase: SupabaseServerClient,
  bucket: string,
  objectPath: string
): Promise<{ ok: boolean; error?: string }> => {
  const normalizedPath = trimPath(objectPath);
  if (!normalizedPath) {
    return { ok: false, error: 'original_file_path is blank.' };
  }

  const existence = await storageObjectExists(supabase, bucket, normalizedPath);
  if (!existence.exists) {
    return { ok: false, error: existence.error || 'Storage object does not exist.' };
  }

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(normalizedPath, 120);

  if (signedUrlError || !signedUrlData?.signedUrl) {
    return {
      ok: false,
      error: `Unable to generate signed URL: ${signedUrlError?.message ?? 'Unknown error.'}`,
    };
  }

  return { ok: true };
};

const collectStorageObjects = async (
  supabase: SupabaseServerClient,
  bucket: string,
  cards: UploadCardRow[]
): Promise<StorageObjectEntry[]> => {
  const prefixes = new Set<string>();
  for (const card of cards) {
    const fromPath = pathPrefixFromPath(card.original_file_path);
    if (fromPath) {
      prefixes.add(fromPath);
    }

    const fromDate = monthPrefix(card.upload_date);
    if (fromDate) {
      prefixes.add(fromDate);
    }
  }

  const objects: StorageObjectEntry[] = [];
  for (const prefix of prefixes) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: 1000,
    });

    if (error) {
      continue;
    }

    for (const entry of data ?? []) {
      if (!entry.name) {
        continue;
      }

      objects.push({
        path: `${prefix}/${entry.name}`,
        name: entry.name,
      });
    }
  }

  return objects;
};

const updateCardPath = async (
  supabase: SupabaseServerClient,
  cardId: string,
  newPath: string
): Promise<string | null> => {
  const { error } = await supabase
    .from('knowledge_cards')
    .update({ original_file_path: newPath })
    .eq('id', cardId);

  if (error) {
    return error.message;
  }

  return null;
};

const markCardFailed = async (
  supabase: SupabaseServerClient,
  cardId: string,
  reason: string
): Promise<string | null> => {
  const { error } = await supabase
    .from('knowledge_cards')
    .update({
      processing_status: 'failed',
      summary: reason,
    })
    .eq('id', cardId);

  if (error) {
    return error.message;
  }

  return null;
};

export const scanAndRepairKnowledgeLibrary = async (
  supabase: SupabaseServerClient,
  bucket: string
): Promise<RepairLibraryReport> => {
  const { data, error } = await supabase
    .from('knowledge_cards')
    .select('id,file_name,original_file_path,processing_status,upload_date,source_type');

  if (error) {
    throw new Error(`Unable to load knowledge cards: ${error.message}`);
  }

  const cards = (data ?? []) as UploadCardRow[];
  const objects = await collectStorageObjects(supabase, bucket, cards);
  const objectByPath = new Set(objects.map((entry) => entry.path));
  const objectByCardId = new Map<string, string[]>();
  for (const entry of objects) {
    const cardId = parseCardIdFromObjectName(entry.name);
    if (!cardId) {
      continue;
    }

    const current = objectByCardId.get(cardId) ?? [];
    current.push(entry.path);
    objectByCardId.set(cardId, current);
  }

  const issues: RepairIssue[] = [];
  const repaired: RepairAction[] = [];

  for (const card of cards) {
    const sourceType = (card.source_type ?? '').toLowerCase();
    if (!FILE_SOURCE_TYPES.has(sourceType)) {
      continue;
    }

    const path = trimPath(card.original_file_path);
    const candidatePaths = objectByCardId.get(card.id) ?? [];
    let activePath = path;

    if (!path) {
      issues.push({
        id: card.id,
        fileName: card.file_name,
        issue: 'blank_original_file_path',
        detail: 'Card has blank original_file_path.',
      });

      if (candidatePaths.length > 0) {
        const recoveredPath = candidatePaths[0];
        const updateError = await updateCardPath(supabase, card.id, recoveredPath);
        if (!updateError) {
          repaired.push({
            id: card.id,
            action: 'updated_original_file_path',
            detail: `Recovered original_file_path as ${recoveredPath}.`,
          });
          activePath = recoveredPath;
        }
      }
    }

    if (!activePath) {
      continue;
    }

    if (!objectByPath.has(activePath)) {
      issues.push({
        id: card.id,
        fileName: card.file_name,
        issue: 'missing_storage_object',
        detail: `Storage object missing for path ${activePath}.`,
      });

      if (candidatePaths.length > 0 && candidatePaths[0] !== activePath) {
        const updateError = await updateCardPath(supabase, card.id, candidatePaths[0]);
        if (!updateError) {
          repaired.push({
            id: card.id,
            action: 'updated_original_file_path',
            detail: `Updated original_file_path to ${candidatePaths[0]} after missing object detection.`,
          });
          activePath = candidatePaths[0];
        }
      } else {
        const failReason = 'Original file missing from storage. Re-upload is required.';
        const failError = await markCardFailed(supabase, card.id, failReason);
        if (!failError) {
          repaired.push({
            id: card.id,
            action: 'marked_failed',
            detail: failReason,
          });
        }
        continue;
      }
    }

    const validation = await validateStoragePathForRepair(supabase, bucket, activePath);
    if (!validation.ok) {
      issues.push({
        id: card.id,
        fileName: card.file_name,
        issue: 'broken_signed_url',
        detail: validation.error || 'Signed URL failed validation.',
      });

      const fallbackPath = candidatePaths.find((candidate) => candidate !== activePath);
      if (fallbackPath) {
        const updateError = await updateCardPath(supabase, card.id, fallbackPath);
        if (!updateError) {
          const retry = await validateStoragePathForRepair(supabase, bucket, fallbackPath);
          if (retry.ok) {
            repaired.push({
              id: card.id,
              action: 'updated_original_file_path',
              detail: `Switched original_file_path to ${fallbackPath} after signed URL validation failed.`,
            });
            continue;
          }
        }
      }

      const failReason = 'Original file link validation failed. Re-upload is required.';
      const failError = await markCardFailed(supabase, card.id, failReason);
      if (!failError) {
        repaired.push({
          id: card.id,
          action: 'marked_failed',
          detail: failReason,
        });
      }
    }
  }

  const { data: refreshedRows, error: refreshError } = await supabase
    .from('knowledge_cards')
    .select('original_file_path');

  if (refreshError) {
    throw new Error(`Unable to refresh repaired card paths: ${refreshError.message}`);
  }

  const cardPaths = new Set(
    (refreshedRows ?? [])
      .map((row) => trimPath(String((row as { original_file_path?: unknown }).original_file_path ?? '')))
      .filter(Boolean)
  );

  const orphanedStorageFiles = objects
    .filter((entry) => !cardPaths.has(entry.path))
    .map((entry) => ({
      objectPath: entry.path,
      detail: 'Storage object has no matching knowledge_cards original_file_path.',
    }));

  return {
    scannedCards: cards.length,
    scannedStorageObjects: objects.length,
    issues,
    repaired,
    orphanedStorageFiles,
  };
};