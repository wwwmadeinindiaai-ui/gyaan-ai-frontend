'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Clock, Search, Trash2, ExternalLink } from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface HistoryItem {
  id: string;
  query: string;
  synthesis: string;
  timestamp: Date;
  confidence: number;
}

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      loadHistory();
    }
  }, [status, session]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const userId = (session?.user as any)?.id || session?.user?.email;
      
      if (!userId) {
        console.error('No user ID available');
        setHistory([]);
        return;
      }

      const historyQuery = query(
        collection(db, 'query_history'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(historyQuery);
      const items: HistoryItem[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          query: data.query,
          synthesis: data.synthesis,
          timestamp: data.timestamp?.toDate() || new Date(),
          confidence: data.confidence || 0,
        });
      });

      setHistory(items);
    } catch (error) {
      console.error('Error loading history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(item =>
    item.query.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (status !== 'authenticated' || !session) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please sign in to view your query history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            <Clock className="inline-block w-8 h-8 mr-3 text-indigo-600" />
            Query History
          </h1>
          <p className="text-lg text-gray-600">
            Review your past queries and research
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search your query history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* History List */}
        {filteredHistory.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No matching queries found' : 'No query history yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? 'Try adjusting your search term'
                : 'Start by making your first query on the dashboard'}
            </p>
            <a
              href="/dashboard"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Go to Dashboard
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">
                    {item.query}
                  </h3>
                  <span className="text-sm text-gray-500 ml-4 whitespace-nowrap">
                    {item.timestamp.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-gray-700 mb-4 line-clamp-3">
                  {item.synthesis.substring(0, 200)}...
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      Confidence: {(item.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <a
                    href={`/dashboard?query=${encodeURIComponent(item.query)}`}
                    className="text-indigo-600 hover:text-indigo-800 flex items-center text-sm font-medium"
                  >
                    Re-run query
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {filteredHistory.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-600">
            Showing {filteredHistory.length} of {history.length} queries
          </div>
        )}
      </div>
    </div>
  );
}
