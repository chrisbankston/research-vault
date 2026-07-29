export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Area {
  id: string;
  user_id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: string;
  area_id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ResearchItem {
  id: string;
  topic_id: string;
  title: string;
  content: string;
  source_url?: string;
  created_at: string;
  updated_at: string;
}

export type KnowledgeSourceType = 'pdf' | 'docx' | 'markdown' | 'text' | 'plaud_transcript' | 'other';

export type KnowledgeProcessingStatus = 'uploaded' | 'processing' | 'completed' | 'failed';

export interface KnowledgeMetadata {
  title: string;
  summary: string;
  keywords: string[];
  topics: string[];
  actionItems: string[];
  peopleMentioned: string[];
  datesMentioned: string[];
}

export interface KnowledgeCard {
  id: string;
  title: string;
  summary: string;
  keywords: string[];
  topics: string[];
  actionItems: string[];
  peopleMentioned: string[];
  datesMentioned: string[];
  tags: string[];
  suggestedWorkspace: string;
  sourceType: KnowledgeSourceType;
  processingStatus: KnowledgeProcessingStatus;
  originalFilePath: string;
  uploadDate: string;
  relatedDocuments: string[];
  extractedMetadata: KnowledgeMetadata;
}

export interface KnowledgeCardRecord extends KnowledgeCard {
  extractedText: string;
  fileName: string;
}

export interface Attachment {
  id: string;
  research_item_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  role: "user" | "assistant";
  created_at: string;
  updated_at: string;
}
