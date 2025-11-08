// src/lib/firebase/firestore.ts
// Firestore utility functions for query history management

import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, DocumentData } from 'firebase/firestore';
import { QueryHistoryRecord } from '@/lib/types/query';

const QUERY_HISTORY_COLLECTION = 'query_history';

/**
 * Get the reference to the query history collection
 */
export function getQueryHistoryCollection() {
  return collection(db, QUERY_HISTORY_COLLECTION);
}

/**
 * Save a query history record to Firestore
 */
export async function saveQueryHistory(record: Omit<QueryHistoryRecord, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(getQueryHistoryCollection(), {
      ...record,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('[Firestore] Query saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[Firestore] Error saving query history:', error);
    // Non-blocking error - log but don't throw
    return '';
  }
}

/**
 * Retrieve query history for a specific user
 */
export async function getQueryHistory(userId: string, limitCount: number = 10): Promise<QueryHistoryRecord[]> {
  try {
    const q = query(
      getQueryHistoryCollection(),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const results: QueryHistoryRecord[] = [];

    querySnapshot.forEach((doc: DocumentData) => {
      results.push({
        id: doc.id,
        ...doc.data(),
      } as QueryHistoryRecord);
    });

    console.log('[Firestore] Retrieved', results.length, 'query history records');
    return results;
  } catch (error) {
    console.error('[Firestore] Error retrieving query history:', error);
    return [];
  }
}
