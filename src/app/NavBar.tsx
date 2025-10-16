import Link from 'next/link';

export default function NavBar() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link className="text-2xl font-bold text-blue-600" href="/">
              Gyaan AI
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link className="text-gray-600 hover:text-gray-900" href="/about">
              About
            </Link>
            <Link className="text-gray-600 hover:text-gray-900" href="/api-docs">
              API
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
