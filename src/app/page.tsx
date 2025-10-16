'use client';
import { useState } from 'react';
import NavBar from './NavBar';
import SearchBar from '../components/SearchBar';
import ResultsTabs from './components/ResultsTabs';
import ResultsList from './components/ResultsList';
import ImageGallery from './components/ImageGallery';
import VideoGallery from './components/VideoGallery';

export default function Home() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'images' | 'videos'>('all');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    setLoading(true);
    
    // TODO: Replace with actual API call
    // Placeholder for API integration
    setTimeout(() => {
      setResults([
        {
          title: 'Sample Result 1',
          url: 'https://example.com/1',
          description: 'This is a sample search result. Replace with actual API data.'
        },
        {
          title: 'Sample Result 2',
          url: 'https://example.com/2',
          description: 'Another sample result for testing purposes.'
        }
      ]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-center mb-8 text-gray-900">
            Gyaan AI Search
          </h1>
          <SearchBar onSearch={handleSearch} />
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Searching...</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div>
            <ResultsTabs activeTab={activeTab} onTabChange={setActiveTab} />
            
            <div className="mt-6">
              {activeTab === 'all' && <ResultsList results={results} />}
              {activeTab === 'images' && <ImageGallery images={[]} />}
              {activeTab === 'videos' && <VideoGallery videos={[]} />}
            </div>
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No results found for "{query}"
          </div>
        )}
      </main>
    </div>
  );
}
