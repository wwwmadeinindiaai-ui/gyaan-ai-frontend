'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { SearchHistory, getSearchHistory, saveSearchHistory } from '@/lib/firestore-helpers';
import EnhancedSearchBar from '../components/EnhancedSearchBar';
import ResultsGrid from '../components/ResultsGrid';
import SummaryPanel from '../components/SummaryPanel';

// NOTE: For Images mode to work, ensure UNSPLASH_ACCESS_KEY is set in your .env file
// Example: UNSPLASH_ACCESS_KEY=your_actual_key_here

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

type SearchMode = 'all' | 'academic' | 'news' | 'web' | 'images' | 'videos' | 'trending';
type SearchResult = BaseResult;

export default function Dashboard() {
  const { data: session } = useSession();
  const [query, setQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [currentResults, setCurrentResults] = useState<SearchResult[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<SearchMode>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'date'>('relevance');
  const [warning, setWarning] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [citations, setCitations] = useState<Array<{ source: string; url?: string }>>([]);

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

  // Helper to call backend search API
  async function searchApi(mode: string, q: string, maxResults = 10): Promise<SearchResult[]> {
    const body: any = {
      query: q,
      model: 'gpt-3.5-turbo',
      maxResults,
    };
    // Set mode based on filter
    if (mode !== 'all') {
      body.mode = mode;
    }
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Search API error: ${res.status}`);
    }
    const data = await res.json();
    return data.results || [];
  }

  async function handleSearch(searchQuery?: string, filter?: string) {
    // Use the provided searchQuery or fall back to the query state
    const q = searchQuery || query;
    // Use the provided filter or fall back to selectedFilter state
    const mode = filter || selectedFilter;
    
    if (!q.trim()) return;
    
    setIsSearching(true);
    setCurrentResults(null);
    setWarning(null); // Clear any previous warnings
    setSummary(null); // Clear previous summary
    setCitations([]); // Clear previous citations
    
    try {
      let results: SearchResult[] = [];
      // Use mode to determine which API call to make
      // This ensures the selected mode is used for the search
      if (mode === 'all') {
        results = await searchApi('all', q, 10);
      } else if (mode === 'academic') {
        results = await searchApi('academic', q, 10);
      } else if (mode === 'images') {
        // Images mode with error/warning handling
        try {
          results = await searchApi('images', q, 12);
          
          // Check if results are empty - could indicate missing API key or no results
          if (!results || results.length === 0) {
            setWarning('No images found. Please ensure UNSPLASH_ACCESS_KEY is configured in your .env file, or try a different search term.');
          }
        } catch (e: any) {
          console.error('Image search error:', e);
          setWarning('Image search failed. Please check that UNSPLASH_ACCESS_KEY is set in your .env file and the API is accessible.');
          results = [];
        }
      } else if (mode === 'videos') {
        results = await searchApi('videos', q, 10);
      } else if (mode === 'news') {
        results = await searchApi('news', q, 10);
      } else if (mode === 'web') {
        results = await searchApi('web', q, 10);
      } else if (mode === 'trending') {
        results = await searchApi('trending', q, 10);
      }
      
      setCurrentResults(results);
      
      // Extract summary and citations from backend response if available
      // The backend may return summary/citations in the response object
      // This is an additive UI layer that displays data if present
      if (results && results.length > 0) {
        // Generate summary from results (can be enhanced to use backend summary if available)
        const summaryText = `Found ${results.length} ${mode} results for "${q}". ${results[0]?.content?.substring(0, 150) || ''}...`;
        setSummary(summaryText);
        
        // Extract citations from results
        const extractedCitations = results.slice(0, 5).map(r => ({
          source: r.source,
          url: r.videoUrl || r.imageUrl || undefined
        }));
        setCitations(extractedCitations);
      }
      
      // Save to history
      if (session?.user?.email && results.length > 0) {
        try {
          await saveSearchHistory(session.user.email, {
            query: q,
            mode: mode as SearchMode,
            results: results,
          });
        } catch (e) {
          console.error('Failed to save search history:', e);
        }
      }
    } catch (e) {
      console.error('Search failed:', e);
      setWarning('Search failed. Please try again.');
      setCurrentResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  // Filter results based on selected mode for display
  const displayResults = currentResults;

  // Extract query strings from search history for suggestions
  const searchHistoryQueries = searchHistory.map(item => item.query);

  // Sample trending searches (can be fetched from API in production)
  const trendingSearches = [
    'Artificial Intelligence trends 2025',
    'Climate change solutions',
    'Latest technology news',
  ];

  // Transform results for ResultCard component
  const transformedResults = displayResults?.map(result => ({
    id: result.id,
    title: result.title,
    description: result.content,
    metadata: {
      source: result.source,
      ...(result.relevanceScore && { relevance: `${result.relevanceScore}%` }),
      ...(result.videoUrl && { 'Video URL': result.videoUrl }),
      ...(result.imageUrl && { 'Image': result.imageUrl }),
      ...(result.imageAuthorName && { 'Photo by': result.imageAuthorName }),
    },
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        
        {/* Enhanced Search Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          {/* EnhancedSearchBar Component - New modular component */}
          <div className="mb-4">
            <EnhancedSearchBar
              onSearch={handleSearch}
              placeholder="Search the web..."
              searchHistory={searchHistoryQueries}
              trendingSearches={trendingSearches}
              currentFilter={selectedFilter}
              isLoading={isSearching}
              className=""
            />
          </div>
          
          {/* Original Filter Buttons - Preserved from old implementation */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'academic', 'news', 'web', 'images', 'videos', 'trending'] as SearchMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setSelectedFilter(mode)}
                className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                  selectedFilter === mode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
        
        {/* Warning/Error Messages */}
        {warning && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">{warning}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* SummaryPanel Component - New additive UI layer */}
        {summary && (
          <SummaryPanel
            summary={summary}
            citations={citations}
            isLoading={isSearching}
          />
        )}
        
        {/* Results Section - Now using ResultsGrid component */}
        {displayResults && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Results ({displayResults.length}) - Mode: {selectedFilter}
              </h2>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'relevance' | 'date')}
                className="px-3 py-1 border border-gray-300 rounded-lg"
              >
                <option value="relevance">Sort by Relevance</option>
                <option value="date">Sort by Date</option>
              </select>
            </div>
            
            {/* ResultsGrid Component - New modular UI layer */}
            <ResultsGrid
              results={transformedResults}
              onResultClick={(result) => {
                console.log('Result clicked:', result);
              }}
              emptyMessage="No results found."
            />
          </div>
        )}
        
        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Searches</h2>
            <div className="space-y-2">
              {searchHistory.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.query}</p>
                    <p className="text-sm text-gray-500">
                      {item.mode} · {new Date(item.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setQuery(item.query);
                      setSelectedFilter(item.mode as SearchMode);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Load
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
