/**
 * @fileoverview Item normalizer for converting raw connector data to standardized format
 * @module lib/normalizer
 */

import crypto from 'crypto';
import { URL } from 'url';
import { NormalizedItem } from './types/item';

/**
 * Normalizes raw connector output to standardized NormalizedItem format
 * Handles URL canonicalization, validation, and metadata extraction
 */
export class ItemNormalizer {
  /**
   * List of tracking parameters to remove from URLs
   */
  private readonly UTM_PARAMS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'ref', 'source', 'fbclid', 'gclid', 'mc_cid', 'mc_eid', '_hsenc', '_hsmi'
  ];

  /**
   * Generate stable ID from URL + timestamp
   * Uses MD5 hash of canonical URL and date (YYYY-MM-DD)
   */
  generateId(url: string, publishedAt: Date): string {
    const canonical = this.canonicalizeUrl(url);
    const timestamp = publishedAt.toISOString().split('T')[0]; // YYYY-MM-DD
    const hash = crypto
      .createHash('md5')
      .update(`${canonical}:${timestamp}`)
      .digest('hex');
    return hash.substring(0, 16);
  }

  /**
   * Canonicalize URL: remove tracking params, normalize domain, sort params
   */
  canonicalizeUrl(urlString: string): string {
    try {
      const url = new URL(urlString);
      
      // Remove www prefix
      url.hostname = url.hostname.replace(/^www\./, '');
      
      // Remove tracking parameters
      for (const param of this.UTM_PARAMS) {
        url.searchParams.delete(param);
      }
      
      // Sort remaining params for consistency
      const sorted = Array.from(url.searchParams.entries())
        .sort(([a], [b]) => a.localeCompare(b));
      url.search = new URLSearchParams(sorted).toString();
      
      // Remove trailing slash
      if (url.pathname.endsWith('/') && url.pathname.length > 1) {
        url.pathname = url.pathname.slice(0, -1);
      }
      
      // Force HTTPS for known HTTPS-only domains
      if (['youtube.com', 'wikipedia.org', 'github.com'].includes(url.hostname)) {
        url.protocol = 'https:';
      }
      
      return url.toString();
    } catch (err) {
      console.warn('[Normalizer] Invalid URL:', urlString, err);
      return urlString;
    }
  }

  /**
   * Extract domain from URL
   */
  extractDomain(urlString: string): string {
    try {
      const url = new URL(urlString);
      return url.hostname.replace(/^www\./, '');
    } catch {
      return 'unknown';
    }
  }

  /**
   * Infer content type from source and metadata
   */
  private inferType(
    raw: any,
    source: { name: string; id: string }
  ): NormalizedItem['type'] {
    // Explicit type from connector
    if (raw.type && ['article', 'image', 'video', 'filing', 'social', 'podcast'].includes(raw.type)) {
      return raw.type;
    }
    
    // Infer from source
    const sourceMap: Record<string, NormalizedItem['type']> = {
      youtube: 'video',
      unsplash: 'image',
      reddit: 'social',
      twitter: 'social',
      'sec-edgar': 'filing',
      gdelt: 'article',
      newsapi: 'article',
    };
    
    return sourceMap[source.id] || 'article';
  }

  /**
   * Validate required fields
   */
  private validate(raw: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!raw.title || typeof raw.title !== 'string' || raw.title.trim().length === 0) {
      errors.push('Missing or invalid title');
    }
    
    if (!raw.url || typeof raw.url !== 'string') {
      errors.push('Missing or invalid URL');
    } else {
      try {
        new URL(raw.url);
      } catch {
        errors.push(`Invalid URL format: ${raw.url}`);
      }
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * Sanitize and truncate text fields
   */
  private sanitizeText(text: string | undefined | null, maxLength: number): string | undefined {
    if (!text) return undefined;
    const cleaned = text.trim().replace(/\s+/g, ' ');
    return cleaned.length > maxLength ? cleaned.substring(0, maxLength) + '...' : cleaned;
  }

  /**
   * Normalize single item from raw connector output
   * @param raw - Raw item data from connector
   * @param source - Source connector information
   * @returns Normalized item or null if validation fails
   */
  normalize(
    raw: any,
    source: { name: string; id: string }
  ): NormalizedItem | null {
    const startTime = Date.now();
    
    try {
      // Validate input
      const validation = this.validate(raw);
      if (!validation.valid) {
        console.warn(
          `[Normalizer][${source.name}] Validation failed:`,
          validation.errors,
          { title: raw.title, url: raw.url }
        );
        return null;
      }

      // Parse and validate date
      const publishedAt = raw.publishedAt
        ? new Date(raw.publishedAt)
        : new Date();
      
      if (isNaN(publishedAt.getTime())) {
        console.warn(`[Normalizer][${source.name}] Invalid date:`, raw.publishedAt);
        return null;
      }

      // Skip future dates (likely data errors)
      if (publishedAt.getTime() > Date.now() + 86400000) { // +24h tolerance
        console.warn(`[Normalizer][${source.name}] Future date detected:`, publishedAt);
        return null;
      }

      // Generate canonical URL and ID
      const url = this.canonicalizeUrl(raw.url);
      const id = this.generateId(url, publishedAt);
      const domain = this.extractDomain(url);

      // Build normalized item
      const item: NormalizedItem = {
        id,
        title: this.sanitizeText(raw.title, 500) || 'Untitled',
        url,
        domain,
        publishedAt,
        type: this.inferType(raw, source),
        lang: raw.lang || 'en',
        entities: Array.isArray(raw.entities) ? raw.entities.filter(e => typeof e === 'string') : [],
        sentiment: raw.sentiment,
        source,
        snippet: this.sanitizeText(raw.snippet, 300),
        thumbnail: raw.thumbnail,
        body: raw.body?.substring(0, 50000), // Max 50KB
        embeddings: Array.isArray(raw.embeddings) ? raw.embeddings : undefined,
        metadata: raw.metadata,
        indexedAt: new Date(),
        views: typeof raw.views === 'number' ? Math.max(0, raw.views) : 0,
        engagement: raw.engagement,
      };

      const duration = Date.now() - startTime;
      if (duration > 100) {
        console.warn(`[Normalizer][${source.name}] Slow normalization: ${duration}ms for ${id}`);
      }

      return item;
    } catch (err) {
      console.error(`[Normalizer][${source.name}] Error normalizing item:`, err, {
        title: raw?.title,
        url: raw?.url
      });
      return null;
    }
  }

  /**
   * Normalize batch of items
   * @param items - Array of raw items
   * @param source - Source connector information
   * @returns Array of successfully normalized items
   */
  normalizeBatch(
    items: any[],
    source: { name: string; id: string }
  ): NormalizedItem[] {
    if (!Array.isArray(items) || items.length === 0) {
      console.warn(`[Normalizer][${source.name}] Invalid or empty batch`);
      return [];
    }

    const startTime = Date.now();
    
    const normalized = items
      .map(item => this.normalize(item, source))
      .filter((item): item is NormalizedItem => item !== null);

    const duration = Date.now() - startTime;
    const successRate = (normalized.length / items.length * 100).toFixed(1);
    
    console.log(
      `[Normalizer][${source.name}] Batch complete: ` +
      `${normalized.length}/${items.length} items (${successRate}% success, ${duration}ms)`
    );

    if (normalized.length === 0 && items.length > 0) {
      console.error(`[Normalizer][${source.name}] All items failed normalization!`);
    }

    return normalized;
  }

  /**
   * Get normalization statistics
   */
  getStats(results: NormalizedItem[]): {
    total: number;
    byType: Record<string, number>;
    byDomain: Record<string, number>;
    byLang: Record<string, number>;
  } {
    const stats = {
      total: results.length,
      byType: {} as Record<string, number>,
      byDomain: {} as Record<string, number>,
      byLang: {} as Record<string, number>,
    };

    for (const item of results) {
      // Count by type
      stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
      
      // Count by domain
      stats.byDomain[item.domain] = (stats.byDomain[item.domain] || 0) + 1;
      
      // Count by language
      stats.byLang[item.lang] = (stats.byLang[item.lang] || 0) + 1;
    }

    return stats;
  }
}

// Singleton instance
export const normalizer = new ItemNormalizer();
