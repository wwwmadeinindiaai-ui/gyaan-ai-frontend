'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { SearchHistory, getSearchHistory, saveSearchHistory } from '@/lib/firestore-helpers';
// Types
interface BaseResult {
  id: string;
  title: string;
  content: string;
  source: string;
  timestamp: string | Date;
  relevanceScore?: number;
  videoUrl?: string;
  imageUrl?: string;
  imageAuthorName?: string;
  imageAuthorUrl?: string;
}
type SearchMode = 'all' | 'academic' | 'news' | 'web' | 'images' | 'videos';
type SearchResult = BaseResult;
export default function Dashboard() {
  const { data: session } = useSession();
  const [query, setQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [currentResults, setCurrentResults] = useState<SearchResult[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<SearchMode>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'date'>('relevance');
  // Load search history
  useEffect(() => {
    const load = async () => {
      if (!session?.user?.email) return;
      try {
        const history = await getSearchHistory(session.user.email, 10);
        setSearchHistory(history);
      } catch (e) {
        console.error('Failed to load search history:', e);
      }
    };
    load();
  }, [session]);
  async function handleSearch() {
    if (!query.trim()) return;
    setIsSearching(true);
    setCurrentResults(null);
    try {
      // Map UI filter to backend params
      const body: any = {
        query: query.trim(),
        model: 'gpt-3.5-turbo',
        maxResults: 10,
      };
      if (selectedFilter === 'images') {
        body.mode = 'images';
      } else if (selectedFilter === 'videos') {
        body.mode = 'videos';
      } else if (selectedFilter === 'all') {
        body.mode = 'all';
      } else {
        body.mode = selectedFilter;
      }
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      const rawResults: any[] = data?.results || [];
      const normalized = (selectedFilter === 'videos')
        ? rawResults.filter(r => !!r.videoUrl)
        : rawResults;
      const formatted: SearchResult[] = normalized.map((r: any, index: number) => ({
        id: r.id || `result-${Date.now()}-${index}`,
        title: r.title || `Result ${index + 1}`,
        content: r.content || r.description || '',
        source: r.source || r.siteName || 'Unknown',
        timestamp: r.timestamp || new Date().toISOString(),
        relevanceScore: r.relevanceScore ?? Math.random() * 100,
        videoUrl: r.videoUrl,
        imageUrl: r.imageUrl,
        imageAuthorName: r.imageAuthorName,
        imageAuthorUrl: r.imageAuthorUrl,
      }));
      setCurrentResults(formatted);
      // Save history
      if (session?.user?.email) {
        try {
          await saveSearchHistory(session.user.email, {
            query: query.trim(),
            results: formatted,
            filters: { source: selectedFilter, sortBy },
          });
        } catch (e) {
          console.error('Failed to save search to Firestore:', e);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Network error occurred'}`);
    } finally {
      setIsSearching(false);
    }
  }
  // Filter and sort results for display order only
  const getFilteredResults = () => {
    if (!currentResults) return [] as SearchResult[];
    const out = [...currentResults];
    if (sortBy === 'date') {
      out.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else {
      out.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));
    }
    return out;
  };
  function loadHistoryItem(item: SearchHistory) {
    setQuery(item.query);
    setCurrentResults(item.results);
    if (item.filters?.source) setSelectedFilter(item.filters.source as SearchMode);
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🔍 AI-Powered Search Dashboard</h1>
          <p className="text-gray-600">Discover insights across multiple sources with advanced filters</p>
        </div>
        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter your search query..."
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-semibold"
            >
              {isSearching ? '🔄 Searching...' : '🔍 Search'}
            </button>
          </div>
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            {(['all', 'web', 'academic', 'news', 'images', 'videos'] as SearchMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setSelectedFilter(mode)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedFilter === mode
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          {/* Sort Options */}
          <div className="mt-4 flex gap-3 items-center">
            <span className="text-gray-700 font-medium">Sort by:</span>
            <button
              onClick={() => setSortBy('relevance')}
              className={`px-4 py-2 rounded-lg transition-all ${
                sortBy === 'relevance' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📊 Relevance
            </button>
            <button
              onClick={() => setSortBy('date')}
              className={`px-4 py-2 rounded-lg transition-all ${
                sortBy === 'date' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📅 Date
            </button>
          </div>
        </div>
        {/* Results */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Search Results</h2>
          {isSearching ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
              <p className="mt-4 text-gray-600 text-lg">Searching across sources...</p>
            </div>
          ) : currentResults ? (
            <div className="space-y-4">
              {getFilteredResults().length > 0 ? (
                getFilteredResults().map((result) => (
                  <div key={result.id} className="p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors border border-gray-200 hover:border-blue-300">
                    {result.videoUrl && (
                      <div className="mb-3">
                        <video
                          src={result.videoUrl}
                          controls
                          className="w-full max-h-64 rounded-lg"
                        />
                      </div>
                    )}
                    {result.imageUrl && (
                      <div className="mb-3">
                        <img
                          src={result.imageUrl}
                          alt={result.title}
                          className="w-full max-h-64 object-cover rounded-lg"
                        />
                        {result.imageAuthorName && (
                          <p className="text-xs text-gray-500 mt-1">
                            Photo by{' '}
                            {result.imageAuthorUrl ? (
                              <a href={result.imageAuthorUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                {result.imageAuthorName}
                              </a>
                            ) : (
                              result.imageAuthorName
                            )}
                          </p>
                        )}
                      </div>
                    )}
                    <h3 className="text-xl font-semibold text-blue-600 mb-2">{result.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">Source: {result.source}</p>
                    <p className="text-gray-700 mb-2 leading-relaxed">{result.content}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      {new Date(result.timestamp).toLocaleString()}
                      {result.relevanceScore && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Relevance: {result.relevanceScore.toFixed(1)}%</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No results found. Try adjusting your filters.</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Enter a query and click Search to see results here.</p>
          )}
        </div>
        {/* History */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-700">Search History</h2>
            {searchHistory.length > 0 && (
              <button
                onClick={() => setSearchHistory([])}
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
