'use client';
import React, { useState, useEffect } from 'react';
import { Firestore, getFirestore, doc, onSnapshot, setDoc, collection, getDoc } from 'firebase/firestore';
import { Auth, getAuth, signInWithCustomToken, signInAnonymously, signOut } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
// ...your other imports and icon imports
// Now do your variable initialization below:
let db: Firestore | undefined;
let auth: Auth | undefined;
const appId = process.env.NEXT_PUBLIC_APP_ID || 'default-app-id';
const firebaseConfig = process.env.NEXT_PUBLIC_FIREBASE_CONFIG
  ? JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG)
  : {};
const initialAuthToken = process.env.NEXT_PUBLIC_INITIAL_AUTH_TOKEN || undefined;
if (Object.keys(firebaseConfig).length) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
}
// ===============================================
// === Type Definitions ===
// ===============================================
interface SessionUser {
  name: string;
  email: string;
  uid: string;
}

interface Session {
  user: SessionUser;
}

interface UseSessionReturn {
  data: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  signOut: () => Promise<void>;
}
// ===============================================
// === AUTH HOOK (Reused from other pages) ===
// ===============================================
const useSession = (): UseSessionReturn => {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    let isCancelled = false;
    if (!auth) {
      if (!isCancelled) {
        // Mock session when Firebase is unavailable
        setSession({
          user: {
            name: 'Dr. Elara Vance',
            email: 'e.vance@gyaanai.com',
            uid: 'mock-auth-uid-12345',
          },
        });
        setStatus('authenticated');
      }
      return;
    }
    const runAuthSetup = async () => {
      let unsubscribe = () => {};
      try {
        unsubscribe = auth.onAuthStateChanged((user) => {
          if (isCancelled) return;
          if (user) {
            setSession({
              user: {
                name: user.displayName || 'Gyaan AI User',
                email: user.email || 'N/A',
                uid: user.uid,
              },
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
        console.error('Firebase Auth Initialization Error:', error);
        setStatus('unauthenticated');
      }
      return unsubscribe;
    };
    let cleanupFn = () => {};
    runAuthSetup().then((fn) => (cleanupFn = fn));
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
        window.location.href = '/';
      } catch (error) {
        console.error('Error signing out:', error);
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
                setDoc(docRef, defaultSettings).catch(err => console.error('Error setting initial doc:', err));
                setSettings(defaultSettings);
            }
            setLoading(false);
        }, (err) => {
            console.error('Firestore Settings Error:', err);
            setError('Failed to load settings.');
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
            console.error('Error updating setting: ', e);
            setError('Failed to save setting. Check console.');
        }
    };
    return { settings, loading, error, updateSetting };
};
// --- Utility Components ---
// ... (rest of the file unchanged)
