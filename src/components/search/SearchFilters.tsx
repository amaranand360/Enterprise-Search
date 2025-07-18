'use client';

import { useState } from 'react';
import { X, Calendar, User, Filter } from 'lucide-react';
import { SearchFilters as SearchFiltersType, ContentType } from '@/types';
import { ALL_TOOLS, TOOL_CATEGORIES } from '@/lib/config';
import { cn } from '@/lib/utils';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
}

export function SearchFilters({ filters, onFiltersChange }: SearchFiltersProps) {
  const [dateRange, setDateRange] = useState({
    start: filters.dateRange?.start?.toISOString().split('T')[0] || '',
    end: filters.dateRange?.end?.toISOString().split('T')[0] || ''
  });

  const contentTypes: { value: ContentType; label: string; icon: string }[] = [
    { value: 'email', label: 'Emails', icon: '📧' },
    { value: 'document', label: 'Documents', icon: '📄' },
    { value: 'message', label: 'Messages', icon: '💬' },
    { value: 'task', label: 'Tasks', icon: '✅' },
    { value: 'issue', label: 'Issues', icon: '🐛' },
    { value: 'file', label: 'Files', icon: '📁' },
    { value: 'calendar-event', label: 'Events', icon: '📅' },
    { value: 'contact', label: 'Contacts', icon: '👤' },
    { value: 'note', label: 'Notes', icon: '📝' },
    { value: 'code', label: 'Code', icon: '💻' }
  ];

  const handleToolToggle = (toolId: string) => {
    const currentTools = filters.tools || [];
    const newTools = currentTools.includes(toolId)
      ? currentTools.filter(id => id !== toolId)
      : [...currentTools, toolId];
    
    onFiltersChange({
      ...filters,
      tools: newTools.length > 0 ? newTools : undefined
    });
  };

  const handleContentTypeToggle = (contentType: ContentType) => {
    const currentTypes = filters.contentTypes || [];
    const newTypes = currentTypes.includes(contentType)
      ? currentTypes.filter(type => type !== contentType)
      : [...currentTypes, contentType];
    
    onFiltersChange({
      ...filters,
      contentTypes: newTypes.length > 0 ? newTypes : undefined
    });
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const newDateRange = { ...dateRange, [field]: value };
    setDateRange(newDateRange);
    
    if (newDateRange.start || newDateRange.end) {
      onFiltersChange({
        ...filters,
        dateRange: {
          start: newDateRange.start ? new Date(newDateRange.start) : new Date(0),
          end: newDateRange.end ? new Date(newDateRange.end) : new Date()
        }
      });
    } else {
      onFiltersChange({
        ...filters,
        dateRange: undefined
      });
    }
  };

  const handleAuthorChange = (author: string) => {
    onFiltersChange({
      ...filters,
      author: author.trim() || undefined
    });
  };

  const clearAllFilters = () => {
    setDateRange({ start: '', end: '' });
    onFiltersChange({});
  };

  const hasActiveFilters = !!(
    filters.tools?.length ||
    filters.contentTypes?.length ||
    filters.dateRange ||
    filters.author
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            Search Filters
          </h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Tools Filter */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Tools ({filters.tools?.length || 0} selected)
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {ALL_TOOLS.map(tool => (
            <button
              key={tool.id}
              onClick={() => handleToolToggle(tool.id)}
              className={cn(
                "flex items-center gap-2 p-2 rounded-md text-sm transition-colors text-left",
                filters.tools?.includes(tool.id)
                  ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                  : "hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
              )}
            >
              <span className="text-base">{tool.icon}</span>
              <span className="truncate">{tool.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Types Filter */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Content Types ({filters.contentTypes?.length || 0} selected)
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {contentTypes.map(type => (
            <button
              key={type.value}
              onClick={() => handleContentTypeToggle(type.value)}
              className={cn(
                "flex items-center gap-2 p-2 rounded-md text-sm transition-colors text-left",
                filters.contentTypes?.includes(type.value)
                  ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                  : "hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
              )}
            >
              <span className="text-base">{type.icon}</span>
              <span className="truncate">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Date Range Filter */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Date Range
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              From
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              To
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Author Filter */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <User className="h-4 w-4" />
          Author
        </h4>
        <input
          type="text"
          value={filters.author || ''}
          onChange={(e) => handleAuthorChange(e.target.value)}
          placeholder="Filter by author name..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Active Filters
          </h4>
          <div className="flex flex-wrap gap-2">
            {filters.tools?.map(toolId => {
              const tool = ALL_TOOLS.find(t => t.id === toolId);
              return tool ? (
                <span
                  key={toolId}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded text-xs"
                >
                  <span>{tool.icon}</span>
                  {tool.name}
                  <button
                    onClick={() => handleToolToggle(toolId)}
                    className="ml-1 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ) : null;
            })}
            
            {filters.contentTypes?.map(type => {
              const contentType = contentTypes.find(t => t.value === type);
              return contentType ? (
                <span
                  key={type}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-xs"
                >
                  <span>{contentType.icon}</span>
                  {contentType.label}
                  <button
                    onClick={() => handleContentTypeToggle(type)}
                    className="ml-1 hover:text-green-600 dark:hover:text-green-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ) : null;
            })}
            
            {filters.dateRange && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded text-xs">
                <Calendar className="h-3 w-3" />
                Date Range
                <button
                  onClick={() => {
                    setDateRange({ start: '', end: '' });
                    onFiltersChange({ ...filters, dateRange: undefined });
                  }}
                  className="ml-1 hover:text-purple-600 dark:hover:text-purple-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {filters.author && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded text-xs">
                <User className="h-3 w-3" />
                {filters.author}
                <button
                  onClick={() => handleAuthorChange('')}
                  className="ml-1 hover:text-orange-600 dark:hover:text-orange-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
