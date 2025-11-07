"use client";

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  User, Mail, Key, CreditCard, Settings, LogOut, 
  Info, Bell, Zap, CheckCircle, XCircle
} from 'lucide-react';

// ===============================================
// TYPES
// ===============================================

interface UserSettings {
  darkMode: boolean;
  autoSaveDrafts: boolean;
  highAccuracyMode: boolean;
  emailNotifications: boolean;
  subscriptionTier: 'Free' | 'Pro';
}

const defaultSettings: UserSettings = {
  darkMode: true,
  autoSaveDrafts: true,
  highAccuracyMode: false,
  emailNotifications: false,
  subscriptionTier: 'Pro'
};

// ===============================================
// UTILITY COMPONENTS
// ===============================================

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-40">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );
}

interface SettingsToggleProps {
  label: string;
  description: string;
  isChecked: boolean;
  onToggle: () => void;
  icon: React.ComponentType<{ className?: string }>;
  isLoading: boolean;
}

function SettingsToggle({ label, description, isChecked, onToggle, icon: Icon, isLoading }: SettingsToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0">
      <div className="flex items-start space-x-3">
        <Icon className="w-6 h-6 text-gray-500 mt-0.5 flex-shrink-0" />
        <div>
          <div className="text-base font-medium text-gray-900">{label}</div>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {isLoading && <div className="w-4 h-4 animate-spin border-2 border-indigo-500 border-t-transparent rounded-full" />}
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
}

interface UserProfileCardProps {
  user: {
    name?: string | null;
    email?: string | null;
    id: string;
  };
  onSignOut: () => void;
}

function UserProfileCard({ user, onSignOut }: UserProfileCardProps) {
  const initial = user.name ? user.name.charAt(0).toUpperCase() : 'G';
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-2xl">
          {initial}
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
          <Key className="w-3 h-3 text-indigo-500" />
          <span>Internal User ID (for support & collaboration)</span>
        </p>
        <p className="font-mono text-xs text-gray-800 break-all">{user.id}</p>
      </div>

      <button
        onClick={onSignOut}
        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition duration-200 text-sm flex items-center justify-center"
      >
        <LogOut className="w-4 h-4 mr-2" /> Sign Out
      </button>
    </div>
  );
}

interface SubscriptionCardProps {
  tier: 'Free' | 'Pro';
}

function SubscriptionCard({ tier }: SubscriptionCardProps) {
  const isPro = tier === 'Pro';
  const Icon = isPro ? CheckCircle : XCircle;
  const color = isPro ? 'text-green-600' : 'text-indigo-600';

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 h-full">
      <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
        <CreditCard className={`w-6 h-6 ${color}`} />
        <span>Subscription Status</span>
      </h3>
      
      <div className="text-3xl font-extrabold mb-2">{tier}</div>
      <p className="text-gray-600 mb-4">
        {isPro ? "You have access to all premium features." : "Upgrade to Pro for full access."}
      </p>
      
      <ul className="space-y-2 text-sm text-gray-700 mb-6">
        <li className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>{isPro ? "10,000" : "1,000"} AI Queries / month</span>
        </li>
        <li className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>{isPro ? "Advanced" : "Standard"} Article Builder</span>
        </li>
      </ul>

      {!isPro && (
        <a
          href="/pricing"
          className="block text-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
        >
          Upgrade to Pro Plan
        </a>
      )}
      {isPro && (
        <button className="w-full px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg font-semibold transition">
          Manage Billing
        </button>
      )}
    </div>
  );
}

// ===============================================
// MAIN PROFILE PAGE COMPONENT
// ===============================================

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load settings from API
  useEffect(() => {
    if (session?.user?.id) {
      loadSettings();
    }
  }, [session]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings({ ...defaultSettings, ...data });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof UserSettings, value: boolean | string) => {
    try {
      setSaving(true);
      // Optimistically update UI
      setSettings(prev => ({ ...prev, [key]: value }));
      
      // Save to backend
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      });

      if (!response.ok) {
        console.error('Failed to save setting');
        // Revert on failure
        loadSettings();
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      loadSettings();
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof UserSettings) => {
    if (typeof settings[key] === 'boolean') {
      updateSetting(key, !settings[key]);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  // Loading state
  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  // Unauthenticated state
  if (status !== 'authenticated' || !session?.user) {
    return (
      <div className="p-10 text-center text-red-600 font-medium">
        <p>Access Denied. Please sign in to view your profile and settings.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 border-b pb-4 border-gray-200">
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center space-x-3">
            <User className="w-8 h-8 text-indigo-600" />
            <span>Profile & App Settings</span>
          </h1>
          <p className="mt-1 text-lg text-gray-600">Update your account information and preferences.</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1: Profile and Subscription */}
          <div className="lg:col-span-1 space-y-8">
            <UserProfileCard
              user={{
                name: session.user.name,
                email: session.user.email,
                id: session.user.id
              }}
              onSignOut={handleSignOut}
            />
            <SubscriptionCard tier={settings.subscriptionTier} />
          </div>

          {/* Column 2/3: General Settings */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="text-xl font-semibold p-6 border-b border-gray-200 text-gray-900 flex items-center space-x-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                <span>General Application Settings</span>
              </div>
              {loading ? (
                <LoadingSpinner />
              ) : (
                <div className="divide-y divide-gray-100">
                  <SettingsToggle
                    label="Dark Mode"
                    description="Switch the entire application interface to a dark theme."
                    isChecked={settings.darkMode}
                    onToggle={() => handleToggle('darkMode')}
                    icon={Settings}
                    isLoading={saving}
                  />
                  <SettingsToggle
                    label="Auto-Save Drafts"
                    description="Automatically save unsaved work and draft reports to your history."
                    isChecked={settings.autoSaveDrafts}
                    onToggle={() => handleToggle('autoSaveDrafts')}
                    icon={Info}
                    isLoading={saving}
                  />
                  <SettingsToggle
                    label="High Accuracy Mode"
                    description="Use slower, more powerful AI models for generation (may use more query credits)."
                    isChecked={settings.highAccuracyMode}
                    onToggle={() => handleToggle('highAccuracyMode')}
                    icon={Zap}
                    isLoading={saving}
                  />
                  <SettingsToggle
                    label="Email Notifications"
                    description="Receive updates about new features and usage reports."
                    isChecked={settings.emailNotifications}
                    onToggle={() => handleToggle('emailNotifications')}
                    icon={Bell}
                    isLoading={saving}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
