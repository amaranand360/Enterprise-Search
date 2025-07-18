'use client';

import { useState, useEffect } from 'react';

const SEARCH_HISTORY_KEY = 'enterprise-search-history';
const MAX_HISTORY_ITEMS = 50;

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: Date;
  resultsCount: number;
}

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const historyWithDates = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setHistory(historyWithDates);
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }, [history]);

  const addToHistory = (query: string, resultsCount: number) => {
    if (!query.trim()) return;

    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      query: query.trim(),
      timestamp: new Date(),
      resultsCount
    };

    setHistory(prev => {
      // Remove any existing entry with the same query
      const filtered = prev.filter(item => 
        item.query.toLowerCase() !== query.toLowerCase()
      );
      
      // Add new item at the beginning
      const updated = [newItem, ...filtered];
      
      // Keep only the most recent items
      return updated.slice(0, MAX_HISTORY_ITEMS);
    });
  };

  const removeFromHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const getRecentSearches = (limit: number = 10) => {
    return history.slice(0, limit);
  };

  const getPopularSearches = (limit: number = 10) => {
    // Group by query and count occurrences
    const queryCount = history.reduce((acc, item) => {
      const query = item.query.toLowerCase();
      acc[query] = (acc[query] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Sort by count and return top queries
    return Object.entries(queryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([query]) => query);
  };

  const searchHistory = (searchTerm: string) => {
    if (!searchTerm.trim()) return [];
    
    return history.filter(item =>
      item.query.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getRecentSearches,
    getPopularSearches,
    searchHistory
  };
}
