'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';

interface SearchSuggestion {
  text: string;
  type: 'history' | 'trending' | 'suggestion';
}

interface EnhancedSearchBarProps {
  onSearch: (query: string, filter?: string) => void;
  placeholder?: string;
  searchHistory?: string[];
  trendingSearches?: string[];
  currentFilter?: string;
  isLoading?: boolean;
  className?: string;
}

export default function EnhancedSearchBar({
  onSearch,
  placeholder = 'Search the web...',
  searchHistory = [],
  trendingSearches = [],
  currentFilter = 'web',
  isLoading = false,
  className = '',
}: EnhancedSearchBarProps) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Combine search history and trending searches for suggestions
  const suggestions: SearchSuggestion[] = [
    ...searchHistory.slice(0, 5).map(text => ({ text, type: 'history' as const })),
    ...trendingSearches.slice(0, 3).map(text => ({ text, type: 'trending' as const })),
  ];

  // Filter suggestions based on current query
  const filteredSuggestions = query.trim()
    ? suggestions.filter(s => s.text.toLowerCase().includes(query.toLowerCase()))
    : suggestions;

  // Handle search submission
  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim(), currentFilter);
      setShowSuggestions(false);
      setFocusedIndex(-1);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    handleSearch(suggestion.text);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        if (focusedIndex >= 0) {
          e.preventDefault();
          handleSuggestionClick(filteredSuggestions[focusedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setFocusedIndex(-1);
        break;
    }
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get icon for suggestion type
  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'history':
        return <Clock className="w-4 h-4" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  // Clear input
  const handleClear = () => {
    setQuery('');
    setShowSuggestions(false);
    setFocusedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          {/* Search Icon */}
          <div className="absolute left-4 pointer-events-none">
            <Search className={`w-5 h-5 ${
              isLoading ? 'animate-pulse text-blue-500' : 'text-gray-400'
            }`} />
          </div>

          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className={
              'w-full pl-12 pr-12 py-3 text-base ' +
              'border border-gray-300 rounded-full ' +
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ' +
              'transition-all duration-200 ' +
              'disabled:opacity-50 disabled:cursor-not-allowed ' +
              'shadow-sm hover:shadow-md'
            }
            aria-label="Search input"
            aria-autocomplete="list"
            aria-controls="search-suggestions"
            aria-expanded={showSuggestions && filteredSuggestions.length > 0}
          />

          {/* Clear Button */}
          {query && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          id="search-suggestions"
          role="listbox"
          className={
            'absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg ' +
            'border border-gray-200 max-h-80 overflow-y-auto'
          }
        >
          {/* History Section */}
          {filteredSuggestions.some(s => s.type === 'history') && (
            <div className="py-2">
              <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Recent Searches
              </div>
              {filteredSuggestions
                .filter(s => s.type === 'history')
                .map((suggestion, index) => {
                  const actualIndex = filteredSuggestions.indexOf(suggestion);
                  return (
                    <button
                      key={`history-${index}`}
                      type="button"
                      role="option"
                      aria-selected={focusedIndex === actualIndex}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left ' +
                        'hover:bg-gray-50 transition-colors ' +
                        (focusedIndex === actualIndex ? 'bg-blue-50' : '')
                      }
                    >
                      <span className="text-gray-400">
                        {getSuggestionIcon(suggestion.type)}
                      </span>
                      <span className="flex-1 text-gray-700">{suggestion.text}</span>
                    </button>
                  );
                })}
            </div>
          )}

          {/* Trending Section */}
          {filteredSuggestions.some(s => s.type === 'trending') && (
            <div className="py-2 border-t border-gray-100">
              <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Trending
              </div>
              {filteredSuggestions
                .filter(s => s.type === 'trending')
                .map((suggestion, index) => {
                  const actualIndex = filteredSuggestions.indexOf(suggestion);
                  return (
                    <button
                      key={`trending-${index}`}
                      type="button"
                      role="option"
                      aria-selected={focusedIndex === actualIndex}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left ' +
                        'hover:bg-gray-50 transition-colors ' +
                        (focusedIndex === actualIndex ? 'bg-blue-50' : '')
                      }
                    >
                      <span className="text-orange-500">
                        {getSuggestionIcon(suggestion.type)}
                      </span>
                      <span className="flex-1 text-gray-700">{suggestion.text}</span>
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
