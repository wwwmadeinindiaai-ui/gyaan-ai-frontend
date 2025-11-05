'use client';

import React, { useState, useEffect } from 'react';
import { 
    User, Mail, Key, CreditCard, ToggleRight, Settings, LogOut, Loader, Info, CheckCircle, XCircle, Bell
} from 'lucide-react';

// ===============================================
// === FIREBASE IMPORTS AND SETUP (MANDATORY) ===
// ===============================================
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, signOut } from 'firebase/auth';
import { 
    getFirestore, doc, onSnapshot, setDoc, collection, getDoc
} from 'firebase/firestore';

// Define global variables, mandatory for Canvas environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : undefined;

// --- Initialize and Auth State ---
let db, auth;
if (Object.keys(firebaseConfig).length) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
}

// ===============================================
// === AUTH HOOK (Reused from other pages) ===
// ===============================================
const useSession = () => {
    const [session, setSession] = useState(null);
    const [status, setStatus] = useState('loading');
    
    useEffect(() => {
        let isCancelled = false;

        if (!auth) {
            if (!isCancelled) {
                // Mock session when Firebase is unavailable
                setSession({ user: { 
                    name: "Dr. Elara Vance", 
                    email: "e.vance@gyaanai.com", 
                    uid: "mock-auth-uid-12345" 
                }});
                setStatus('authenticated');
            }
            return;
        }

        const runAuthSetup = async () => {
            let unsubscribe = () => {}; 
            
            try {
                unsubscribe = auth.onAuthStateChanged(user => {
                    if (isCancelled) return;
                    
                    if (user) {
                        setSession({ 
                            user: { 
                                name: user.displayName || "Gyaan AI User",
                                email: user.email || "N/A",
                                uid: user.uid
                            } 
                        });
                        setStatus('authenticated');
                    } else {
                        setSession(null);
                        setStatus('unauthenticated');
                    }
                });
                
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                } else {
                    await signInAnonymously(auth);
                }

            } catch (error) {
                if (isCancelled) return;
                console.error("Firebase Auth Initialization Error:", error);
                setStatus('unauthenticated');
            }

            return unsubscribe;
        };

        let cleanupFn = () => {};
        runAuthSetup().then(fn => cleanupFn = fn);

        return () => {
            isCancelled = true;
            cleanupFn();
        };

    }, []); 

    const handleSignOut = async () => {
        if (auth) {
            try {
                await signOut(auth);
                setSession(null);
                setStatus('unauthenticated');
                // Redirect user back to home or sign-in page
                window.location.href = '/'; 
            } catch (error) {
                console.error("Error signing out:", error);
            }
        } else {
             // Mock logout
            setSession(null);
            setStatus('unauthenticated');
            window.location.href = '/'; 
        }
    };

    return { data: session, status, signOut: handleSignOut };
};

// ===============================================
// === FIREBASE SETTINGS HOOK ===
// This handles reading and writing user settings to Firestore
// ===============================================

const defaultSettings = {
    darkMode: true,
    autoSaveDrafts: true,
    highAccuracyMode: false,
    emailNotifications: false,
    subscriptionTier: 'Pro'
};

const useUserSettings = (userId) => {
    const [settings, setSettings] = useState(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const settingsDocPath = userId && db 
        ? `artifacts/${appId}/users/${userId}/app_data/settings` 
        : null;

    useEffect(() => {
        if (!settingsDocPath) {
            setLoading(false);
            return;
        }

        const docRef = doc(db, settingsDocPath);
        
        // Use a real-time listener (onSnapshot)
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setSettings({ ...defaultSettings, ...docSnap.data() });
            } else {
                // Initialize document if it doesn't exist
                setDoc(docRef, defaultSettings).catch(err => console.error("Error setting initial doc:", err));
                setSettings(defaultSettings);
            }
            setLoading(false);
        }, (err) => {
            console.error("Firestore Settings Error:", err);
            setError("Failed to load settings.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [settingsDocPath]);

    const updateSetting = async (key, value) => {
        if (!settingsDocPath) {
            // Mock update for unauthenticated/no-firebase users
            setSettings(prev => ({ ...prev, [key]: value }));
            return;
        }

        try {
            const docRef = doc(db, settingsDocPath);
            // setDoc with merge: true acts like updateDoc, but handles creation if missing
            await setDoc(docRef, { [key]: value }, { merge: true });
        } catch (e) {
            console.error("Error updating setting: ", e);
            setError("Failed to save setting. Check console.");
        }
    };

    return { settings, loading, error, updateSetting };
};

// --- Utility Components ---
const PrimaryButton = ({ children, onClick, className = '' }) => (
    <button onClick={onClick} className={`px-4 py-2 rounded-lg font-semibold transition duration-200 text-sm flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white shadow-md ${className}`}>
        {children}
    </button>
);

const IconButton = ({ icon: Icon, onClick, className = '' }) => (
    <button onClick={onClick} className={`p-2 rounded-full text-gray-500 hover:bg-gray-100 transition ${className}`}>
        <Icon className="w-5 h-5" />
    </button>
);

const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
);

// --- Toggle Switch Component ---
const SettingsToggle = ({ label, description, isChecked, onToggle, Icon, isLoading }) => (
    <div className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0">
        <div className="flex items-start space-x-3">
            <Icon className="w-6 h-6 text-gray-500 mt-0.5 flex-shrink-0" />
            <div>
                <span className="text-base font-medium text-gray-900">{label}</span>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
        </div>
        <div className="flex items-center space-x-2">
            {isLoading && <Loader className="w-4 h-4 animate-spin text-indigo-500" />}
            <button
                onClick={onToggle}
                disabled={isLoading}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    isChecked ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
            >
                <span
                    aria-hidden="true"
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isChecked ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
            </button>
        </div>
    </div>
);

// --- Section Card Components ---

const UserProfileCard = ({ user, onSignOut }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-2xl">
                {user.name ? user.name.charAt(0) : 'G'}
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-900">{user.name || "Gyaan AI User"}</h2>
                <p className="text-gray-500 flex items-center space-x-2 text-sm">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                </p>
            </div>
        </div>
        
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-semibold text-gray-600 uppercase mb-1 flex items-center space-x-1">
                <Info className="w-3 h-3 text-indigo-500" />
                <span>Internal User ID (for support & collaboration)</span>
            </p>
            <p className="font-mono text-xs text-gray-800 break-all">{user.uid}</p>
        </div>

        <PrimaryButton onClick={onSignOut} className="w-full bg-red-600 hover:bg-red-700">
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </PrimaryButton>
    </div>
);

const SubscriptionCard = ({ tier }) => {
    const isPro = tier.toLowerCase() === 'pro';
    const Icon = isPro ? CheckCircle : XCircle;
    const color = isPro ? 'text-green-600' : 'text-indigo-600';

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 h-full">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <CreditCard className={`w-6 h-6 ${color}`} />
                <span>Subscription Status</span>
            </h3>
            
            <p className="text-3xl font-extrabold mb-2">{tier}</p>
            <p className="text-gray-600 mb-4">{isPro ? "You have access to all premium features." : "Upgrade to Pro for full access."}</p>
            
            <ul className="space-y-2 text-sm text-gray-700 mb-6">
                <li className="flex items-center space-x-2">
                    <Icon className="w-4 h-4 text-green-500" />
                    <span>{isPro ? "10,000" : "1,000"} AI Queries / month</span>
                </li>
                <li className="flex items-center space-x-2">
                    <Icon className="w-4 h-4 text-green-500" />
                    <span>{isPro ? "Advanced" : "Standard"} Article Builder</span>
                </li>
            </ul>

            {!isPro && (
                <PrimaryButton href="/pricing" className="bg-indigo-600 hover:bg-indigo-700 w-full">
                    Upgrade to Pro Plan
                </PrimaryButton>
            )}
            {isPro && (
                <PrimaryButton className="bg-gray-200 text-gray-700 hover:bg-gray-300 w-full shadow-none">
                    Manage Billing
                </PrimaryButton>
            )}
        </div>
    );
};

// --- Main Page Component ---
export default function ProfilePage() {
    const { data: session, status, signOut } = useSession();
    const userId = session?.user?.uid;
    const { settings, loading: settingsLoading, updateSetting } = useUserSettings(userId);
    
    if (status === 'loading') {
        return <LoadingSpinner />;
    }

    if (status !== 'authenticated' || !session) {
         return <div className="p-10 text-center text-red-600 font-medium">
             <p>Access Denied. Please sign in to view your profile and settings.</p>
         </div>;
    }

    // Toggle logic helper
    const handleToggle = (key) => {
        updateSetting(key, !settings[key]);
    };

    return (
        <div className="bg-gray-50 min-h-[calc(100vh-64px)] py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <header className="mb-8 border-b pb-4 border-gray-200">
                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center space-x-3">
                        <Settings className="w-8 h-8 text-indigo-600" />
                        <span>Profile & App Settings</span>
                    </h1>
                    <p className="mt-1 text-lg text-gray-600">Update your account information and preferences.</p>
                </header>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Column 1: Profile and Subscription */}
                    <div className="lg:col-span-1 space-y-8">
                        <UserProfileCard user={session.user} onSignOut={signOut} />
                        <SubscriptionCard tier={settings.subscriptionTier} />
                    </div>

                    {/* Column 2/3: General Settings */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                            <h3 className="text-xl font-semibold p-6 border-b border-gray-200 text-gray-900 flex items-center space-x-2">
                                <ToggleRight className="w-5 h-5 text-indigo-600" />
                                <span>General Application Settings</span>
                            </h3>
                            {settingsLoading ? (
                                <LoadingSpinner />
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    <SettingsToggle 
                                        label="Dark Mode"
                                        description="Switch the entire application interface to a dark theme."
                                        isChecked={settings.darkMode}
                                        onToggle={() => handleToggle('darkMode')}
                                        Icon={Settings}
                                        isLoading={settingsLoading}
                                    />
                                    <SettingsToggle 
                                        label="Auto-Save Drafts"
                                        description="Automatically save unsaved work and draft reports to your history."
                                        isChecked={settings.autoSaveDrafts}
                                        onToggle={() => handleToggle('autoSaveDrafts')}
                                        Icon={Info}
                                        isLoading={settingsLoading}
                                    />
                                    <SettingsToggle 
                                        label="High Accuracy Mode"
                                        description="Use slower, more powerful AI models for generation (may use more query credits)."
                                        isChecked={settings.highAccuracyMode}
                                        onToggle={() => handleToggle('highAccuracyMode')}
                                        Icon={Zap}
                                        isLoading={settingsLoading}
                                    />
                                    <SettingsToggle 
                                        label="Email Notifications"
                                        description="Receive updates about new features and usage reports."
                                        isChecked={settings.emailNotifications}
                                        onToggle={() => handleToggle('emailNotifications')}
                                        Icon={Bell}
                                        isLoading={settingsLoading}
                                    />
                                </div>
                            )}
                        </div>
                        
                        {/* API Key/Security Placeholder */}
                        <div className="bg-white p-6 mt-8 rounded-xl shadow-lg border border-gray-200">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                                <Key className="w-6 h-6 text-indigo-600" />
                                <span>API & Security</span>
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Manage your API access token and set up two-factor authentication.
                            </p>
                            <PrimaryButton className="bg-gray-700 hover:bg-gray-800">
                                Generate New API Key
                            </PrimaryButton>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Add necessary icon for Zap (used in settings toggle)
const Zap = ({ className = 'w-5 h-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
);
