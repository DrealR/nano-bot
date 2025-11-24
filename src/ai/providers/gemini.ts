/**
 * Gemini Provider
 * Google's Gemini AI with vision and multimodal capabilities
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import {
  BaseProvider,
  ChatMessage,
  ChatResponse,
  AnalysisResult,
  ProviderConfig,
} from './base';

export interface ImageAnalysisResult extends AnalysisResult {
  detectedObjects?: string[];
  colors?: string[];
  text?: string;
}

export class GeminiProvider extends BaseProvider {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(config: ProviderConfig) {
    super(config);
    this.validateConfig();

    this.client = new GoogleGenerativeAI(this.config.apiKey);
    this.model = this.client.getGenerativeModel({
      model: this.getModel(),
    });
  }

  protected getDefaultModel(): string {
    return 'gemini-1.5-flash';
  }

  async chat(
    messages: ChatMessage[],
    options?: Partial<ProviderConfig>
  ): Promise<ChatResponse> {
    try {
      // Use a specific model if provided in options
      const model = options?.model
        ? this.client.getGenerativeModel({ model: options.model })
        : this.model;

      // Convert messages to Gemini format
      const history = messages.slice(0, -1).map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      const lastMessage = messages[messages.length - 1];

      // Start a chat session with history
      const chat = model.startChat({
        history: history.length > 0 ? history : undefined,
        generationConfig: {
          temperature: options?.temperature ?? this.config.temperature,
          maxOutputTokens: options?.maxTokens ?? this.config.maxTokens,
        },
      });

      const result = await chat.sendMessage(lastMessage.content);
      const response = result.response;
      const text = response.text();

      if (!text) {
        throw new Error('No response from Gemini API');
      }

      return {
        content: text,
        model: this.getModel(),
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0,
        },
      };
    } catch (error) {
      throw new Error(
        `Gemini chat error: ${error instanceof Error ? error.message : 'Unknown error'}`
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
            'You are an analytical AI assistant with advanced reasoning capabilities. Provide structured, precise analysis.',
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
        `Gemini analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Analyze an image using Gemini's vision capabilities
   * @param imageData - Base64 encoded image or image URL
   * @param prompt - Optional prompt to guide the analysis
   */
  async analyzeImage(
    imageData: string,
    prompt?: string
  ): Promise<ImageAnalysisResult> {
    try {
      const visionModel = this.client.getGenerativeModel({
        model: 'gemini-1.5-flash',
      });

      const analysisPrompt =
        prompt ||
        'Analyze this image in detail. Identify objects, colors, text, and provide insights relevant to a 3D voxel environment or game scene.';

      // Prepare image part
      let imagePart: { inlineData: { data: string; mimeType: string } };

      if (imageData.startsWith('data:')) {
        // Data URL format
        const [mimeType, base64Data] = imageData.split(',');
        imagePart = {
          inlineData: {
            data: base64Data,
            mimeType: mimeType.replace('data:', '').replace(';base64', ''),
          },
        };
      } else {
        // Assume it's base64 PNG
        imagePart = {
          inlineData: {
            data: imageData,
            mimeType: 'image/png',
          },
        };
      }

      const result = await visionModel.generateContent([
        analysisPrompt,
        imagePart,
      ]);

      const response = result.response;
      const text = response.text();

      if (!text) {
        throw new Error('No response from Gemini Vision API');
      }

      // Parse structured information from the response
      const lines = text.split('\n').filter((line) => line.trim());

      let summary = '';
      const insights: string[] = [];
      const detectedObjects: string[] = [];
      const colors: string[] = [];
      let detectedText = '';
      let confidence = 0.85;

      for (const line of lines) {
        const lowerLine = line.toLowerCase();

        if (lowerLine.includes('summary') || lowerLine.includes('overview')) {
          summary = line.replace(/^[^:]+:/, '').trim();
        } else if (lowerLine.includes('object') && line.includes(':')) {
          const objects = line
            .split(':')[1]
            .split(',')
            .map((obj) => obj.trim());
          detectedObjects.push(...objects);
        } else if (lowerLine.includes('color') && line.includes(':')) {
          const colorList = line
            .split(':')[1]
            .split(',')
            .map((color) => color.trim());
          colors.push(...colorList);
        } else if (lowerLine.includes('text') && line.includes(':')) {
          detectedText = line.split(':')[1].trim();
        } else if (line.match(/^[•\-*\d+\.]/)) {
          insights.push(line.replace(/^[•\-*\d+\.\s]+/, '').trim());
        } else if (lowerLine.includes('confidence')) {
          const match = line.match(/(\d+\.?\d*)/);
          if (match) {
            confidence = parseFloat(match[1]);
            if (confidence > 1) confidence = confidence / 100;
          }
        }
      }

      if (!summary) {
        summary = text.slice(0, 200);
      }

      return {
        summary,
        insights: insights.length > 0 ? insights : [text],
        confidence,
        detectedObjects: detectedObjects.length > 0 ? detectedObjects : undefined,
        colors: colors.length > 0 ? colors : undefined,
        text: detectedText || undefined,
        raw: response,
      };
    } catch (error) {
      throw new Error(
        `Gemini image analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate embeddings for text (useful for semantic search)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const embeddingModel = this.client.getGenerativeModel({
        model: 'text-embedding-004',
      });

      const result = await embeddingModel.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      throw new Error(
        `Gemini embedding error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
