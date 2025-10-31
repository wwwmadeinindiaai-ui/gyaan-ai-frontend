"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

// Sources Section Component
function SourcesSection({ sources, onChange }: { sources: string[]; onChange: (sources: string[]) => void }) {
  const [newSource, setNewSource] = useState('');

  const addSource = () => {
    if (newSource.trim() && !sources.includes(newSource.trim())) {
      onChange([...sources, newSource.trim()]);
      setNewSource('');
    }
  };

  const removeSource = (source: string) => {
    onChange(sources.filter(s => s !== source));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Sources</h2>
      <p className="text-gray-600 mb-4">Manage your preferred information sources</p>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newSource}
          onChange={(e) => setNewSource(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addSource()}
          placeholder="Add a source..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={addSource}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Add
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {sources.map((source) => (
          <div
            key={source}
            className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full"
          >
            <span>{source}</span>
            <button
              onClick={() => removeSource(source)}
              className="text-blue-600 hover:text-blue-800 font-bold"
              aria-label={`Remove ${source}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Filters Section Component
function FiltersSection({ filters, onChange }: { filters: { keywords: string[]; categories: string[] }; onChange: (filters: { keywords: string[]; categories: string[] }) => void }) {
  const [newKeyword, setNewKeyword] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const addKeyword = () => {
    if (newKeyword.trim() && !filters.keywords.includes(newKeyword.trim())) {
      onChange({ ...filters, keywords: [...filters.keywords, newKeyword.trim()] });
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    onChange({ ...filters, keywords: filters.keywords.filter(k => k !== keyword) });
  };

  const addCategory = () => {
    if (newCategory.trim() && !filters.categories.includes(newCategory.trim())) {
      onChange({ ...filters, categories: [...filters.categories, newCategory.trim()] });
      setNewCategory('');
    }
  };

  const removeCategory = (category: string) => {
    onChange({ ...filters, categories: filters.categories.filter(c => c !== category) });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Filters</h2>
      <p className="text-gray-600 mb-4">Set up content filters and preferences</p>

      {/* Keywords */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Keywords</h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
            placeholder="Add a keyword..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={addKeyword}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.keywords.map((keyword) => (
            <div
              key={keyword}
              className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full"
            >
              <span>{keyword}</span>
              <button
                onClick={() => removeKeyword(keyword)}
                className="text-green-600 hover:text-green-800 font-bold"
                aria-label={`Remove ${keyword}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-lg font-medium mb-2">Categories</h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCategory()}
            placeholder="Add a category..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={addCategory}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.categories.map((category) => (
            <div
              key={category}
              className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full"
            >
              <span>{category}</span>
              <button
                onClick={() => removeCategory(category)}
                className="text-green-600 hover:text-green-800 font-bold"
                aria-label={`Remove ${category}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Appearance Section Component
function AppearanceSection({ appearance, onChange }: { appearance: { theme: string; fontSize: string; layout: string }; onChange: (appearance: { theme: string; fontSize: string; layout: string }) => void }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Appearance</h2>
      <p className="text-gray-600 mb-4">Customize your interface preferences</p>

      {/* Theme */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
        <select
          value={appearance.theme}
          onChange={(e) => onChange({ ...appearance, theme: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="auto">Auto</option>
        </select>
      </div>

      {/* Font Size */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
        <select
          value={appearance.fontSize}
          onChange={(e) => onChange({ ...appearance, fontSize: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>

      {/* Layout */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Layout</label>
        <select
          value={appearance.layout}
          onChange={(e) => onChange({ ...appearance, layout: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="compact">Compact</option>
          <option value="comfortable">Comfortable</option>
          <option value="spacious">Spacious</option>
        </select>
      </div>
    </div>
  );
}

// Main Preferences Page Component
export default function PreferencesPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // State for each section
  const [sources, setSources] = useState<string[]>([]);
  const [filters, setFilters] = useState<{ keywords: string[]; categories: string[] }>({
    keywords: [],
    categories: []
  });
  const [appearance, setAppearance] = useState<{ theme: string; fontSize: string; layout: string }>({
    theme: 'light',
    fontSize: 'medium',
    layout: 'comfortable'
  });

  // Load preferences on mount
  useEffect(() => {
    if (session?.user?.email) {
      loadPreferences();
    }
  }, [session]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/preferences');
      if (response.ok) {
        const data = await response.json();
        if (data.sources) setSources(data.sources);
        if (data.filters) setFilters(data.filters);
        if (data.appearance) setAppearance(data.appearance);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      setMessage('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources, filters, appearance })
      });

      if (response.ok) {
        setMessage('Preferences saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Please sign in to access preferences.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8">
          <p className="text-gray-600">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Preferences</h1>
        <p className="text-gray-600">Manage your personalized settings</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.includes('success') 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* Modular Sections */}
      <SourcesSection sources={sources} onChange={setSources} />
      <FiltersSection filters={filters} onChange={setFilters} />
      <AppearanceSection appearance={appearance} onChange={setAppearance} />

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={savePreferences}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
