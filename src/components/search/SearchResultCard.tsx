'use client';

import { ExternalLink, Calendar, User, Tag } from 'lucide-react';
import { SearchResult } from '@/types';
import { formatRelativeTime, highlightSearchTerm, truncateText } from '@/lib/utils';

interface SearchResultCardProps {
  result: SearchResult;
  query: string;
}

export function SearchResultCard({ result, query }: SearchResultCardProps) {
  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return '📧';
      case 'document': return '📄';
      case 'message': return '💬';
      case 'task': return '✅';
      case 'issue': return '🐛';
      case 'file': return '📁';
      case 'calendar-event': return '📅';
      case 'contact': return '👤';
      case 'note': return '📝';
      case 'code': return '💻';
      default: return '📄';
    }
  };

  const getContentTypeLabel = (type: string) => {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Tool Icon */}
          <div 
            className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-medium"
            style={{ backgroundColor: result.tool.color }}
          >
            {result.tool.icon}
          </div>
          
          {/* Tool and Content Type */}
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium">{result.tool.name}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span>{getContentTypeIcon(result.type)}</span>
              {getContentTypeLabel(result.type)}
            </span>
          </div>
        </div>

        {/* Relevance Score */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="h-2 w-16 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${result.relevanceScore}%` }}
            />
          </div>
          <span>{Math.round(result.relevanceScore)}%</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
        <span 
          dangerouslySetInnerHTML={{ 
            __html: highlightSearchTerm(result.title, query) 
          }} 
        />
      </h3>

      {/* Content Preview */}
      <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
        <span 
          dangerouslySetInnerHTML={{ 
            __html: highlightSearchTerm(truncateText(result.content, 200), query) 
          }} 
        />
      </p>

      {/* Metadata */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          {/* Author */}
          {result.author && (
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{result.author}</span>
            </div>
          )}
          
          {/* Timestamp */}
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formatRelativeTime(result.timestamp)}</span>
          </div>

          {/* Tags */}
          {result.metadata?.tags && result.metadata.tags.length > 0 && (
            <div className="flex items-center gap-1">
              <Tag className="h-4 w-4" />
              <div className="flex gap-1">
                {result.metadata.tags.slice(0, 2).map((tag: string) => (
                  <span 
                    key={tag}
                    className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
                {result.metadata.tags.length > 2 && (
                  <span className="text-xs text-gray-400">
                    +{result.metadata.tags.length - 2}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {result.url && (
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Open
            </a>
          )}
        </div>
      </div>

      {/* Priority Indicator */}
      {result.metadata?.priority && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Priority:</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              result.metadata.priority === 'high' 
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                : result.metadata.priority === 'medium'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            }`}>
              {result.metadata.priority}
            </span>
            {result.metadata.department && (
              <>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {result.metadata.department}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
