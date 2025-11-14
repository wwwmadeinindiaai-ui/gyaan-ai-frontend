/**
 * Content Ingestion Pipeline API
 * 
 * Orchestrates the complete data ingestion flow:
 * 1. Receive raw connector data
 * 2. Normalize items (standardize format, canonicalize URLs)
 * 3. Deduplicate (remove exact and near-duplicates)
 * 4. Index in Meilisearch (for fast search)
 * 5. Store in Firestore (for persistence)
 * 
 * POST /api/ingest
 * Request body: { source: string, items: any[], options?: {...} }
 * 
 * @module ingest-api
 */

import { NextRequest, NextResponse } from 'next/server';
import { normalizer } from '@/lib/normalizer';
import { deduplicator } from '@/lib/deduplicator';
import { searchIndexer } from '@/lib/indexer';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Ingestion request body
 */
interface IngestRequest {
  /** Source connector name (e.g., 'youtube', 'newsapi', 'gdelt') */
  source: string;
  
  /** Raw items from connector */
  items: any[];
  
  /** Optional ingestion settings */
  options?: {
    /** Skip deduplication (default: false) */
    skipDedup?: boolean;
    
    /** Skip Meilisearch indexing (default: false) */
    skipIndex?: boolean;
    
    /** Skip Firestore storage (default: false) */
    skipFirestore?: boolean;
    
    /** Batch size for processing (default: 100) */
    batchSize?: number;
  };
}

/**
 * Ingestion response
 */
interface IngestResponse {
  success: boolean;
  message: string;
  stats: {
    received: number;
    normalized: number;
    duplicates: number;
    indexed: number;
    stored: number;
    failed: number;
  };
  processingTime: number;
  errors?: string[];
}

/**
 * POST /api/ingest
 * 
 * Ingest and process content from connectors
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const errors: string[] = [];
  
  try {
    console.log('[IngestAPI] Starting ingestion pipeline');

    // Parse request body
    const body: IngestRequest = await request.json();
    const { source, items, options = {} } = body;

    // Validate request
    if (!source || typeof source !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing source parameter' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or empty items array' },
        { status: 400 }
      );
    }

    const stats = {
      received: items.length,
      normalized: 0,
      duplicates: 0,
      indexed: 0,
      stored: 0,
      failed: 0,
    };

    console.log(
      `[IngestAPI] Received ${stats.received} items from ${source}`
    );

    // Step 1: Normalize items
    console.log('[IngestAPI] Step 1: Normalizing items');
    const normalizedItems = await normalizer.normalizeBatch(items, source);
    stats.normalized = normalizedItems.length;
    stats.failed = stats.received - stats.normalized;

    if (normalizedItems.length === 0) {
      return NextResponse.json<IngestResponse>({
        success: false,
        message: 'All items failed normalization',
        stats,
        processingTime: Date.now() - startTime,
        errors: ['No valid items after normalization'],
      });
    }

    console.log(
      `[IngestAPI] Normalized ${stats.normalized} items (${stats.failed} failed)`
    );

    // Step 2: Deduplicate (unless skipped)
    let uniqueItems = normalizedItems;
    if (!options.skipDedup) {
      console.log('[IngestAPI] Step 2: Deduplicating items');
      uniqueItems = deduplicator.filterDuplicates(normalizedItems);
      const dedupStats = deduplicator.getStats();
      stats.duplicates = dedupStats.duplicatesRemoved;
      console.log(
        `[IngestAPI] Removed ${stats.duplicates} duplicates, ${uniqueItems.length} unique items remain`
      );
    } else {
      console.log('[IngestAPI] Step 2: Skipping deduplication');
    }

    if (uniqueItems.length === 0) {
      return NextResponse.json<IngestResponse>({
        success: true,
        message: 'All items were duplicates',
        stats,
        processingTime: Date.now() - startTime,
      });
    }

    // Step 3: Index in Meilisearch (unless skipped)
    if (!options.skipIndex) {
      console.log('[IngestAPI] Step 3: Indexing in Meilisearch');
      try {
        // Initialize indexer if not ready
        if (!searchIndexer.isReady()) {
          console.log('[IngestAPI] Initializing Meilisearch indexer');
          await searchIndexer.initialize();
        }

        const taskUids = await searchIndexer.indexBatch(
          uniqueItems,
          options.batchSize || 100
        );
        stats.indexed = uniqueItems.length;
        console.log(
          `[IngestAPI] Indexed ${stats.indexed} items (tasks: ${taskUids.join(', ')})`
        );
      } catch (error) {
        const errorMsg = `Meilisearch indexing failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`[IngestAPI] ${errorMsg}`);
        errors.push(errorMsg);
        // Continue with Firestore storage even if indexing fails
      }
    } else {
      console.log('[IngestAPI] Step 3: Skipping Meilisearch indexing');
    }

    // Step 4: Store in Firestore (unless skipped)
    if (!options.skipFirestore) {
      console.log('[IngestAPI] Step 4: Storing in Firestore');
      try {
        const itemsCollection = collection(db, 'search_items');
        
        // Store in batches
        const batchSize = options.batchSize || 100;
        for (let i = 0; i < uniqueItems.length; i += batchSize) {
          const batch = uniqueItems.slice(i, i + batchSize);
          
          await Promise.all(
            batch.map(async (item) => {
              try {
                await addDoc(itemsCollection, {
                  ...item,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                });
                stats.stored++;
              } catch (error) {
                console.error(
                  `[IngestAPI] Failed to store item ${item.id}:`,
                  error
                );
                errors.push(`Failed to store item ${item.id}`);
              }
            })
          );
        }

        console.log(`[IngestAPI] Stored ${stats.stored} items in Firestore`);
      } catch (error) {
        const errorMsg = `Firestore storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`[IngestAPI] ${errorMsg}`);
        errors.push(errorMsg);
      }
    } else {
      console.log('[IngestAPI] Step 4: Skipping Firestore storage');
    }

    const processingTime = Date.now() - startTime;
    const itemsPerSecond = (stats.received / processingTime) * 1000;

    console.log(
      `[IngestAPI] Pipeline complete: ${stats.received} received → ${stats.normalized} normalized → ${uniqueItems.length} unique → ${stats.indexed} indexed → ${stats.stored} stored (${processingTime}ms, ${itemsPerSecond.toFixed(0)} items/sec)`
    );

    return NextResponse.json<IngestResponse>({
      success: errors.length === 0,
      message:
        errors.length === 0
          ? 'Ingestion completed successfully'
          : 'Ingestion completed with errors',
      stats,
      processingTime,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[IngestAPI] Fatal error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ingest
 * 
 * Get ingestion pipeline status and configuration
 */
export async function GET() {
  try {
    const indexerReady = searchIndexer.isReady();
    
    return NextResponse.json({
      status: 'operational',
      indexer: {
        ready: indexerReady,
        message: indexerReady
          ? 'Meilisearch indexer initialized'
          : 'Meilisearch indexer not initialized',
      },
      pipeline: {
        steps: ['normalize', 'deduplicate', 'index', 'store'],
        description: 'Normalizer → Deduplicator → Meilisearch → Firestore',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
