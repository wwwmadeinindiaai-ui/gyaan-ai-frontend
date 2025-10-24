'use client';

import { useState } from 'react';

export default function Dashboard() {
  const [query, setQuery] = useState('');
  const [searches, setSearches] = useState<string[]>([]);
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setSearchResult(null);
    
    // Simulate search (in real app, this would call an API)
    setTimeout(() => {
      setSearchResult(`Results for: "${query}"`);
      setSearches(prev => [query, ...prev.slice(0, 4)]); // Keep last 5 searches
      setIsSearching(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-4">Search Your Queries</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your search query..."
              className="flex-grow border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Search Result */}
        {searchResult && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">Search Result</h3>
            <p className="text-gray-700">{searchResult}</p>
            <p className="text-sm text-gray-500 mt-2">This is a demo result. In production, this would show actual search results from your AI platform.</p>
          </div>
        )}

        {/* Recent Searches */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Recent Searches</h3>
          {searches.length > 0 ? (
            <ul className="space-y-2">
              {searches.map((search, index) => (
                <li
                  key={index}
                  onClick={() => setQuery(search)}
                  className="p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  {search}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No recent searches yet</p>
          )}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-lg font-semibold mb-2">Total Searches</h4>
            <p className="text-3xl font-bold text-blue-600">{searches.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-lg font-semibold mb-2">Active Users</h4>
            <p className="text-3xl font-bold text-green-600">1</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-lg font-semibold mb-2">Platform Status</h4>
            <p className="text-xl font-semibold text-green-600">✓ Online</p>
          </div>
        </div>
      </main>
    </div>
  );
}
