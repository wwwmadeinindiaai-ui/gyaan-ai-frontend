/**
 * GDELT (Global Database of Events, Language, and Tone) Connector
 * 
 * Fetches global news events from the GDELT Project, which monitors
 * broadcast, print, and web news from nearly every corner of every
 * country in over 100 languages.
 * 
 * API Documentation: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/
 * 
 * @module gdelt-connector
 */

/**
 * Raw GDELT article from API response
 */
interface GDELTArticle {
  url: string;
  urltone?: number;
  domain?: string;
  urlpubtimedate?: string;
  urlpubdate?: string;
  language?: string;
  title?: string;
}

/**
 * GDELT API response structure
 */
interface GDELTResponse {
  articles?: GDELTArticle[];
}

/**
 * Search options for GDELT queries
 */
export interface GDELTSearchOptions {
  /** Search query/keyword */
  query: string;
  
  /** Maximum number of articles to fetch (default: 250, max: 250) */
  maxRecords?: number;
  
  /** Mode: 'ArtList' for article list (default) */
  mode?: string;
  
  /** Format: 'json' (default) */
  format?: string;
  
  /** Time span: number of minutes back to search (default: 1440 = 24 hours) */
  timespan?: number;
  
  /** Sort by: 'DateDesc' (default), 'DateAsc', 'ToneDesc', 'ToneAsc' */
  sort?: string;
}

/**
 * Normalized GDELT result matching connector interface
 */
export interface GDELTResult {
  title: string;
  url: string;
  summary?: string;
  content?: string;
  imageUrl?: string;
  date: Date;
  source: string;
  metadata?: {
    tone?: number;
    domain?: string;
    language?: string;
  };
}

/**
 * GDELTConnector class for fetching global news events
 * 
 * GDELT monitors global news media in real-time, providing
 * comprehensive coverage of events worldwide.
 * 
 * @example
 * ```typescript
 * const connector = new GDELTConnector();
 * const results = await connector.search({
 *   query: 'climate change',
 *   maxRecords: 100,
 *   timespan: 1440 // 24 hours
 * });
 * ```
 */
export class GDELTConnector {
  private baseUrl: string = 'https://api.gdeltproject.org/api/v2/doc/doc';

  /**
   * Search GDELT for articles matching query
   * 
   * @param options - Search options including query and filters
   * @returns Array of normalized article results
   * @throws Error if API request fails or returns invalid data
   */
  async search(options: GDELTSearchOptions): Promise<GDELTResult[]> {
    const {
      query,
      maxRecords = 250,
      mode = 'ArtList',
      format = 'json',
      timespan = 1440, // 24 hours
      sort = 'DateDesc',
    } = options;

    const startTime = Date.now();

    console.log(
      `[GDELTConnector] Searching for "${query}" (max: ${maxRecords}, timespan: ${timespan}m)`
    );

    try {
      // Build query parameters
      const params = new URLSearchParams({
        query: query,
        mode: mode,
        maxrecords: maxRecords.toString(),
        format: format,
        timespan: `${timespan}m`,
        sort: sort,
      });

      const url = `${this.baseUrl}?${params.toString()}`;

      console.log(`[GDELTConnector] Fetching: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Timeout after 30 seconds
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(
          `GDELT API error: ${response.status} ${response.statusText}`
        );
      }

      const data: GDELTResponse = await response.json();

      if (!data.articles || !Array.isArray(data.articles)) {
        console.warn('[GDELTConnector] No articles found in response');
        return [];
      }

      const results = this.normalizeResults(data.articles);

      const duration = Date.now() - startTime;
      console.log(
        `[GDELTConnector] Found ${results.length} articles in ${duration}ms`
      );

      if (duration > 5000) {
        console.warn(
          `[GDELTConnector] Performance warning: Request took ${duration}ms`
        );
      }

      return results;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('[GDELTConnector] Request timeout after 30s');
          throw new Error('GDELT API request timeout');
        }
        console.error('[GDELTConnector] Search failed:', error.message);
        throw new Error(`GDELT search failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Normalize GDELT articles to standard format
   * 
   * @param articles - Raw GDELT articles from API
   * @returns Array of normalized results
   */
  private normalizeResults(articles: GDELTArticle[]): GDELTResult[] {
    const results: GDELTResult[] = [];

    for (const article of articles) {
      try {
        // Skip articles without URL or title
        if (!article.url || !article.title) {
          continue;
        }

        // Parse date (format: YYYYMMDDHHmmss)
        let date = new Date();
        if (article.urlpubtimedate) {
          const dateStr = article.urlpubtimedate;
          const year = parseInt(dateStr.substring(0, 4));
          const month = parseInt(dateStr.substring(4, 6)) - 1; // 0-indexed
          const day = parseInt(dateStr.substring(6, 8));
          const hour = parseInt(dateStr.substring(8, 10) || '0');
          const minute = parseInt(dateStr.substring(10, 12) || '0');
          const second = parseInt(dateStr.substring(12, 14) || '0');

          date = new Date(year, month, day, hour, minute, second);

          // Validate date
          if (isNaN(date.getTime())) {
            console.warn(
              `[GDELTConnector] Invalid date for article: ${article.url}`
            );
            date = new Date();
          }
        } else if (article.urlpubdate) {
          const dateStr = article.urlpubdate;
          const year = parseInt(dateStr.substring(0, 4));
          const month = parseInt(dateStr.substring(4, 6)) - 1;
          const day = parseInt(dateStr.substring(6, 8));

          date = new Date(year, month, day);

          if (isNaN(date.getTime())) {
            date = new Date();
          }
        }

        results.push({
          title: article.title,
          url: article.url,
          summary: undefined, // GDELT doesn't provide summaries
          content: undefined, // GDELT doesn't provide full content
          imageUrl: undefined, // GDELT doesn't provide images
          date: date,
          source: 'gdelt',
          metadata: {
            tone: article.urltone,
            domain: article.domain,
            language: article.language,
          },
        });
      } catch (error) {
        console.warn(
          `[GDELTConnector] Failed to normalize article:`,
          error,
          article
        );
      }
    }

    return results;
  }

  /**
   * Get recent global news articles
   * 
   * Convenience method for fetching recent news without specific query.
   * 
   * @param limit - Maximum number of articles (default: 100)
   * @param timespan - Minutes to look back (default: 1440 = 24 hours)
   * @returns Array of recent news articles
   */
  async getRecentNews(
    limit: number = 100,
    timespan: number = 1440
  ): Promise<GDELTResult[]> {
    // Use a broad query to get recent news
    return this.search({
      query: 'news OR world OR global',
      maxRecords: limit,
      timespan: timespan,
      sort: 'DateDesc',
    });
  }

  /**
   * Search for trending topics
   * 
   * @param topic - Topic to search for
   * @param hours - Hours to look back (default: 24)
   * @returns Array of articles about the topic
   */
  async searchTrending(
    topic: string,
    hours: number = 24
  ): Promise<GDELTResult[]> {
    return this.search({
      query: topic,
      maxRecords: 250,
      timespan: hours * 60, // Convert hours to minutes
      sort: 'ToneDesc', // Sort by tone to get most positive coverage first
    });
  }
}

// ========================================
// STANDARD CONNECTOR INTERFACE ADAPTER
// ========================================

/**
 * Standard connector interface adapter for GDELT
 * Converts GDELT-specific format to SearchConnectorResult format
 * for compatibility with other connectors in the system
 * 
 * @param query - Search query
 * @returns Array of results in standard SearchConnectorResult format
 */
export async function fetchFromGDELT(query: string): Promise<any[]> {
  try {
    const connector = new GDELTConnector();
    const results = await connector.search({ 
      query, 
      maxRecords: 10,
      timespan: 1440 // 24 hours
    });
    
    // Map GDELT-specific format to standard connector format
    return results.map(item => ({
      title: item.title,
      url: item.url,
      snippet: item.summary,           // Map summary -> snippet
      thumbnail: item.imageUrl,        // Map imageUrl -> thumbnail  
      source: 'GDELT',
      publishedAt: item.date.toISOString(), // Convert Date -> ISO string
    }));
  } catch (error) {
    console.error('[fetchFromGDELT] Error:', error);
    return [];
  }
}

// Singleton instance
export const gdeltConnector = new GDELTConnector();
