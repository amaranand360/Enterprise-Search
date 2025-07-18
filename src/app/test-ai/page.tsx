'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Loader2, Sparkles } from 'lucide-react';

export default function TestAIPage() {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testOpenAI = async () => {
    setLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/test-openai');
      const data = await res.json();

      if (data.success) {
        setResponse(data.content);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to test OpenAI API');
    } finally {
      setLoading(false);
    }
  };

  const testCustomQuery = async () => {
    setLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: 'Explain how enterprise search can improve productivity in 3 bullet points'
            }
          ],
          model: 'gpt-4o-mini',
          max_tokens: 300
        })
      });

      const data = await res.json();

      if (data.content) {
        setResponse(data.content);
      } else {
        setError(data.error || 'No response received');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to call OpenAI API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                OpenAI API Test
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Test your OpenAI API integration with gpt-4o-mini model
            </p>
          </div>

          <div className="space-y-6">
            {/* Test Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={testOpenAI}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Test Haiku Generation
              </Button>

              <Button
                onClick={testCustomQuery}
                disabled={loading}
                variant="secondary"
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Test Enterprise Search Query
              </Button>
            </div>

            {/* Response Display */}
            {(response || error) && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Response:
                </h3>
                <div className={`p-6 rounded-lg border-2 ${
                  error 
                    ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' 
                    : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                }`}>
                  <pre className={`whitespace-pre-wrap text-sm ${
                    error 
                      ? 'text-red-800 dark:text-red-200' 
                      : 'text-green-800 dark:text-green-200'
                  }`}>
                    {error || response}
                  </pre>
                </div>
              </div>
            )}

            {/* API Info */}
            <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                API Configuration
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Model: gpt-4o-mini (latest and most cost-effective)</li>
                <li>• API Key: Loaded from environment variables (secure)</li>
                <li>• Store: Enabled for better tracking</li>
                <li>• Max Tokens: Configurable per request</li>
              </ul>
            </div>

            {/* Back to Home */}
            <div className="text-center pt-6">
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
              >
                Back to Enterprise Search
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
