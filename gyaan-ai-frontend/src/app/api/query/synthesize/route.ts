// src/app/api/query/synthesize/route.ts
// API endpoint for query synthesis with Google Search Grounding

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import QueryService from '@/lib/services/query-service';
import { QueryRequest, QueryResponse } from '@/lib/types/query';

/**
 * POST /api/query/synthesize
 * Synthesize a user query using AI with Google Search Grounding and return results with real citations
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      console.log('[API] Unauthorized request to /api/query/synthesize');
      return NextResponse.json(
        { success: false, error: 'Unauthorized', timestamp: new Date() },
        { status: 401 }
      );
    }

    // Parse request body
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

    // Validate required fields
    if (!body.query) {
      return NextResponse.json(
        { success: false, error: 'Query field is required', timestamp: new Date() },
        { status: 400 }
      );
    }

    // Log the request
    console.log('[API] Processing query synthesis for user:', session.user.email);
    console.log('[API] Query:', body.query);

    // Process query through QueryService (with Google Search Grounding)
    const result = await QueryService.synthesizeQuery(
      body,
      (session.user.id ?? session.user.email) || ''
    );

    console.log('[API] Query synthesized successfully in', result.processingTimeMs, 'ms');
    console.log('[API] Citations found:', result.citations.length);

    // Transform response to match dashboard expectations
    // Dashboard expects: { query: string, data: ResultItem[] }
    // Where ResultItem = { id, title, snippet, source, url, date }
    
    const transformedData = result.citations.map((citation, index) => ({
      id: index + 1,
      title: citation.title || citation.source,
      snippet: result.synthesis.substring(index * 200, (index + 1) * 200) || 
               'View the full synthesis for complete context.',
      source: citation.source,
      url: citation.url,
      date: new Date(result.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    }));

    // Return transformed data for dashboard compatibility
    return NextResponse.json(
      {
        query: result.query,
        data: transformedData,
        // Also include the full synthesis for potential future use
        synthesis: result.synthesis,
        confidence: result.confidence,
        processingTimeMs: result.processingTimeMs,
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
