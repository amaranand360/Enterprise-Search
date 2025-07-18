'use client';

import { useState, useEffect } from 'react';
import { Search, Clock, TrendingUp, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchSuggestionsProps {
  query: string;
  isVisible: boolean;
  onSuggestionSelect: (suggestion: string) => void;
  onClose: () => void;
}

interface Suggestion {
  id: string;
  text: string;
  type: 'recent' | 'popular' | 'completion' | 'tag';
  icon: React.ReactNode;
  metadata?: string;
}

export function SearchSuggestions({ 
  query, 
  isVisible, 
  onSuggestionSelect, 
  onClose 
}: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Enhanced recent searches with more variety
  const recentSearches = [
    'Q4 budget planning',
    'Team performance metrics',
    'Product roadmap 2025',
    'Marketing campaign analysis',
    'Client feedback from yesterday',
    'Weekly team sync notes',
    'Project status update',
    'Sales pipeline review',
    'User research findings',
    'Technical documentation'
  ];

  // Enhanced popular searches with more variety
  const popularSearches = [
    'Create presentation from meeting notes',
    'Schedule weekly team sync',
    'Generate expense report',
    'Find similar documents to current project',
    'Summarize email thread from yesterday',
    'Draft project proposal',
    'Review quarterly goals',
    'Analyze customer feedback',
    'Update team dashboard',
    'Prepare status report'
  ];

  // Mock tags
  const tags = [
    'important',
    'urgent',
    'review',
    'planning',
    'meeting',
    'project',
    'client',
    'team'
  ];

  useEffect(() => {
    if (!query.trim()) {
      // Show recent and popular searches when no query
      const recentSuggestions: Suggestion[] = recentSearches.slice(0, 3).map((search, index) => ({
        id: `recent-${index}`,
        text: search,
        type: 'recent',
        icon: <Clock className="h-4 w-4" />,
        metadata: 'Recent'
      }));

      const popularSuggestions: Suggestion[] = popularSearches.slice(0, 3).map((search, index) => ({
        id: `popular-${index}`,
        text: search,
        type: 'popular',
        icon: <TrendingUp className="h-4 w-4" />,
        metadata: 'Popular'
      }));

      setSuggestions([...recentSuggestions, ...popularSuggestions]);
    } else {
      // Generate completions and filtered suggestions
      const completions: Suggestion[] = [];
      const filteredRecent: Suggestion[] = [];
      const filteredTags: Suggestion[] = [];

      // Auto-completions
      const allSearches = [...recentSearches, ...popularSearches];
      allSearches.forEach((search, index) => {
        if (search.toLowerCase().includes(query.toLowerCase()) && search !== query) {
          completions.push({
            id: `completion-${index}`,
            text: search,
            type: 'completion',
            icon: <Search className="h-4 w-4" />
          });
        }
      });

      // Recent searches that match
      recentSearches.forEach((search, index) => {
        if (search.toLowerCase().includes(query.toLowerCase()) && search !== query) {
          filteredRecent.push({
            id: `filtered-recent-${index}`,
            text: search,
            type: 'recent',
            icon: <Clock className="h-4 w-4" />,
            metadata: 'Recent'
          });
        }
      });

      // Tags that match
      tags.forEach((tag, index) => {
        if (tag.toLowerCase().includes(query.toLowerCase())) {
          filteredTags.push({
            id: `tag-${index}`,
            text: `#${tag}`,
            type: 'tag',
            icon: <Hash className="h-4 w-4" />,
            metadata: 'Tag'
          });
        }
      });

      setSuggestions([
        ...completions.slice(0, 4),
        ...filteredRecent.slice(0, 2),
        ...filteredTags.slice(0, 3)
      ]);
    }

    setSelectedIndex(-1);
  }, [query]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isVisible) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          onSuggestionSelect(suggestions[selectedIndex].text);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, selectedIndex, suggestions]);

  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
      {!query.trim() && (
        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Search Suggestions
          </p>
        </div>
      )}
      
      <div className="py-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={suggestion.id}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSuggestionSelect(suggestion.text);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
              selectedIndex === index && "bg-blue-50 dark:bg-blue-900/20"
            )}
          >
            <div className={cn(
              "flex-shrink-0",
              suggestion.type === 'recent' && "text-gray-400",
              suggestion.type === 'popular' && "text-orange-500",
              suggestion.type === 'completion' && "text-blue-500",
              suggestion.type === 'tag' && "text-purple-500"
            )}>
              {suggestion.icon}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 dark:text-white truncate">
                {highlightMatch(suggestion.text, query)}
              </p>
            </div>
            
            {suggestion.metadata && (
              <div className="flex-shrink-0">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {suggestion.metadata}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>
      
      <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Use ↑↓ to navigate, Enter to select, Esc to close
        </p>
      </div>
    </div>
  );
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => 
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 text-gray-900 dark:text-white">
        {part}
      </mark>
    ) : (
      part
    )
  );
}
