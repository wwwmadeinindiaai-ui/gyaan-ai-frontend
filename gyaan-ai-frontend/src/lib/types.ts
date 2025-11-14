// Types for connector results and citations used in Gyaan AI

export interface SearchConnectorResult {
  title: string;
  url: string;
  snippet?: string;
  thumbnail?: string;
  source: string;
  publishedAt?: string;
}

/**
 * For normalizing citations in UI/API responses.
 */
export interface BaseCitation {
  id?: string | number;
  title?: string;
  snippet?: string;
  source?: string;
  url?: string;
  date?: string;
}
