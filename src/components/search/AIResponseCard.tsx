'use client';

import { SearchResult } from '@/types';
import { Bot, Copy, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface AIResponseCardProps {
  result: SearchResult;
}

export function AIResponseCard({ result }: AIResponseCardProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(type);
    // Here you could send feedback to your analytics
    console.log(`AI response feedback: ${type}`);
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 p-6 mb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
          <Bot className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Assistant
            </h3>
            <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
          </div>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            {result.metadata?.selectedModel ? (
              <>Powered by {result.metadata.selectedModel} <span className="text-xs opacity-75">(via GPT-4o-mini)</span></>
            ) : (
              'Powered by GPT-4o-mini'
            )}
          </p>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors"
            title="Copy response"
          >
            <Copy className={`h-4 w-4 ${copied ? 'text-green-600' : 'text-gray-500'}`} />
          </button>
          
          <button
            onClick={() => handleFeedback('up')}
            className={`p-2 rounded-lg transition-colors ${
              feedback === 'up' 
                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                : 'hover:bg-blue-100 dark:hover:bg-blue-800/50 text-gray-500'
            }`}
            title="Good response"
          >
            <ThumbsUp className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => handleFeedback('down')}
            className={`p-2 rounded-lg transition-colors ${
              feedback === 'down' 
                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                : 'hover:bg-blue-100 dark:hover:bg-blue-800/50 text-gray-500'
            }`}
            title="Poor response"
          >
            <ThumbsDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* AI Response Content */}
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <div className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
          {result.content}
        </div>
      </div>

      {/* Footer with metadata */}
      {result.metadata && (
        <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400">
            {result.metadata.usage && (
              <span>
                Tokens: {result.metadata.usage.prompt_tokens + result.metadata.usage.completion_tokens}
              </span>
            )}
            <span>Response time: ~2s</span>
          </div>
        </div>
      )}

      {/* Copy feedback */}
      {copied && (
        <div className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
          <Copy className="h-3 w-3" />
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}
