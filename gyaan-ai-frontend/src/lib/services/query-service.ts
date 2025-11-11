// src/lib/services/query-service.ts
// Query & Synthesis Service for AI-powered content synthesis with Google Search Grounding

import { QueryRequest, SynthesizedResult, Citation } from '@/lib/types/query';
import { saveQueryHistory } from '@/lib/firebase/firestore';

// Result item format expected by dashboard
interface ResultItem {
  id: number;
  title: string;
  snippet: string;
  source: string;
  url: string;
  date: string;
}

/**
 * Performs an API call with exponential backoff for retry mechanism.
 */
async function makeApiCallWithBackoff(
  apiUrl: string,
  payload: any,
  maxRetries: number = 5
): Promise<any> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    const delay = Math.pow(2, i) * 1000 + Math.random() * 1000; // 1s, 2s, 4s, 8s, 16s + jitter

    if (i > 0) {
      console.log(`[QueryService] Retry attempt ${i} after ${Math.round(delay)}ms delay`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return await response.json();
      } else if (response.status === 429 || response.status >= 500) {
        // Throttle (429) or Server Error (5xx) - retry
        lastError = new Error(`API call failed with status ${response.status}. Retrying...`);
        console.warn(`[QueryService] ${lastError.message}`);
        continue;
      } else {
        // Non-recoverable error (e.g., 400 Bad Request) - stop
        const errorBody = await response.json();
        throw new Error(
          `API call failed: ${response.statusText}. Details: ${JSON.stringify(errorBody)}`
        );
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.warn(`[QueryService] Network error on attempt ${i + 1}:`, lastError.message);
      // Network errors or fetch errors - retry
      continue;
    }
  }

  throw new Error(
    `API call failed after ${maxRetries} attempts. Last error: ${lastError?.message || 'Unknown error'}`
  );
}

class QueryService {
  /**
   * Validate query for basic requirements
   */
  private static validateQuery(query: string): { valid: boolean; error?: string } {
    if (!query || query.trim().length === 0) {
      return { valid: false, error: 'Query cannot be empty' };
    }
    if (query.trim().length < 3) {
      return { valid: false, error: 'Query must be at least 3 characters' };
    }
    if (query.length > 500) {
      return { valid: false, error: 'Query cannot exceed 500 characters' };
    }
    return { valid: true };
  }

  /**
   * Real Gemini API integration with Google Search Grounding
   * Returns synthesis text and real citations from groundingMetadata
   */
  private static async synthesizeWithAI(
    query: string
  ): Promise<{ synthesis: string; citations: Citation[] }> {
    console.log('[QueryService] Synthesizing query with Gemini API + Google Search Grounding:', query);

    try {
      // Initialize Gemini API
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
      }

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

      const systemPrompt =
        'Act as a neutral, world-class news and intelligence analyst. Provide a comprehensive, synthesized report in a clear, objective tone. Do not use conversational openings or closings.';

      const payload = {
        contents: [{ parts: [{ text: query.trim() }] }],
        // MANDATORY: Enable Google Search Grounding for real-time information
        tools: [{ google_search: {} }],
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
      };

      // Make API call with exponential backoff
      const result = await makeApiCallWithBackoff(apiUrl, payload);

      const candidate = result.candidates?.[0];

      if (candidate && candidate.content?.parts?.[0]?.text) {
        const text = candidate.content.parts[0].text;

        // Extract grounding sources
        const citations: Citation[] = [];
        const groundingMetadata = candidate.groundingMetadata;

        if (groundingMetadata && groundingMetadata.groundingAttributions) {
          groundingMetadata.groundingAttributions.forEach(
            (attribution: any, index: number) => {
              if (attribution.web?.uri && attribution.web?.title) {
                citations.push({
                  source: attribution.web.title,
                  url: attribution.web.uri,
                  title: attribution.web.title,
                  relevance: 0.9 - index * 0.05, // Decreasing relevance
                });
              }
            }
          );
        }

        console.log(
          `[QueryService] Gemini API response received. Synthesis length: ${text.length}, Citations: ${citations.length}`
        );

        return {
          synthesis: text,
          citations,
        };
      } else {
        throw new Error('AI response was empty or malformed.');
      }
    } catch (error) {
      console.error('[QueryService] Error calling Gemini API:', error);
      throw error;
    }
  }

  /**
   * Main method to synthesize a query
   */
  static async synthesizeQuery(
    request: QueryRequest,
    userId?: string
  ): Promise<SynthesizedResult> {
    const startTime = Date.now();

    // Validate query
    const validation = this.validateQuery(request.query);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid query');
    }

    // Synthesize with AI - get synthesis text and real citations
    const { synthesis, citations } = await this.synthesizeWithAI(request.query);

    const result: SynthesizedResult = {
      id: `query_${Date.now()}`,
      query: request.query,
      synthesis,
      citations,
      confidence: 0.9,
      timestamp: new Date(),
      processingTimeMs: Date.now() - startTime,
    };

    console.log('[QueryService] Query synthesized in', result.processingTimeMs, 'ms');

    // Save to history if userId is provided
    if (userId) {
      try {
        await saveQueryHistory({
          userId,
          query: request.query,
          synthesis,
          citations,
          confidence: result.confidence,
        });
      } catch (error) {
        console.error('[QueryService] Failed to save query history:', error);
        // Non-blocking error
      }
    }

    return result;
  }
}

export default QueryService;
