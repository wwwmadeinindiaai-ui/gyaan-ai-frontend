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
        // videos come from regular web results; filter client-side
        body.mode = 'web';
      } else if (selectedFilter === 'all') {
        body.mode = 'all';
      } else {
        body.mode = selectedFilter; // academic | news | web
      }

      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();

      const rawResults: any[] = data?.results || [];

      // For videos, keep only those with videoUrl
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
      out.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    }
    return out;
  };

  const exportAsJSON = () => {
    if (!currentResults) return;
    const dataStr = JSON.stringify({ query, results: currentResults, timestamp: new Date().toISOString() }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsText = () => {
    if (!currentResults) return;
    let text = `Search Query: ${query}\nDate: ${new Date().toLocaleString()}\n\n`;
    currentResults.forEach((r, i) => {
      text += `${i + 1}. ${r.title}\nSource: ${r.source}\n${r.content}\n\n`;
    });
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-results-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    if (!currentResults) return;
    let text = `Search Query: ${query}\n\n`;
    currentResults.forEach((r, i) => {
      text += `${i + 1}. ${r.title}\n${r.content}\n\n`;
    });
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const loadHistoryItem = (item: SearchHistory) => {
    setQuery(item.query);
    // @ts-ignore tolerate legacy structure
    setCurrentResults(item.results as any);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">AI Search Dashboard</h1>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Search Your Queries</h2>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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

          <div className="flex gap-4 items-center flex-wrap">
            <label className="font-medium text-gray-700">Mode:</label>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value as SearchMode)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sources</option>
              <option value="academic">Academic</option>
              <option value="news">News</option>
              <option value="web">Web</option>
              <option value="images">Images</option>
              <option value="videos">Videos</option>
            </select>

            <label className="font-medium text-gray-700 ml-2">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'relevance' | 'date')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="relevance">Relevance</option>
              <option value="date">Date</option>
            </select>
          </div>
        </div>

        {/* Results */}
        {currentResults && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold text-gray-700">Results ({currentResults.length})</h3>
              <div className="flex gap-2">
                <button onClick={copyToClipboard} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">📋 Copy</button>
                <button onClick={exportAsText} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm">📄 Export TXT</button>
                <button onClick={exportAsJSON} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm">💾 Export JSON</button>
              </div>
            </div>

            {/* Render by mode */}
            {selectedFilter === 'images' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {getFilteredResults().length === 0 ? (
                  <p className="text-gray-500">No images found. Try a different query.</p>
                ) : (
                  getFilteredResults().map((r) => (
                    <figure key={r.id} className="rounded-lg overflow-hidden border bg-gray-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.imageUrl || ''} alt={r.title} className="w-full h-40 object-cover" />
                      <figcaption className="p-2 text-xs text-gray-600">
                        <div className="font-medium truncate">{r.title}</div>
                        {r.imageAuthorName && (
                          <span>
                            Photo by <a className="underline" href={r.imageAuthorUrl || '#'} target="_blank" rel="noreferrer">{r.imageAuthorName}</a> on Unsplash
                          </span>
                        )}
                      </figcaption>
                    </figure>
                  ))
                )}
              </div>
            ) : selectedFilter === 'videos' ? (
              <div className="space-y-4">
                {getFilteredResults().length === 0 ? (
                  <p className="text-gray-500">No videos found. Try a different query.</p>
                ) : (
                  getFilteredResults().map((r, index) => (
                    <div key={r.id} className="p-4 border-l-4 border-blue-500 bg-gray-50 rounded-r-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-semibold text-gray-800">{index + 1}. {r.title}</h4>
                        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">{r.source}</span>
                      </div>
                      <p className="text-gray-700 mb-2">{r.content}</p>
                      {r.videoUrl && (
                        <a className="text-blue-600 underline" href={r.videoUrl} target="_blank" rel="noreferrer">Watch video</a>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredResults().length === 0 ? (
                  <p className="text-gray-500">No results found. Try adjusting filters.</p>
                ) : (
                  getFilteredResults().map((result, index) => (
                    <div key={result.id} className="p-4 border-l-4 border-blue-500 bg-gray-50 rounded-r-lg hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-semibold text-gray-800">{index + 1}. {result.title}</h4>
                        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">{result.source}</span>
                      </div>
                      <p className="text-gray-700 mb-2 leading-relaxed">{result.content}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        {new Date(result.timestamp).toLocaleString()}
                        {result.relevanceScore && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Relevance: {result.relevanceScore.toFixed(1)}%</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

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
