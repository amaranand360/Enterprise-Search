'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { SearchResult } from '@/types';

interface AISearchContextType {
  isAIProcessing: boolean;
  aiSummary: string | null;
  aiSuggestions: string[];
  enhanceSearchWithAI: (query: string, results: SearchResult[]) => Promise<void>;
  generateAIResponse: (query: string) => Promise<string>;
  clearAIResults: () => void;
  usageCount: number;
  dailyLimit: number;
}

const AISearchContext = createContext<AISearchContextType | undefined>(undefined);

export function AISearchProvider({ children }: { children: ReactNode }) {
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiSummary, setAISummary] = useState<string | null>(null);
  const [aiSuggestions, setAISuggestions] = useState<string[]>([]);
  const [usageCount, setUsageCount] = useState(0);
  const dailyLimit = 20; // Conservative limit for free tier

  // Check if we've hit daily limit
  const checkUsageLimit = useCallback(() => {
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('ai-usage-date');
    const storedCount = parseInt(localStorage.getItem('ai-usage-count') || '0');

    if (storedDate !== today) {
      // Reset count for new day
      localStorage.setItem('ai-usage-date', today);
      localStorage.setItem('ai-usage-count', '0');
      setUsageCount(0);
      return true;
    }

    setUsageCount(storedCount);
    return storedCount < dailyLimit;
  }, [dailyLimit]);

  // Increment usage count
  const incrementUsage = useCallback(() => {
    const newCount = usageCount + 1;
    setUsageCount(newCount);
    localStorage.setItem('ai-usage-count', newCount.toString());
  }, [usageCount]);

  // Optimized API call for free tier
  const callOpenAI = useCallback(async (prompt: string, systemPrompt: string = "You are a helpful assistant.") => {
    if (!checkUsageLimit()) {
      throw new Error(`Daily AI usage limit (${dailyLimit}) reached. Try again tomorrow.`);
    }

    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          max_tokens: 150, // Keep responses short for free tier
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const data = await response.json();
      incrementUsage();
      return data.content;
    } catch (error: any) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  }, [checkUsageLimit, incrementUsage, dailyLimit]);

  // Simplified AI enhancement for free tier
  const enhanceSearchWithAI = useCallback(async (query: string, results: SearchResult[]) => {
    setIsAIProcessing(true);
    
    try {
      // Only process top 3 results to save tokens
      const topResults = results.slice(0, 3).map(r => 
        `${r.title}: ${r.content.substring(0, 100)}...`
      ).join('\n');
      
      const prompt = `Summarize these search results for "${query}" in 2-3 sentences and suggest 2 follow-up questions:\n\n${topResults}`;
      
      const systemPrompt = "Provide a brief summary and exactly 2 follow-up questions. Keep response under 100 words.";
      
      const aiResponse = await callOpenAI(prompt, systemPrompt);
      
      if (aiResponse) {
        // Simple parsing for free tier
        const lines = aiResponse.split('\n').filter((line: string) => line.trim());
        const summaryLines = lines.filter((line: string) => !line.includes('?'));
        const questionLines = lines.filter((line: string) => line.includes('?'));
        
        setAISummary(summaryLines.join(' '));
        setAISuggestions(questionLines.slice(0, 2));
      }
    } catch (error: any) {
      console.error('Error enhancing search with AI:', error);
      setAISummary(`AI enhancement failed: ${error.message}`);
      setAISuggestions([]);
    } finally {
      setIsAIProcessing(false);
    }
  }, [callOpenAI]);

  // Simple AI response for free tier
  const generateAIResponse = useCallback(async (query: string) => {
    setIsAIProcessing(true);
    
    try {
      const systemPrompt = "Answer briefly in 2-3 sentences. Keep under 50 words.";
      const aiResponse = await callOpenAI(query, systemPrompt);
      return aiResponse || "I couldn't generate a response at this time.";
    } catch (error: any) {
      console.error('Error generating AI response:', error);
      return `AI Error: ${error.message}`;
    } finally {
      setIsAIProcessing(false);
    }
  }, [callOpenAI]);

  const clearAIResults = useCallback(() => {
    setAISummary(null);
    setAISuggestions([]);
  }, []);

  return (
    <AISearchContext.Provider
      value={{
        isAIProcessing,
        aiSummary,
        aiSuggestions,
        enhanceSearchWithAI,
        generateAIResponse,
        clearAIResults,
        usageCount,
        dailyLimit,
      }}
    >
      {children}
    </AISearchContext.Provider>
  );
}

export const useAISearch = () => {
  const context = useContext(AISearchContext);
  if (context === undefined) {
    throw new Error('useAISearch must be used within an AISearchProvider');
  }
  return context;
};