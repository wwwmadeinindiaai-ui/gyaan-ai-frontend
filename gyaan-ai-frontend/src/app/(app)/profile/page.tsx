'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { 
    User, Mail, Key, Settings, CreditCard, Save, X, Check, Lock, Bell 
} from 'lucide-react';

// ===============================================
// === FIREBASE IMPORTS AND SETUP (MANDATORY) ===
// ===============================================
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { 
    getFirestore, doc, setDoc, onSnapshot, updateDoc, 
    collection, query, where, getDocs 
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
// === CRITICAL MOCK FOR RUNNABLE ENVIRONMENT ===
// The following mock is used for session data when Firestore isn't fully set up or 
// to provide initial data. In a real app, this would be from 'next-auth/react'.
// ===============================================
const useSession = () => {
    // Mimics the session structure
    const [session, setSession] = useState(null);
    const [status, setStatus] = useState('loading');
    
    useEffect(() => {
        let isCancelled = false;

        if (!auth) {
             // Fallback if Firebase setup failed (Non-Firebase Mock)
            if (!isCancelled) {
                setSession({ user: { 
                    name: "Mock User", 
                    email: "arunattn33@gmail.com", 
                    uid: "mock-auth-uid-12345" 
                }});
                setStatus('authenticated');
            }
            return;
        }

        // --- Robust Firebase Auth Setup ---
        const runAuthSetup = async () => {
            let unsubscribe = () => {}; // Placeholder for the listener cleanup function
            
            try {
                // 1. Set up the listener first. This fires immediately with the current state.
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
                
                // 2. Attempt sign-in to establish session if an initial token is available.
                // This attempt will trigger the onAuthStateChanged listener above.
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                } else {
                    // Always ensure we have a user (even anonymous) for Firestore rules
                    await signInAnonymously(auth);
                }

            } catch (error) {
                if (isCancelled) return;
                console.error("Firebase Auth Initialization Error:", error);
                // If sign-in completely fails, we force the status out of loading.
                setStatus('unauthenticated');
            }

            return unsubscribe;
        };

        // Run the async setup and capture the cleanup function
        let cleanupFn = () => {};
        runAuthSetup().then(fn => cleanupFn = fn);

        // Cleanup function for useEffect
        return () => {
            isCancelled = true;
            cleanupFn();
        };

    }, []); // Empty dependency array is correct

    return { data: session, status, authInstance: auth };
};

// --- Utility Components ---
const PrimaryButton = ({ children, onClick, disabled = false, className = '', href, type = 'button' }) => {
    const baseClasses = `px-4 py-2 rounded-lg font-semibold transition duration-200 text-sm flex items-center justify-center`;
    const themeClasses = disabled 
        ? 'bg-gray-400 cursor-not-allowed text-white' 
        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg';

    if (href) return <a href={href} className={`${baseClasses} ${themeClasses} ${className}`}>{children}</a>;
    return <button onClick={onClick} disabled={disabled} type={type} className={`${baseClasses} ${themeClasses} ${className}`}>{children}</button>;
};

const SecondaryButton = ({ children, onClick, disabled = false, className = '' }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`px-4 py-2 rounded-lg font-semibold transition duration-200 text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 ${disabled ? 'opacity-50' : ''} ${className}`}
    >
        {children}
    </button>
);

const InputField = ({ label, icon: Icon, value, onChange, type = 'text', readOnly = false }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="relative rounded-lg shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon className="h-5 w-5 text-gray-400" />
            </div>
            <input
                type={type}
                value={value}
                onChange={onChange}
                readOnly={readOnly}
                className={`block w-full rounded-lg border-gray-300 pl-10 pr-4 py-3 text-base ${
                    readOnly ? 'bg-gray-50 text-gray-500 cursor-default' : 'focus:border-indigo-500 focus:ring-indigo-500'
                }`}
                placeholder={label}
            />
        </div>
    </div>
);

// --- Firestore Data Management ---
const useUserProfile = (userId) => {
    const [profile, setProfile] = useState({ 
        displayName: '', 
        apiKey: '************************',
        billingCycle: 'Annual', 
        notifications: true 
    });
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState(null);

    const profilePath = userId && db 
        ? `artifacts/${appId}/users/${userId}/profile/settings` 
        : null;

    useEffect(() => {
        if (!profilePath) return;

        const docRef = doc(db, profilePath);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setProfile(prev => ({ 
                    ...prev, 
                    displayName: data.displayName || prev.displayName,
                    billingCycle: data.billingCycle || prev.billingCycle,
                    notifications: data.notifications !== undefined ? data.notifications : prev.notifications,
                    // Note: API key is not stored in Firestore for this demo, keeping mock
                }));
            } else {
                console.log("No profile found, using defaults.");
            }
        }, (error) => {
            console.error("Firestore Snapshot Error:", error);
            setMessage({ type: 'error', text: 'Error loading profile. Check console for details.' });
        });

        return () => unsubscribe();
    }, [profilePath]);

    const saveProfile = useCallback(async (newProfile) => {
        if (!profilePath) {
            setMessage({ type: 'error', text: 'Authentication error. Cannot save profile.' });
            return;
        }

        setIsSaving(true);
        setMessage(null);

        try {
            const docRef = doc(db, profilePath);
            await setDoc(docRef, {
                displayName: newProfile.displayName,
                billingCycle: newProfile.billingCycle,
                notifications: newProfile.notifications,
            }, { merge: true });
            
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (e) {
            console.error("Error saving document: ", e);
            setMessage({ type: 'error', text: 'Failed to save profile. Please try again.' });
        } finally {
            setIsSaving(false);
            // Clear message after 5 seconds
            setTimeout(() => setMessage(null), 5000);
        }
    }, [profilePath]);

    return { profile, saveProfile, isSaving, message, setProfile };
};


// --- Main Page Component ---
export default function ProfilePage() {
    const { data: session, status } = useSession();
    
    // Get user ID after auth is ready
    const userId = session?.user?.uid;
    
    // Custom hook to manage profile state and persistence
    const { profile, saveProfile, isSaving, message, setProfile } = useUserProfile(userId);

    // Local state for form input (pre-save). Initialized with the Firestore state.
    const [localProfile, setLocalProfile] = useState(profile);

    // Sync Firestore state to local form state when Firestore data loads/changes
    useEffect(() => {
        // This ensures local state updates when Firestore loads the data
        setLocalProfile(profile);
    }, [profile]);
    
    const isProfileDirty = localProfile.displayName !== profile.displayName ||
                           localProfile.billingCycle !== profile.billingCycle ||
                           localProfile.notifications !== profile.notifications;

    const handleSave = () => {
        if (isProfileDirty) {
            saveProfile(localProfile);
        }
    };

    // Use status !== 'authenticated' as the primary check to ensure we move out of 'loading'
    if (status === 'loading') {
        return <LoadingSpinner />;
    }
    if (status !== 'authenticated') {
         return <AccessDenied />;
    }
    // Now we can safely rely on userId being present if authenticated
    if (!userId) {
        return <AccessDenied />;
    }

    return (
        <div className="bg-gray-50 min-h-[calc(100vh-64px)] py-10">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center space-x-3">
                        <Settings className="w-8 h-8 text-indigo-600" />
                        <span>Account & Settings</span>
                    </h1>
                    <p className="mt-1 text-lg text-gray-600">Manage your personal information, API key, and subscription details.</p>
                </header>

                <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 space-y-10">
                    
                    {/* Status Message */}
                    {message && (
                        <div className={`p-4 rounded-lg flex items-center justify-between ${
                            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                            <p className="font-medium">{message.text}</p>
                            <button onClick={() => setMessage(null)}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* Section 1: Personal Information */}
                    <SectionHeader icon={User} title="Personal Information" description="Update your public profile details." />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField 
                            label="Display Name" 
                            icon={User} 
                            value={localProfile.displayName} 
                            onChange={(e) => setLocalProfile({...localProfile, displayName: e.target.value})}
                        />
                        <InputField 
                            label="Email Address" 
                            icon={Mail} 
                            value={session.user.email} 
                            readOnly 
                        />
                    </div>
                    
                    {/* Separator */}
                    <div className="border-t border-gray-200" />

                    {/* Section 2: Security and API */}
                    <SectionHeader icon={Key} title="Security & API" description="Manage your access credentials." />
                    <div className="grid grid-cols-1 gap-6">
                        <InputField 
                            label="API Key" 
                            icon={Lock} 
                            type="password"
                            value={localProfile.apiKey} 
                            readOnly 
                        />
                        <div className="flex justify-between items-center bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <p className="text-sm text-yellow-800 flex items-center space-x-2">
                                <Lock className="w-4 h-4" />
                                <span>Your API Key is for development. Contact support to regenerate.</span>
                            </p>
                            <PrimaryButton className="bg-yellow-600 hover:bg-yellow-700 text-white shadow-none px-3 py-2">
                                Regenerate Key
                            </PrimaryButton>
                        </div>
                    </div>

                    {/* Separator */}
                    <div className="border-t border-gray-200" />

                    {/* Section 3: Subscription & Billing */}
                    <SectionHeader icon={CreditCard} title="Subscription & Billing" description="View your current plan and manage payments." />
                    <div className="space-y-4">
                         <InfoBox label="Current Plan" value="Pro" color="text-indigo-600" />
                         <InfoBox label="Billing Cycle" value={localProfile.billingCycle} color="text-gray-700" />
                         <InfoBox label="Next Billing Date" value="Dec 15, 2025" color="text-gray-700" />
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                        <PrimaryButton href="/pricing" className="bg-gray-700 hover:bg-gray-800 shadow-none">
                            Change Plan
                        </PrimaryButton>
                        <SecondaryButton>
                            Manage Payment Method
                        </SecondaryButton>
                    </div>

                    {/* Separator */}
                    <div className="border-t border-gray-200" />
                    
                    {/* Section 4: Preferences */}
                    <SectionHeader icon={Bell} title="Preferences" description="Control app notifications and settings." />
                    
                    <ToggleSwitch 
                        label="Email Notifications"
                        description="Receive updates on new features and subscription changes."
                        checked={localProfile.notifications}
                        onChange={(checked) => setLocalProfile({...localProfile, notifications: checked})}
                    />

                    {/* Final Save Button */}
                    <div className="pt-6 flex justify-end">
                        <PrimaryButton 
                            onClick={handleSave} 
                            disabled={!isProfileDirty || isSaving}
                            className="px-6 py-3"
                        >
                            {isSaving ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                            ) : (
                                <Save className="w-5 h-5 mr-2" />
                            )}
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </PrimaryButton>
                    </div>

                </div>
            </div>
        </div>
    );
}

// --- Sub-Components ---

const SectionHeader = ({ icon: Icon, title, description }) => (
    <div className="flex items-start space-x-4">
        <Icon className="w-6 h-6 text-indigo-500 flex-shrink-0 mt-1" />
        <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500">{description}</p>
        </div>
    </div>
);

const InfoBox = ({ label, value, color }) => (
    <div className="flex justify-between items-center p-4
