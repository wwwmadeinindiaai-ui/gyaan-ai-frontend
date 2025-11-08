// src/lib/services/query-service.ts
// Query & Synthesis Service for AI-powered content synthesis

import { QueryRequest, SynthesizedResult, Citation } from '@/lib/types/query';
import { saveQueryHistory } from '@/lib/firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Result item format expected by dashboard
interface ResultItem {
  id: number;
  title: string;
  snippet: string;
  source: string;
  url: string;
  date: string;
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
   * Real Gemini API integration for query synthesis
   * Returns multiple structured results based on the query
   */
  private static async synthesizeWithAI(query: string): Promise<ResultItem[]> {
    console.log('[QueryService] Synthesizing query with Gemini API:', query);
    
    try {
      // Initialize Gemini API
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      // Create the prompt for synthesis - ask for structured results
      const prompt = `You are a knowledgeable AI assistant for Gyaan AI, designed to help journalists and researchers find accurate information quickly.

User Query: "${query}"

Please provide 3 distinct, relevant results related to this query. For each result, provide:
1. A concise title (max 100 characters)
2. A detailed snippet/description (2-3 sentences)
3. A suggested source type (e.g., "Academic Research", "News Analysis", "Industry Report", "Government Data", etc.)

Format your response as follows:

RESULT 1:
Title: [title here]
Snippet: [snippet here]
Source: [source type here]

RESULT 2:
...and so on.

Make each result substantive, accurate, and directly relevant to the query.`;

      // Generate content
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('[QueryService] Gemini API response received, length:', text.length);

      // Parse the structured response
      const results = this.parseGeminiResponse(text, query);
      
      return results;
    } catch (error) {
      console.error('[QueryService] Error calling Gemini API:', error);
      
      // Fallback to error message results
      return [
        {
          id: 1,
          title: 'API Error - Unable to Process Query',
          snippet: `We encountered an error while processing your query: "${query}". This might be due to API rate limits or connectivity issues. Please try again in a moment.`,
          source: 'System Message',
          url: '#',
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }
      ];
    }
  }

  /**
   * Parse Gemini's text response into structured results
   */
  private static parseGeminiResponse(text: string, query: string): ResultItem[] {
    const results: ResultItem[] = [];
    
    // Try to parse structured RESULT blocks
    const resultBlocks = text.split(/RESULT \d+:/i).slice(1);
    
    if (resultBlocks.length === 0) {
      // Fallback: if no structured format, create a single result from the whole response
      return [{
        id: 1,
        title: `AI Analysis: ${query.substring(0, 60)}${query.length > 60 ? '...' : ''}`,
        snippet: text.substring(0, 300) + (text.length > 300 ? '...' : ''),
        source: 'Gemini AI',
        url: 'https://ai.google.dev/',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }];
    }

    // Parse each result block
    resultBlocks.forEach((block, index) => {
      const titleMatch = block.match(/Title:\s*(.+)/i);
      const snippetMatch = block.match(/Snippet:\s*([\s\S]+?)(?=Source:|$)/i);
      const sourceMatch = block.match(/Source:\s*(.+)/i);

      if (titleMatch && snippetMatch) {
        results.push({
          id: index + 1,
          title: titleMatch[1].trim(),
          snippet: snippetMatch[1].trim(),
          source: sourceMatch ? sourceMatch[1].trim() : 'Gemini AI',
          url: '#',
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        });
      }
    });

    // If parsing failed, return a fallback result
    if (results.length === 0) {
      return [{
        id: 1,
        title: `AI Analysis: ${query.substring(0, 60)}${query.length > 60 ? '...' : ''}`,
        snippet: text.substring(0, 300) + (text.length > 300 ? '...' : ''),
        source: 'Gemini AI',
        url: 'https://ai.google.dev/',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }];
    }

    return results;
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

    // Synthesize with AI - get structured results
    const resultItems = await this.synthesizeWithAI(request.query);
    
    // Create synthesis text from results
    const synthesis = resultItems.map((item, i) => 
      `**${item.title}**\n${item.snippet}\n\nSource: ${item.source}`
    ).join('\n\n---\n\n');

    // Create citations from results
    const citations: Citation[] = resultItems.map(item => ({
      source: item.source,
      url: item.url || '#',
      title: item.title,
      relevance: 0.85,
    }));

    const result: SynthesizedResult = {
      id: `query_${Date.now()}`,
      query: request.query,
      synthesis,
      citations,
      confidence: 0.85,
      timestamp: new Date(),
      processingTimeMs: Date.now() - startTime,
      // Add the data array for dashboard compatibility
      data: resultItems,
    } as any;

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
