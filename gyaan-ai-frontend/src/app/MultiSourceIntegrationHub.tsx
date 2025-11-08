'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, Auth, User
} from 'firebase/auth';
import { 
  getFirestore, Firestore, collection, onSnapshot, query, setDoc, doc, DocumentData, Unsubscribe
} from 'firebase/firestore';

// --- Type Definitions (Extracted from user's implied types/structure) ---

// Define the shape of a single data source document
interface DataSource {
  id: string;
  name: string;
  type: 'API' | 'Database' | 'File';
  status: 'active' | 'inactive';
  lastSync: number; // Unix timestamp
}

// Define the state for Firebase services and user identity
interface FirebaseState {
  db: Firestore | null;
  auth: Auth | null;
  userId: string | null;
  isAuthReady: boolean;
}

// Define the initial state for Firebase services
const INITIAL_FIREBASE_STATE: FirebaseState = {
  db: null,
  auth: null,
  userId: null,
  isAuthReady: false,
};


// --- Component Logic ---

const MultiSourceIntegrationHub: React.FC = () => {
  // Global variables provided by the Canvas environment
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  const firebaseConfigString = typeof __firebase_config !== 'undefined' ? __firebase_config : '{}';
  const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
  
  const [firebaseState, setFirebaseState] = useState<FirebaseState>(INITIAL_FIREBASE_STATE);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Firebase Initialization and Authentication
  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    const initFirebase = async () => {
      try {
        const firebaseConfig = JSON.parse(firebaseConfigString);
        if (Object.keys(firebaseConfig).length === 0) {
            console.error("Firebase config is empty.");
            setIsLoading(false);
            return;
        }

        const app = initializeApp(firebaseConfig);
        const dbInstance = getFirestore(app);
        const authInstance = getAuth(app);
        
        // Use custom token if available, otherwise sign in anonymously
        if (initialAuthToken) {
          await signInWithCustomToken(authInstance, initialAuthToken);
        } else {
          await signInAnonymously(authInstance);
        }

        // Set up Auth State Listener
        unsubscribe = onAuthStateChanged(authInstance, (user: User | null) => {
            const currentUserId = user ? user.uid : crypto.randomUUID();
            
            setFirebaseState({
                db: dbInstance,
                auth: authInstance,
                userId: currentUserId,
                isAuthReady: true,
            });
            setIsLoading(false);
        });

      } catch (e) {
        console.error("Firebase initialization or authentication failed:", e);
        setError("Failed to connect to backend services.");
        setIsLoading(false);
      }
    };

    initFirebase();
    
    // Cleanup the auth listener on unmount
    return () => {
        if (unsubscribe) unsubscribe();
    };
  }, []); // Run only once on mount

  // 2. Real-time Data Fetching (Firestore onSnapshot)
  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;
    const { db, userId, isAuthReady } = firebaseState;

    // Guard clause: Do not fetch data until auth is confirmed and userId is available
    if (!isAuthReady || !db || !userId) return;

    // Collection Path: /artifacts/{appId}/users/{userId}/datasources
    const userDatasourcesCollectionPath = `/artifacts/${appId}/users/${userId}/datasources`;
    const datasourcesCollectionRef = collection(db, userDatasourcesCollectionPath);
    
    // Set up real-time listener
    try {
        const q = query(datasourcesCollectionRef);
        
        unsubscribe = onSnapshot(q, (snapshot) => {
            const sources: DataSource[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data() as Omit<DataSource, 'id'>,
            }));

            // Sort data by name client-side (to avoid index issues)
            sources.sort((a, b) => a.name.localeCompare(b.name));
            setDataSources(sources);
            setIsLoading(false);
        }, (err) => {
            console.error("Firestore snapshot listener failed:", err);
            setError("Error fetching real-time data.");
        });

    } catch (e) {
        console.error("Error setting up onSnapshot listener:", e);
        setError("A data connection error occurred.");
        setIsLoading(false);
    }
    
    // Cleanup the listener on unmount or dependency change
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [firebaseState.db, firebaseState.userId, firebaseState.isAuthReady, appId]);

  // Handler for adding a new mock data source
  const addMockDataSource = async () => {
    const { db, userId } = firebaseState;
    if (!db || !userId) return;

    const newSource: Omit<DataSource, 'id'> = {
      name: `New Source ${dataSources.length + 1}`,
      type: (['API', 'Database', 'File'] as const)[Math.floor(Math.random() * 3)],
      status: 'active',
      lastSync: Date.now(),
    };

    const docRefPath = `/artifacts/${appId}/users/${userId}/datasources`;
    const newDocRef = doc(collection(db, docRefPath));

    try {
      await setDoc(newDocRef, newSource);
    } catch (e) {
      console.error("Failed to add document:", e);
      setError("Could not add new data source.");
    }
  };

  // Helper to format last sync time
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg font-medium text-blue-600">Loading Integrations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="text-lg font-medium text-red-700 p-6 rounded-lg shadow-lg bg-white">
          <p>Error: {error}</p>
          <p className="text-sm text-gray-500 mt-2">Please check the console for details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-inter">
      <script src="https://cdn.tailwindcss.com"></script>
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1">
            Gyaan AI: Data Integration Hub
          </h1>
          <p className="text-sm text-gray-600">
            Current User ID: <code className="bg-gray-200 px-2 py-0.5 rounded text-xs font-mono">{firebaseState.userId || 'Signing in...'}</code>
          </p>
        </header>

        <main className="bg-white p-6 rounded-xl shadow-2xl">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Connected Data Sources ({dataSources.length})
            </h2>
            <button
              onClick={addMockDataSource}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition duration-150 ease-in-out transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              + Add Mock Source
            </button>
          </div>

          <div className="space-y-4">
            {dataSources.length === 0 ? (
              <div className="text-center p-8 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-gray-600">No data sources connected yet. Click "Add Mock Source" to populate the list!</p>
              </div>
            ) : (
              dataSources.map((source) => (
                <div 
                  key={source.id} 
                  className="p-5 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition duration-200 flex flex-col md:flex-row justify-between items-start md:items-center"
                >
                  <div className="flex-grow mb-3 md:mb-0">
                    <p className="text-lg font-bold text-gray-800 flex items-center">
                       {source.type === 'API' && <span className="mr-2 text-blue-500">🔗</span>}
                       {source.type === 'Database' && <span className="mr-2 text-green-500">💾</span>}
                       {source.type === 'File' && <span className="mr-2 text-yellow-500">📁</span>}
                       {source.name}
                    </p>
                    <p className="text-sm text-gray-500">Type: {source.type}</p>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm">
                    <span 
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        source.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {source.status.toUpperCase()}
                    </span>
                    <span className="text-gray-500">
                      Sync: {formatTime(source.lastSync)}
                    </span>
                    <button className="text-blue-600 hover:text-blue-800 font-medium">
                      Configure
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MultiSourceIntegrationHub;
