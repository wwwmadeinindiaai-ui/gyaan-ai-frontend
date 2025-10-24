import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  deleteDoc,
  Timestamp,
  addDoc 
} from 'firebase/firestore';

export interface SearchHistory {
  id?: string;
  userId: string;
  query: string;
  timestamp: Date | Timestamp;
  results?: any;
  filters?: {
    source: string;
    sortBy: string;
  };
}

const SEARCH_HISTORY_COLLECTION = 'searchHistory';

/**
 * Save a search to user's search history in Firestore
 */
export async function saveSearchHistory(
  userId: string,
  searchData: Omit<SearchHistory, 'id' | 'userId' | 'timestamp'>
): Promise<void> {
  try {
    const searchHistoryRef = collection(db, SEARCH_HISTORY_COLLECTION);
    await addDoc(searchHistoryRef, {
      userId,
      ...searchData,
      timestamp: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error saving search history:', error);
    throw error;
  }
}

/**
 * Get user's search history from Firestore
 */
export async function getSearchHistory(
  userId: string,
  limitCount: number = 10
): Promise<SearchHistory[]> {
  try {
    const searchHistoryRef = collection(db, SEARCH_HISTORY_COLLECTION);
    const q = query(
      searchHistoryRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const history: SearchHistory[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      history.push({
        id: doc.id,
        userId: data.userId,
        query: data.query,
        timestamp: data.timestamp.toDate(),
        results: data.results,
        filters: data.filters,
      });
    });

    return history;
  } catch (error) {
    console.error('Error fetching search history:', error);
    throw error;
  }
}

/**
 * Clear all search history for a user
 */
export async function clearSearchHistory(userId: string): Promise<void> {
  try {
    const searchHistoryRef = collection(db, SEARCH_HISTORY_COLLECTION);
    const q = query(searchHistoryRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error clearing search history:', error);
    throw error;
  }
}

/**
 * Delete a specific search history entry
 */
export async function deleteSearchHistoryItem(searchId: string): Promise<void> {
  try {
    const searchDocRef = doc(db, SEARCH_HISTORY_COLLECTION, searchId);
    await deleteDoc(searchDocRef);
  } catch (error) {
    console.error('Error deleting search history item:', error);
    throw error;
  }
}

/**
 * Get a single search history item by ID
 */
export async function getSearchHistoryItem(searchId: string): Promise<SearchHistory | null> {
  try {
    const searchDocRef = doc(db, SEARCH_HISTORY_COLLECTION, searchId);
    const docSnap = await getDoc(searchDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId: data.userId,
        query: data.query,
        timestamp: data.timestamp.toDate(),
        results: data.results,
        filters: data.filters,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching search history item:', error);
    throw error;
  }
}
