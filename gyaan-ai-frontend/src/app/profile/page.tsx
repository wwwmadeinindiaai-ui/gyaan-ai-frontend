'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { signOut } from 'next-auth/react';
import { Bell, User, Mail, Shield, LogOut, Save } from 'lucide-react';

interface UserProfile {
  email: string;
  displayName: string;
  notificationsEnabled: boolean;
  emailVerified: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Wait for session loading before rendering UI
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  // If not authenticated, show access denied or redirect
  if (status !== 'authenticated' || !session) {
    return <div className="p-10 text-center">Access Denied. Please sign in.</div>;
  }

  // Use session.user for profile info
  const userEmail = session.user?.email || '';
  const userName = session.user?.name || '';

  // Real-time Firestore listener for profile updates
  useEffect(() => {
    if (session.user) {
      const userDocRef = doc(db, 'users', session.user.email || '');
      const unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const profileData: UserProfile = {
            email: userEmail,
            displayName: data.displayName || userName,
            notificationsEnabled: data.notificationsEnabled ?? true,
            emailVerified: data.emailVerified ?? false,
            createdAt: data.createdAt?.toDate().toLocaleDateString() || 'N/A',
          };
          setProfile(profileData);
          setDisplayName(profileData.displayName);
          setNotificationsEnabled(profileData.notificationsEnabled);
        }
      });
      return () => unsubscribeFirestore();
    }
  }, [session, userEmail, userName]);

  const handleSaveProfile = async () => {
    if (!session.user?.email) return;
    setSaving(true);
    try {
      const userDocRef = doc(db, 'users', session.user.email);
      await updateDoc(userDocRef, {
        displayName,
        notificationsEnabled,
        updatedAt: new Date(),
      });
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/login' });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // If profile not loaded yet, show loading
  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8">
            <div className="flex items-center space-x-4">
              <div className="bg-white rounded-full p-3">
                <User className="h-12 w-12 text-blue-600" />
              </div>
              <div className="text-white">
                <h1 className="text-3xl font-bold">{profile.displayName || 'User Profile'}</h1>
                <p className="text-blue-100 mt-1">{profile.email}</p>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="px-6 py-6 space-y-6">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your display name"
              />
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline h-4 w-4 mr-2" />
                Email Address
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed. Verified: {profile.emailVerified ? '✓ Yes' : '✗ No'}
              </p>
            </div>

            {/* Notifications Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Enable Notifications</p>
                  <p className="text-sm text-gray-500">Receive updates and alerts</p>
                </div>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notificationsEnabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Account Info */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-blue-600" />
                Account Information
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">
                  <span className="font-medium">Account Created:</span> {profile.createdAt}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Email Verified:</span>{' '}
                  {profile.emailVerified ? (
                    <span className="text-green-600 font-medium">✓ Verified</span>
                  ) : (
                    <span className="text-amber-600 font-medium">⚠ Not Verified</span>
                  )}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-6 border-t">
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                <Save className="h-5 w-5" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
              <button
                onClick={handleSignOut}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center space-x-2"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Additional Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Real-time Sync Active</h4>
          <p className="text-sm text-blue-700">
            Your profile changes are synced in real-time with Firestore. Any updates will be reflected immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
