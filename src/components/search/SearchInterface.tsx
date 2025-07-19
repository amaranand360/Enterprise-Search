'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Filter, SortAsc, Loader2, Lightbulb, Bot, Mic, TrendingUp, Clock, Zap, ArrowRight, ChevronDown, Cpu, Shield, BarChart3, ArrowUp, Calendar } from 'lucide-react';
import { useScrollAnimation, useStaggeredAnimation } from '@/hooks/useScrollAnimation';
import { ScrollToTop } from '@/components/ui/ScrollToTop';
import { SearchProcessing } from '@/components/ui/SearchProcessing';
import { AIResponseCard } from './AIResponseCard';
import { cn, debounce } from '@/lib/utils';
import { SearchResult, SearchQuery, SearchFilters, Tool } from '@/types';
import { generateDemoSearchResults } from '@/data/demo-data';
import { SearchResultCard } from './SearchResultCard';
import { SearchFilters as SearchFiltersComponent } from './SearchFilters';
import { SearchSuggestions } from './SearchSuggestions';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { IconRenderer } from '@/components/ui/IconRenderer';
import { ActionExecutor } from '@/components/actions/ActionExecutor';
import { parseQuery, explainQuery } from '@/lib/queryParser';
import { AIActionHandler } from '@/components/ai/AIActionHandler';
import { demoConnectorManager } from '@/services/demo/DemoConnectorManager';
import { CalendarAgentComponent } from '@/agents/calendar/CalendarAgentComponent';

// AI Models for demo purposes (UI only - always uses gpt-4o-mini)
const AI_MODELS = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Fast and efficient',
    icon: '⚡',
    color: '#10B981'
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Most capable',
    icon: '🧠',
    color: '#8B5CF6'
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'Balanced performance',
    icon: '🚀',
    color: '#3B82F6'
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    description: 'Anthropic AI',
    icon: '🎭',
    color: '#F59E0B'
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    description: 'Google AI',
    icon: '💎',
    color: '#EF4444'
  }
];

export function SearchInterface() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [parsedQuery, setParsedQuery] = useState<any>(null);
  const [showAIAction, setShowAIAction] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [searchStats, setSearchStats] = useState({
    totalSearches: 12483,
    growthPercentage: 12,
    responseTime: 0.8
  });
  const [showActionExecutor, setShowActionExecutor] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>('');
  const [showCalendarAgent, setShowCalendarAgent] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const { addToHistory, getRecentSearches, getPopularSearches } = useSearchHistory();

  // Scroll animations
  const { ref: statsRef, isVisible: statsVisible } = useScrollAnimation();
  const { ref: trendingRef, isVisible: trendingVisible } = useStaggeredAnimation(200);
  const { ref: actionsRef, isVisible: actionsVisible } = useStaggeredAnimation(400);
  const { ref: recentRef, isVisible: recentVisible } = useStaggeredAnimation(600);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string, searchFilters?: SearchFilters) => {
      if (searchQuery.trim().length < 2) {
        setResults([]);
        setParsedQuery(null);
        return;
      }

      setIsLoading(true);

      // Parse the query for natural language processing
      const parsed = parseQuery(searchQuery);
      setParsedQuery(parsed);

      // Check if this is an action query
      if (parsed.intent.type === 'action' && parsed.intent.confidence > 0.7) {
        setIsLoading(false);
        setShowAIAction(true);
        return;
      }

      // Merge parsed filters with manual filters
      const combinedFilters = {
        ...parsed.filters,
        ...searchFilters
      };

      // Search using demo connector manager (AI disabled for debugging)
      try {
        const allResults: SearchResult[] = [];

        // Use demo results for debounced search to avoid rate limiting

        // Get demo results
        const demoResults = await demoConnectorManager.searchAllConnectedTools({
          query: parsed.cleanQuery || searchQuery,
          maxResults: 15,
          contentTypes: combinedFilters.contentTypes,
          dateRange: combinedFilters.dateRange
        });

        // Combine with fallback demo results
        const fallbackResults = generateDemoSearchResults(parsed.cleanQuery || searchQuery, 5);
        allResults.push(...demoResults, ...fallbackResults);

        // Remove duplicates and sort by relevance (AI response first)
        const uniqueResults = allResults.filter((result, index, self) =>
          index === self.findIndex(r => r.id === result.id)
        );

        setResults(uniqueResults.sort((a, b) => {
          if (a.type === 'ai-response') return -1;
          if (b.type === 'ai-response') return 1;
          return b.relevanceScore - a.relevanceScore;
        }));
      } catch (error) {
        console.error('Search failed:', error);
        // Fallback to demo data
        const searchResults = generateDemoSearchResults(parsed.cleanQuery || searchQuery, 20);
        setResults(searchResults);
      }

      setIsLoading(false);

      // Add to search history
      addToHistory(searchQuery, results.length);
    }, 300), // Reduced debounce for debugging
    [addToHistory, selectedModel]
  );

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.trim()) {
      setShowSuggestions(true);
      setHasSearched(true);
    } else {
      setHasSearched(false);
    }
    debouncedSearch(value, filters);
  };

  // Handle suggestion/trending/recent clicks
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    setHasSearched(true);
    // Trigger immediate search with processing animation
    performSearch(suggestion);
  };

  // Handle quick action clicks - populate search input
  const handleQuickActionClick = (action: string) => {
    setQuery(action);
    setShowSuggestions(false);
    // Focus the search input after setting the query
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Perform search with AI-powered responses
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Check if this is a Quick Action
    const quickActions = [
      'Send a email to team',
      'Schedule meeting',
      'Generate report',
      'Create presentation',
      'Find similar documents'
    ];

    if (quickActions.includes(searchQuery)) {
      // This is a Quick Action - trigger the ActionExecutor
      setCurrentAction(searchQuery);
      setShowActionExecutor(true);
      return;
    }

    setIsLoading(true);
    setResults([]);

    try {
      let aiResult: SearchResult | null = null;

      // Try to call OpenAI API for intelligent response
      try {
        const aiResponse = await fetch('/api/openai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: 'You are an AI assistant for an enterprise search system. Provide helpful, accurate, and concise responses to user queries. If the query is about searching for documents, data, or information, provide guidance on how to find what they need.'
              },
              {
                role: 'user',
                content: searchQuery
              }
            ],
            model: 'gpt-4o-mini',
            max_tokens: 500,
            temperature: 0.7
          })
        });

        const aiData = await aiResponse.json();

        if (aiData.content && !aiData.error) {
          // Create AI response as a special search result
          const aiTool: Tool = {
            id: 'ai-assistant',
            name: 'AI Assistant',
            category: 'productivity',
            icon: Bot,
            color: '#3B82F6',
            isConnected: true,
            isDemo: false,
            connectionStatus: 'connected',
            description: 'AI-powered assistant using GPT-4o-mini',
            features: ['Natural Language Processing', 'Smart Responses', 'Query Understanding']
          };

          aiResult = {
            id: 'ai-response',
            title: 'AI Assistant Response',
            content: aiData.content,
            tool: aiTool,
            type: 'ai-response',
            url: '#',
            timestamp: new Date(),
            relevanceScore: 1.0,
            author: 'AI Assistant',
            metadata: {
              model: 'gpt-4o-mini', // Always use this model regardless of UI selection
              selectedModel: selectedModel, // Show what user selected in UI
              usage: aiData.usage
            }
          };
        }
      } catch (aiError) {
        console.error('AI API call failed:', aiError);
      }

      // Always generate demo results
      const demoResults = generateDemoSearchResults(searchQuery, aiResult ? 5 : 10);

      // Combine AI response with demo results (if AI succeeded)
      const finalResults = aiResult ? [aiResult, ...demoResults] : demoResults;
      setResults(finalResults);



      // Parse the query for natural language processing
      const parsed = parseQuery(searchQuery);
      setParsedQuery(parsed);

      // Add to search history
      addToHistory(searchQuery, finalResults.length);
    } catch (error) {
      console.error('Search failed completely:', error);
      // Always provide fallback demo results
      const searchResults = generateDemoSearchResults(searchQuery, 10);
      setResults(searchResults);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    handleSuggestionClick(suggestion);
    searchInputRef.current?.focus();
  };

  const handleInputFocus = () => {
    if (query.trim() || results.length === 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
    }, 300);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showSuggestions) {
      e.preventDefault();
      setHasSearched(true);
      performSearch(query);
    }
  };

  // Close suggestions and model dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setShowModelDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Trending searches data
  const trendingSearches = [
    { query: 'Q4 budget planning', count: 145 },
    { query: 'Team performance metrics', count: 89 },
    { query: 'Product roadmap 2025', count: 73 },
    { query: 'Marketing campaign analysis', count: 62 }
  ];

  // Suggested actions data
  const suggestedActions = [
    'Create presentation from last meeting notes',
    'Schedule weekly team sync',
    'Generate expense report',
    'Find similar documents to current project',
    'Summarize email thread from yesterday'
  ];

  // Recent actions data
  const recentActions = [
    {
      id: 1,
      action: 'Created "Project Roadmap" presentation',
      user: 'Sarah Johnson',
      time: '2 minutes ago',
      status: 'completed',
      icon: '📊'
    },
    {
      id: 2,
      action: 'Scheduled team meeting for next week',
      user: 'Mike Chen',
      time: '5 minutes ago',
      status: 'completed',
      icon: '📅'
    }
  ];

  if (!hasSearched) {
    // Homepage/Dashboard view
    return (
      <div className="flex-1 bg-gray-900 transition-colors duration-200 overflow-y-auto">
        {/* Hero Section */}
        <div className="border-b border-gray-700 transition-colors duration-200 sticky top-0 z-10 backdrop-blur-sm bg-gray-800/95">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <div
              className="text-center mb-6 cursor-pointer hover:opacity-80 transition-opacity duration-200"
              onClick={() => {
                // Reset to homepage state
                setQuery('');
                setResults([]);
                setHasSearched(false);
                setShowSuggestions(false);
                setIsLoading(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4 transition-all duration-200 animate-fade-in">
                AI-Powered Enterprise Search
              </h1>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto transition-colors duration-200 animate-fade-in-delay">
                Search anything, Ask anything
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && query.trim()) {
                      setShowSuggestions(false);
                      performSearch(query);
                    }
                  }}
                  placeholder="Search anything or ask AI to help..."
                  className="w-full pl-12 pr-48 py-4 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-lg hover:shadow-xl transition-all duration-200 focus:shadow-xl"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (query.trim()) {
                        setShowSuggestions(false);
                        setHasSearched(true);
                        performSearch(query);
                      }
                    }}
                    title="Search"
                    className="w-8 h-8 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-600"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>

                  {/* AI Model Selector */}
                  <div className="relative">
                    <button
                      onClick={() => setShowModelDropdown(!showModelDropdown)}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 border border-gray-300 dark:border-gray-600"
                    >
                      <span className="text-lg">{AI_MODELS.find(m => m.id === selectedModel)?.icon}</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                        {AI_MODELS.find(m => m.id === selectedModel)?.name}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </button>

                    {/* Dropdown */}
                    {showModelDropdown && (
                      <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                        <div className="p-2">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                            AI Models (Demo UI Only)
                          </div>
                          {AI_MODELS.map((model) => (
                            <button
                              key={model.id}
                              onClick={() => {
                                setSelectedModel(model.id);
                                setShowModelDropdown(false);
                              }}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                                selectedModel === model.id
                                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              <span className="text-lg">{model.icon}</span>
                              <div className="flex-1 text-left">
                                <div className="text-sm font-medium">{model.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{model.description}</div>
                              </div>
                              {selectedModel === model.id && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
               
                </div>
              </div>

              {/* Search Suggestions */}
              <SearchSuggestions
                query={query}
                isVisible={showSuggestions}
                onSuggestionSelect={handleSuggestionSelect}
                onClose={() => setShowSuggestions(false)}
              />
            </div>
          </div>
        </div>

        {/* Quick Suggestions Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {/* Recent Searches */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Recent</h3>
              </div>
              <div className="space-y-2">
                {[
                  'Q4 budget planning',
                  'Team performance metrics',
                  'Product roadmap 2025',
                  'Marketing campaign analysis',
                  'Client feedback from yesterday'
                ].map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(item)}
                    className="w-full text-left text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Trending Searches */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Trending</h3>
              </div>
              <div className="space-y-2">
                {[
                  'Marketing campaign analysis',
                  'Client feedback review',
                  'Weekly team sync',
                  'Quarterly budget planning',
                  'Product roadmap 2025'
                ].map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(item)}
                    className="w-full text-left text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-blue-500" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Quick Actions</h3>
              </div>
              <div className="space-y-2">
                {[
                  'Send a email to team',
                  'Schedule meeting',
                  'Generate report',
                  'Create presentation',
                  'Find similar documents'
                ].map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickActionClick(item)}
                    className="w-full text-left text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 animate-slide-up">
            {/* Left Column - Trending & Stats */}
            <div className="md:col-span-1 space-y-6 lg:space-y-8">
              {/* Search Stats */}
              <div
                ref={statsRef}
                className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-200 group ${
                  statsVisible ? 'animate-fade-in' : 'opacity-0'
                }`}
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 transition-colors duration-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">Total Searches</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {searchStats.totalSearches.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                      <TrendingUp className="h-4 w-4" />
                      +{searchStats.growthPercentage}% vs last month
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Avg Response Time</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-white">{searchStats.responseTime}s</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trending Searches */}
              <div
                ref={trendingRef}
                className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-200 group ${
                  trendingVisible ? 'animate-fade-in' : 'opacity-0'
                }`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-orange-500 dark:text-orange-400 group-hover:scale-110 transition-transform duration-200" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-200 group-hover:text-orange-600 dark:group-hover:text-orange-400">Trending</h3>
                </div>
                <div className="space-y-3">
                  {trendingSearches.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-all duration-200 group"
                      onClick={() => handleSuggestionClick(item.query)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-200">
                          {index + 1}
                        </div>
                        <span className="text-gray-900 dark:text-white text-sm transition-colors duration-200">{item.query}</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Suggested Actions & Recent Activity */}
            <div className="md:col-span-1 lg:col-span-2 space-y-6 lg:space-y-8">
              {/* Suggested Actions */}
              <div
                ref={actionsRef}
                className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-200 group ${
                  actionsVisible ? 'animate-fade-in' : 'opacity-0'
                }`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-5 w-5 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">Suggested Actions</h3>
                </div>
                <div className="space-y-2">
                  {suggestedActions.map((action, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-all duration-200 group"
                      onClick={() => handleSuggestionClick(action)}
                    >
                      <Zap className="h-4 w-4 text-blue-500 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors duration-200" />
                      <span className="text-gray-900 dark:text-white text-sm flex-1 transition-colors duration-200">{action}</span>
                      <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Actions */}
              <div
                ref={recentRef}
                className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-200 group ${
                  recentVisible ? 'animate-fade-in' : 'opacity-0'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-200 group-hover:text-purple-600 dark:group-hover:text-purple-400">Recent Actions</h3>
                  <button 
                    aria-label="View all recent actions"
                    title="View all recent actions"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200 hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  {recentActions.map((action) => (
                    <div key={action.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 group">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-colors duration-200">
                        {action.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate transition-colors duration-200">
                          {action.action}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">
                          by {action.user} • {action.time}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 transition-colors duration-200">
                          Completed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Content for Better Scrolling */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Discover what makes our enterprise search solution the best choice for your organization
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
            {[
              {
                icon: '🚀',
                title: 'Lightning Fast',
                description: 'Get results in milliseconds with our advanced indexing technology'
              },
              {
                icon: Shield,
                title: 'Enterprise Security',
                description: 'Bank-level security with role-based access controls'
              },
              {
                icon: Bot,
                title: 'AI-Powered',
                description: 'Smart suggestions and natural language understanding'
              },
              {
                icon: BarChart3,
                title: 'Analytics',
                description: 'Detailed insights into search patterns and usage'
              },
              {
                icon: '🔗',
                title: 'Integrations',
                description: 'Connect with 100+ popular business applications'
              },
              {
                icon: '📱',
                title: 'Mobile Ready',
                description: 'Optimized experience across all devices'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-200 group"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200">
                  <IconRenderer icon={feature.icon} size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

     

        {/* Scroll to Top Button */}
        <ScrollToTop />
      </div>
    );
  }

  // Search Results view
  return (
    <div className="flex flex-col h-full transition-colors duration-200">
      {/* Search Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
        <div className="max-w-4xl mx-auto">
          {/* Search Bar */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={handleKeyPress}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder="Search anything..."
              className="block w-full pl-10 pr-20 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
            />

            {/* Search Button */}
            <div className="absolute inset-y-0 right-0 flex items-center">
              {isLoading ? (
                <div className="pr-3">
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (query.trim()) {
                      setShowSuggestions(false);
                      setHasSearched(true);
                      performSearch(query);
                    }
                  }}
                  title="Search"
                  aria-label="Search"
                  className="mr-2 w-8 h-8 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-600"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Search Suggestions */}
            <SearchSuggestions
              query={query}
              isVisible={showSuggestions}
              onSuggestionSelect={handleSuggestionSelect}
              onClose={() => setShowSuggestions(false)}
            />
          </div>

          {/* Query Explanation */}
          {parsedQuery && parsedQuery.cleanQuery !== parsedQuery.originalQuery && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <Lightbulb className="h-4 w-4" />
                <span className="text-sm font-medium">Query interpreted as:</span>
                <span className="text-sm">{explainQuery(parsedQuery)}</span>
              </div>
            </div>
          )}

          {/* Search Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  showFilters
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
              
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <SortAsc className="h-4 w-4" />
                Sort by Relevance
              </button>

              {parsedQuery && parsedQuery.intent.type === 'action' && (
                <button
                  onClick={() => setShowAIAction(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <Bot className="h-4 w-4" />
                  Execute Action
                </button>
              )}

              <button
                onClick={() => setShowCalendarAgent(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              >
                <Calendar className="h-4 w-4" />
                Calendar Agent
              </button>
            </div>

            {results.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {results.length} results found
              </p>
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <SearchFiltersComponent
                filters={filters}
                onFiltersChange={(newFilters) => {
                  setFilters(newFilters);
                  if (query.trim()) {
                    debouncedSearch(query, newFilters);
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          {query.length === 0 ? (
            <SearchEmptyState />
          ) : isLoading ? (
            <SearchLoadingState />
          ) : results.length === 0 ? (
            <SearchNoResults query={query} />
          ) : (
            <div className="space-y-4">
              {results.map((result) => (
                result.type === 'ai-response' ? (
                  <AIResponseCard key={result.id} result={result} />
                ) : (
                  <SearchResultCard key={result.id} result={result} query={query} />
                )
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Action Handler */}
      {parsedQuery && (
        <AIActionHandler
          isOpen={showAIAction}
          onClose={() => setShowAIAction(false)}
          parsedQuery={parsedQuery}
        />
      )}

      {/* Action Executor - Shows step-by-step execution for Quick Actions */}
      <ActionExecutor
        action={currentAction}
        isVisible={showActionExecutor}
        onClose={() => setShowActionExecutor(false)}
        onNewSearch={() => {
          // Close action executor and focus on search input
          setShowActionExecutor(false);
          setQuery('');
          setResults([]);
          setHasSearched(false);
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }}
        onBackToHome={() => {
          // Close action executor and reset to homepage
          setShowActionExecutor(false);
          setQuery('');
          setResults([]);
          setHasSearched(false);
          setShowSuggestions(false);
          setIsLoading(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Calendar Agent */}
      <CalendarAgentComponent
        isOpen={showCalendarAgent}
        onClose={() => setShowCalendarAgent(false)}
      />
    </div>
  );
}

function SearchEmptyState() {
  const suggestions = [
    'project alpha status',
    'meeting notes from last week',
    'budget review documents',
    'team standup summary',
    'client feedback'
  ];

  return (
    <div className="text-center py-12">
      <Search className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
      <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
        Search across all your tools
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
        Find emails, documents, messages, tasks, and more from all your connected tools in one place.
      </p>
      
      <div className="max-w-md mx-auto">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Try searching for:
        </h4>
        <div className="flex flex-wrap gap-2 justify-center">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchLoadingState() {
  return <SearchProcessing />;
}

function SearchNoResults({ query }: { query: string }) {
  return (
    <div className="text-center py-12">
      <div className="h-16 w-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
        <Search className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
        No results found for "{query}"
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Try adjusting your search terms or connecting more tools to expand your search scope.
      </p>
      
      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
        <p>Suggestions:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Check your spelling</li>
          <li>Try different keywords</li>
          <li>Use broader search terms</li>
          <li>Connect more tools to search across</li>
        </ul>
      </div>
    </div>
  );
}
