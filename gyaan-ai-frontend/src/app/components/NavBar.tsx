import Link from 'next/link';

export default function NavBar() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Gyaan AI
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/about" className="text-gray-600 hover:text-gray-900">
              About
            </Link>
            <Link href="/api-docs" className="text-gray-600 hover:text-gray-900">
              API
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
