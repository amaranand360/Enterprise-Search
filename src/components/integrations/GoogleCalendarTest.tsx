'use client';

import { useState } from 'react';
import { Calendar, CheckCircle, AlertCircle, Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { googleAuth } from '@/services/googleAuth';
import { realCalendarService } from '@/services/realCalendarService';

interface GoogleCalendarTestProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  duration?: number;
}

export function GoogleCalendarTest({ isOpen, onClose }: GoogleCalendarTestProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Google Authentication Check', status: 'pending' },
    { name: 'Calendar Service Initialization', status: 'pending' },
    { name: 'Calendar List Access', status: 'pending' },
    { name: 'Create Test Event', status: 'pending' },
    { name: 'Fetch Today\'s Events', status: 'pending' }
  ]);

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, ...updates } : test
    ));
  };

  const runTests = async () => {
    setIsRunning(true);
    
    // Reset all tests
    setTests(prev => prev.map(test => ({ ...test, status: 'pending' as const })));

    try {
      // Test 1: Google Authentication Check
      updateTest(0, { status: 'running' });
      const startTime1 = Date.now();
      
      if (!googleAuth.isSignedIn()) {
        updateTest(0, { 
          status: 'error', 
          message: 'Not signed in to Google. Please authenticate first.',
          duration: Date.now() - startTime1
        });
        return;
      }

      const userInfo = googleAuth.getUserInfo();
      updateTest(0, { 
        status: 'success', 
        message: `Signed in as ${userInfo?.name || 'Unknown'} (${userInfo?.email || 'No email'})`,
        duration: Date.now() - startTime1
      });

      // Test 2: Calendar Service Initialization
      updateTest(1, { status: 'running' });
      const startTime2 = Date.now();
      
      const initSuccess = await realCalendarService.initialize();
      if (!initSuccess) {
        updateTest(1, { 
          status: 'error', 
          message: 'Failed to initialize Calendar service',
          duration: Date.now() - startTime2
        });
        return;
      }

      updateTest(1, { 
        status: 'success', 
        message: 'Calendar service initialized successfully',
        duration: Date.now() - startTime2
      });

      // Test 3: Calendar List Access
      updateTest(2, { status: 'running' });
      const startTime3 = Date.now();
      
      try {
        const calendars = await realCalendarService.getCalendars();
        updateTest(2, { 
          status: 'success', 
          message: `Found ${calendars.length} calendar(s)`,
          duration: Date.now() - startTime3
        });
      } catch (error) {
        updateTest(2, { 
          status: 'error', 
          message: `Failed to fetch calendars: ${error instanceof Error ? error.message : 'Unknown error'}`,
          duration: Date.now() - startTime3
        });
        return;
      }

      // Test 4: Create Test Event
      updateTest(3, { status: 'running' });
      const startTime4 = Date.now();
      
      try {
        const now = new Date();
        const start = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
        const end = new Date(now.getTime() + 90 * 60 * 1000); // 1.5 hours from now

        const testEvent = await realCalendarService.createEvent({
          title: 'Test Event - Enterprise Search',
          description: 'This is a test event created by the Enterprise Search Google Calendar integration.',
          start,
          end,
          location: 'Test Location',
          createMeetLink: true
        });

        if (testEvent) {
          updateTest(3, { 
            status: 'success', 
            message: `Test event created successfully (ID: ${testEvent.id})`,
            duration: Date.now() - startTime4
          });
        } else {
          updateTest(3, { 
            status: 'error', 
            message: 'Event creation returned null',
            duration: Date.now() - startTime4
          });
        }
      } catch (error) {
        updateTest(3, { 
          status: 'error', 
          message: `Failed to create test event: ${error instanceof Error ? error.message : 'Unknown error'}`,
          duration: Date.now() - startTime4
        });
      }

      // Test 5: Fetch Today's Events
      updateTest(4, { status: 'running' });
      const startTime5 = Date.now();
      
      try {
        const todaysEvents = await realCalendarService.getTodaysEvents();
        updateTest(4, { 
          status: 'success', 
          message: `Found ${todaysEvents.length} event(s) for today`,
          duration: Date.now() - startTime5
        });
      } catch (error) {
        updateTest(4, { 
          status: 'error', 
          message: `Failed to fetch today's events: ${error instanceof Error ? error.message : 'Unknown error'}`,
          duration: Date.now() - startTime5
        });
      }

    } catch (error) {
      console.error('Test suite error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return 'text-gray-500';
      case 'running':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Google Calendar Integration Test" size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Test Real Google Calendar Integration
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            This will test your actual Google Calendar connection and create a real test event.
          </p>
        </div>

        {/* Test Results */}
        <div className="space-y-3">
          {tests.map((test, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
            >
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon(test.status)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`font-medium ${getStatusColor(test.status)}`}>
                  {test.name}
                </h4>
                {test.message && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {test.message}
                  </p>
                )}
                {test.duration && (
                  <p className="text-xs text-gray-500 mt-1">
                    Completed in {test.duration}ms
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {googleAuth.isSignedIn() 
              ? `✅ Signed in as ${googleAuth.getUserInfo()?.email || 'Unknown'}`
              : '❌ Not signed in to Google'
            }
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isRunning}
            >
              Close
            </Button>
            <Button
              onClick={runTests}
              disabled={isRunning || !googleAuth.isSignedIn()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Tests
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                Real Integration Test
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                This test will create a real event in your Google Calendar. Make sure you're signed in with the correct Google account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
