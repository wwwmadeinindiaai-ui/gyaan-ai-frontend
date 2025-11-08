'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function TestQueryPage() {
  const { data: session, status } = useSession();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/query/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to synthesize query');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="p-8">Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return <div className="p-8">Please sign in to test the API.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-2">Query Synthesis API Test</h1>
          <p className="text-gray-600 mb-6">Test the Gemini AI-powered query synthesis</p>

          <form onSubmit={handleSubmit} className="mb-6">
            <div className="mb-4">
              <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                Enter your query:
              </label>
              <textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="e.g., What are the latest developments in AI technology?"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Processing...' : 'Synthesize Query'}
            </button>
          </form>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              <strong>Error:</strong> {error}
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">✓ Success!</h3>
                <p className="text-sm text-green-700">Query processed in {result.data?.processingTimeMs}ms</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Query:</h3>
                <p className="text-gray-700 mb-6">{result.data?.query}</p>

                <h3 className="text-xl font-semibold mb-4">AI Synthesis:</h3>
                <div className="prose max-w-none mb-6">
                  <p className="text-gray-800 whitespace-pre-wrap">{result.data?.synthesis}</p>
                </div>

                <h3 className="text-xl font-semibold mb-4">Citations:</h3>
                <div className="space-y-2">
                  {result.data?.citations?.map((citation: any, index: number) => (
                    <div key={index} className="bg-gray-50 p-4 rounded border border-gray-200">
                      <p className="font-medium">{citation.title}</p>
                      <p className="text-sm text-gray-600">Source: {citation.source}</p>
                      <p className="text-sm text-gray-600">Relevance: {(citation.relevance * 100).toFixed(0)}%</p>
                      {citation.url && (
                        <a href={citation.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                          {citation.url}
                        </a>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold mb-2">Metadata:</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Query ID:</span>
                      <span className="ml-2 font-mono">{result.data?.id}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Confidence:</span>
                      <span className="ml-2">{(result.data?.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Processing Time:</span>
                      <span className="ml-2">{result.data?.processingTimeMs}ms</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Timestamp:</span>
                      <span className="ml-2">{new Date(result.data?.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
