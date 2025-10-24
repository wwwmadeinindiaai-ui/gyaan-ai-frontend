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
  };
