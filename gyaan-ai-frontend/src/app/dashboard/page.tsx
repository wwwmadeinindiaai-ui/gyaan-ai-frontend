 'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { SearchHistory, getSearchHistory, saveSearchHistory, clearSearchHistory as clearFirestoreHistory } from '@/lib/firestore-helpers';
// Define types
interface SearchResult {
  id: string;
  title: string;
  content: string;
  source: string;
  timestamp: string;
  relevanceScore?: number;
}


export default function Dashboard() {
  const [query, setQuery] = useState('');
   const { data: session } = useSession();
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [currentResults, setCurrentResults] = useState<SearchResult[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'academic' | 'news' | 'web'>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'date'>('relevance');

  // Load search history from Firestore on mount
  useEffect(() => {
    const loadSearchHistory = async () => {
      if (session?.user?.email) {
        try {
          const history = await getSearchHistory(session.user.email, 10);
          setSearchHistory(history);
        } catch (error) {
          console.error('Failed to load search history:', error);
        }
      }
    };

    loadSearchHistory();
  }, [session]);

  async function handleSearch() {
    if (!query.trim()) return;

    setIsSearching(true);
    setCurrentResults(null);

    try {
      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          model: 'gpt-3.5-turbo',
          maxResults: 5,
          searchType: selectedFilter,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.results) {
        const formattedResults: SearchResult[] = data.results.map((result: any, index: number) => ({
          id: `result-${Date.now()}-${index}`,
          title: result.title || `Result ${index + 1}`,
          content: result.content || '',
          source: result.source || 'Unknown',
        timestamp: new Date()
                 ,          relevanceScore: result.relevanceScore || Math.random() * 100,
        }));

        setCurrentResults(formattedResults);
        
        // Add to search history
        const newHistoryItem: SearchHistory = {
          query: query.trim(),
      timestamp: new Date()
               ,          results: formattedResults,
        };
        
        setSearchHistory(prev => [newHistoryItem, ...prev.slice(0, 9)]); // Keep last 1
       
                   // Save to Firestore
        if (session?.user?.email) {
          try {
            await saveSearchHistory(session.user.email, {
              query: query.trim(),
              results: formattedResults,
              filters: {
                source: selectedFilter,
                sortBy: sortBy
              }
            });
          } catch (error) {
            console.error('Failed to save search to Firestore:', error);
          }
        }0
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Network error occurred'}`);
    } finally {
      setIsSearching(false);
    }
  }

  // Filter and sort results
  const getFilteredResults = () => {
    if (!currentResults) return [];
    
    let filtered = [...currentResults];
    
    // Sort
    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else {
      filtered.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    }
    
    return filtered;
  };

  // Export functions
  const exportAsJSON = () => {
    if (!currentResults) return;
    const dataStr = JSON.stringify({ query, results: currentResults, timestamp: new Date().toISOString() }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `search-results-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportAsText = () => {
    if (!currentResults) return;
    let textContent = `Search Query: ${query}\nDate: ${new Date().toLocaleString()}\n\n`;
    currentResults.forEach((result, i) => {
      textContent += `${i + 1}. ${result.title}\nSource: ${result.source}\n${result.content}\n\n`;
    });
    const dataBlob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `search-results-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    if (!currentResults) return;
    let textContent = `Search Query: ${query}\n\n`;
    currentResults.forEach((result, i) => {
      textContent += `${i + 1}. ${result.title}\n${result.content}\n\n`;
    });
    navigator.clipboard.writeText(textContent);
    alert('Copied to clipboard!');
  };

  const loadHistoryItem = (item: SearchHistory) => {
    setQuery(item.query);
    setCurrentResults(item.results);
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all search history?')) {
      setSearchHistory([]);
      localStorage.removeItem('searchHistory');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">AI Search Dashboard</h1>

        {/* Search Box */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Search Your Queries</h2>

          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter your search query..."
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSearching}
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-4 items-center">
            <label className="font-medium text-gray-700">Filter:</label>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sources</option>
              <option value="academic">Academic</option>
              <option value="news">News</option>
              <option value="web">Web</option>
            </select>

            <label className="font-medium text-gray-700 ml-4">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="relevance">Relevance</option>
              <option value="date">Date</option>
            </select>
          </div>
        </div>

        {/* Search Results */}
        {currentResults && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold text-gray-700">Results ({currentResults.length})</h3>
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  📋 Copy
                </button>
                <button
                  onClick={exportAsText}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  📄 Export TXT
                </button>
                <button
                  onClick={exportAsJSON}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                >
                  💾 Export JSON
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {getFilteredResults().map((result, index) => (
                <div key={result.id} className="p-4 border-l-4 border-blue-500 bg-gray-50 rounded-r-lg hover:bg-gray-100 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-semibold text-gray-800">
                      {index + 1}. {result.title}
                    </h4>
                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                      {result.source}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2 leading-relaxed">{result.content}</p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{new Date(result.timestamp).toLocaleString()}</span>
                    {result.relevanceScore && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Relevance: {result.relevanceScore.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search History */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-700">Search History</h2>
            {searchHistory.length > 0 && (
              <button
                onClick={clearHistory}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                🗑️ Clear History
              </button>
            )}
          </div>

          {searchHistory.length > 0 ? (
            <div className="space-y-3">
              {searchHistory.map((item, index) => (
                <div
                  key={index}
                  onClick={() => loadHistoryItem(item)}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors border border-gray-200 hover:border-blue-300"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{item.query}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(item.timestamp).toLocaleString()} • {item.results.length} results
                      </p>
                    </div>
                    <span className="text-blue-600 text-sm font-medium">→</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No search history yet. Start searching to see your history here!</p>
          )}
        </div>
      </div>
    </div>
  );
}
