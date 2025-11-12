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
 * Fetch real data from Wikipedia API
 */
async function fetchFromWikipedia(query: string, endpoint: string): Promise<string> {
  try {
    const searchUrl = `${endpoint}?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      console.warn(`[Wikipedia] API call failed: ${response.status}`);
      return '';
    }
    
    const data = await response.json();
    const searchResults = data.query?.search || [];
    
    if (searchResults.length === 0) {
      return '';
    }
    
    // Format results into text
    const formattedResults = searchResults.slice(0, 3).map((result: any, index: number) => {
      return `${index + 1}. ${result.title}: ${result.snippet.replace(/<[^>]*>/g, '')}`;
    }).join('\\n');
    
    return `Wikipedia Search Results:\\n${formattedResults}`;
  } catch (error) {
    console.error('[Wikipedia] Error fetching data:', error);
    return '';
  }
}

/**
 * Fetch real data from a custom API endpoint
 */
async function fetchFromCustomAPI(query: string, endpoint: string, config: any): Promise<string> {
  try {
    const headers: any = {
      'Content-Type': 'application/json',
    };
    
    // Add API key if provided
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }
    
    const response = await fetch(endpoint, {
      method: config.method || 'GET',
      headers,
      body: config.method === 'POST' ? JSON.stringify({ query }) : undefined,
    });
    
    if (!response.ok) {
      console.warn(`[Custom API] API call failed: ${response.status}`);
      return '';
    }
    
    const data = await response.json();
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('[Custom API] Error fetching data:', error);
    return '';
  }
}

/**
 * Fetch real data from configured data source
 * Replaces the simulated content generation with actual API calls
 */
async function fetchRealDataFromSource(source: DataSource, query: string): Promise<string> {
  const { name, config } = source;
  const service = config.service.toLowerCase();
  
  console.log(`[DataSource] Fetching real data from ${name} (${service})`);
  
  try {
    // Wikipedia integration
    if (service.includes('wikipedia')) {
      const endpoint = config.endpoint || 'https://en.wikipedia.org/w/api.php';
      const content = await fetchFromWikipedia(query, endpoint);
      return content || `No results found from ${name}`;
    }
    
    // Custom API integration
    if (service.includes('api') || config.endpoint) {
      const content = await fetchFromCustomAPI(query, config.endpoint, config);
      return content || `No results from ${name}`;
    }
    
    // Database integration (would require server-side proxy)
    if (service.includes('database')) {
      console.warn(`[DataSource] Database integration requires server-side implementation`);
      return `Database source: ${name}. Direct browser-side database queries not supported. Consider using an API proxy.`;
    }
    
    // Fallback for unknown sources
    console.warn(`[DataSource] Unknown service type: ${service}`);
    return `Data source ${name} (${service}) configured but integration not yet implemented.`;
    
  } catch (error) {
    console.error(`[DataSource] Error fetching from ${name}:`, error);
    return `Error fetching data from ${name}`;
  }
}

/**
 * Retrieve and format content from user's active private data sources
 * Now uses REAL API integration instead of simulated content
 */
async function retrievePrivateDataContext(userId: string, query: string): Promise<string> {
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

    // Fetch REAL data from all active sources in parallel
    const dataPromises = sources.map(async (source, index) => {
      const content = await fetchRealDataFromSource(source, query);
      return `[Source ${index + 1}: ${source.name} (${source.config.service})]\\n${content}`;
    });

    const privateContentArray = await Promise.all(dataPromises);
    const privateContent = privateContentArray.join('\\n\\n');

    console.log(`[PrivateData] Retrieved ${privateContent.length} chars of real data`);
    return privateContent;

  } catch (error) {
    console.error('[PrivateData] Error retrieving private data:', error);
    return '';
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

      // Step 1: Retrieve REAL private data context
      let privateContext = '';
      if (userId) {
        privateContext = await retrievePrivateDataContext(userId, query);
        console.log(`[QueryService] Private context length: ${privateContext.length} chars`);
      }

      // Step 2: Build composite prompt
      let compositeQuery = query.trim();
      
      if (privateContext) {
        compositeQuery = `# USER QUERY:\\n${query}\\n\\n# PRIVATE DATA SOURCES (Real-time data from configured sources):\\n${privateContext}\\n\\n# INSTRUCTIONS:\\nSynthesize a comprehensive response by integrating:\\n1. Real-time public information from Google Search\\n2. The private data source content provided above\\n\\nEnsure the response clearly distinguishes between public and private sources when relevant.`;
        console.log('[QueryService] Composite query built with REAL private data');
      }

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

      // Step 3: Enhanced system prompt for multi-source integration
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

    // IMPORTANT: Save query history even when synthesis succeeds
    if (userId) {
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
