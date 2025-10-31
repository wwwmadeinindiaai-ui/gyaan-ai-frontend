import React from 'react';

interface ResultCardProps {
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  onClick?: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  title,
  description,
  metadata,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 cursor-pointer border border-gray-200 dark:border-gray-700"
    >
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {description}
        </p>
      )}
      {metadata && (
        <div className="flex flex-wrap gap-2 mt-4">
          {Object.entries(metadata).map(([key, value]) => (
            <span
              key={key}
              className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
            >
              {key}: {String(value)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultCard;
