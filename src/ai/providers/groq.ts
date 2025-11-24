/**
 * Groq Provider
 * Fast inference using Groq's API with llama-3.3-70b-versatile
 */

import Groq from 'groq-sdk';
import {
  BaseProvider,
  ChatMessage,
  ChatResponse,
  AnalysisResult,
  ProviderConfig,
} from './base';

export class GroqProvider extends BaseProvider {
  private client: Groq | null = null;

  constructor(config: ProviderConfig) {
    super(config);
    this.validateConfig();

    // Only create client if we have an API key
    if (this.hasApiKey()) {
      this.client = new Groq({
        apiKey: this.config.apiKey,
      });
    }
  }

  protected getDefaultModel(): string {
    return 'llama-3.3-70b-versatile';
  }

  async chat(
    messages: ChatMessage[],
    options?: Partial<ProviderConfig>
  ): Promise<ChatResponse> {
    // Return mock response if no API key
    if (!this.client) {
      return {
        content: 'AI is disabled. Please set VITE_GROQ_API_KEY in your .env file.',
        model: 'mock',
        usage: undefined,
      };
    }

    try {
      const response = await this.client.chat.completions.create({
        model: options?.model || this.getModel(),
        messages: messages as Groq.Chat.ChatCompletionMessageParam[],
        temperature: options?.temperature ?? this.config.temperature,
        max_tokens: options?.maxTokens ?? this.config.maxTokens,
      });

      const choice = response.choices[0];
      if (!choice || !choice.message.content) {
        throw new Error('No response from Groq API');
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
        `Groq chat error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async analyze(prompt: string, data: unknown): Promise<AnalysisResult> {
    // Return mock response if no API key
    if (!this.client) {
      return {
        summary: 'AI is disabled. Please set VITE_GROQ_API_KEY in your .env file.',
        insights: ['No analysis available without API key'],
        confidence: 0,
      };
    }

    const analysisPrompt = `${prompt}\n\nData to analyze:\n${JSON.stringify(data, null, 2)}\n\nProvide a structured analysis with:\n1. A brief summary\n2. Key insights (as bullet points)\n3. Confidence level (0-1)`;

    try {
      const response = await this.chat([
        {
          role: 'system',
          content:
            'You are an analytical AI assistant. Provide structured, precise analysis.',
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
        } else if (line.match(/^[•\-*]/)) {
          insights.push(line.replace(/^[•\-*]\s*/, '').trim());
        } else if (line.toLowerCase().includes('confidence')) {
          const match = line.match(/(\d+\.?\d*)/);
          if (match) {
            confidence = parseFloat(match[1]);
            if (confidence > 1) confidence = confidence / 100;
          }
        }
      }

      // If we couldn't parse structured data, use the whole response as summary
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
        `Groq analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
