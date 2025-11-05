'use client';
import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Settings, Download, Clipboard, ArrowRight, Clock, LayoutDashboard, Users, Zap, Globe, HardDrive } from 'lucide-react';
import { useSession } from 'next-auth/react';

// Type definitions
type ResultItem = {
  id: number;
  title: string;
  snippet: string;
  source: string;
  url: string;
  date: string;
};

type ResultsData = {
  query: string;
  data: ResultItem[];
};

// --- Sidebar ---
const SidebarItem = ({ icon: Icon, label, href, active = false }: { icon: React.ElementType, label: string, href: string, active?: boolean }) => (
  <li>
    <a href={href} className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition duration-200 ${active ? 'bg-indigo-100 text-indigo-700 font-semibold shadow-inner' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </a>
  </li>
);

const DashboardSidebar = () => (
  <nav className="w-64 bg-white shadow-lg h-full fixed top-16 left-0 pt-6 px-4 hidden md:block">
    <ul className="space-y-2">
      <SidebarItem icon={LayoutDashboard} label="Dashboard" href="/dashboard" active />
      <SidebarItem icon={Clock} label="Query History" href="/history" />
      <SidebarItem icon={BookOpen} label="Article Builder" href="#" />
      <SidebarItem icon={HardDrive} label="Data Sources" href="/profile" />
      <SidebarItem icon={Users} label="Team Members" href="#" />
    </ul>
    <div className="absolute bottom-20 left-4 right-4 p-4 bg-indigo-50 rounded-lg text-center">
      <Zap className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
      <p className="text-sm font-semibold text-indigo-800 mb-2">Upgrade to Pro</p>
      <p className="text-xs text-indigo-700 mb-3">Unlock advanced AI models and unlimited reports.</p>
      <a className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition" href="/pricing">View Plans →</a>
    </div>
  </nav>
);

const ActionCard = ({ icon: Icon, title, description, href }: { icon: React.ElementType, title: string, description: string, href: string }) => (
  <a className="block p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:border-indigo-300 transition-all duration-300 transform hover:-translate-y-1" href={href}>
    <Icon className="w-10 h-10 text-indigo-600 mb-3" />
    <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
    <p className="text-sm text-gray-600">{description}</p>
  </a>
);

const ResultCard = ({ item }: { item: ResultItem }) => (
  <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
    <div className="flex items-start justify-between mb-3">
      <h3 className="text-xl font-semibold text-gray-900 flex-1">{item.title}</h3>
      <span className="text-xs text-gray-500 ml-4">{item.date}</span>
    </div>
    <p className="text-gray-700 mb-4">{item.snippet}</p>
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-indigo-600">{item.source}</span>
      <a href={item.url} className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline">View Source →</a>
    </div>
  </div>
);

// --- Main Dashboard Page ---
export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ResultsData | null>(null);
  const [message, setMessage] = useState('');
  
  const handleSearch = () => {
    if (!query.trim()) {
      setMessage('Please enter a query.');
      return;
    }
    setLoading(true);
    setResults(null);
    setMessage('');
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setMessage(`Showing ${mockResults.data.length} synthesized results for: "${query}"`);
      setResults(mockResults);
    }, 1800);
  };
  
  if (status === 'loading') {
    return <div className="flex justify-center items-center h-[calc(100vh-64px)]"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div></div>;
  }
  
  if (status !== 'authenticated' || !session) {
    return <div className="p-10 text-center">Access Denied. Please sign in.</div>;
  }
  
  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <DashboardSidebar />
      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 bg-gray-50 p-6 sm:p-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome, {session.user?.name?.split(' ')[0] || 'User'}</h1>
          <p className="text-xl text-gray-600 mb-8">What knowledge will you uncover today?</p>
          {/* Quick Actions Grid */}
          {!results && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <ActionCard icon={BookOpen} title="New Article" description="Start a new report from scratch." href="#" />
              <ActionCard icon={Clock} title="View History" description="Review your past queries and reports." href="/history" />
              <ActionCard icon={Settings} title="Manage Preferences" description="Adjust sources and account settings." href="/profile" />
            </div>
          )}
          {/* Search Bar */}
          <div className="sticky top-20 z-10 bg-gray-50/80 backdrop-blur-sm py-4 mb-6">
            <div className="relative flex items-center">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ask Gyaan AI anything... (e.g., 'What are the risks of deploying generative AI in finance?')"
                className="w-full p-5 pr-40 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-lg text-lg"
                disabled={loading}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <div className="absolute right-3">
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/50 text-base flex items-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                  <span className="ml-2 hidden sm:inline">{loading ? 'Searching...' : 'Query AI'}</span>
                </button>
              </div>
            </div>
            <p className={`mt-2 text-sm text-left ${message ? 'text-indigo-700' : 'text-gray-500'} font-medium`}>{message || 'Your AI research assistant is ready.'}</p>
          </div>
          {/* Results Display */}
          {results && (
            <div className="mt-4 animate-fadeIn">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">Intelligent Synthesis Results</h2>
                <button className="bg-gray-700 hover:bg-gray-800 text-white rounded-xl px-4 py-2 flex items-center">
                  <Download className="w-4 h-4 mr-2" /> Export to PDF
                </button>
              </div>
              <div className="space-y-6">
                {results.data.map((item) => (
                  <ResultCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// --- Mock Data ---
const mockResults: ResultsData = {
  query: "risks of generative AI in finance",
  data: [
    { 
      id: 1, 
      title: "Analysis of AI-Driven Market Manipulation", 
      snippet: "Generative AI could be used to create sophisticated, automated disinformation campaigns, influencing market sentiment and causing flash crashes. Regulatory bodies are behind the curve.", 
      source: "Financial Times", 
      url: "#", 
      date: "Nov 3, 2025" 
    },
    { 
      id: 2, 
      title: "Internal Memo: Q4 AI Risk Assessment (Confidential)", 
      snippet: "Our internal models show a 35% increase in 'model hallucination' risk when generative AI is applied to quarterly earnings report summaries. Recommending human-in-the-loop verification.", 
      source: "Internal Knowledge Base", 
      url: "#",
      date: "Oct 30, 2025" 
    },
    { 
      id: 3, 
      title: "SEC Advisory on AI Model GRC (Governance, Risk, Compliance)", 
      snippet: "The SEC has issued new guidance indicating that public companies may be liable for 'materially misleading' statements generated by AI, even if unintentional.", 
      source: "SEC.gov", 
      url: "#",
      date: "Nov 1, 2025" 
    },
  ],
};

if (typeof document !== 'undefined') {
  document.head.appendChild(document.createElement('style')).innerHTML = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn {
      animation: fadeIn 0.5s ease-out;
    }
  `;
}
