export type AiProvider = 'openai' | 'github-models';

export interface AiProviderConfig {
  provider: AiProvider;
  apiKey: string;
  baseUrl: string;
  chatModel: string;
  embeddingModel: string;
}

const SUPPORTED_PROVIDERS: AiProvider[] = ['openai', 'github-models'];

const resolveExplicitProvider = (): AiProvider | null => {
  const explicitProvider = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (!explicitProvider) {
    return null;
  }

  if (!SUPPORTED_PROVIDERS.includes(explicitProvider as AiProvider)) {
    throw new Error(
      'Unsupported AI_PROVIDER. Supported values are "openai" and "github-models".'
    );
  }

  return explicitProvider as AiProvider;
};

export const getAiProviderConfig = (): AiProviderConfig | null => {
  const explicitProvider = resolveExplicitProvider();

  if (!explicitProvider) {
    return null;
  }

  if (explicitProvider === 'github-models') {
    const apiKey = process.env.GITHUB_TOKEN?.trim();
    if (!apiKey) {
      return null;
    }

    return {
      provider: 'github-models',
      apiKey,
      baseUrl:
        process.env.GITHUB_MODELS_BASE_URL?.trim() || 'https://models.github.ai/inference',
      chatModel: process.env.GITHUB_MODELS_CHAT_MODEL?.trim() || 'gpt-4.1-mini',
      embeddingModel:
        process.env.GITHUB_MODELS_EMBEDDING_MODEL?.trim() || 'text-embedding-3-small',
    };
  }

  if (explicitProvider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return null;
    }

    return {
      provider: 'openai',
      apiKey,
      baseUrl: process.env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1',
      chatModel: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
      embeddingModel: process.env.OPENAI_EMBEDDING_MODEL?.trim() || 'text-embedding-3-small',
    };
  }

  return null;
};

export const getRequiredAiProviderConfig = (context: string): AiProviderConfig => {
  const config = getAiProviderConfig();
  if (config) {
    return config;
  }

  const explicitProvider = resolveExplicitProvider();
  if (!explicitProvider) {
    throw new Error(
      `${context}: AI provider is not configured. Set AI_PROVIDER to "openai" or "github-models".`
    );
  }

  if (explicitProvider === 'openai') {
    throw new Error(`${context}: OPENAI_API_KEY is required when AI_PROVIDER="openai".`);
  }

  throw new Error(`${context}: GITHUB_TOKEN is required when AI_PROVIDER="github-models".`);
};

export const getChatModelCandidates = (config: AiProviderConfig): string[] => {
  const fromEnv = (process.env.AI_CHAT_MODEL_FALLBACKS ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const defaults = config.provider === 'github-models'
    ? ['gpt-4.1-mini', 'gpt-4o-mini', 'gpt-4.1']
    : ['gpt-4o-mini', 'gpt-4.1-mini'];

  const ordered = [config.chatModel, ...fromEnv, ...defaults];
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const model of ordered) {
    const key = model.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(model);
    }
  }

  return unique;
};
