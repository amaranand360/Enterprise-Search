'use client';

import { Loader2, Search, Zap, Brain } from 'lucide-react';

export function SearchProcessing() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="relative mb-8">
        {/* Animated search icon */}
        <div className="relative">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <Search className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          
          {/* Spinning loader */}
          <div className="absolute inset-0">
            <Loader2 className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          
          {/* Pulsing rings */}
          <div className="absolute inset-0 animate-ping">
            <div className="w-16 h-16 border-2 border-blue-300 dark:border-blue-600 rounded-full opacity-20"></div>
          </div>
          <div className="absolute inset-0 animate-ping" style={{ animationDelay: '0.5s' }}>
            <div className="w-20 h-20 border-2 border-blue-200 dark:border-blue-700 rounded-full opacity-10 -m-2"></div>
          </div>
        </div>
      </div>

      {/* Processing steps */}
      <div className="text-center max-w-md">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Processing your search...
        </h3>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <Brain className="h-4 w-4 text-purple-500 animate-pulse" />
            <span>Analyzing your query with AI</span>
          </div>
          
          <div className="flex items-center justify-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <Search className="h-4 w-4 text-blue-500 animate-bounce" />
            <span>Searching across all connected tools</span>
          </div>
          
          <div className="flex items-center justify-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <Zap className="h-4 w-4 text-yellow-500 animate-pulse" />
            <span>Ranking and organizing results</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400">
          This usually takes a few seconds...
        </p>
      </div>
    </div>
  );
}
