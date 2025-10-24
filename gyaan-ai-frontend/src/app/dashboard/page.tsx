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
    
    try {
      // Call the AI search API
      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          model: 'gpt-3.5-turbo',
          maxResults: 3
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Format the results for display
        const resultsText = data.results.map((result: any, index: number) => 
          `${index + 1}. ${result.title}\n${result.content}\n`
        ).join('\n');
        
        setSearchResult(resultsText);
        setSearches(prev => [query.trim(), ...prev.slice(0, 4)]); // Keep last 5 searches
      } else {
        setSearchResult(`Error: ${data.error || 'Search failed'}`);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResult(`Error: ${error instanceof Error ? error.message : 'Network error occurred'}`);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Search Your Queries</h2>
          
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter your search query..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSearching}
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {searchResult && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Results:</h3>
              <pre className="whitespace-pre-wrap text-sm">{searchResult}</pre>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Searches</h2>
          {searches.length > 0 ? (
            <ul className="space-y-2">
              {searches.map((search, index) => (
                <li key={index} className="p-2 bg-gray-50 rounded">
                  {search}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No recent searches yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
