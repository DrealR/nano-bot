/**
 * OpenRouter Provider
 * Access to multiple models through OpenRouter's unified API
 * Uses OpenAI SDK with custom base URL
 */

import OpenAI from 'openai';
import {
  BaseProvider,
  ChatMessage,
  ChatResponse,
  AnalysisResult,
  ProviderConfig,
} from './base';

export interface OpenRouterConfig extends ProviderConfig {
  siteName?: string;
  siteUrl?: string;
}

export class OpenRouterProvider extends BaseProvider {
  private client: OpenAI;
  private siteName?: string;
  private siteUrl?: string;

  constructor(config: OpenRouterConfig) {
    super(config);
    this.validateConfig();

    this.siteName = config.siteName;
    this.siteUrl = config.siteUrl;

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': this.siteUrl || 'https://nanobot.local',
        'X-Title': this.siteName || 'NanoBot Framework',
      },
    });
  }

  protected getDefaultModel(): string {
    return 'meta-llama/llama-3.3-70b-instruct';
  }

  async chat(
    messages: ChatMessage[],
    options?: Partial<ProviderConfig>
  ): Promise<ChatResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: options?.model || this.getModel(),
        messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
        temperature: options?.temperature ?? this.config.temperature,
        max_tokens: options?.maxTokens ?? this.config.maxTokens,
      });

      const choice = response.choices[0];
      if (!choice || !choice.message.content) {
        throw new Error('No response from OpenRouter API');
      }

      return {
        content: choice.message.content,
        model: response.model,
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
      };
    } catch (error) {
      throw new Error(
        `OpenRouter chat error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async analyze(prompt: string, data: unknown): Promise<AnalysisResult> {
    const analysisPrompt = `${prompt}\n\nData to analyze:\n${JSON.stringify(data, null, 2)}\n\nProvide a structured analysis with:\n1. A brief summary\n2. Key insights (as bullet points)\n3. Confidence level (0-1)`;

    try {
      const response = await this.chat([
        {
          role: 'system',
          content:
            'You are an analytical AI assistant specialized in NanoBot swarm intelligence. Provide structured, precise analysis.',
        },
        {
          role: 'user',
          content: analysisPrompt,
        },
      ]);

      // Parse the response to extract structured data
      const lines = response.content.split('\n').filter((line) => line.trim());

      let summary = '';
      const insights: string[] = [];
      let confidence = 0.8; // Default confidence

      for (const line of lines) {
        if (line.toLowerCase().includes('summary')) {
          summary = line.replace(/summary:?/i, '').trim();
        } else if (line.match(/^[•\-*\d+\.]/)) {
          insights.push(line.replace(/^[•\-*\d+\.\s]+/, '').trim());
        } else if (line.toLowerCase().includes('confidence')) {
          const match = line.match(/(\d+\.?\d*)/);
          if (match) {
            confidence = parseFloat(match[1]);
            if (confidence > 1) confidence = confidence / 100;
          }
        }
      }

      // If we couldn't parse structured data, use the whole response
      if (!summary && insights.length === 0) {
        summary = response.content;
      }

      return {
        summary: summary || response.content.slice(0, 200),
        insights: insights.length > 0 ? insights : [response.content],
        confidence,
        raw: response,
      };
    } catch (error) {
      throw new Error(
        `OpenRouter analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get available models from OpenRouter
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = (await response.json()) as { data: Array<{ id: string }> };
      return data.data.map((model) => model.id);
    } catch (error) {
      throw new Error(
        `Failed to get available models: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
