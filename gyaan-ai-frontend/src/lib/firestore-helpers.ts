import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as limitFn,
  deleteDoc,
  Timestamp,
  addDoc,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
} from "firebase/firestore";

export interface SearchHistory {
  id?: string;
  userId: string;
  query: string;
  timestamp: Date;            // always a JS Date in app code
  results?: any;              // you can tighten this type later
  filters?: {
    source: string;
    sortBy: string;
  };
}

/**
 * Firestore data converter for SearchHistory
 * Ensures timestamp is always a Date (in app code) and stored as Timestamp in Firestore.
 */
export const searchHistoryConverter: FirestoreDataConverter<SearchHistory> = {
  toFirestore(history: SearchHistory) {
    return {
      userId: history.userId,
      query: history.query,
      results: history.results ?? null,
      filters: history.filters ?? null,
      timestamp:
        history.timestamp instanceof Date
          ? Timestamp.fromDate(history.timestamp)
          : history.timestamp, // tolerate pre-converted Timestamp
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): SearchHistory {
    const data = snapshot.data(options) as any;
    return {
      id: snapshot.id,
      userId: data.userId,
      query: data.query,
      results: data.results ?? null,
      filters: data.filters ?? null,
      timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp),
    };
  },
};

const SEARCH_HISTORY_COLLECTION = "searchHistory";

/**
 * Save a search to user's search history in Firestore
 */
export async function saveSearchHistory(
  userId: string,
  searchData: Omit<SearchHistory, "id" | "userId" | "timestamp">
): Promise<void> {
  try {
    const searchHistoryRef = collection(db, SEARCH_HISTORY_COLLECTION).withConverter(searchHistoryConverter);
    await addDoc(searchHistoryRef, {
      userId,
      ...searchData,
      timestamp: new Date(), // converter will store as Firestore Timestamp
    });
  } catch (error) {
    console.error("Error saving search history:", error);
    throw error;
  }
}

/**
 * Get user's search history from Firestore
 */
export async function getSearchHistory(userId: string, limitCount: number = 10): Promise<SearchHistory[]> {
  try {
    const searchHistoryRef = collection(db, SEARCH_HISTORY_COLLECTION).withConverter(searchHistoryConverter);
    const q = query(searchHistoryRef, where("userId", "==", userId), orderBy("timestamp", "desc"), limitFn(limitCount));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((d) => d.data());
  } catch (error) {
    console.error("Error fetching search history:", error);
    throw error;
  }
}

/**
 * Clear all search history for a user
 */
export async function clearSearchHistory(userId: string): Promise<void> {
  try {
    const searchHistoryRef = collection(db, SEARCH_HISTORY_COLLECTION); // converter not needed for deletes
    const q = query(searchHistoryRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    const deletePromises = querySnapshot.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error clearing search history:", error);
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
    console.error("Error deleting search history item:", error);
    throw error;
  }
}

/**
 * Get a single search history item by ID
 */
export async function getSearchHistoryItem(searchId: string): Promise<SearchHistory | null> {
  try {
    const searchDocRef = doc(db, SEARCH_HISTORY_COLLECTION, searchId).withConverter(searchHistoryConverter);
    const docSnap = await getDoc(searchDocRef);

    if (!docSnap.exists()) return null;
    return docSnap.data(); // already typed & has id via converter
  } catch (error) {
    console.error("Error fetching search history item:", error);
    throw error;
  }
}
