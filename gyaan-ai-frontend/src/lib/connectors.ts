/**
import { fetchFromGDELT } from "./services/gdelt-connector";
 * @fileoverview External data connectors for Gyaan AI
 * @module lib/connectors
 * 
 * This module provides standardized interfaces for fetching data from external sources
 * including YouTube, Unsplash, Google Search, Wikipedia, and NewsAPI.
 * 
 * All connectors return SearchConnectorResult[] with proper error handling and fallbacks.
 */

import type { SearchConnectorResult } from "./types";
import { Timestamp } from "firebase/firestore";

// ========================================
// TYPES & INTERFACES
// ========================================

/**
 * Standard output format for all connectors
 * Ensures consistency across different data sources
 */
export interface ConnectorOutput {
  title: string;
  url: string;
  snippet?: string;
  thumbnail?: string;
  source: string;
  publishedAt?: string;
}

/**
 * Error response from a connector
 */
export interface ConnectorError {
  service: string;
  error: string;
  timestamp: Date;
}

/**
 * Connector response with error flag
 */
export interface ConnectorResponse {
  results: SearchConnectorResult[];
  error?: ConnectorError;
}

// ========================================
// CONFIGURATION & VALIDATION
// ========================================

/**
 * Validates required environment variables at module load
 * Logs warnings for missing optional API keys
 */
function validateEnvironment() {
  const optional = {
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
    UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY,
    GOOGLE_SEARCH_API_KEY: process.env.GOOGLE_SEARCH_API_KEY,
    GOOGLE_SEARCH_ENGINE_ID: process.env.GOOGLE_SEARCH_ENGINE_ID,
    NEWSAPI_KEY: process.env.NEWSAPI_KEY,
  };

  Object.entries(optional).forEach(([key, value]) => {
    if (!value) {
      console.warn(`[Connectors] Missing optional env var: ${key} - connector will return empty results`);
    }
  });
}

// Validate on module load
validateEnvironment();

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Safe fetch wrapper with comprehensive error handling
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param serviceName - Name of the service for logging
 * @returns JSON response or null on error
 */
async function safeFetch(
  url: string,
  options: RequestInit = {},
  serviceName: string = "Unknown"
): Promise<any | null> {
  const startTime = Date.now();
  
  try {
    const res = await fetch(url, { 
      ...options, 
      cache: "no-store",
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    const duration = Date.now() - startTime;
    
    if (!res.ok) {
      console.warn(`[${serviceName}] Request failed: ${res.status} ${res.statusText} (${duration}ms)`);
      return null;
    }
    
    const data = await res.json();
    console.log(`[${serviceName}] Success (${duration}ms)`);
    return data;
    
  } catch (err) {
    const duration = Date.now() - startTime;
    
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        console.warn(`[${serviceName}] Timeout after ${duration}ms`);
      } else {
        console.warn(`[${serviceName}] Error: ${err.message} (${duration}ms)`);
      }
    } else {
      console.warn(`[${serviceName}] Unknown error (${duration}ms):`, err);
    }
    
    return null;
  }
}

/**
 * Creates a fallback result when a connector fails
 */
function createFallbackResult(service: string, message: string): SearchConnectorResult[] {
  return [];
}

// ========================================
// CONNECTOR IMPLEMENTATIONS
// ========================================

/**
 * Fetches video results from YouTube Data API v3
 * @param query - Search query
 * @returns Array of video results or empty array on error
 */
export async function fetchFromYouTube(query: string): Promise<SearchConnectorResult[]> {
  try {
    const key = process.env.YOUTUBE_API_KEY;
    if (!key) {
      console.log('[YouTube] API key not configured, skipping');
      return [];
    }
    
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(query)}&key=${key}`;
    const json = await safeFetch(url, {}, 'YouTube');
    
    if (!json?.items || !Array.isArray(json.items)) {
      return createFallbackResult('YouTube', 'No results found');
    }
    
    return json.items
      .filter((v: any) => v.id?.videoId && v.snippet?.title)
      .map((v: any) => ({
        title: v.snippet.title,
        url: `https://youtube.com/watch?v=${v.id.videoId}`,
        thumbnail: v.snippet.thumbnails?.medium?.url,
        snippet: v.snippet.description,
        source: "YouTube",
        publishedAt: v.snippet.publishedAt,
      }));
      
  } catch (err) {
    console.error('[YouTube] Unexpected error:', err);
    return [];
  }
}

/**
 * Fetches images from Unsplash API
 * @param query - Search query
 * @returns Array of image results or empty array on error
 */
export async function fetchFromUnsplash(query: string): Promise<SearchConnectorResult[]> {
  try {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      console.log('[Unsplash] Access key not configured, skipping');
      return [];
    }
    
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&client_id=${accessKey}`;
    const json = await safeFetch(url, {}, 'Unsplash');
    
    if (!json?.results || !Array.isArray(json.results)) {
      return createFallbackResult('Unsplash', 'No results found');
    }
    
    return json.results
      .filter((img: any) => img.links?.html && img.urls?.small)
      .map((img: any) => ({
        title: img.alt_description ?? img.description ?? "Image",
        url: img.links.html,
        thumbnail: img.urls.small,
        snippet: img.description,
        source: "Unsplash",
      }));
      
  } catch (err) {
    console.error('[Unsplash] Unexpected error:', err);
    return [];
  }
}

/**
 * Fetches search results from Google Custom Search API
 * @param query - Search query
 * @returns Array of search results or empty array on error
 */
export async function fetchFromGoogleSearch(query: string): Promise<SearchConnectorResult[]> {
  try {
    const key = process.env.GOOGLE_SEARCH_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;
    
    if (!key || !cx) {
      console.log('[Google Search] API credentials not configured, skipping');
      return [];
    }
    
    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${key}&cx=${cx}`;
    const json = await safeFetch(url, {}, 'Google Search');
    
    if (!json?.items || !Array.isArray(json.items)) {
      return createFallbackResult('Google Search', 'No results found');
    }
    
    return json.items
      .filter((i: any) => i.title && i.link)
      .map((i: any) => ({
        title: i.title,
        url: i.link,
        snippet: i.snippet,
        thumbnail: i.pagemap?.cse_image?.[0]?.src,
        source: "Google Search",
      }));
      
  } catch (err) {
    console.error('[Google Search] Unexpected error:', err);
    return [];
  }
}

/**
 * Fetches articles from Wikipedia API with retry logic
 * @param query - Search query
 * @returns Array of Wikipedia article results or empty array on error
 */
export async function fetchFromWikipedia(query: string): Promise<SearchConnectorResult[]> {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srsearch=${encodeURIComponent(query)}&origin=*`;
  
  // Retry up to 3 times with exponential backoff
  for (let attempt = 0; attempt < 3; attempt++) {
    const json = await safeFetch(url, {}, `Wikipedia (attempt ${attempt + 1})`);
    
    if (json && json.query?.search && Array.isArray(json.query.search)) {
      return json.query.search
        .filter((i: any) => i.title)
        .map((i: any) => ({
          title: i.title,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(i.title)}`,
          snippet: i.snippet ? i.snippet.replace(/<[^>]*>/g, '') : undefined,
          source: "Wikipedia",
        }));
    }
    
    // Exponential backoff: wait 2s, 4s, 8s
    if (attempt < 2) {
      await new Promise((res) => setTimeout(res, 2000 * Math.pow(2, attempt)));
    }
  }
  
  console.warn('[Wikipedia] All retry attempts failed');
  return [];
}

/**
 * Fetches news articles from NewsAPI
 * @param query - Search query
 * @returns Array of news article results or empty array on error
 */
export async function fetchFromNewsAPI(query: string): Promise<SearchConnectorResult[]> {
  try {
    const apiKey = process.env.NEWSAPI_KEY;
    if (!apiKey) {
      console.log('[NewsAPI] API key not configured, skipping');
      return [];
    }
    
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&pageSize=10&language=en&apiKey=${apiKey}`;
    const json = await safeFetch(url, {}, 'NewsAPI');
    
    if (!json?.articles || !Array.isArray(json.articles)) {
      return createFallbackResult('NewsAPI', 'No articles found');
    }
    
    return json.articles
      .filter((article: any) => article.title && article.url)
      .map((article: any) => ({
        title: article.title,
        url: article.url,
        thumbnail: article.urlToImage,
        snippet: article.description,
        source: article.source?.name || "NewsAPI",
        publishedAt: article.publishedAt,
      }));
      
  } catch (err) {
    console.error('[NewsAPI] Unexpected error:', err);
    return [];
  }
}

// ========================================
// CONNECTOR DISPATCHER
// ========================================

/**
 * Routes requests to appropriate connector by service name
 * @param service - Service name (youtube, unsplash, google-search, wikipedia, newsapi)
 * @param query - Search query
 * @returns Array of results from the specified connector
 */
export async function fetchFromConnector(
  service: string,
  query: string
): Promise<SearchConnectorResult[]> {
  const startTime = Date.now();
  
  try {
    let results: SearchConnectorResult[] = [];
    
    switch (service.toLowerCase()) {
      case "youtube":
        results = await fetchFromYouTube(query);
        break;
      case "unsplash":
        results = await fetchFromUnsplash(query);
        break;
      case "google-search":
        results = await fetchFromGoogleSearch(query);
        break;
      case "wikipedia":
        results = await fetchFromWikipedia(query);
        break;
      case "newsapi":
        results = await fetchFromNewsAPI(query);
        break;
              case "gdelt":
                  results = await fetchFromGDELT(query);
                break;
      default:
        console.warn(`[Connector] Unknown service: ${service}`);
        return [];
    }
    
    const duration = Date.now() - startTime;
    console.log(`[Connector][${service}] Returned ${results.length} results (${duration}ms)`);
    
    return results;
    
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`[Connector][${service}] Fatal error (${duration}ms):`, err);
    return [];
  }
}

// ========================================
// EXPORTS
// ========================================

/**
 * List of all available connector service names
 */
export const AVAILABLE_CONNECTORS = [
  "google-search",
  "youtube",
  "unsplash",
  "wikipedia",
  "newsapi",
    "gdelt",
] as const;

export type ConnectorName = typeof AVAILABLE_CONNECTORS[number];
