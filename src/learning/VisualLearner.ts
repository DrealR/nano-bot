/**
 * VisualLearner - Screenshot capture and analysis for visual learning
 *
 * Enables bots to learn from screenshots by analyzing visual content
 * using Gemini's vision capabilities. Extracts objects, patterns, text,
 * and actionable insights from the captured images.
 */

import { GeminiProvider, ImageAnalysisResult } from '../ai/providers/gemini';
import { VisualLearningData } from '../core/types';
// Browser-compatible UUID generator
const randomUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export interface VisualLearnerConfig {
  /** API key for Gemini provider */
  apiKey: string;
  /** Model to use for vision analysis */
  model?: string;
  /** Custom analysis prompt template */
  customPrompt?: string;
  /** Minimum confidence threshold for detections (0-1) */
  confidenceThreshold?: number;
  /** Enable color analysis */
  analyzeColors?: boolean;
  /** Enable pattern recognition */
  analyzePatterns?: boolean;
  /** Enable text extraction */
  extractText?: boolean;
}

export interface ScreenshotOptions {
  /** Quality of the screenshot (0-1) */
  quality?: number;
  /** Format of the screenshot */
  format?: 'png' | 'jpeg' | 'webp';
  /** Scale factor for the screenshot */
  scale?: number;
}

export interface DetectedObject {
  type: string;
  label: string;
  position: { x: number; y: number; width: number; height: number };
  confidence: number;
  properties?: Record<string, any>;
}

export interface Pattern {
  name: string;
  description: string;
  confidence: number;
  occurrences: number;
}

/**
 * VisualLearner class for screenshot analysis and visual learning
 */
export class VisualLearner {
  private provider: GeminiProvider;
  private config: Required<VisualLearnerConfig>;
  private captureIntervalId: ReturnType<typeof setInterval> | null = null;
  private lastCaptureTime: number = 0;
  private captureHistory: VisualLearningData[] = [];
  private maxHistorySize: number = 100;

  constructor(config: VisualLearnerConfig) {
    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'gemini-1.5-flash',
      customPrompt: config.customPrompt || this.getDefaultPrompt(),
      confidenceThreshold: config.confidenceThreshold ?? 0.5,
      analyzeColors: config.analyzeColors ?? true,
      analyzePatterns: config.analyzePatterns ?? true,
      extractText: config.extractText ?? true,
    };

    this.provider = new GeminiProvider({
      apiKey: this.config.apiKey,
      model: this.config.model,
    });
  }

  /**
   * Get the default analysis prompt
   */
  private getDefaultPrompt(): string {
    return `Analyze this screenshot from a 3D voxel world environment where NanoBots operate.

Please provide:
1. OBJECTS: List all visible UI elements, 3D objects, or entities with their approximate positions
2. PATTERNS: Identify visual patterns, grids, or repeating elements
3. TEXT: Extract any visible text, labels, or numbers
4. COLORS: Describe the dominant colors and color scheme
5. LAYOUT: Describe the spatial layout and regions
6. INSIGHTS: Provide actionable insights for a bot operating in this environment

Format your response clearly with these sections.`;
  }

  /**
   * Capture a screenshot from a canvas element
   * @param canvas - HTML Canvas element or Three.js WebGLRenderer
   * @param options - Screenshot capture options
   * @returns Base64 encoded image data
   */
  public captureScreenshot(
    canvas: HTMLCanvasElement | { domElement: HTMLCanvasElement },
    options: ScreenshotOptions = {}
  ): string {
    const {
      quality = 0.95,
      format = 'png',
      scale = 1,
    } = options;

    // Get the actual canvas element
    const canvasElement = 'domElement' in canvas ? canvas.domElement : canvas;

    // Create a temporary canvas if scaling is needed
    let targetCanvas = canvasElement;
    if (scale !== 1) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvasElement.width * scale;
      tempCanvas.height = canvasElement.height * scale;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.scale(scale, scale);
        ctx.drawImage(canvasElement, 0, 0);
        targetCanvas = tempCanvas;
      }
    }

    // Convert to base64
    const mimeType = `image/${format}`;
    const dataUrl = targetCanvas.toDataURL(mimeType, quality);

    // Extract just the base64 data (remove data:image/png;base64, prefix)
    const base64Data = dataUrl.split(',')[1];

    this.lastCaptureTime = Date.now();

    return base64Data;
  }

  /**
   * Analyze a screenshot using Gemini vision API
   * @param imageData - Base64 encoded image or data URL
   * @param customPrompt - Optional custom analysis prompt
   * @returns Image analysis result from Gemini
   */
  public async analyzeScreenshot(
    imageData: string,
    customPrompt?: string
  ): Promise<ImageAnalysisResult> {
    const prompt = customPrompt || this.config.customPrompt;

    try {
      const result = await this.provider.analyzeImage(imageData, prompt);
      return result;
    } catch (error) {
      console.error('Visual learning analysis error:', error);
      throw new Error(
        `Failed to analyze screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Extract detected objects from analysis result
   * @param analysis - Analysis result from Gemini
   * @returns Array of detected objects
   */
  public extractObjects(analysis: ImageAnalysisResult): DetectedObject[] {
    const objects: DetectedObject[] = [];

    // Parse from insights and detected objects
    if (analysis.detectedObjects) {
      analysis.detectedObjects.forEach((objName, index) => {
        objects.push({
          type: this.categorizeObject(objName),
          label: objName,
          position: { x: 0, y: 0, width: 0, height: 0 }, // Would need OCR/detection for exact positions
          confidence: analysis.confidence,
          properties: {},
        });
      });
    }

    // Parse from insights text
    analysis.insights.forEach((insight) => {
      const objectMatches = insight.match(/\b(bot|crystal|platform|portal|pillar|node|barrier)\b/gi);
      if (objectMatches) {
        objectMatches.forEach((match) => {
          if (!objects.find(o => o.label.toLowerCase() === match.toLowerCase())) {
            objects.push({
              type: this.categorizeObject(match),
              label: match,
              position: { x: 0, y: 0, width: 0, height: 0 },
              confidence: analysis.confidence * 0.8,
              properties: { source: 'insight_extraction' },
            });
          }
        });
      }
    });

    return objects.filter(obj => obj.confidence >= this.config.confidenceThreshold);
  }

  /**
   * Extract patterns from analysis result
   * @param analysis - Analysis result from Gemini
   * @returns Array of identified patterns
   */
  public extractPatterns(analysis: ImageAnalysisResult): Pattern[] {
    if (!this.config.analyzePatterns) {
      return [];
    }

    const patterns: Pattern[] = [];

    // Look for pattern-related keywords in insights
    const patternKeywords = ['grid', 'pattern', 'repeating', 'symmetr', 'array', 'cluster', 'formation'];

    analysis.insights.forEach((insight) => {
      const lowerInsight = insight.toLowerCase();

      for (const keyword of patternKeywords) {
        if (lowerInsight.includes(keyword)) {
          patterns.push({
            name: keyword,
            description: insight,
            confidence: analysis.confidence,
            occurrences: 1,
          });
          break;
        }
      }
    });

    // Check for grid patterns in layout
    if (analysis.summary.toLowerCase().includes('grid')) {
      patterns.push({
        name: 'grid_layout',
        description: 'Grid-based spatial organization detected',
        confidence: analysis.confidence,
        occurrences: 1,
      });
    }

    return patterns;
  }

  /**
   * Update bot knowledge with visual learning data
   * @param botId - ID of the bot to update
   * @param analysis - Analysis result from screenshot
   * @param updateCallback - Callback to update bot's memory/knowledge
   * @returns Visual learning data object
   */
  public async updateBotKnowledge(
    botId: string,
    analysis: ImageAnalysisResult,
    updateCallback?: (data: VisualLearningData) => void
  ): Promise<VisualLearningData> {
    const startTime = Date.now();

    const objects = this.extractObjects(analysis);
    const patterns = this.extractPatterns(analysis);

    const learningData: VisualLearningData = {
      id: randomUUID(),
      botId,
      timestamp: Date.now(),
      screenshotPath: '', // Would be set if saving to disk
      detectedElements: objects,
      patterns,
      textContent: analysis.text ? [analysis.text] : [],
      colorAnalysis: {
        dominant: analysis.colors || [],
        palette: analysis.colors || [],
        contrast: 0.5, // Would need more sophisticated color analysis
      },
      layoutStructure: {
        type: this.inferLayoutType(analysis),
        regions: this.extractRegions(analysis),
      },
      insights: analysis.insights,
      overallConfidence: analysis.confidence,
      modelUsed: this.config.model,
      processingTime: Date.now() - startTime,
    };

    // Add to history
    this.captureHistory.push(learningData);
    if (this.captureHistory.length > this.maxHistorySize) {
      this.captureHistory.shift();
    }

    // Call update callback if provided
    if (updateCallback) {
      updateCallback(learningData);
    }

    return learningData;
  }

  /**
   * Schedule automatic screenshot captures at intervals
   * @param interval - Interval in milliseconds
   * @param canvas - Canvas element to capture
   * @param botId - ID of the bot performing the learning
   * @param updateCallback - Callback to update bot knowledge
   */
  public scheduleCapture(
    interval: number,
    canvas: HTMLCanvasElement | { domElement: HTMLCanvasElement },
    botId: string,
    updateCallback?: (data: VisualLearningData) => void
  ): void {
    // Clear existing interval if any
    if (this.captureIntervalId) {
      this.stopScheduledCapture();
    }

    this.captureIntervalId = setInterval(async () => {
      try {
        const screenshot = this.captureScreenshot(canvas);
        const analysis = await this.analyzeScreenshot(screenshot);
        await this.updateBotKnowledge(botId, analysis, updateCallback);
      } catch (error) {
        console.error('Scheduled capture error:', error);
      }
    }, interval);
  }

  /**
   * Stop scheduled screenshot captures
   */
  public stopScheduledCapture(): void {
    if (this.captureIntervalId) {
      clearInterval(this.captureIntervalId);
      this.captureIntervalId = null;
    }
  }

  /**
   * Get capture history
   * @param limit - Maximum number of entries to return
   * @returns Array of visual learning data
   */
  public getCaptureHistory(limit?: number): VisualLearningData[] {
    if (limit) {
      return this.captureHistory.slice(-limit);
    }
    return [...this.captureHistory];
  }

  /**
   * Clear capture history
   */
  public clearHistory(): void {
    this.captureHistory = [];
  }

  /**
   * Get the last capture time
   */
  public getLastCaptureTime(): number {
    return this.lastCaptureTime;
  }

  // Helper methods

  /**
   * Categorize an object based on its name
   */
  private categorizeObject(name: string): string {
    const lower = name.toLowerCase();

    if (lower.includes('bot') || lower.includes('agent')) return 'entity';
    if (lower.includes('crystal') || lower.includes('energy')) return 'resource';
    if (lower.includes('platform') || lower.includes('floor')) return 'terrain';
    if (lower.includes('portal') || lower.includes('gateway')) return 'structure';
    if (lower.includes('ui') || lower.includes('button') || lower.includes('menu')) return 'interface';
    if (lower.includes('text') || lower.includes('label')) return 'text';

    return 'unknown';
  }

  /**
   * Infer layout type from analysis
   */
  private inferLayoutType(analysis: ImageAnalysisResult): VisualLearningData['layoutStructure']['type'] {
    const summary = analysis.summary.toLowerCase();
    const insights = analysis.insights.join(' ').toLowerCase();
    const text = summary + ' ' + insights;

    if (text.includes('grid')) return 'grid';
    if (text.includes('flex') || text.includes('horizontal') || text.includes('vertical')) return 'flex';
    if (text.includes('float')) return 'float';
    if (text.includes('absolute') || text.includes('positioned')) return 'absolute';

    return 'unknown';
  }

  /**
   * Extract regions from analysis
   */
  private extractRegions(analysis: ImageAnalysisResult): Array<{
    name: string;
    bounds: { x: number; y: number; width: number; height: number };
  }> {
    const regions: Array<{
      name: string;
      bounds: { x: number; y: number; width: number; height: number };
    }> = [];

    // Look for spatial references in insights
    const spatialKeywords = ['top', 'bottom', 'left', 'right', 'center', 'corner', 'edge'];

    analysis.insights.forEach((insight, index) => {
      const lowerInsight = insight.toLowerCase();

      for (const keyword of spatialKeywords) {
        if (lowerInsight.includes(keyword)) {
          regions.push({
            name: `region_${keyword}_${index}`,
            bounds: { x: 0, y: 0, width: 0, height: 0 }, // Would need OCR/detection for exact bounds
          });
          break;
        }
      }
    });

    return regions;
  }

  /**
   * Export learning data as JSON
   * @param limit - Optional limit on number of entries
   */
  public exportLearningData(limit?: number): string {
    const data = limit ? this.captureHistory.slice(-limit) : this.captureHistory;

    return JSON.stringify({
      learningData: data,
      totalCaptures: this.captureHistory.length,
      config: {
        model: this.config.model,
        confidenceThreshold: this.config.confidenceThreshold,
      },
      exportedAt: Date.now(),
    }, null, 2);
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.stopScheduledCapture();
    this.captureHistory = [];
  }
}
