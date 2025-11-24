/**
 * Base Provider Abstract Class
 * Common interface for all AI providers in the NanoBot framework
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AnalysisResult {
  summary: string;
  insights: string[];
  confidence: number;
  raw?: unknown;
}

export interface ProviderConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Abstract base class for all AI providers
 * Defines the common interface that all providers must implement
 */
export abstract class BaseProvider {
  protected config: ProviderConfig;
  protected defaultModel: string;

  constructor(config: ProviderConfig) {
    this.config = {
      temperature: 0.7,
      maxTokens: 2048,
      ...config,
    };
    this.defaultModel = config.model || this.getDefaultModel();
  }

  /**
   * Send a chat completion request
   * @param messages - Array of chat messages
   * @param options - Optional overrides for temperature, maxTokens, etc.
   */
  abstract chat(
    messages: ChatMessage[],
    options?: Partial<ProviderConfig>
  ): Promise<ChatResponse>;

  /**
   * Analyze text or data and return structured insights
   * @param prompt - The analysis prompt
   * @param data - Data to analyze
   */
  abstract analyze(prompt: string, data: unknown): Promise<AnalysisResult>;

  /**
   * Get the current model being used
   */
  getModel(): string {
    return this.config.model || this.defaultModel;
  }

  /**
   * Get the default model for this provider
   */
  protected abstract getDefaultModel(): string;

  /**
   * Validate the configuration
   */
  protected validateConfig(): void {
    if (!this.config.apiKey) {
      throw new Error(`API key is required for ${this.constructor.name}`);
    }
  }

  /**
   * Format messages for the specific provider
   */
  protected formatMessages(messages: ChatMessage[]): unknown {
    return messages;
  }

  /**
   * Parse usage information from provider response
   */
  protected parseUsage(response: unknown): ChatResponse['usage'] | undefined {
    return undefined;
  }
}
