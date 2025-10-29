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
      const hist = await getSearchHistory(session.user.email);
      setSearchHistory(hist);
    };
    load();
  }, [session?.user?.email]);

  // Handle search function
  const handleSearch = async () => {
    if (!query.trim() || !session?.user?.email) return;
    
    setIsSearching(true);
    try {
      // Mock search results - replace with actual API call
      const mockResults: SearchResult[] = [
        {
          id: Date.now().toString(),
          title: `Result for "${query}"`,
          content: 'This is a sample search result. Replace this with actual search API integration.',
          source: 'Sample Source',
          timestamp: new Date().toISOString(),
          relevanceScore: 95,
        },
      ];

      // Update current results
      setCurrentResults(mockResults);

      // Save to Firestore
      await saveSearchHistory(
        session.user.email,
        {
          query: query,
          results: mockResults,
          mode: selectedFilter
        }
      );

      // Refresh search history
      const updatedHistory = await getSearchHistory(session.user.email);
      setSearchHistory(updatedHistory);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Helpers
  const isYouTubeUrl = (url?: string) =>
    !!url && /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(url);

  const youTubeEmbedSrc = (url: string) => {
    try {
      // Handle youtu.be short links and youtube.com/watch URLs
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) {
        return `https://www.youtube.com/embed/${u.pathname.replace('/', '')}`;
      }
      if (u.hostname.includes('youtube.com')) {
        const vid = u.searchParams.get('v');
        if (vid) return `https://www.youtube.com/embed/${vid}`;
        // Handle /embed/:id already
        if (u.pathname.startsWith('/embed/')) return url;
      }
    } catch {}
    return '';
  };

  // Rendering helpers for media
  const renderImage = (result: SearchResult) => {
    // Fix: Ensure non-empty src for all 
    const src = result.imageUrl && result.imageUrl.trim() !== '' ? result.imageUrl : undefined;
    if (!src) return null; // Do not render broken images

    return (
      <div className="mt-2">
        <img
          src={src}
          alt={result.title || 'Result image'}
          className="rounded-md max-h-64 w-auto object-contain border"
          loading="lazy"
        />
        {(result.imageAuthorName || result.imageAuthorUrl) && (
          <p className="text-xs text-gray-500 mt-1">
            Image credit: {result.imageAuthorUrl ? (
              <a className="underline" href={result.imageAuthorUrl} target="_blank" rel="noreferrer">
                {result.imageAuthorName || result.imageAuthorUrl}
              </a>
            ) : (
              result.imageAuthorName
            )}
          </p>
        )}
      </div>
    );
  };

  const renderVideo = (result: SearchResult) => {
    if (selectedFilter !== 'videos') return null;

    const url = result.videoUrl && result.videoUrl.trim() !== '' ? result.videoUrl : undefined;
    if (!url) {
      return <p className="text-sm text-gray-500 mt-2">No video available for this result.</p>;
    }

    if (isYouTubeUrl(url)) {
      const embed = youTubeEmbedSrc(url);
      if (!embed) {
        return <p className="text-sm text-gray-500 mt-2">Invalid YouTube URL.</p>;
      }
      return (
        <div className="mt-3">
          <div className="aspect-video w-full max-w-2xl">
            <iframe
              src={embed}
              className="w-full h-full rounded-md border"
              title={result.title || 'YouTube video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      );
    }

    // Generic video player for direct video URLs
    return (
      <div className="mt-3 w-full max-w-2xl">
        <video
          src={url}
          className="w-full rounded-md border"
          controls
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  };

  const loadHistoryItem = (item: SearchHistory) => {
    setQuery(item.query);
    setSelectedFilter(item.mode as SearchMode);
    setCurrentResults(item.results as SearchResult[]);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Results */}
      {currentResults && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Results</h3>
          <div className="space-y-5">
            {currentResults.map((result, index) => (
              <div key={result.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-lg font-semibold text-gray-800">
                    {index + 1}. {result.title}
                  </h4>
                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">{result.source}</span>
                </div>
                <p className="text-gray-700 mb-2 leading-relaxed">{result.content}</p>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  {new Date(result.timestamp).toLocaleString()}
                  {result.relevanceScore && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Relevance: {result.relevanceScore.toFixed(1)}%
                    </span>
                  )}
                </div>
                {/* Media sections */}
                {renderImage(result)}
                {renderVideo(result)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Input Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Search</h2>
        <div className="mb-4 flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSearch()}
            placeholder="Type your search..."
            className="p-2 border rounded w-full"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            disabled={isSearching || !query.trim()}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
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
  );
}
