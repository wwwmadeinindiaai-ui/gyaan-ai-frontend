import React from 'react';

interface Citation {
  source: string;
  url?: string;
}

interface SummaryPanelProps {
  summary: string;
  citations: Citation[];
  isLoading: boolean;
  // Add additional props below as needed
  className?: string;
  onCitationClick?: (citation: Citation) => void;
}

const SummaryPanel: React.FC<SummaryPanelProps> = ({
  summary,
  citations,
  isLoading,
  className,
  onCitationClick
}) => {
  return (
    <div className={`summary-panel ${className || ''}`}>
      <h2>Summary Panel</h2>
      {isLoading ? (
        <p>Loading summary...</p>
      ) : (
        <>
          <div className="summary-content">
            {summary}
          </div>
          {citations.length > 0 && (
            <div className="citations">
              <h3>Citations</h3>
              <ul>
                {citations.map((citation, index) => (
                  <li key={index}>
                    {citation.url ? (
                      <a
                        href={citation.url}
                        onClick={() => onCitationClick?.(citation)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {citation.source}
                      </a>
                    ) : (
                      <span>{citation.source}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SummaryPanel;
