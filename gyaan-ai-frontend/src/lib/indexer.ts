/**
 * Search Indexer Module for Meilisearch Integration
 * 
 * Provides functionality for indexing normalized items into Meilisearch
 * for fast, typo-tolerant full-text search. Handles index configuration,
 * document indexing, and search operations.
 * 
 * @module indexer
 */

import { MeiliSearch, Index } from 'meilisearch';
import { NormalizedItem } from './types/item';

/**
 * Search configuration options
 */
interface SearchConfig {
  /** Results per page. Default: 20 */
  hitsPerPage?: number;
  
  /** Attributes to search in. Default: ['title', 'summary', 'content'] */
  searchableAttributes?: string[];
  
  /** Attributes to display in results. Default: all except 'content' */
  displayedAttributes?: string[];
  
  /** Attributes to filter on. Default: ['type', 'source', 'lang', 'domain'] */
  filterableAttributes?: string[];
  
  /** Attributes to sort by. Default: ['date'] */
  sortableAttributes?: string[];
}

/**
 * Search result with Meilisearch metadata
 */
export interface SearchResult {
  /** Array of matching items */
  hits: NormalizedItem[];
  
  /** Total number of results */
  totalHits: number;
  
  /** Query execution time in ms */
  processingTime: number;
  
  /** Current page number */
  page: number;
  
  /** Results per page */
  hitsPerPage: number;
}

/**
 * SearchIndexer class for Meilisearch operations
 * 
 * Manages the connection to Meilisearch, index configuration,
 * and provides methods for indexing and searching normalized items.
 * 
 * @example
 * ```typescript
 * const indexer = new SearchIndexer({
 *   host: 'http://localhost:7700',
 *   apiKey: 'masterKey'
 * });
 * await indexer.initialize();
 * await indexer.indexBatch(items);
 * const results = await indexer.search('climate change');
 * ```
 */
export class SearchIndexer {
  private client: MeiliSearch;
  private index: Index | null = null;
  private indexName: string = 'search_items';
  private config: SearchConfig;
  private isInitialized: boolean = false;

  constructor(
    host: string = process.env.NEXT_PUBLIC_MEILISEARCH_HOST || 'http://localhost:7700',
    apiKey: string = process.env.MEILISEARCH_MASTER_KEY || '',
    config?: SearchConfig
  ) {
    this.client = new MeiliSearch({ host, apiKey });
    this.config = {
      hitsPerPage: 20,
      searchableAttributes: ['title', 'summary', 'content'],
      displayedAttributes: [
        'id',
        'title',
        'summary',
        'url',
        'imageUrl',
        'date',
        'type',
        'source',
        'lang',
        'domain',
        'metadata',
      ],
      filterableAttributes: ['type', 'source', 'lang', 'domain', 'date'],
      sortableAttributes: ['date'],
      ...config,
    };

    console.log('[SearchIndexer] Initialized with host:', host);
  }

  /**
   * Initialize the Meilisearch index with proper settings
   * 
   * Creates the index if it doesn't exist and configures:
   * - Searchable attributes (title, summary, content)
   * - Filterable attributes (type, source, lang, domain, date)
   * - Sortable attributes (date)
   * - Displayed attributes (all except full content by default)
   * 
   * @throws Error if Meilisearch is unreachable or initialization fails
   */
  async initialize(): Promise<void> {
    try {
      console.log('[SearchIndexer] Initializing index:', this.indexName);

      // Check if Meilisearch is healthy
      const health = await this.client.health();
      console.log('[SearchIndexer] Meilisearch health:', health.status);

      // Get or create index
      try {
        this.index = this.client.index(this.indexName);
        await this.index.fetchInfo();
        console.log('[SearchIndexer] Index exists:', this.indexName);
      } catch (error) {
        console.log('[SearchIndexer] Creating new index:', this.indexName);
        await this.client.createIndex(this.indexName, { primaryKey: 'id' });
        this.index = this.client.index(this.indexName);
      }

      // Configure index settings
      await this.index.updateSettings({
        searchableAttributes: this.config.searchableAttributes,
        displayedAttributes: this.config.displayedAttributes,
        filterableAttributes: this.config.filterableAttributes,
        sortableAttributes: this.config.sortableAttributes,
        rankingRules: [
          'words',
          'typo',
          'proximity',
          'attribute',
          'sort',
          'exactness',
        ],
      });

      console.log('[SearchIndexer] Index settings configured');
      this.isInitialized = true;
    } catch (error) {
      console.error('[SearchIndexer] Initialization failed:', error);
      throw new Error(
        `Failed to initialize Meilisearch: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Index a single item
   * 
   * @param item - Normalized item to index
   * @returns Task UID for tracking the indexing operation
   * @throws Error if index is not initialized or indexing fails
   */
  async indexItem(item: NormalizedItem): Promise<number> {
    if (!this.isInitialized || !this.index) {
      throw new Error('SearchIndexer not initialized. Call initialize() first.');
    }

    try {
      console.log(`[SearchIndexer] Indexing item: ${item.id}`);
      const task = await this.index.addDocuments([item]);
      return task.taskUid;
    } catch (error) {
      console.error(`[SearchIndexer] Failed to index item ${item.id}:`, error);
      throw error;
    }
  

  /**
   * Index multiple items in batch
   * 
   * More efficient than indexing items one by one.
   * Automatically handles batching for large datasets.
   * 
   * @param items - Array of normalized items to index
   * @param batchSize - Items per batch (default: 1000)
   * @returns Array of task UIDs for tracking
   * @throws Error if index is not initialized or batch indexing fails
   */
  async indexBatch(
    items: NormalizedItem[],
    batchSize: number = 1000
    ): Promise<number[]> {
    if (!this.isInitialized || !this.index) {
      throw new Error('SearchIndexer not initialized. Call initialize() first.');
    }

    const startTime = Date.now();
    const taskUids: number[] = [];

    console.log(
      `[SearchIndexer] Indexing ${items.length} items in batches of ${batchSize}`
    );

    // Process in batches
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      try {
        const task = await this.index.addDocuments(batch);
        taskUids.push(task.taskUid);
        console.log(
          `[SearchIndexer] Batch ${Math.floor(i / batchSize) + 1}: Indexed ${batch.length} items (task ${task.taskUid})`
        );
      } catch (error) {
        console.error(
          `[SearchIndexer] Failed to index batch starting at ${i}:`,
          error
        );
        throw error;
      }
    }

    const duration = Date.now() - startTime;
    const itemsPerSecond = (items.length / duration) * 1000;
    
    console.log(
      `[SearchIndexer] Batch indexing complete: ${items.length} items in ${duration}ms (${itemsPerSecond.toFixed(0)} items/sec)`
    );

    return taskUids;
  }

  /**
   * Search for items using query and filters
   * 
   * @param query - Search query string
   * @param options - Search options (filters, pagination, sorting)
   * @returns Search results with metadata
   * @throws Error if index is not initialized or search fails
   * 
   * @example
   * ```typescript
   * // Basic search
   * const results = await indexer.search('climate change');
   * 
   * // Search with filters
   * const results = await indexer.search('climate', {
   *   filter: 'type = article AND lang = en',
   *   hitsPerPage: 10,
 *   page: 1
   * });
   * 
   * // Search with sorting
   * const results = await indexer.search('news', {
   *   sort: ['date:desc']
   * });
   * ```
   */
  async search(
    query: string,
    options?: {
      filter?: string;
      sort?: string[];
      hitsPerPage?: number;
      page?: number;
      attributesToHighlight?: string[];
    }
  ): Promise<SearchResult> {
    if (!this.isInitialized || !this.index) {
      throw new Error('SearchIndexer not initialized. Call initialize() first.');
    }

    const startTime = Date.now();

    try {
      const searchParams: any = {
        limit: options?.hitsPerPage || this.config.hitsPerPage,
        offset: ((options?.page || 1) - 1) * (options?.hitsPerPage || this.config.hitsPerPage),
      };

      if (options?.filter) {
        searchParams.filter = options.filter;
      }

      if (options?.sort) {
        searchParams.sort = options.sort;
      }

      if (options?.attributesToHighlight) {
        searchParams.attributesToHighlight = options.attributesToHighlight;
      }

      console.log(`[SearchIndexer] Searching for: "${query}"`, searchParams);

      const result = await this.index.search(query, searchParams);

      const duration = Date.now() - startTime;
      console.log(
        `[SearchIndexer] Search complete: ${result.hits.length} results in ${duration}ms`
      );

      return {
        hits: result.hits as NormalizedItem[],
        totalHits: result.estimatedTotalHits || 0,
        processingTime: result.processingTimeMs,
        page: options?.page || 1,
        hitsPerPage: options?.hitsPerPage || this.config.hitsPerPage,
      };
    } catch (error) {
      console.error('[SearchIndexer] Search failed:', error);
      throw error;
    }
  }

  /**
   * Delete an item from the index
   * 
   * @param itemId - ID of the item to delete
   * @returns Task UID for tracking the deletion
   * @throws Error if index is not initialized or deletion fails
   */
  async deleteItem(itemId: string): Promise<number> {
    if (!this.isInitialized || !this.index) {
      throw new Error('SearchIndexer not initialized. Call initialize() first.');
    }

    try {
      console.log(`[SearchIndexer] Deleting item: ${itemId}`);
      const task = await this.index.deleteDocument(itemId);
      return task.taskUid;
    } catch (error) {
      console.error(`[SearchIndexer] Failed to delete item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Delete all items from the index
   * 
   * @returns Task UID for tracking the deletion
   * @throws Error if index is not initialized or deletion fails
   */
  async deleteAll(): Promise<number> {
    if (!this.isInitialized || !this.index) {
      throw new Error('SearchIndexer not initialized. Call initialize() first.');
    }

    try {
      console.log('[SearchIndexer] Deleting all documents');
      const task = await this.index.deleteAllDocuments();
      return task.taskUid;
    } catch (error) {
      console.error('[SearchIndexer] Failed to delete all documents:', error);
      throw error;
    }
  }

  /**
   * Get index statistics
   * 
   * @returns Index statistics including document count and field distribution
   */
  async getStats(): Promise<any> {
    if (!this.isInitialized || !this.index) {
      throw new Error('SearchIndexer not initialized. Call initialize() first.');
    }

    try {
      const stats = await this.index.getStats();
      console.log('[SearchIndexer] Index stats:', stats);
      return stats;
    } catch (error) {
      console.error('[SearchIndexer] Failed to get stats:', error);
      throw error;
    }
  }

  /**
   * Wait for a task to complete
   * 
   * Useful for ensuring indexing/deletion operations have finished
   * before proceeding with dependent operations.
   * 
   * @param taskUid - Task UID to wait for
   * @param timeoutMs - Maximum time to wait in milliseconds (default: 30000)
   * @throws Error if task fails or times out
   */
  async waitForTask(taskUid: number, timeoutMs: number = 30000): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('SearchIndexer not initialized. Call initialize() first.');
    }

    const startTime = Date.now();
    
    console.log(`[SearchIndexer] Waiting for task ${taskUid}`);

    while (Date.now() - startTime < timeoutMs) {
      const task = await this.client.getTask(taskUid);
      
      if (task.status === 'succeeded') {
        console.log(`[SearchIndexer] Task ${taskUid} succeeded`);
        return;
      }
      
      if (task.status === 'failed') {
        console.error(`[SearchIndexer] Task ${taskUid} failed:`, task.error);
        throw new Error(`Task ${taskUid} failed: ${JSON.stringify(task.error)}`);
      }

      // Wait 100ms before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error(`Task ${taskUid} timed out after ${timeoutMs}ms`);
  }

  /**
   * Check if indexer is ready for operations
   */
  isReady(): boolean {
    return this.isInitialized && this.index !== null;
  }
}

// Singleton instance (will be initialized in API routes)
export const searchIndexer = new SearchIndexer();
