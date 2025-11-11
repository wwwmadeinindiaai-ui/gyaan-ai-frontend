// src/lib/services/query-service.ts
// Query & Synthesis Service with Multi-Source Integration (Private + Public)

import { QueryRequest, SynthesizedResult, Citation } from '@/lib/types/query';
import { saveQueryHistory } from '@/lib/firebase/firestore';
import { getFirestore, collection, query as firestoreQuery, getDocs } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

// Result item format expected by dashboard
interface ResultItem {
  id: number;
  title: string;
  snippet: string;
  source: string;
  url: string;
  date: string;
}

// Data source interface
interface DataSource {
  id: string;
  name: string;
  type: string;
  status: string;
  config: {
    service: string;
    [key: string]: any;
  };
}

/**
 * Retrieve and format content from user's active private data sources
 * Simulates retrieval based on source names stored in Firestore
 */
async function retrievePrivateDataContext(userId: string): Promise<string> {
  try {
    // Get Firebase instance
    const apps = getApps();
    if (apps.length === 0) {
      console.warn('[PrivateData] Firebase not initialized');
      return '';
    }

    const db = getFirestore(apps[0]);
    const appId = process.env.NEXT_PUBLIC_APP_ID || 'default-app-id';
    
    // Fetch user's connected data sources
    const datasourcesPath = `artifacts/${appId}/users/${userId}/datasources`;
    const datasourcesRef = collection(db, datasourcesPath);
    const q = firestoreQuery(datasourcesRef);
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('[PrivateData] No private sources found for user');
      return '';
    }

    // Extract active sources
    const sources: DataSource[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as Omit<DataSource, 'id'>;
      if (data.status === 'active') {
        sources.push({ id: doc.id, ...data });
      }
    });

    if (sources.length === 0) {
      console.log('[PrivateData] No active private sources');
      return '';
    }

    console.log(`[PrivateData] Found ${sources.length} active sources:`, sources.map(s => s.name));

    // Simulate content retrieval based on source names
    // In production, this would fetch real data from the respective sources
    const privateContent = sources
      .map((source, index) => {
        // Generate simulated content based on source name and type
        const content = generateSimulatedContent(source);
        return `[Source ${index + 1}: ${source.name} (${source.config.service})]\n${content}`;
      })
      .join('\n\n');

    return privateContent;
  } catch (error) {
    console.error('[PrivateData] Error retrieving private data:', error);
    return '';
  }
}

/**
 * Generate simulated content based on data source characteristics
 * In production, replace with actual data retrieval logic
 */
function generateSimulatedContent(source: DataSource): string {
  const { name, config } = source;
  const service = config.service.toLowerCase();

  // Simulate different content based on service type
  if (service.includes('archive') || service.includes('internal')) {
    return `Internal archive data from ${name}. Contains historical records, memos, and proprietary research documents relevant to organizational knowledge base. Last updated: ${new Date().toLocaleDateString()}.`;
  } else if (service.includes('api') || service.includes('gemini')) {
    return `API-connected data source: ${name}. Provides access to structured data feeds and real-time information streams from ${config.service}.`;
  } else if (service.includes('database')) {
    return `Database connection: ${name}. Structured query access to organizational data repositories including customer records, analytics, and operational metrics.`;
  } else {
    return `Private data source: ${name}. Connected via ${config.service}. Provides domain-specific information for enhanced query context.`;
  }
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
   */
  private static async synthesizeWithAI(
    query: string,
    userId?: string
  ): Promise<{ synthesis: string; citations: Citation[]; privateContext?: string }> {
    console.log('[QueryService] Starting multi-source synthesis');

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
      }

      // Step 1: Retrieve private data context
      let privateContext = '';
      if (userId) {
        privateContext = await retrievePrivateDataContext(userId);
        console.log(`[QueryService] Private context length: ${privateContext.length} chars`);
      }

      // Step 2: Build composite prompt
      let compositeQuery = query.trim();
      
      if (privateContext) {
        compositeQuery = `# USER QUERY:\n${query}\n\n# PRIVATE ARCHIVE DATA (Internal Sources):\n${privateContext}\n\n# INSTRUCTIONS:\nSynthesize a comprehensive response by integrating:\n1. Real-time public information from Google Search\n2. The private archive data provided above\n\nEnsure the response clearly distinguishes between public and private sources when relevant.`;
        console.log('[QueryService] Composite query built with private context');
      }

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

      // Step 3: Enhanced system prompt for multi-source integration
      const enhancedSystemPrompt = `You are a world-class intelligence analyst with access to TWO distinct information streams:

1. **Google Search Results**: Real-time, publicly available information from the web
2. **Private Archive Data**: Internal organizational knowledge, memos, and proprietary sources

Your task:
- Synthesize information from BOTH streams into a coherent, comprehensive response
- When citing information, clearly indicate whether it comes from public sources or private archives
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

      // Step 4: Make API call with exponential backoff
      const result = await makeApiCallWithBackoff(apiUrl, payload);

      const candidate = result.candidates?.[0];

      if (candidate && candidate.content?.parts?.[0]?.text) {
        const text = candidate.content.parts[0].text;

        // Step 5: Extract grounding sources (public citations)
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
          `[QueryService] Synthesis complete. Length: ${text.length}, Public citations: ${citations.length}, Private context: ${privateContext ? 'YES' : 'NO'}`
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
   */
  static async synthesizeQuery(
    request: QueryRequest,
    userId?: string
  ): Promise<SynthesizedResult & { privateContext?: string }> {
    const startTime = Date.now();

    const validation = this.validateQuery(request.query);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid query');
    }

    const { synthesis, citations, privateContext } = await this.synthesizeWithAI(
      request.query,
      userId
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
      }
    }

    return result;
  }
}

export default QueryService;
