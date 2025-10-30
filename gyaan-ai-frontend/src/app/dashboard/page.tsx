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
  async function searchApi(mode: string, q: string, maxResults = 10) {
    const body: any = {
      query: q,
      model: 'gpt-3.5-turbo',
      maxResults,
      mode,
    };
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Search API failed for mode ${mode}`);
    const data = await res.json();
    return (data?.results || []) as SearchResult[];
  }

  async function handleSearch() {
    if (!query.trim()) return;
    setIsSearching(true);
    setCurrentResults(null);
    setWarning(null);

    try {
      const q = query.trim();

      // Modes handling
      if (selectedFilter === 'all') {
        // Send parallel requests for web, news, trending, images, and videos, then combine
        const [web, news, trending, images, videos] = await Promise.all([
          searchApi('web', q, 10).catch(() => []),
          searchApi('news', q, 10).catch(() => []),
          searchApi('trending', q, 10).catch(() => []),
          searchApi('images', q, 10).catch(() => []),
          searchApi('videos', q, 10).catch(() => []),
        ]);
        // Simple interleave/mix: concatenate with source tags already in results
        const mixed = [...web, ...news, ...trending, ...images, ...videos];
        setCurrentResults(mixed);
      } else if (selectedFilter === 'academic') {
        // Academic mode: prefer Semantic Scholar or arXiv if available, else placeholder
        try {
          const academic = await searchApi('academic', q, 10);
          setCurrentResults(academic);
          if (!academic?.length) {
            setWarning('No academic results found. Try a more specific query.');
          }
        } catch (e) {
          // Fallback placeholder
          setWarning('Academic search not fully implemented. Try Semantic Scholar or arXiv.');
          setCurrentResults([]);
        }
      } else if (selectedFilter === 'images') {
        // Ensure API uses plural 'images', and warn if Unsplash key missing
        try {
          const images = await searchApi('images', q, 12);
          if (images?.length === 0) {
            // Heuristic warning if backend signals missing key; also show generic hint
            setWarning('No images found. Ensure Unsplash API key is configured.');
          }
          setCurrentResults(images);
        } catch (e: any) {
          setWarning('Image search failed. Check Unsplash API key in environment.');
          setCurrentResults([]);
        }
      } else if (selectedFilter === 'videos') {
        const videos = await searchApi('videos', q, 10);
        setCurrentResults(videos);
      } else if (selectedFilter === 'news') {
        const news = await searchApi('news', q, 10);
        setCurrentResults(news);
      } else if (selectedFilter === 'web') {
        const web = await searchApi('web', q, 10);
        setCurrentResults(web);
      } else if (selectedFilter === 'trending') {
        const trending = await searchApi('trending', q, 10);
        setCurrentResults(trending);
      }

      // Save to history
      if (session?.user?.email) {
        try {
          const resultsToSave = (currentResults ?? []) as SearchResult[];
          await saveSearchHistory(session.user.email, {
            query: q,
            timestamp: new Date().toISOString(),
            filter: selectedFilter,
            results: resultsToSave,
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

  // The rest of your component JSX remains, using currentResults and warning where appropriate.
  // ...
  return (
    <div>/* Dashboard JSX omitted for brevity. Ensure UI shows warning if set. */</div>
  );
}
