export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
      </header>
      
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-4">Search Your Queries</h2>
          <div className="flex gap-4">
            <input 
              type="text" 
              placeholder="Enter your search query..." 
              className="flex-grow border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
              Search
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Recent Searches</h3>
          <ul className="space-y-2">
            <li className="p-3 bg-gray-50 rounded">No recent searches yet</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
