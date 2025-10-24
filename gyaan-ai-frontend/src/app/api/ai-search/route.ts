import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Define the structure for AI search requests
interface AISearchRequest {
  query: string;
  model?: 'gpt-4' | 'gpt-3.5-turbo' | 'claude' | 'gemini';
  maxResults?: number;
  searchType?: 'general' | 'academic' | 'news' | 'web';
}

// Define the structure for AI search results
interface AISearchResult {
  id: string;
  title: string;
  content: string;
  source: string;
  relevanceScore: number;
  timestamp: string;
  metadata?: {
    author?: string;
    publishedDate?: string;
    domain?: string;
    tags?: string[];
  };
}

interface AISearchResponse {
  success: boolean;
  query: string;
  model: string;
  totalResults: number;
  processingTime: number;
  results: AISearchResult[];
  suggestions?: string[];
  error?: string;
}

// Initialize Gemini AI
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Real AI search function using Gemini API
async function performAISearch(request: AISearchRequest): Promise<AISearchResponse> {
  const startTime = Date.now();
  const { query, model = 'gemini', maxResults = 5, searchType = 'general' } = request;

  if (!genAI || !process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured. Please add GEMINI_API_KEY to your environment variables.');
  }

  try {
    // Initialize Gemini Pro model
    const geminiModel = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Create a comprehensive prompt for search results
    const prompt = `You are an AI-powered search assistant. Generate ${maxResults} comprehensive and relevant search results for the following query.

Query: "${query}"
Search Type: ${searchType}

For each result, provide:
1. A descriptive title
2. Detailed content/summary (100-150 words)
3. A credible source name
4. Relevance score (0-1)
5. Current timestamp
6. Metadata including author (if applicable), publication date, domain, and relevant tags

Format your response as a JSON array of objects with this structure:
[
  {
    "title": "Result title",
    "content": "Detailed content...",
    "source": "Source name",
    "relevanceScore": 0.95,
    "metadata": {
      "author": "Author name",
      "publishedDate": "2025-10-24",
      "domain": "example.com",
      "tags": ["tag1", "tag2"]
    }
  }
]

Ensure the results are factual, diverse, and highly relevant to the query.`;

    // Call Gemini API
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the AI response
    let results: AISearchResult[];
    try {
      // Extract JSON from the response (Gemini might wrap it in markdown code blocks)
      const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        const parsedResults = JSON.parse(jsonMatch[0]);
        results = parsedResults.map((r: any, index: number) => ({
          id: `result-${index + 1}-${Date.now()}`,
          title: r.title || `Result ${index + 1}`,
          content: r.content || '',
          source: r.source || 'AI Knowledge Base',
          relevanceScore: r.relevanceScore || 0.8,
          timestamp: new Date().toISOString(),
          metadata: r.metadata || {
            author: 'Gyaan AI',
            publishedDate: new Date().toISOString().split('T')[0],
            domain: 'ai.gyaan.com',
            tags: [searchType, 'AI-generated']
          }
        }));
      } else {
        // Fallback: Create a single result from the AI response
        results = [{
          id: `result-1-${Date.now()}`,
          title: `AI Analysis: ${query}`,
          content: text.substring(0, 500) + '...',
          source: 'Gemini AI',
          relevanceScore: 0.9,
          timestamp: new Date().toISOString(),
          metadata: {
            author: 'Gyaan AI',
            publishedDate: new Date().toISOString().split('T')[0],
            domain: 'ai.gyaan.com',
            tags: [searchType, 'AI-generated']
          }
        }];
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Create a result from the raw response
      results = [{
        id: `result-1-${Date.now()}`,
        title: `AI Response: ${query}`,
        content: text.substring(0, 500),
        source: 'Gemini AI',
        relevanceScore: 0.85,
        timestamp: new Date().toISOString(),
        metadata: {
          author: 'Gyaan AI',
          publishedDate: new Date().toISOString().split('T')[0],
          domain: 'ai.gyaan.com',
          tags: [searchType]
        }
      }];
    }

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      query,
      model: 'gemini-pro',
      totalResults: results.length,
      processingTime,
      results,
      suggestions: [`Related: ${query}`, `More about ${query}`, `Latest on ${query}`]
    };
  } catch (error: any) {
    console.error('Gemini AI Error:', error);
    const processingTime = Date.now() - startTime;
    
    return {
      success: false,
      query,
      model: 'gemini-pro',
      totalResults: 0,
      processingTime,
      results: [],
      error: error.message || 'Failed to perform AI search'
    };
  }
}

// POST handler for AI search
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: AISearchRequest = await request.json();
    
    // Validate query
    if (!body.query || typeof body.query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameter' },
        { status: 400 }
      );
    }

    // Perform AI search
    const searchResults = await performAISearch(body);

    return NextResponse.json(searchResults);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// GET handler for health check
export async function GET() {
  const isConfigured = !!process.env.GEMINI_API_KEY;
  
  return NextResponse.json({
    success: true,
    message: 'AI Search API is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    aiProvider: 'Google Gemini',
    configured: isConfigured,
    endpoints: {
      search: 'POST /api/ai-search',
      health: 'GET /api/ai-search'
    }
  });
}
