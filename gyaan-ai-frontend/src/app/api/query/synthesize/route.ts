// src/app/api/query/synthesize/route.ts
// API endpoint for query synthesis with Google Search Grounding + Private Data Integration + Unified Connectors

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import QueryService from '@/lib/services/query-service';
import { QueryRequest, QueryResponse } from '@/lib/types/query';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import {
  fetchFromConnector,
  AVAILABLE_CONNECTORS,
} from "@/lib/connectors";

// Add necessary type imports for normalization
import type { BaseCitation, SearchConnectorResult } from "@/lib/types";

/**
 * Initialize Firebase Admin SDK (server-side only)
 */
function getFirestoreAdmin() {
  if (getApps().length === 0) {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT || '{}'
    );
    initializeApp({
      credential: cert(serviceAccount),
    });
  }
  return getFirestore();
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
    }).join('\n');
    return `Wikipedia Search Results:\n${formattedResults}`;
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
 */
async function fetchRealDataFromSource(source: any, query: string): Promise<string> {
  const { name, config } = source;
  const service = config.service.toLowerCase();
  console.log(`[DataSource] Fetching real data from ${name} (${service})`);
  try {
    if (service.includes('wikipedia')) {
      const endpoint = config.endpoint || 'https://en.wikipedia.org/w/api.php';
      const content = await fetchFromWikipedia(query, endpoint);
      return content || `No results found from ${name}`;
    }
    if (service.includes('api') || config.endpoint) {
      const content = await fetchFromCustomAPI(query, config.endpoint, config);
      return content || `No results from ${name}`;
    }
    if (service.includes('database')) {
      console.warn(`[DataSource] Database integration requires server-side implementation`);
      return `Database source: ${name}. Direct database queries require additional configuration.`;
    }
    console.warn(`[DataSource] Unknown service type: ${service}`);
    return `Data source ${name} (${service}) configured but integration not yet implemented.`;
  } catch (error) {
    console.error(`[DataSource] Error fetching from ${name}:`, error);
    return `Error fetching data from ${name}`;
  }
}

/**
 * Retrieve and format content from user's active private data sources
 * SERVER-SIDE ONLY - uses Firebase Admin SDK
 */
async function retrievePrivateDataContext(userId: string, query: string): Promise<string> {
  try {
    const db = getFirestoreAdmin();
    const appId = process.env.NEXT_PUBLIC_APP_ID || 'default-app-id';
    const datasourcesPath = `artifacts/${appId}/users/${userId}/datasources`;
    const snapshot = await db.collection(datasourcesPath).get();

    if (snapshot.empty) {
      console.log('[PrivateData] No private sources found for user');
      return '';
    }

    const sources: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.status === 'active') {
        sources.push({ id: doc.id, ...data });
      }
    });

    if (sources.length === 0) {
      console.log('[PrivateData] No active private sources');
      return '';
    }

    console.log(`[PrivateData] Found ${sources.length} active sources:`, sources.map(s => s.name));
    const dataPromises = sources.map(async (source, index) => {
      const content = await fetchRealDataFromSource(source, query);
      return `[Source ${index + 1}: ${source.name} (${source.config.service})]\n${content}`;
    });

    const privateContentArray = await Promise.all(dataPromises);
    const privateContent = privateContentArray.join('\n\n');

    console.log(`[PrivateData] Retrieved ${privateContent.length} chars of real data`);
    return privateContent;
  } catch (error) {
    console.error('[PrivateData] Error retrieving private data:', error);
    return '';
  }
}

/**
 * Fetch external connector results in parallel
 */
async function fetchExternalConnectorResults(query: string) {
  try {
    const connectorResults = await Promise.all(
      AVAILABLE_CONNECTORS.map(service => fetchFromConnector(service, query))
    );
    return connectorResults.flat();
  } catch (error) {
    console.warn('[Connectors] Error fetching external data:', error);
    return [];
  }
}

/**
 * POST /api/query/synthesize
 * Synthesize a user query using AI with Google Search Grounding + Private Data + Unified Connectors
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      console.log('[API] Unauthorized request to /api/query/synthesize');
      return NextResponse.json(
        { success: false, error: 'Unauthorized', timestamp: new Date() },
        { status: 401 }
      );
    }

    let body: QueryRequest;
    try {
      body = await request.json();
    } catch (error) {
      console.error('[API] Failed to parse JSON:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body', timestamp: new Date() },
        { status: 400 }
      );
    }

    if (!body.query) {
      return NextResponse.json(
        { success: false, error: 'Query field is required', timestamp: new Date() },
        { status: 400 }
      );
    }

    console.log('[API] Processing query synthesis for user:', session.user.email);
    console.log('[API] Query:', body.query);

    const userId = (session.user.id ?? session.user.email) || '';

    // Fetch private context (from Firebase)
    let privateContext = '';
    try {
      privateContext = await retrievePrivateDataContext(userId, body.query);
      console.log(`[API] Private context fetched: ${privateContext.length} chars`);
    } catch (error) {
      console.error('[API] Failed to fetch private context:', error);
    }

    // Fetch public/external data (YouTube, Unsplash, Google Search, Wikipedia, NewsAPI)
    let externalResults: any[] = [];
    try {
      externalResults = await fetchExternalConnectorResults(body.query);
      console.log(`[Connectors] External results: ${externalResults.length} items`);
    } catch (error) {
      console.warn('[Connectors] Error fetching external data:', error);
    }

    // Combine contexts for AI grounding
    const externalText = externalResults.map(res =>
      `[${res.source}] ${res.title}: ${res.snippet ?? ''}`
    ).join('\n');
    const combinedContext = [privateContext, externalText].filter(Boolean).join('\n\n');

    // Synthesize using QueryService
    const result = await QueryService.synthesizeQuery(
      body,
      userId,
      combinedContext
    );

    console.log('[API] Query synthesized successfully in', result.processingTimeMs, 'ms');
    console.log('[API] Citations found:', result.citations.length);

    // --- Citation normalization using safe type guard ---
    const connectorCitations = externalResults.map((item, index) => ({
      id: `connector-${index + 1}`,
      title: item.title,
      snippet: item.snippet,
      source: item.source,
      url: item.url,
      date: item.publishedAt
        ? new Date(item.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : undefined,
    }));
    const allCitations = [...connectorCitations, ...result.citations];

    const normalized = (allCitations as BaseCitation[]).map((citation, index) => {
      const hasSnippet =
        "snippet" in citation && typeof citation.snippet === "string";
      const hasDate =
        "date" in citation && typeof citation.date === "string";
      return {
        id: index + 1,
        title: citation.title ?? citation.source ?? "Source",
        snippet: hasSnippet
          ? citation.snippet!
          : "View the full synthesis for complete context.",
        source: citation.source ?? "Unknown",
        url: citation.url ?? "",
        date: hasDate ? citation.date : undefined,
      };
    });

    // Return dashboard-compatible response
    return NextResponse.json(
      {
        query: result.query,
        data: normalized,
        synthesis: result.synthesis,
        confidence: result.confidence,
        processingTimeMs: result.processingTimeMs,
        privateContext: result.privateContext,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Error in query synthesis:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
