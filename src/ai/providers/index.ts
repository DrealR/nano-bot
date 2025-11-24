/**
 * AI Provider Factory
 * Central export point for all AI providers with factory function
 */

import { BaseProvider, ProviderConfig } from './base';
import { GroqProvider } from './groq';
import { OpenRouterProvider, OpenRouterConfig } from './openrouter';
import { GeminiProvider } from './gemini';

export type ProviderType = 'groq' | 'openrouter' | 'gemini';

export interface CreateProviderOptions {
  type: ProviderType;
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  siteName?: string;
  siteUrl?: string;
}

/**
 * Factory function to create the appropriate AI provider
 * @param options - Provider configuration options
 * @returns Instance of the requested provider
 */
export function createProvider(options: CreateProviderOptions): BaseProvider {
  const { type, apiKey, model, temperature, maxTokens, siteName, siteUrl } =
    options;

  // Get API key from environment if not provided
  let key = apiKey;
  if (!key) {
    const envKey = getApiKeyFromEnv(type);
    if (!envKey) {
      throw new Error(
        `API key not provided and VITE_${type.toUpperCase()}_API_KEY not found in environment`
      );
    }
    key = envKey;
  }

  const baseConfig: ProviderConfig = {
    apiKey: key,
    model,
    temperature,
    maxTokens,
  };

  switch (type) {
    case 'groq':
      return new GroqProvider(baseConfig);

    case 'openrouter': {
      const openRouterConfig: OpenRouterConfig = {
        ...baseConfig,
        siteName,
        siteUrl,
      };
      return new OpenRouterProvider(openRouterConfig);
    }

    case 'gemini':
      return new GeminiProvider(baseConfig);

    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
}

/**
 * Get API key from Vite environment variables
 */
function getApiKeyFromEnv(type: ProviderType): string | undefined {
  const envVarMap: Record<ProviderType, string> = {
    groq: 'VITE_GROQ_API_KEY',
    openrouter: 'VITE_OPENROUTER_API_KEY',
    gemini: 'VITE_GEMINI_API_KEY',
  };

  const envVar = envVarMap[type];
  return import.meta.env[envVar];
}

/**
 * Create a Groq provider with default settings
 */
export function createGroqProvider(
  apiKey?: string,
  model?: string
): GroqProvider {
  return createProvider({
    type: 'groq',
    apiKey,
    model,
  }) as GroqProvider;
}

/**
 * Create an OpenRouter provider with default settings
 */
export function createOpenRouterProvider(
  apiKey?: string,
  model?: string
): OpenRouterProvider {
  return createProvider({
    type: 'openrouter',
    apiKey,
    model,
  }) as OpenRouterProvider;
}

/**
 * Create a Gemini provider with default settings
 */
export function createGeminiProvider(
  apiKey?: string,
  model?: string
): GeminiProvider {
  return createProvider({
    type: 'gemini',
    apiKey,
    model,
  }) as GeminiProvider;
}

// Re-export types and classes for convenience
export { BaseProvider, ProviderConfig } from './base';
export { GroqProvider } from './groq';
export { OpenRouterProvider, OpenRouterConfig } from './openrouter';
export { GeminiProvider, ImageAnalysisResult } from './gemini';
export type {
  ChatMessage,
  ChatResponse,
  AnalysisResult,
} from './base';
