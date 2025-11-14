/**
 * Item Deduplication Module
 * 
 * Provides functionality for identifying and filtering duplicate items
 * across different data sources. Uses multiple similarity detection methods:
 * - Exact ID matching for perfect duplicates
 * - URL canonicalization for same content from different sources
 * - Title similarity using Levenshtein distance for near-duplicates
 * - Date proximity checking to identify content republished within time window
 * 
 * @module deduplicator
 */

import { NormalizedItem } from './types/item';

/**
 * Configuration for duplicate detection thresholds
 */
interface DeduplicationConfig {
  /** Similarity threshold (0-1) for title comparison. Default: 0.85 */
  titleSimilarityThreshold: number;
  
  /** Max hours between items to consider as potential duplicates. Default: 24 */
  dateProximityHours: number;
  
  /** Minimum title length to perform similarity check. Default: 10 */
  minTitleLength: number;
}

/**
 * Statistics about deduplication operation
 */
interface DeduplicationStats {
  /** Total items processed */
  total: number;
  
  /** Duplicates found and removed */
  duplicatesRemoved: number;
  
  /** Unique items retained */
  uniqueItems: number;
  
  /** Breakdown by duplicate type */
  byType: {
    exactId: number;
    sameUrl: number;
    similarTitle: number;
  };
}

/**
 * ItemDeduplicator class for detecting and filtering duplicate items
 * 
 * Implements multi-stage deduplication:
 * 1. Exact ID match (fastest)
 * 2. URL canonicalization match (reliable)
 * 3. Title similarity with date proximity (catches near-duplicates)
 * 
 * @example
 * ```typescript
 * const deduplicator = new ItemDeduplicator();
 * const uniqueItems = deduplicator.filterDuplicates(items);
 * console.log(deduplicator.getStats());
 * ```
 */
export class ItemDeduplicator {
  private config: DeduplicationConfig;
  private seenIds: Set<string>;
  private seenUrls: Set<string>;
  private stats: DeduplicationStats;

  constructor(config?: Partial<DeduplicationConfig>) {
    this.config = {
      titleSimilarityThreshold: 0.85,
      dateProximityHours: 24,
      minTitleLength: 10,
      ...config,
    };

    this.seenIds = new Set();
    this.seenUrls = new Set();
    this.stats = {
      total: 0,
      duplicatesRemoved: 0,
      uniqueItems: 0,
      byType: {
        exactId: 0,
        sameUrl: 0,
        similarTitle: 0,
      },
    };
  }

  /**
   * Calculate Levenshtein distance between two strings
   * 
   * Measures the minimum number of single-character edits (insertions,
   * deletions, or substitutions) required to change one string into another.
   * 
   * @param str1 - First string to compare
   * @param str2 - Second string to compare
   * @returns Levenshtein distance (lower = more similar)
   * 
   * @example
   * ```typescript
   * levenshteinDistance('kitten', 'sitting'); // Returns 3
   * ```
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i <= str1.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str2.length; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix using dynamic programming
    for (let i = 1; i <= str1.length; i++) {
      for (let j = 1; j <= str2.length; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str1.length][str2.length];
  }

  /**
   * Calculate similarity ratio between two strings (0-1)
   * 
   * Uses Levenshtein distance normalized by the length of the longer string.
   * 1.0 = identical, 0.0 = completely different
   * 
   * @param str1 - First string to compare
   * @param str2 - Second string to compare
   * @returns Similarity ratio from 0 (different) to 1 (identical)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    
    const normalized1 = str1.toLowerCase().trim();
    const normalized2 = str2.toLowerCase().trim();

    if (normalized1 === normalized2) return 1.0;

    const distance = this.levenshteinDistance(normalized1, normalized2);
    const maxLength = Math.max(normalized1.length, normalized2.length);
    
    return 1 - distance / maxLength;
  }

  /**
   * Check if two items are duplicates based on configured thresholds
   * 
   * Evaluates items using multiple criteria:
   * 1. Exact ID match (guaranteed duplicate)
   * 2. Same canonical URL (same content)
   * 3. High title similarity + date proximity (likely duplicate)
   * 
   * @param item1 - First item to compare
   * @param item2 - Second item to compare
   * @returns Tuple: [isDuplicate: boolean, reason: string]
   */
  isDuplicate(
    item1: NormalizedItem,
    item2: NormalizedItem
  ): [boolean, string] {
    // Check 1: Exact ID match
    if (item1.id === item2.id) {
      return [true, 'exact_id'];
    }

    // Check 2: Same URL (after canonicalization)
    if (item1.url === item2.url) {
      return [true, 'same_url'];
    }

    // Check 3: Title similarity with date proximity
    const titleLength = Math.min(item1.title.length, item2.title.length);
    if (titleLength >= this.config.minTitleLength) {
      const similarity = this.calculateSimilarity(item1.title, item2.title);
      
      if (similarity >= this.config.titleSimilarityThreshold) {
        // Check date proximity
        const timeDiffHours = Math.abs(
          item1.date.getTime() - item2.date.getTime()
        ) / (1000 * 60 * 60);

        if (timeDiffHours <= this.config.dateProximityHours) {
          return [
            true,
            `similar_title_${similarity.toFixed(2)}_within_${timeDiffHours.toFixed(1)}h`,
          ];
        }
      }
    }

    return [false, 'unique'];
  }

  /**
   * Filter an array of items to remove duplicates
   * 
   * Processes items in order, keeping the first occurrence of each unique item.
   * Maintains statistics about duplicate detection for monitoring.
   * 
   * @param items - Array of normalized items to deduplicate
   * @returns Array of unique items with duplicates removed
   * 
   * @example
   * ```typescript
   * const uniqueItems = deduplicator.filterDuplicates([
   *   item1, item2, item1, item3  // item1 appears twice
   * ]);
   * // Returns: [item1, item2, item3]
   * ```
   */
  filterDuplicates(items: NormalizedItem[]): NormalizedItem[] {
    const startTime = Date.now();
    const uniqueItems: NormalizedItem[] = [];
    const itemMap = new Map<string, NormalizedItem>();

    // Reset stats for this operation
    this.stats = {
      total: items.length,
      duplicatesRemoved: 0,
      uniqueItems: 0,
      byType: {
        exactId: 0,
        sameUrl: 0,
        similarTitle: 0,
      },
    };

    console.log(`[Deduplicator] Starting deduplication for ${items.length} items`);

    // First pass: exact ID and URL matching (fast)
    for (const item of items) {
      if (this.seenIds.has(item.id)) {
        this.stats.duplicatesRemoved++;
        this.stats.byType.exactId++;
        console.log(`[Deduplicator] Duplicate ID: ${item.id}`);
        continue;
      }

      if (this.seenUrls.has(item.url)) {
        this.stats.duplicatesRemoved++;
        this.stats.byType.sameUrl++;
        console.log(`[Deduplicator] Duplicate URL: ${item.url}`);
        continue;
      }

      // Track this item
      this.seenIds.add(item.id);
      this.seenUrls.add(item.url);
      itemMap.set(item.id, item);
      uniqueItems.push(item);
    }

    // Second pass: title similarity check (slower, only for items that passed first pass)
    const finalUniqueItems: NormalizedItem[] = [];
    const checkedItems: NormalizedItem[] = [];

    for (const item of uniqueItems) {
      let isDupe = false;

      for (const checkedItem of checkedItems) {
        const [duplicate, reason] = this.isDuplicate(item, checkedItem);
        
        if (duplicate && reason.startsWith('similar_title')) {
          this.stats.duplicatesRemoved++;
          this.stats.byType.similarTitle++;
          console.log(
            `[Deduplicator] Similar title: "${item.title}" ~ "${checkedItem.title}" (${reason})`
          );
          isDupe = true;
          break;
        }
      }

      if (!isDupe) {
        finalUniqueItems.push(item);
        checkedItems.push(item);
      }
    }

    this.stats.uniqueItems = finalUniqueItems.length;

    const duration = Date.now() - startTime;
    console.log(
      `[Deduplicator] Complete: ${this.stats.uniqueItems} unique items from ${this.stats.total} total (${this.stats.duplicatesRemoved} duplicates removed) in ${duration}ms`
    );

    if (duration > 1000) {
      console.warn(
        `[Deduplicator] Performance warning: Deduplication took ${duration}ms for ${items.length} items`
      );
    }

    return finalUniqueItems;
  }

  /**
   * Get statistics about the most recent deduplication operation
   * 
   * @returns Statistics object with counts and breakdowns
   */
  getStats(): DeduplicationStats {
    return { ...this.stats };
  }

  /**
   * Reset the deduplicator state
   * 
   * Clears all seen IDs and URLs. Use this when starting a new deduplication
   * session to ensure items from previous sessions aren't incorrectly
   * flagged as duplicates.
   */
  reset(): void {
    this.seenIds.clear();
    this.seenUrls.clear();
    this.stats = {
      total: 0,
      duplicatesRemoved: 0,
      uniqueItems: 0,
      byType: {
        exactId: 0,
        sameUrl: 0,
        similarTitle: 0,
      },
    };
    console.log('[Deduplicator] State reset');
  }
}

// Singleton instance
export const deduplicator = new ItemDeduplicator();
