/**
 * @fileoverview Fallback data for connectors when external APIs fail
 * @module lib/connector-fallbacks
 * 
 * Provides sample/fallback data for each connector to ensure graceful
 * degradation and a working demo experience even when APIs are unavailable.
 */
import type { SearchConnectorResult } from "./types";

// ========================================
// YOUTUBE FALLBACKS
// ========================================

export const YOUTUBE_FALLBACKS: SearchConnectorResult[] = [
  {
    title: "Introduction to TypeScript - Full Course",
    url: "https://www.youtube.com/watch?v=BwuLxPH8IDs",
    snippet: "Learn TypeScript from scratch in this comprehensive tutorial. Perfect for beginners and experienced developers.",
    thumbnail: "https://i.ytimg.com/vi/BwuLxPH8IDs/mqdefault.jpg",
    source: "YouTube",
    publishedAt: "2023-01-15T10:00:00Z",
  },
  {
    title: "Next.js 15 - What's New?",
    url: "https://www.youtube.com/watch?v=gSSsZReIFRk",
    snippet: "Explore the latest features in Next.js 15 including improved performance and new APIs.",
    thumbnail: "https://i.ytimg.com/vi/gSSsZReIFRk/mqdefault.jpg",
    source: "YouTube",
    publishedAt: "2024-10-20T14:30:00Z",
  },
  {
    title: "Building Production-Ready React Applications",
    url: "https://www.youtube.com/watch?v=NZKUirTtxcg",
    snippet: "Best practices for building scalable React applications with modern tooling.",
    thumbnail: "https://i.ytimg.com/vi/NZKUirTtxcg/mqdefault.jpg",
    source: "YouTube",
    publishedAt: "2024-03-10T09:15:00Z",
  },
];

// ========================================
// UNSPLASH FALLBACKS
// ========================================

export const UNSPLASH_FALLBACKS: SearchConnectorResult[] = [
  {
    title: "Mountain Landscape at Sunset",
    url: "https://unsplash.com/photos/mountain-landscape",
    snippet: "Stunning mountain vista with golden hour lighting",
    thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
    source: "Unsplash",
  },
  {
    title: "Modern Office Workspace",
    url: "https://unsplash.com/photos/modern-workspace",
    snippet: "Clean and minimalist desk setup with natural lighting",
    thumbnail: "https://images.unsplash.com/photo-1497366216548-37526070297c",
    source: "Unsplash",
  },
  {
    title: "City Skyline at Night",
    url: "https://unsplash.com/photos/city-skyline",
    snippet: "Urban cityscape with illuminated buildings",
    thumbnail: "https://images.unsplash.com/photo-1514565131-fce0801e5785",
    source: "Unsplash",
  },
];

// ========================================
// GOOGLE SEARCH FALLBACKS
// ========================================

export const GOOGLE_SEARCH_FALLBACKS: SearchConnectorResult[] = [
  {
    title: "React Documentation - Official Guide",
    url: "https://react.dev",
    snippet: "The library for web and native user interfaces. Learn React with interactive examples and comprehensive documentation.",
    thumbnail: "https://react.dev/images/og-home.png",
    source: "Google Search",
  },
  {
    title: "TypeScript: Typed JavaScript at Any Scale",
    url: "https://www.typescriptlang.org",
    snippet: "TypeScript extends JavaScript by adding types to the language. TypeScript speeds up your development experience.",
    thumbnail: "https://www.typescriptlang.org/images/branding/ts-lettermark-blue.png",
    source: "Google Search",
  },
  {
    title: "Next.js by Vercel - The React Framework",
    url: "https://nextjs.org",
    snippet: "Next.js enables you to create high-quality web applications with the power of React components.",
    thumbnail: "https://nextjs.org/og.png",
    source: "Google Search",
  },
];

// ========================================
// WIKIPEDIA FALLBACKS
// ========================================

export const WIKIPEDIA_FALLBACKS: SearchConnectorResult[] = [
  {
    title: "Artificial Intelligence",
    url: "https://en.wikipedia.org/wiki/Artificial_intelligence",
    snippet: "Artificial intelligence (AI) is intelligence demonstrated by machines, in contrast to the natural intelligence displayed by humans and animals.",
    source: "Wikipedia",
  },
  {
    title: "Machine Learning",
    url: "https://en.wikipedia.org/wiki/Machine_learning",
    snippet: "Machine learning (ML) is a field of study in artificial intelligence concerned with the development and study of statistical algorithms.",
    source: "Wikipedia",
  },
  {
    title: "Natural Language Processing",
    url: "https://en.wikipedia.org/wiki/Natural_language_processing",
    snippet: "Natural language processing (NLP) is an interdisciplinary subfield of computer science and information retrieval.",
    source: "Wikipedia",
  },
];

// ========================================
// NEWSAPI FALLBACKS
// ========================================

export const NEWSAPI_FALLBACKS: SearchConnectorResult[] = [
  {
    title: "Tech Industry Embraces AI Development",
    url: "https://techcrunch.com/2024/11/15/ai-development",
    snippet: "Major technology companies are investing heavily in artificial intelligence research and development, signaling a new era of innovation.",
    thumbnail: "https://techcrunch.com/wp-content/uploads/2024/11/ai-development.jpg",
    source: "TechCrunch",
    publishedAt: "2024-11-15T08:00:00Z",
  },
  {
    title: "Breakthrough in Quantum Computing",
    url: "https://www.wired.com/story/quantum-computing-breakthrough",
    snippet: "Researchers achieve significant milestone in quantum computing stability, bringing practical applications closer to reality.",
    thumbnail: "https://www.wired.com/images/quantum-computing.jpg",
    source: "Wired",
    publishedAt: "2024-11-14T15:30:00Z",
  },
  {
    title: "Renewable Energy Adoption Accelerates",
    url: "https://www.reuters.com/business/energy/renewable-adoption",
    snippet: "Global renewable energy capacity reaches new highs as countries accelerate their transition to sustainable power sources.",
    thumbnail: "https://www.reuters.com/resizer/renewable-energy.jpg",
    source: "Reuters",
    publishedAt: "2024-11-13T12:00:00Z",
  },
];

// ========================================
// GDELT FALLBACKS
// ========================================

export const GDELT_FALLBACKS: SearchConnectorResult[] = [
  {
    title: "Global Economic Summit Concludes with Climate Commitments",
    url: "https://www.example.com/global-economic-summit",
    snippet: "World leaders agree on new climate initiatives and economic cooperation frameworks at international summit.",
    thumbnail: "https://example.com/images/economic-summit.jpg",
    source: "GDELT",
    publishedAt: "2024-11-14T18:00:00Z",
  },
  {
    title: "Technology Regulation Debates Heat Up",
    url: "https://www.example.com/tech-regulation",
    snippet: "Governments worldwide grapple with balancing innovation and consumer protection in the digital age.",
    thumbnail: "https://example.com/images/tech-regulation.jpg",
    source: "GDELT",
    publishedAt: "2024-11-13T10:30:00Z",
  },
  {
    title: "International Collaboration on Space Exploration",
    url: "https://www.example.com/space-exploration",
    snippet: "Multiple space agencies announce joint missions to explore Mars and establish lunar research stations.",
    thumbnail: "https://example.com/images/space-mission.jpg",
    source: "GDELT",
    publishedAt: "2024-11-12T14:45:00Z",
  },
];

// ========================================
// FALLBACK RETRIEVAL
// ========================================

/**
 * Get fallback data for a specific connector
 * @param connectorName - Name of the connector
 * @returns Array of fallback results
 */
export function getFallbackData(connectorName: string): SearchConnectorResult[] {
  const fallbacks: Record<string, SearchConnectorResult[]> = {
    youtube: YOUTUBE_FALLBACKS,
    unsplash: UNSPLASH_FALLBACKS,
    'google-search': GOOGLE_SEARCH_FALLBACKS,
    wikipedia: WIKIPEDIA_FALLBACKS,
    newsapi: NEWSAPI_FALLBACKS,
    gdelt: GDELT_FALLBACKS,
  };

  const data = fallbacks[connectorName.toLowerCase()];
  
  if (!data) {
    console.warn(`[Fallback] No fallback data for connector: ${connectorName}`);
    return [];
  }

  console.log(`[Fallback] Using fallback data for ${connectorName}: ${data.length} items`);
  return data;
}

/**
 * Check if fallback mode should be enabled based on environment or config
 * @returns true if fallback mode is enabled
 */
export function isFallbackModeEnabled(): boolean {
  // Check if explicitly enabled via environment variable
  if (process.env.NEXT_PUBLIC_USE_FALLBACKS === 'true') {
    return true;
  }

  // Enable fallbacks in development if no API keys are configured
  if (process.env.NODE_ENV === 'development') {
    const hasAnyApiKey = !!
      process.env.YOUTUBE_API_KEY ||
      process.env.UNSPLASH_ACCESS_KEY ||
      process.env.GOOGLE_SEARCH_API_KEY ||
      process.env.NEWSAPI_KEY;
    
    return !hasAnyApiKey;
  }

  return false;
}
