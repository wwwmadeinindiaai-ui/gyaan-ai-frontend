// Main landing page component
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-blue-600 text-white p-6">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold">Gyaan AI</h1>
          <nav className="mt-4">
            <a href="/signup" className="mr-4 hover:underline">Sign Up</a>
            <a href="/dashboard" className="mr-4 hover:underline">Dashboard</a>
            <a href="/pricing" className="mr-4 hover:underline">Pricing</a>
            <a href="/about" className="mr-4 hover:underline">About</a>
            <a href="/contact" className="hover:underline">Contact</a>
          </nav>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto p-6">
        <section className="text-center py-20">
          <h2 className="text-5xl font-bold mb-6">Welcome to Gyaan AI</h2>
          <p className="text-xl text-gray-600 mb-8">
            Your intelligent search and query platform
          </p>
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-blue-700">
            Get Started
          </button>
        </section>
      </main>
      
      <footer className="bg-gray-800 text-white p-6 text-center">
        <p>&copy; 2025 Gyaan AI. All rights reserved.</p>
      </footer>
    </div>
  );
}