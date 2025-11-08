// --- FIX: Declare global variables for TypeScript to recognize the Canvas injected values ---
declare const __app_id: string | undefined;
declare const __firebase_config: string | undefined;
declare const __initial_auth_token: string | null | undefined;
// -----------------------------------------------------------------------------------------

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, Auth, User
} from 'firebase/auth';
import { 
  getFirestore, Firestore, collection, onSnapshot, query, setDoc, doc, Unsubscribe, deleteDoc, updateDoc
} from 'firebase/firestore';

// --- Type Definitions ---
const GENERAL_TYPES = ['API', 'Database', 'File', 'OAuth'] as const;
type GeneralType = typeof GENERAL_TYPES[number];

// Services derived from the user's environment variable list
const EXTERNAL_SERVICES = ['Gemini API', 'YouTube', 'Unsplash', 'NewsAPI', 'GitHub', 'Custom API'] as const;
type ExternalService = typeof EXTERNAL_SERVICES[number];


interface SourceConfig {
    service: ExternalService; // e.g., 'Gemini API'
    credentialName: string; // e.g., 'GEMINI_API_KEY'
    endpoint: string;
    
    // Service-specific fields (optional)
    youtubeChannelId?: string;
    newsCategory?: string; // e.g., 'technology'
    githubRepo?: string; // e.g., 'google/gemini-api'
}

interface DataSource {
  id: string;
  name: string;
  type: GeneralType; // General type (API, Database, etc.)
  status: 'active' | 'inactive';
  lastSync: number; // Unix timestamp
  config: SourceConfig;
}

interface FirebaseState {
  db: Firestore | null;
  auth: Auth | null;
  userId: string | null;
  isAuthReady: boolean;
}

interface Notification {
    message: string;
    type: 'success' | 'error';
}

const INITIAL_FIREBASE_STATE: FirebaseState = {
  db: null,
  auth: null,
  userId: null,
  isAuthReady: false,
};

// --- Helper Functions ---

const getInitialConfig = (service: ExternalService): SourceConfig => {
    // Helper function to set initial realistic data based on service
    switch (service) {
        case 'Gemini API':
            return {
                service,
                credentialName: 'GEMINI_API_KEY',
                endpoint: 'https://generativelanguage.googleapis.com/v1beta',
            };
        case 'YouTube':
            return {
                service,
                credentialName: 'YOUTUBE_API_KEY',
                endpoint: 'https://www.googleapis.com/youtube/v3',
                youtubeChannelId: 'UC-QdM7_v6WvK8_2m_mP-H-g',
            };
        case 'Unsplash':
            return {
                service,
                credentialName: 'UNSPLASH_ACCESS_KEY',
                endpoint: 'https://api.unsplash.com',
            };
        case 'NewsAPI':
            return {
                service,
                credentialName: 'NEWSAPI_KEY',
                endpoint: 'https://newsapi.org/v2',
                newsCategory: 'technology',
            };
        case 'GitHub':
            return {
                service,
                credentialName: 'GITHUB_API_KEY',
                endpoint: 'https://api.github.com',
                githubRepo: 'owner/repo',
            };
        case 'Custom API':
        default:
            return {
                service: 'Custom API',
                credentialName: 'CUSTOM_SECRET_KEY',
                endpoint: 'https://my-custom-api.com/v1',
            };
    }
}

// --- Modal Component for Editing ---

interface EditModalProps {
    source: DataSource;
    onClose: () => void;
    onSave: (id: string, updates: { name: string; status: 'active' | 'inactive'; config: SourceConfig }) => void;
}

const EditModal: React.FC<EditModalProps> = ({ source, onClose, onSave }) => {
    const [name, setName] = useState(source.name);
    const [status, setStatus] = useState(source.status);
    
    // Configuration details
    const [config, setConfig] = useState<SourceConfig>(source.config);

    const [isSaving, setIsSaving] = useState(false);

    // Dynamic configuration fields based on the selected service
    const renderServiceConfigFields = () => {
        const updateConfig = (key: keyof SourceConfig, value: string) => {
            setConfig(prev => ({ ...prev, [key]: value }));
        };

        switch (config.service) {
            case 'YouTube':
                return (
                    <div className="mb-4">
                        <label htmlFor="youtubeChannelId" className="block text-sm font-medium text-gray-700 mb-1">
                            YouTube Channel ID (e.g., UC-...)
                        </label>
                        <input
                            id="youtubeChannelId"
                            type="text"
                            value={config.youtubeChannelId || ''}
                            onChange={(e) => updateConfig('youtubeChannelId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            placeholder="UC-QdM7_v6WvK8_2m_mP-H-g"
                            required
                        />
                    </div>
                );
            case 'NewsAPI':
                return (
                    <div className="mb-4">
                        <label htmlFor="newsCategory" className="block text-sm font-medium text-gray-700 mb-1">
                            News Category (e.g., business, technology)
                        </label>
                        <input
                            id="newsCategory"
                            type="text"
                            value={config.newsCategory || ''}
                            onChange={(e) => updateConfig('newsCategory', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            placeholder="technology"
                        />
                    </div>
                );
            case 'GitHub':
                return (
                    <div className="mb-4">
                        <label htmlFor="githubRepo" className="block text-sm font-medium text-gray-700 mb-1">
                            GitHub Repository (owner/repo)
                        </label>
                        <input
                            id="githubRepo"
                            type="text"
                            value={config.githubRepo || ''}
                            onChange={(e) => updateConfig('githubRepo', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            placeholder="google/gemini-api"
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        
        onSave(source.id, { 
            name, 
            status, 
            config: config
        });
        
        onClose(); 
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
                    Configure: {source.type} - {source.config.service}
                </h3>
                <form onSubmit={handleSubmit}>
                    
                    {/* General Fields */}
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Source Name</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    {/* Authentication Fields */}
                    <fieldset className="p-4 border border-blue-200 rounded-lg mb-6 bg-blue-50">
                        <legend className="px-2 text-sm font-semibold text-blue-700">Connection Details</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="credentialName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Credential Name (Env Var)
                                </label>
                                <input
                                    id="credentialName"
                                    type="text"
                                    value={config.credentialName}
                                    onChange={(e) => setConfig(prev => ({ ...prev, credentialName: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="GEMINI_API_KEY"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Key required in your production environment.
                                </p>
                            </div>
                            <div>
                                <label htmlFor="endpoint" className="block text-sm font-medium text-gray-700 mb-1">
                                    Base Endpoint URL
                                </label>
                                <input
                                    id="endpoint"
                                    type="text"
                                    value={config.endpoint}
                                    onChange={(e) => setConfig(prev => ({ ...prev, endpoint: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="https://api.example.com/v1"
                                    required
                                />
                            </div>
                        </div>
                    </fieldset>

                    {/* Service-Specific Fields */}
                    {renderServiceConfigFields()}

                    {/* Status Field */}
                    <div className="mb-6">
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Connection Status</label>
                        <select
                            id="status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                            <option value="active">Active (Data Syncing)</option>
                            <option value="inactive">Inactive (Paused)</option>
                        </select>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-150"
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className={`px-4 py-2 text-white font-medium rounded-lg transition duration-150 ${
                                isSaving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- Main Component Logic ---

const MultiSourceIntegrationHub: React.FC = () => {
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  const firebaseConfigString = typeof __firebase_config !== 'undefined' ? __firebase_config : '{}';
  const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
  
  const [firebaseState, setFirebaseState] = useState<FirebaseState>(INITIAL_FIREBASE_STATE);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  
  const [editingSource, setEditingSource] = useState<DataSource | null>(null);

  // Function to show and hide notifications automatically
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => {
        setNotification(null);
    }, 3000);
  };

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
        
        if (initialAuthToken) {
          await signInWithCustomToken(authInstance, initialAuthToken);
        } else {
          await signInAnonymously(authInstance);
        }

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
    
    return () => {
        if (unsubscribe) unsubscribe();
    };
  }, []);

  // 2. Real-time Data Fetching (Firestore onSnapshot)
  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;
    const { db, userId, isAuthReady } = firebaseState;

    if (!isAuthReady || !db || !userId) return;

    const userDatasourcesCollectionPath = `/artifacts/${appId}/users/${userId}/datasources`;
    const datasourcesCollectionRef = collection(db, userDatasourcesCollectionPath);
    
    try {
        const q = query(datasourcesCollectionRef);
        
        unsubscribe = onSnapshot(q, (snapshot) => {
            const sources: DataSource[] = snapshot.docs.map((doc) => {
                const data = doc.data();
                // Ensure config object and all necessary fields are present using default values
                const config: SourceConfig = {
                    service: data.config?.service || 'Custom API',
                    credentialName: data.config?.credentialName || 'API_KEY',
                    endpoint: data.config?.endpoint || '',
                    youtubeChannelId: data.config?.youtubeChannelId,
                    newsCategory: data.config?.newsCategory,
                    githubRepo: data.config?.githubRepo,
                };

                return {
                    id: doc.id,
                    ...data as Omit<DataSource, 'id' | 'config'>,
                    config: config,
                } as DataSource;
            });

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
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [firebaseState.db, firebaseState.userId, firebaseState.isAuthReady, appId]);

  // Handler for adding a new mock data source
  const addMockDataSource = async () => {
    const { db, userId } = firebaseState;
    if (!db || !userId) {
        showNotification("Authentication not ready. Please wait.", 'error');
        return;
    }
    
    // Cycle through the external services for new mock data
    const serviceIndex = dataSources.length % EXTERNAL_SERVICES.length;
    const newService = EXTERNAL_SERVICES[serviceIndex];
    const newConfig = getInitialConfig(newService);

    const newSource: Omit<DataSource, 'id'> = {
      name: `${newService} Integration`,
      type: 'API', 
      status: 'inactive', 
      lastSync: Date.now(),
      config: newConfig,
    };

    const docRefPath = `/artifacts/${appId}/users/${userId}/datasources`;
    const newDocRef = doc(collection(db, docRefPath));

    try {
      await setDoc(newDocRef, newSource);
      showNotification(`Source '${newSource.name}' added! Now configure its credentials.`, 'success');
    } catch (e) {
      console.error("Failed to add document:", e);
      showNotification("Could not add new data source.", 'error');
    }
  };

  // Handler for updating a data source
  const handleUpdateSource = async (
    sourceId: string, 
    updates: { name: string; status: 'active' | 'inactive'; config: SourceConfig } 
  ) => {
    const { db, userId } = firebaseState;
    if (!db || !userId) {
        showNotification("Authentication not ready. Cannot update.", 'error');
        return;
    }

    const docRefPath = `/artifacts/${appId}/users/${userId}/datasources/${sourceId}`;
    const docRef = doc(db, docRefPath);

    try {
        await updateDoc(docRef, { 
            name: updates.name, 
            status: updates.status, 
            config: updates.config, 
            lastSync: Date.now()
        });
        showNotification(`Source '${updates.name}' updated successfully.`, 'success');
    } catch (e) {
        console.error(`Failed to update document ${sourceId}:`, e);
        showNotification(`Failed to update source '${updates.name}'.`, 'error');
    }
  };


  // Handler for deleting a data source 
  const handleDeleteSource = async (sourceId: string, sourceName: string) => {
    const { db, userId } = firebaseState;
    if (!db || !userId) {
        showNotification("Authentication not ready. Cannot delete.", 'error');
        return;
    }

    const docRefPath = `/artifacts/${appId}/users/${userId}/datasources/${sourceId}`;
    const docRef = doc(db, docRefPath);

    try {
        await deleteDoc(docRef);
        showNotification(`Source '${sourceName}' deleted successfully.`, 'success');
    } catch (e) {
        console.error(`Failed to delete document ${sourceId}:`, e);
        showNotification(`Failed to delete source '${sourceName}'.`, 'error');
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

  // --- Notification Component and Animation ---
  const NotificationToast = notification && (
    <div 
        className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-xl text-white transition-opacity duration-300 ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } animate-fade-in-up`}
        role="alert"
    >
        {notification.message}
    </div>
  );
  
  const tailwindAnimation = (
    <style dangerouslySetInnerHTML={{__html: `
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.3s ease-out forwards;
        }
    `}} />
  );
  // --- End Notification Component ---

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-inter">
      <script src="https://cdn.tailwindcss.com"></script>
      {tailwindAnimation}
      
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
              + Add Mock Integration
            </button>
          </div>

          <div className="space-y-4">
            {dataSources.length === 0 ? (
              <div className="text-center p-8 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-gray-600">No data sources connected yet. Click "Add Mock Integration" to populate the list!</p>
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
                       {source.type === 'OAuth' && <span className="mr-2 text-purple-500">🔒</span>}
                       {source.name}
                    </p>
                    <p className="text-sm text-gray-500">
                        Service: <span className="font-semibold text-gray-700">{source.config.service}</span>
                        <span className="ml-3 text-gray-400"> (Key: {source.config.credentialName})</span>
                    </p>
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
                    <button 
                        onClick={() => setEditingSource(source)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Configure
                    </button>
                    <button 
                        onClick={() => handleDeleteSource(source.id, source.name)}
                        className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* Render Edit Modal if a source is selected for editing */}
      {editingSource && (
          <EditModal 
              source={editingSource}
              onClose={() => setEditingSource(null)}
              onSave={handleUpdateSource}
          />
      )}

      {NotificationToast}
    </div>
  );
};

export default MultiSourceIntegrationHub;
