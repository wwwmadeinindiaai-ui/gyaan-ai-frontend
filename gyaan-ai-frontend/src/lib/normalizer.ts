/**
 * Item Normalizer Module
 * Provides functionality to transform raw data retrieved from various connectors
 * (e.g., NewsAPI, RSS feeds) into the unified NormalizedItem structure.
 * @module item-normalizer
 */

import { NormalizedItem } from './types/item';

/**
 * Placeholder interface for raw data input from a connector.
 * This structure will vary based on the data source.
 */
interface RawDataItem {
  id: string;
  title: string;
  url: string;
  // ... other raw fields
}

/**
 * ItemNormalizer class
 * Contains static methods for data cleaning, transformation, and
 * field mapping to ensure consistency before indexing.
 */
export class ItemNormalizer {
  /**
   * Converts raw connector data into a NormalizedItem structure.
   *
   * @param rawData The raw item data received from a connector API.
   * @param sourceId The unique identifier of the connector/source.
   * @returns A promise that resolves to the fully populated NormalizedItem.
   */
  public static async normalize(
    rawData: RawDataItem,
    sourceId: string
  ): Promise<NormalizedItem> {
    // --- Placeholder Logic ---
    // 1. Sanitizing/cleaning text (title, body).
    // 2. Generating the unique 'id' (e.g., MD5 hash of canonical URL + date).
    // 3. Extracting 'domain', 'lang', 'type', and other fields.
    // 4. Enriching data (e.g., sentiment analysis, entity extraction).

    console.log(`[ItemNormalizer] Normalizing raw item from source ${sourceId}`);

    // Placeholder return:
    const normalizedItem: NormalizedItem = {
      id: rawData.id,
      title: rawData.title,
      url: rawData.url,
      domain: new URL(rawData.url).hostname.replace('www.', ''),
      date: new Date(),
      type: 'article', // Default type
      lang: 'en', // Default language
      entities: [],
      source: {
        name: 'Unknown Source', // Needs to be mapped from sourceId
        id: sourceId,
      },
      indexedAt: new Date(),
      // Minimal data for demonstration
    };

    return normalizedItem;
  }

  /**
   * Helper function to strip HTML and other noisy elements from content.
   */
  public static cleanContent(htmlContent: string): string {
    // In a real scenario, this would use a library like 'cheerio' or similar.
    return htmlContent.replace(/<[^>]*>?/gm, '');
  }

    /**
   * Normalize a batch of items from a connector.
   * @param items Array of raw items to normalize
   * @param sourceInfo Source information (name and id)
   * @returns Promise resolving to array of normalized items
   */
  public static async normalizeBatch(
    items: RawDataItem[],
    sourceInfo: { name: string; id: string }
  ): Promise<NormalizedItem[]> {
    return Promise.all(
      items.map((item) => this.normalize(item, sourceInfo.id))
    );
  }
}

/**
 * Named export – Use this for utility usage in other modules
 */
export const normalizer = ItemNormalizer;
