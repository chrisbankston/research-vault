export type AiProvider = 'openai' | 'github-models';

export interface AiProviderConfig {
  provider: AiProvider;
  apiKey: string;
  baseUrl: string;
  chatModel: string;
  embeddingModel: string;
}

export const getAiProviderConfig = (): AiProviderConfig | null => {
  const explicitProvider = process.env.AI_PROVIDER?.trim().toLowerCase();

  if (explicitProvider === 'github-models') {
    const apiKey = process.env.GITHUB_TOKEN?.trim();
    if (!apiKey) {
      return null;
    }

    return {
      provider: 'github-models',
      apiKey,
      baseUrl:
        process.env.GITHUB_MODELS_BASE_URL?.trim() || 'https://models.inference.ai.azure.com',
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

  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  if (openAiKey) {
    return {
      provider: 'openai',
      apiKey: openAiKey,
      baseUrl: process.env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1',
      chatModel: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
      embeddingModel: process.env.OPENAI_EMBEDDING_MODEL?.trim() || 'text-embedding-3-small',
    };
  }

  const githubToken = process.env.GITHUB_TOKEN?.trim();
  if (githubToken) {
    return {
      provider: 'github-models',
      apiKey: githubToken,
      baseUrl:
        process.env.GITHUB_MODELS_BASE_URL?.trim() || 'https://models.inference.ai.azure.com',
      chatModel: process.env.GITHUB_MODELS_CHAT_MODEL?.trim() || 'gpt-4.1-mini',
      embeddingModel:
        process.env.GITHUB_MODELS_EMBEDDING_MODEL?.trim() || 'text-embedding-3-small',
    };
  }

  return null;
};
