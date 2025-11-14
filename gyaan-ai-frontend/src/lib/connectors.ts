import type { SearchConnectorResult } from "./types";
import { Timestamp } from "firebase/firestore";

export interface ConnectorOutput {
  title: string;
  url: string;
  snippet?: string;
  thumbnail?: string;
  source: string;
  publishedAt?: string;
}

async function safeFetch(url: string, options: RequestInit = {}) {
  try {
    const res = await fetch(url, { ...options, cache: "no-store" });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("[Connector Error]", url, err);
    return null;
  }
}

export async function fetchFromYouTube(query: string): Promise<ConnectorOutput[]> {
  try {
    const key = process.env.YOUTUBE_API_KEY!;
    if (!key) return [];
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(query)}&key=${key}`;
    const json = await safeFetch(url);
    if (!json?.items) return [];
    return json.items.map((v: any) => ({
      title: v.snippet.title,
      url: `https://youtube.com/watch?v=${v.id.videoId}`,
      thumbnail: v.snippet.thumbnails?.medium?.url,
      snippet: v.snippet.description,
      source: "YouTube",
      publishedAt: v.snippet.publishedAt,
    }));
  } catch { return []; }
}

export async function fetchFromUnsplash(query: string): Promise<ConnectorOutput[]> {
  try {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY!;
    if (!accessKey) return [];
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&client_id=${accessKey}`;
    const json = await safeFetch(url);
    if (!json?.results) return [];
    return json.results.map((img: any) => ({
      title: img.alt_description ?? "Image",
      url: img.links.html,
      thumbnail: img.urls.small,
      snippet: img.description,
      source: "Unsplash",
    }));
  } catch { return []; }
}

export async function fetchFromGoogleSearch(query: string): Promise<ConnectorOutput[]> {
  try {
    const key = process.env.GOOGLE_SEARCH_API_KEY!;
    const cx = process.env.GOOGLE_SEARCH_ENGINE_ID!;
    if (!key || !cx) return [];
    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${key}&cx=${cx}`;
    const json = await safeFetch(url);
    if (!json?.items) return [];
    return json.items.map((i: any) => ({
      title: i.title,
      url: i.link,
      snippet: i.snippet,
      thumbnail: i.pagemap?.cse_image?.[0]?.src,
      source: "Google Search",
    }));
  } catch { return []; }
}

export async function fetchFromWikipedia(query: string): Promise<ConnectorOutput[]> {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srsearch=${encodeURIComponent(query)}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const json = await safeFetch(url);
    if (!json) {
      await new Promise((res) => setTimeout(res, 2000 * (attempt + 1)));
      continue;
    }
    if (!json.query?.search) return [];
    return json.query.search.map((i: any) => ({
      title: i.title,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(i.title)}`,
      snippet: i.snippet,
      source: "Wikipedia",
    }));
  }
  return [];
}

export async function fetchFromNewsAPI(query: string): Promise<ConnectorOutput[]> {
  try {
    const apiKey = process.env.NEWSAPI_KEY!;
    if (!apiKey) return [];
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&pageSize=10&language=en&apiKey=${apiKey}`;
    const json = await safeFetch(url);
    if (!json?.articles) return [];
    return json.articles.map((article: any) => ({
      title: article.title,
      url: article.url,
      thumbnail: article.urlToImage,
      snippet: article.description,
      source: article.source?.name || "NewsAPI",
      publishedAt: article.publishedAt,
    }));
  } catch { return []; }
}

export async function fetchFromConnector(service: string, query: string): Promise<ConnectorOutput[]> {
  try {
    switch (service) {
      case "youtube":
        return await fetchFromYouTube(query);
      case "unsplash":
        return await fetchFromUnsplash(query);
      case "google-search":
        return await fetchFromGoogleSearch(query);
      case "wikipedia":
        return await fetchFromWikipedia(query);
      case "newsapi":
        return await fetchFromNewsAPI(query);
      default:
        console.warn("Unknown connector:", service);
        return [];
    }
  } catch (err) {
    console.warn(`[Connector Failure][${service}]`, err);
    return [];
  }
}

export const AVAILABLE_CONNECTORS = [
  "google-search",
  "youtube",
  "unsplash",
  "wikipedia",
  "newsapi",
];
