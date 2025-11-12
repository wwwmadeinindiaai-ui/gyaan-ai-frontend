// src/app/data-sources/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface DataSource {
  id: string;
  name: string;
  type: 'google-drive' | 'notion' | 'internal-api' | 'custom';
  status: 'active' | 'inactive' | 'error';
  config: { service: string; endpoint?: string };
  lastSync?: Date;
  createdAt: Date;
}

export default function DataSourcesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', type: 'custom' as DataSource['type'], service: '', endpoint: ''
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/signin');
  }, [status, router]);

  useEffect(() => {
    if (session?.user) fetchDataSources();
  }, [session]);

  const fetchDataSources = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/data-sources');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setDataSources(data.sources || []);
    } catch (err) {
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/data-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Failed');
      await fetchDataSources();
      setShowAddModal(false);
      setFormData({ name: '', type: 'custom', service: '', endpoint: '' });
    } catch (err) {
      setError('Failed to add');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return;
    try {
      await fetch(`/api/data-sources/${id}`, { method: 'DELETE' });
      setDataSources(dataSources.filter(s => s.id !== id));
    } catch (err) {
      setError('Failed to delete');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8"><h1 className="text-3xl font-bold">Data Sources</h1><p className="mt-2 text-gray-600">Connect and manage your data sources</p></div>
        {error && <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4"><p className="text-red-800">{error}</p><button onClick={() => setError(null)} className="text-red-600 underline text-sm mt-2">Dismiss</button></div>}
        <div className="mb-6 flex justify-between">
          <button onClick={fetchDataSources} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Refresh</button>
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Add</button>
        </div>
        {dataSources.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <h3 className="text-lg font-medium mb-2">No data sources</h3>
            <p className="text-gray-600 mb-6">Connect your first data source</p>
            <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add First Source</button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dataSources.map(s => (
              <div key={s.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between mb-4">
                  <div><h3 className="font-semibold">{s.name}</h3><p className="text-sm text-gray-500">{s.config.service}</p></div>
                  <span className={`px-2 py-1 text-xs rounded-full ${s.status === 'active' ? 'bg-green-100 text-green-800' : s.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100'}`}>{s.status}</span>
                </div>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between"><span>Type:</span><span className="font-medium">{s.type}</span></div>
                  {s.lastSync && <div className="flex justify-between"><span>Last Sync:</span><span className="font-medium">{new Date(s.lastSync).toLocaleDateString()}</span></div>}
                </div>
                <button onClick={() => handleDelete(s.id)} className="mt-4 w-full px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100">Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Add Data Source</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Name</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium mb-1">Type</label><select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as DataSource['type']})} className="w-full px-3 py-2 border rounded-lg"><option value="custom">Custom</option><option value="google-drive">Google Drive</option><option value="notion">Notion</option><option value="internal-api">Internal API</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Service</label><input type="text" value={formData.service} onChange={e => setFormData({...formData, service: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium mb-1">Endpoint</label><input type="text" value={formData.endpoint} onChange={e => setFormData({...formData, endpoint: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="https://api.example.com" /></div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
