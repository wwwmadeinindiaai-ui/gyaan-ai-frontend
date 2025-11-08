import { initializeApp, FirebaseApp, setLogLevel } from 'firebase/app';
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged,
  Auth,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  query,
  onSnapshot,
  where,
  addDoc,
  deleteDoc,
  Firestore,
  DocumentData,
  QueryConstraint,
  Unsubscribe,
  serverTimestamp,
} from 'firebase/firestore';

// Environment variables are globally declared in the runtime environment
declare const __firebase_config: string;
declare const __app_id: string;
declare const __initial_auth_token: string | undefined;

// Explicit Type Declarations for globals to prevent 'implicit any' errors
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let currentUserId: string | null = null;
let isAuthReady: boolean = false;

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
let firebaseConfig: Record<string, string> = {};

try {
  if (typeof __firebase_config !== 'undefined') {
    firebaseConfig = JSON.parse(__firebase_config);
  }
} catch (e) {
  console.error("Failed to parse __firebase_config:", e);
}

/**
 * Returns the path for a Firestore collection based on scope.
 * @param collectionName The name of the collection (e.g., 'dataSources').
 * @param scope 'public' for shared data, 'private' for user-specific data.
 * @returns The full Firestore collection path.
 */
function getCollectionPath(collectionName: string, scope: 'private' | 'public'): string {
  if (!currentUserId) {
    // Fallback ID to allow initialization to proceed, though operations will fail security rules
    console.warn('User ID is not yet defined. Using temporary fallback ID.');
    const userIdFallback = auth?.currentUser?.uid || 'temp-anon-id';
    
    if (scope === 'public') {
      return `artifacts/${appId}/public/data/${collectionName}`;
    } else {
      return `artifacts/${appId}/users/${userIdFallback}/${collectionName}`;
    }
  }

  const userId = currentUserId;

  if (scope === 'public') {
    // Path: /artifacts/{appId}/public/data/{collectionName}
    return `artifacts/${appId}/public/data/${collectionName}`;
  } else {
    // Path: /artifacts/{appId}/users/{userId}/{collectionName}
    return `artifacts/${appId}/users/${userId}/${collectionName}`;
  }
}

/**
 * Initializes Firebase, authenticates the user, and sets up the global instances.
 * This should be called once at application startup.
 */
export async function initializeFirebase(): Promise<void> {
  if (app) {
    return; // Already initialized
  }

  if (!Object.keys(firebaseConfig).length) {
    console.warn("Firebase configuration is missing or empty.");
    return;
  }

  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);

    console.log("Firebase services initialized.");

    // Sign in using the custom token or anonymously
    const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : undefined;

    if (token) {
      await signInWithCustomToken(auth, token);
    } else {
      await signInAnonymously(auth);
    }
    
    // Set up Auth State Listener
    onAuthStateChanged(auth, (user: User | null) => {
        if (user) {
            currentUserId = user.uid;
        } else {
            // If anonymous sign-in failed (shouldn't happen), use a random ID
            currentUserId = crypto.randomUUID();
        }
        isAuthReady = true;
        console.log(`Authentication state changed. User ID: ${currentUserId}`);
    });

  } catch (error) {
    console.error("Firebase initialization or authentication failed:", error);
  }
}

/**
 * Executes a real-time query against a Firestore collection.
 * @param collectionName The name of the collection.
 * @param scope The data scope ('private' or 'public').
 * @param callback Function to call with the updated data.
 * @param constraints Optional array of Firestore QueryConstraints (e.g., where).
 * @returns An unsubscribe function to stop listening to updates.
 */
export function listenToCollection<T extends DocumentData>(
  collectionName: string,
  scope: 'private' | 'public',
  callback: (data: (T & { id: string })[]) => void,
  constraints: QueryConstraint[] = []
): Unsubscribe {
  if (!db || !isAuthReady || !currentUserId) {
    // Return a no-op unsubscribe function if not ready
    console.warn("Firestore not ready. Cannot attach listener.");
    return () => {}; 
  }

  const path = getCollectionPath(collectionName, scope);
  const colRef = collection(db, path);
  const q = query(colRef, ...constraints);

  console.log(`Attaching listener to: ${path}`);

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as T & { id: string }));
    callback(data);
  }, (error) => {
    console.error(`Firestore listen error on ${path}:`, error);
  });
}

/**
 * Adds a new document to a collection.
 * @param collectionName The name of the collection.
 * @param scope The data scope ('private' or 'public').
 * @param data The document data to add.
 * @returns The ID of the newly created document.
 */
export async function addDocument(collectionName: string, scope: 'private' | 'public', data: DocumentData): Promise<string> {
  if (!db) throw new Error("Firestore not initialized.");
  const path = getCollectionPath(collectionName, scope);
  const docRef = await addDoc(collection(db, path), {
    ...data,
    userId: currentUserId,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Updates an existing document.
 * @param collectionName The name of the collection.
 * @param scope The data scope ('private' or 'public').
 * @param docId The ID of the document to update.
 * @param data The partial document data to merge.
 */
export async function updateDocument(collectionName: string, scope: 'private' | 'public', docId: string, data: Partial<DocumentData>): Promise<void> {
  if (!db) throw new Error("Firestore not initialized.");
  const path = getCollectionPath(collectionName, scope);
  const docRef = doc(db, path, docId);
  await setDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Deletes a document from a collection.
 * @param collectionName The name of the collection.
 * @param scope The data scope ('private' or 'public').
 * @param docId The ID of the document to delete.
 */
export async function deleteDocument(collectionName: string, scope: 'private' | 'public', docId: string): Promise<void> {
  if (!db) throw new Error("Firestore not initialized.");
  const path = getCollectionPath(collectionName, scope);
  const docRef = doc(db, path, docId);
  await deleteDoc(docRef);
}

/**
 * Utility function to check if Firebase and Auth are ready.
 */
export function isReady(): boolean {
    return isAuthReady && db !== null;
}

/**
 * Getter for the current user ID
 */
export function getUserId(): string | null {
    return currentUserId;
}

// Set logging level for debugging
console.log("Setting Firebase Log Level to Debug.");
setLogLevel('debug');
