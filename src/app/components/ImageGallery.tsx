interface ImageResult {
  url: string;
  title: string;
  thumbnail: string;
}

interface ImageGalleryProps {
  images: ImageResult[];
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No images found. Try a different search.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((image, index) => (
        <div key={index} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
          <a href={image.url} target="_blank" rel="noopener noreferrer">
            <img
              src={image.thumbnail}
              alt={image.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-2">
              <p className="text-sm text-gray-700 truncate">{image.title}</p>
            </div>
          </a>
        </div>
      ))}
    </div>
  );
}
EOFcat > src/app/components/ResultsList.tsx << 'EOF'
interface SearchResult {
  title: string;
  url: string;
  description: string;
}

interface ResultsListProps {
  results: SearchResult[];
}

export default function ResultsList({ results }: ResultsListProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No results found. Try a different search.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {results.map((result, index) => (
        <div key={index} className="border-b pb-4">
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xl text-blue-600 hover:underline"
          >
            {result.title}
          </a>
          <div className="text-sm text-green-700 mt-1">{result.url}</div>
          <p className="text-gray-600 mt-2">{result.description}</p>
        </div>
      ))}
    </div>
  );
}
