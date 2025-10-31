import React from 'react';
import ResultCard from './ResultCard';

interface ResultsGridProps {
  results: any[];
  onResultClick?: (result: any) => void;
  emptyMessage?: string;
  columns?: number;
}

export const ResultsGrid: React.FC<ResultsGridProps> = ({
  results,
  onResultClick,
  emptyMessage = 'No results found',
  columns = 3,
}) => {
  if (!results || results.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-500 dark:text-gray-400">
        <p className="text-lg">{emptyMessage}</p>
      </div>
    );
  }

  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  }[columns] || 'md:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`grid grid-cols-1 ${gridColsClass} gap-6 p-6`}>
      {results.map((result, index) => (
        <ResultCard
          key={result.id || index}
          title={result.title || result.name || 'Untitled'}
          description={result.description || result.summary}
          metadata={result.metadata}
          onClick={() => onResultClick?.(result)}
        />
      ))}
    </div>
  );
};

export default ResultsGrid;
