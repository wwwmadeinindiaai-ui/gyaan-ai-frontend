import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

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

// DuckDuckGo Instant Answer result type
interface DuckDuckGoResult {
  Text?: string;
  FirstURL?: string;
  Icon?: {
    URL?: string;
  };
}

interface DuckDuckGoRelatedTopic {
  Text?: string;
  FirstURL?: string;
  Icon?: {
    URL?: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const query = searchParams.get('q') || "";
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
      // Try DuckDuckGo Instant Answer API as fallback
      else {
        try {
          const ddgResponse = await fetch(
            `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
          );

          if (ddgResponse.ok) {
            const ddgData = await ddgResponse.json();
            const ddgResults: SearchResult[] = [];

            // Process main result if available
            if (ddgData.AbstractText && ddgData.AbstractURL) {
              ddgResults.push({
                id: `ddg-main-${Date.now()}`,
                title: ddgData.Heading || query,
                description: ddgData.AbstractText,
                url: ddgData.AbstractURL,
                imageUrl: ddgData.Image || undefined,
                videoUrl: undefined,
                source: ddgData.AbstractSource || 'DuckDuckGo',
                publishedAt: new Date().toISOString()
              });
            }

            // Process related topics
            if (ddgData.RelatedTopics && Array.isArray(ddgData.RelatedTopics)) {
              ddgData.RelatedTopics.forEach((topic: DuckDuckGoRelatedTopic | { Topics?: DuckDuckGoRelatedTopic[] }, index: number) => {
                // Handle grouped topics
                if ('Topics' in topic && Array.isArray(topic.Topics)) {
                  topic.Topics.forEach((subTopic: DuckDuckGoRelatedTopic, subIndex: number) => {
                    if (subTopic.Text && subTopic.FirstURL) {
                      ddgResults.push({
                        id: `ddg-topic-${index}-${subIndex}-${Date.now()}`,
                        title: subTopic.Text.split(' - ')[0] || 'Related Topic',
                        description: subTopic.Text || 'No description available',
                        url: subTopic.FirstURL,
                        imageUrl: subTopic.Icon?.URL || undefined,
                        videoUrl: undefined,
                        source: 'DuckDuckGo',
                        publishedAt: new Date().toISOString()
                      });
                    }
                  });
                }
                // Handle direct topics
                else if ('Text' in topic && topic.Text && topic.FirstURL) {
                  ddgResults.push({
                    id: `ddg-topic-${index}-${Date.now()}`,
                    title: topic.Text.split(' - ')[0] || 'Related Topic',
                    description: topic.Text || 'No description available',
                    url: topic.FirstURL,
                    imageUrl: topic.Icon?.URL || undefined,
                    videoUrl: undefined,
                    source: 'DuckDuckGo',
                    publishedAt: new Date().toISOString()
                  });
                }
              });
            }

            // If we have DuckDuckGo results, use them
            if (ddgResults.length > 0) {
              results = ddgResults;
            }
          }
        } catch (ddgError) {
          console.warn('DuckDuckGo API fallback failed:', ddgError);
        }

        // Final fallback to NewsAPI if DuckDuckGo didn't return results
        if (results.length === 0) {
          const newsApiKey = process.env.NEWSAPI_KEY;
          
          if (!newsApiKey) {
            return NextResponse.json(
              { error: 'No search API keys configured (Google Search, DuckDuckGo, or NewsAPI)' },
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
    }
    else {
      return NextResponse.json(
        { error: 'Invalid mode. Use "news", "trending", or "web"' },
        { status: 400 }
      );
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
