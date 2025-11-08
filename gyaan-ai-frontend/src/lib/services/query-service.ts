// src/lib/services/query-service.ts
// Query & Synthesis Service for AI-powered content synthesis

import { QueryRequest, SynthesizedResult, Citation } from '@/lib/types/query';
import { saveQueryHistory } from '@/lib/firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
   * Real Gemini API integration for query synthesis
   */
  private static async synthesizeWithAI(query: string): Promise<{ synthesis: string; citations: Citation[] }> {
    console.log('[QueryService] Synthesizing query with Gemini API:', query);

    try {
      // Initialize Gemini API
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      // Create the prompt for synthesis
      const prompt = `You are a knowledgeable AI assistant for Gyaan AI, designed to help journalists and news agencies find accurate information quickly.

User Query: "${query}"

Please provide:
1. A comprehensive, well-researched answer to the query
2. Key insights and relevant context
3. If applicable, mention potential sources or references (you can suggest general source types like "academic journals", "government reports", "news archives", etc.)

Keep the response informative, accurate, and journalistic in tone. Limit to 3-4 paragraphs.`;

      // Generate content
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const synthesis = response.text();

      console.log('[QueryService] Gemini API response received, length:', synthesis.length);

      // Generate mock citations based on the query
      // In a production system, these would come from actual source verification
      const citations: Citation[] = [
        {
          source: 'Gemini AI Analysis',
          url: 'https://ai.google.dev/',
          title: `AI-Generated Insights on: ${query.substring(0, 50)}...`,
          relevance: 0.95,
        },
      ];

      return { synthesis, citations };
    } catch (error) {
      console.error('[QueryService] Error calling Gemini API:', error);
      
      // Fallback to a basic response if API fails
      const synthesis = `I apologize, but I encountered an error while processing your query: "${query}". Please try again or rephrase your question. If the problem persists, contact support.`;
      
      const citations: Citation[] = [];
      
      return { synthesis, citations };
    }
  }

  /**
   * Main method to synthesize a query
   */
  static async synthesizeQuery(request: QueryRequest, userId?: string): Promise<SynthesizedResult> {
    const startTime = Date.now();

    // Validate query
    const validation = this.validateQuery(request.query);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid query');
    }

    // Synthesize with AI
    const { synthesis, citations } = await this.synthesizeWithAI(request.query);

    const result: SynthesizedResult = {
      id: `query_${Date.now()}`,
      query: request.query,
      synthesis,
      citations,
      confidence: 0.85, // Mock confidence score
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
