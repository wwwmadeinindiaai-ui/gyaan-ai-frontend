// src/lib/services/query-service.ts
// Query & Synthesis Service with Multi-Source Integration (Private + Public)
// Server-side compatible version - NO Firebase Client SDK

import { QueryRequest, SynthesizedResult, Citation } from '@/lib/types/query';
import { saveQueryHistory } from '@/lib/firebase/firestore';

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
    const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;

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
        lastError = new Error(`API call failed with status ${response.status}. Retrying...`);
        console.warn(`[QueryService] ${lastError.message}`);
        continue;
      } else {
        const errorBody = await response.json();
        throw new Error(
          `API call failed: ${response.statusText}. Details: ${JSON.stringify(errorBody)}`
        );
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.warn(`[QueryService] Network error on attempt ${i + 1}:`, lastError.message);
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

    if (query.length > 2000) {
      return { valid: false, error: 'Query cannot exceed 2000 characters' };
    }

    return { valid: true };
  }

  /**
   * Real Gemini API integration with Multi-Source (Private + Public via Google Search)
   * Returns synthesis text and real citations from groundingMetadata
   * 
   * NOTE: Private context is now passed IN from the API route (server-side)
   */
  private static async synthesizeWithAI(
    query: string,
    privateContext?: string
  ): Promise<{ synthesis: string; citations: Citation[]; privateContext?: string }> {
    console.log('[QueryService] Starting multi-source synthesis');

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
      }

      // Build composite prompt with provided private context
      let compositeQuery = query.trim();
      
      if (privateContext && privateContext.length > 0) {
        compositeQuery = `# USER QUERY:\\n${query}\\n\\n# PRIVATE DATA SOURCES (Real-time data from configured sources):\\n${privateContext}\\n\\n# INSTRUCTIONS:\\nSynthesize a comprehensive response by integrating:\\n1. Real-time public information from Google Search\\n2. The private data source content provided above\\n\\nEnsure the response clearly distinguishes between public and private sources when relevant.`;
        console.log('[QueryService] Composite query built with REAL private data');
      }

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

      // Enhanced system prompt for multi-source integration
      const enhancedSystemPrompt = `You are a world-class intelligence analyst with access to TWO distinct information streams:

1. **Google Search Results**: Real-time, publicly available information from the web
2. **Private Data Sources**: Real-time data fetched from user-configured APIs, databases, and knowledge bases

Your task:
- Synthesize information from BOTH streams into a coherent, comprehensive response
- When citing information, clearly indicate whether it comes from public sources or private data sources
- Maintain objectivity and factual accuracy
- Do not use conversational openings or closings
- Present information in a clear, analytical tone suitable for executive briefings`;

      const payload = {
        contents: [{ parts: [{ text: compositeQuery }] }],
        tools: [{ google_search: {} }],
        systemInstruction: {
          parts: [{ text: enhancedSystemPrompt }],
        },
      };

      // Make API call with exponential backoff
      const result = await makeApiCallWithBackoff(apiUrl, payload);

      const candidate = result.candidates?.[0];
      if (candidate && candidate.content?.parts?.[0]?.text) {
        const text = candidate.content.parts[0].text;

        // Extract grounding sources (public citations)
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
                  relevance: 0.9 - index * 0.05,
                });
              }
            }
          );
        }

        console.log(
          `[QueryService] Synthesis complete. Length: ${text.length}, Public citations: ${citations.length}, Real private data: ${privateContext ? 'YES' : 'NO'}`
        );

        return {
          synthesis: text,
          citations,
          privateContext: privateContext || undefined,
        };
      } else {
        throw new Error('AI response was empty or malformed.');
      }
    } catch (error) {
      console.error('[QueryService] Error in multi-source synthesis:', error);
      throw error;
    }
  }

  /**
   * Main method to synthesize a query with multi-source integration
   * 
   * @param request - The query request
   * @param userId - User ID for query history
   * @param privateContext - Optional private data context (passed from server-side API route)
   */
  static async synthesizeQuery(
    request: QueryRequest,
    userId?: string,
    privateContext?: string
  ): Promise<SynthesizedResult & { privateContext?: string }> {
    const startTime = Date.now();

    const validation = this.validateQuery(request.query);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid query');
    }

    const { synthesis, citations } = await this.synthesizeWithAI(
      request.query,
      privateContext
    );

    const result: SynthesizedResult & { privateContext?: string } = {
      id: `query_${Date.now()}`,
      query: request.query,
      synthesis,
      citations,
      confidence: 0.9,
      timestamp: new Date(),
      processingTimeMs: Date.now() - startTime,
      privateContext,
    };

    console.log('[QueryService] Query synthesized in', result.processingTimeMs, 'ms');

    // Save query history (client-side only)
    if (userId && typeof window !== 'undefined') {
      try {
        await saveQueryHistory({
          userId,
          query: request.query,
          synthesis,
          citations,
          confidence: result.confidence,
        });
        console.log('[QueryService] Query history saved successfully');
      } catch (error) {
        console.error('[QueryService] Failed to save query history:', error);
      }
    }

    return result;
  }
}

export default QueryService;
