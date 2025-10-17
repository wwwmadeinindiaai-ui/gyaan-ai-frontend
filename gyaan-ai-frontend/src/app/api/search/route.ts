import { NextRequest, NextResponse } from 'next/server';

// Define the structure for search results
interface SearchResult {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  videoUrl?: string;
  source: string;
  publishedAt: string;
}

// NewsAPI article type
interface NewsAPIArticle {
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
  source: {
    name: string;
  };
  publishedAt: string;
}

// Google Search result type
interface GoogleSearchItem {
  title: string;
  snippet: string;
  link: string;
  pagemap?: {
    cse_image?: Array<{ src: string }>;
    videoobject?: Array<{ embedurl?: string; url?: string }>;
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const mode = searchParams.get('mode') || 'web';

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    let results: SearchResult[] = [];

    // Handle news and trending modes with NewsAPI
    if (mode === 'news' || mode === 'trending') {
      const newsApiKey = process.env.NEWSAPI_KEY;
      
      if (!newsApiKey) {
        return NextResponse.json(
          { error: 'NewsAPI key is not configured' },
          { status: 500 }
        );
      }

      // For trending, use top-headlines endpoint; for news, use everything endpoint
      const endpoint = mode === 'trending' 
        ? 'https://newsapi.org/v2/top-headlines'
        : 'https://newsapi.org/v2/everything';
      
      const params = new URLSearchParams({
        q: query,
        apiKey: newsApiKey,
        pageSize: '20',
        language: 'en'
      });

      // Add country parameter for trending/top-headlines
      if (mode === 'trending') {
        params.append('country', 'us');
      } else {
        params.append('sortBy', 'relevancy');
      }

      const response = await fetch(`${endpoint}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`NewsAPI error: ${response.statusText}`);
      }

      const data = await response.json();
      
      results = (data.articles || []).map((article: NewsAPIArticle, index: number) => ({
        id: `news-${index}-${Date.now()}`,
        title: article.title || 'No title',
        description: article.description || 'No description available',
        url: article.url,
        imageUrl: article.urlToImage || undefined,
        videoUrl: undefined,
        source: article.source?.name || 'Unknown',
        publishedAt: article.publishedAt || new Date().toISOString()
      }));
    }
    // Handle web mode
    else if (mode === 'web') {
      const googleApiKey = process.env.GOOGLE_SEARCH_API_KEY;
      const googleSearchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

      // If Google Search API is configured, use it
      if (googleApiKey && googleSearchEngineId) {
        const params = new URLSearchParams({
          key: googleApiKey,
          cx: googleSearchEngineId,
          q: query,
          num: '10'
        });

        const response = await fetch(
          `https://www.googleapis.com/customsearch/v1?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error(`Google Search API error: ${response.statusText}`);
        }

        const data = await response.json();
        
        results = (data.items || []).map((item: GoogleSearchItem, index: number) => {
          const imageUrl = item.pagemap?.cse_image?.[0]?.src;
          const videoUrl = item.pagemap?.videoobject?.[0]?.embedurl 
            || item.pagemap?.videoobject?.[0]?.url;

          return {
            id: `web-${index}-${Date.now()}`,
            title: item.title || 'No title',
            description: item.snippet || 'No description available',
            url: item.link,
            imageUrl: imageUrl || undefined,
            videoUrl: videoUrl || undefined,
            source: new URL(item.link).hostname,
            publishedAt: new Date().toISOString()
          };
        });
      }
      // Fallback to NewsAPI for web search if Google Search API is not configured
      else {
        const newsApiKey = process.env.NEWSAPI_KEY;
        
        if (!newsApiKey) {
          return NextResponse.json(
            { error: 'No search API keys configured (Google Search or NewsAPI)' },
            { status: 500 }
          );
        }

        const params = new URLSearchParams({
          q: query,
          apiKey: newsApiKey,
          pageSize: '20',
          language: 'en',
          sortBy: 'relevancy'
        });

        const response = await fetch(
          `https://newsapi.org/v2/everything?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error(`NewsAPI fallback error: ${response.statusText}`);
        }

        const data = await response.json();
        
        results = (data.articles || []).map((article: NewsAPIArticle, index: number) => ({
          id: `web-fallback-${index}-${Date.now()}`,
          title: article.title || 'No title',
          description: article.description || 'No description available',
          url: article.url,
          imageUrl: article.urlToImage || undefined,
          videoUrl: undefined,
          source: article.source?.name || 'Unknown',
          publishedAt: article.publishedAt || new Date().toISOString()
        }));
      }
    }
    else {
      return NextResponse.json(
        { error: 'Invalid mode. Use "news", "trending", or "web"' },
        { status: 400 }
      );
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
