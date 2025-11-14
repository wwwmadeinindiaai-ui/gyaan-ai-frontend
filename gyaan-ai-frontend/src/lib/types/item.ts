/**
 * @fileoverview Normalized item types for unified search indexing
 * @module lib/types/item
 *
 * All data sources (connectors) must normalize their output to NormalizedItem format
 * for consistent indexing, deduplication, and search functionality.
 */

/**
 * Normalized search item - unified format for all data sources
 */
export interface NormalizedItem {
  /** Unique ID: MD5(canonicalUrl + publishedAt) */
  id: string;
  
  /** Item title (required, max 500 chars) */
  title: string;
  
  /** Canonical URL (UTM params stripped, normalized) */
  url: string;
  
  /** Domain extracted from URL (e.g., "nytimes.com") */
  domain: string;
  
  /** Publication timestamp */
  publishedAt: Date;
  
  /** Content type */
  type: 'article' | 'image' | 'video' | 'filing' | 'social' | 'podcast';
  
  /** ISO 639-1 language code (e.g., "en", "es", "fr") */
  lang: string;
  
  /** Extracted entities (companies, tickers, people, topics) */
  entities: string[];
  
  /** Sentiment analysis result */
  sentiment?: {
    /** Sentiment score from -1 (negative) to 1 (positive) */
    score: number;
    /** Sentiment classification */
    label: 'positive' | 'negative' | 'neutral';
    /** Confidence level (0 to 1) */
    confidence: number;
  };
  
  /** Source information */
  source: {
    /** Human-readable source name (e.g., "YouTube", "NewsAPI") */
    name: string;
    /** Connector identifier for tracking */
    id: string;
  };
  
  /** Short description/excerpt (max 300 chars) */
  snippet?: string;
  
  /** Thumbnail/preview image URL */
  thumbnail?: string;
  
  /** Full body text (optional, max 50KB for deep indexing) */
  body?: string;
  
  /** Vector embeddings for semantic search (future use) */
  embeddings?: number[];
  
  /** Connector-specific metadata */
  metadata?: Record<string, any>;
  
  /** Timestamp when item was indexed */
  indexedAt: Date;
  
  /** View count for trending/popularity */
  views?: number;
  
  /** Engagement metrics */
  engagement?: {
    likes?: number;
    shares?: number;
    comments?: number;
    reactions?: Record<string, number>;
  };
}

/**
 * Search query filters for advanced search
 */
export interface SearchFilters {
  /** Filter by specific domains */
  domains?: string[];
  
  /** Filter by content types */
  types?: NormalizedItem['type'][];
  
  /** Filter by languages */
  langs?: string[];
  
  /** Filter by date range - start date */
  dateFrom?: Date;
  
  /** Filter by date range - end date */
  dateTo?: Date;
  
  /** Filter by source connectors */
  sources?: string[];
  
  /** Filter by sentiment */
  sentiment?: 'positive' | 'negative' | 'neutral';
  
  /** Filter by entities (companies, tickers, topics) */
  entities?: string[];
  
  /** Minimum view count threshold */
  minViews?: number;
  
  /** Minimum engagement threshold */
  minEngagement?: number;
}

/**
 * Search result with metadata and facets
 */
export interface SearchResult {
  /** Array of matching items */
  items: NormalizedItem[];
  
  /** Total number of results */
  total: number;
  
  /** Search execution time in milliseconds */
  took: number;
  
  /** Current page number (1-indexed) */
  page?: number;
  
  /** Items per page */
  perPage?: number;
  
  /** Faceted counts for filtering UI */
  facets?: {
    /** Domain counts */
    domains: Record<string, number>;
    /** Type counts */
    types: Record<string, number>;
    /** Language counts */
    langs: Record<string, number>;
    /** Source counts */
    sources: Record<string, number>;
    /** Sentiment counts */
    sentiment: Record<string, number>;
  };
}

/**
 * Batch indexing job status
 */
export interface IndexingJob {
  /** Job ID */
  id: string;
  
  /** Job status */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  
  /** Source connector */
  source: string;
  
  /** Total items to process */
  total: number;
  
  /** Items processed so far */
  processed: number;
  
  /** Items successfully indexed */
  indexed: number;
  
  /** Items skipped (duplicates) */
  skipped: number;
  
  /** Items failed */
  failed: number;
  
  /** Error messages if any */
  errors?: string[];
  
  /** Job start time */
  startedAt: Date;
  
  /** Job completion time */
  completedAt?: Date;
}

/**
 * Deduplication result
 */
export interface DeduplicationResult {
  /** Original item count */
  original: number;
  
  /** Unique items after deduplication */
  unique: number;
  
  /** Duplicates removed */
  duplicates: number;
  
  /** Duplicate IDs (for logging) */
  duplicateIds: string[];
}
