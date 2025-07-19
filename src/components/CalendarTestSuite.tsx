'use client';

import { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { googleAuth } from '@/services/googleAuth';
import { clientGoogleCalendar } from '@/services/clientGoogleCalendar';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  duration?: number;
}

export function CalendarTestSuite() {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const tests = [
    {
      name: 'Google Auth Initialization',
      test: async () => {
        await googleAuth.initialize();
        return { success: true, message: 'Google Auth initialized successfully' };
      }
    },
    {
      name: 'Google Sign-in',
      test: async () => {
        const credentials = await googleAuth.signIn();
        setIsAuthenticated(true);
        return { success: true, message: `Signed in successfully. Access token: ${credentials.access_token.substring(0, 20)}...` };
      }
    },
    {
      name: 'Create Test Event',
      test: async () => {
        const testEvent = {
          summary: '🤖 Calendar Agent Test Event',
          description: 'This is a test event created by the Calendar Agent to verify Google Calendar integration.',
          location: 'Virtual Meeting',
          start: {
            dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          attendees: [
            {
              email: 'test@example.com',
              displayName: 'Test Attendee'
            }
          ]
        };

        const createdEvent = await clientGoogleCalendar.createEvent(testEvent);
        return { 
          success: true, 
          message: `Event created successfully: "${createdEvent.summary}" (ID: ${createdEvent.id})`,
          eventId: createdEvent.id
        };
      }
    },
    {
      name: 'List Recent Events',
      test: async () => {
        const events = await clientGoogleCalendar.listEvents(
          new Date().toISOString(),
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next 7 days
          10
        );
        return { 
          success: true, 
          message: `Retrieved ${events.length} events from your calendar`,
          events
        };
      }
    },
    {
      name: 'Update Test Event',
      test: async (context: any) => {
        if (!context.eventId) {
          throw new Error('No event ID available from previous test');
        }

        const updatedEvent = await clientGoogleCalendar.updateEvent(context.eventId, {
          summary: '🤖 Calendar Agent Test Event (Updated)',
          description: 'This test event has been updated to verify the update functionality.'
        });

        return { 
          success: true, 
          message: `Event updated successfully: "${updatedEvent.summary}"`
        };
      }
    },
    {
      name: 'Get Free/Busy Information',
      test: async () => {
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const dayAfterTomorrow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
        
        const freeBusy = await clientGoogleCalendar.getFreeBusy(
          tomorrow.toISOString(),
          dayAfterTomorrow.toISOString()
        );

        const busySlots = freeBusy.calendars?.primary?.busy?.length || 0;
        return { 
          success: true, 
          message: `Free/busy data retrieved. Found ${busySlots} busy time slots`
        };
      }
    },
    {
      name: 'Delete Test Event',
      test: async (context: any) => {
        if (!context.eventId) {
          throw new Error('No event ID available from previous test');
        }

        await clientGoogleCalendar.deleteEvent(context.eventId);
        return { 
          success: true, 
          message: 'Test event deleted successfully'
        };
      }
    }
  ];

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    const results: TestResult[] = [];
    const context: any = {};

    for (const test of tests) {
      const testResult: TestResult = {
        test: test.name,
        status: 'pending',
        message: 'Running...'
      };
      
      results.push(testResult);
      setTestResults([...results]);

      const startTime = Date.now();
      
      try {
        const result = await test.test(context);
        const duration = Date.now() - startTime;
        
        testResult.status = 'success';
        testResult.message = result.message;
        testResult.duration = duration;
        
        // Store context for subsequent tests
        if ((result as any).eventId) {
          context.eventId = (result as any).eventId;
        }
        if ((result as any).events) {
          context.events = (result as any).events;
        }
        
      } catch (error) {
        const duration = Date.now() - startTime;
        testResult.status = 'error';
        testResult.message = error instanceof Error ? error.message : 'Unknown error';
        testResult.duration = duration;
      }
      
      setTestResults([...results]);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setIsRunning(false);
  };

  const checkAuthStatus = async () => {
    try {
      await googleAuth.initialize();
      const authStatus = googleAuth.isSignedIn();
      setIsAuthenticated(authStatus);
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'success':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Calendar Agent Test Suite
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Comprehensive testing for Google Calendar integration
            </p>
          </div>
        </div>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-medium text-gray-900 dark:text-white">
              Authentication Status: {isAuthenticated ? 'Signed In' : 'Not Signed In'}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isAuthenticated 
              ? 'You are authenticated with Google. Ready to run tests.' 
              : 'Please sign in with Google first using the Connections settings.'
            }
          </p>
        </div>

        <div className="flex gap-3 mb-6">
          <Button 
            onClick={runTests} 
            disabled={isRunning || !isAuthenticated}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4" />
            )}
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Button>
          
          <Button 
            onClick={checkAuthStatus}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Check Auth Status
          </Button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Test Results
            </h2>
            
            {testResults.map((result, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <span className="font-medium">{result.test}</span>
                  </div>
                  {result.duration && (
                    <span className="text-sm opacity-75">
                      {result.duration}ms
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm">{result.message}</p>
              </div>
            ))}
            
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                Test Summary
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {testResults.filter(r => r.status === 'success').length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Passed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {testResults.filter(r => r.status === 'error').length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {testResults.filter(r => r.status === 'pending').length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
