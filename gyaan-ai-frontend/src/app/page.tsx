// Main landing page component
import Link from 'next/link';
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      
      <main className="flex-grow container mx-auto p-6">
        <section className="text-center py-20">
          <h2 className="text-5xl font-bold mb-6">Welcome to Gyaan AI</h2>
          <p className="text-xl text-gray-600 mb-8">
            Your intelligent search and query platform
          </p>
          <Link href="/dashboard">
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-blue-700">
            Get Started
          </button>
            </Link>
        </section>
      </main>
      
      <footer className="bg-gray-800 text-white p-6 text-center">
        <p>&copy; 2025 Gyaan AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
