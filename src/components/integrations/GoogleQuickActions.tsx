'use client';

import { useState } from 'react';
import { Calendar, Mail, Plus, Settings, Zap, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { GoogleServiceSelector } from './GoogleServiceSelector';
import { GoogleCalendarActions } from './GoogleCalendarActions';
import { GmailActions } from './GmailActions';
import { GoogleCalendarTest } from './GoogleCalendarTest';
import { googleAuth } from '@/services/googleAuth';
import { demoGoogleAuth } from '@/services/demoGoogleAuth';

// Use demo mode for now to avoid authentication issues
const USE_DEMO_MODE = false;
const authService = USE_DEMO_MODE ? demoGoogleAuth : googleAuth;

interface GoogleQuickActionsProps {
  onActionComplete?: (action: string, success: boolean) => void;
}

interface QuickAction {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  requiresAuth: boolean;
  action: () => void;
}

export function GoogleQuickActions({ onActionComplete }: GoogleQuickActionsProps) {
  const [showServiceSelector, setShowServiceSelector] = useState(false);
  const [showCalendarActions, setShowCalendarActions] = useState(false);
  const [showGmailActions, setShowGmailActions] = useState(false);
  const [showCalendarTest, setShowCalendarTest] = useState(false);
  const [connectedServices, setConnectedServices] = useState<string[]>([]);

  const isConnected = authService.isSignedIn();
  const hasGmailAccess = authService.hasServiceAccess('gmail');
  const hasCalendarAccess = authService.hasServiceAccess('calendar');

  const quickActions: QuickAction[] = [
    {
      id: 'setup-google',
      name: isConnected ? 'Manage Services' : 'Connect Google',
      description: isConnected ? 'Add or remove Google services' : 'Set up Gmail & Calendar integration',
      icon: <Settings className="h-5 w-5" />,
      color: 'bg-blue-500',
      requiresAuth: false,
      action: () => setShowServiceSelector(true)
    },
    {
      id: 'compose-email',
      name: 'Compose Email',
      description: hasGmailAccess ? 'Send a new email via Gmail' : 'Connect Gmail first',
      icon: <Mail className="h-5 w-5" />,
      color: 'bg-red-500',
      requiresAuth: true,
      action: () => hasGmailAccess ? setShowGmailActions(true) : setShowServiceSelector(true)
    },
    {
      id: 'create-event',
      name: 'Create Event',
      description: hasCalendarAccess ? 'Schedule a new calendar event' : 'Connect Calendar first',
      icon: <Calendar className="h-5 w-5" />,
      color: 'bg-green-500',
      requiresAuth: true,
      action: () => hasCalendarAccess ? setShowCalendarActions(true) : setShowServiceSelector(true)
    },
    {
      id: 'quick-meeting',
      name: 'Quick Meeting',
      description: hasCalendarAccess ? 'Schedule a 30-min meeting now' : 'Connect Calendar first',
      icon: <Clock className="h-5 w-5" />,
      color: 'bg-purple-500',
      requiresAuth: true,
      action: () => hasCalendarAccess ? handleQuickMeeting() : setShowServiceSelector(true)
    }
  ];

  const handleQuickMeeting = async () => {
    if (!hasCalendarAccess) {
      setShowServiceSelector(true);
      return;
    }

    try {
      // Import real calendar service
      const { realCalendarService } = await import('@/services/realCalendarService');

      const now = new Date();
      const start = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
      const end = new Date(now.getTime() + 35 * 60 * 1000); // 30 minutes duration

      const event = await realCalendarService.createEvent({
        title: 'Quick Meeting',
        description: 'Quick meeting scheduled via Enterprise Search',
        start,
        end,
        createMeetLink: true // Enable Google Meet link
      });

      if (event) {
        onActionComplete?.('quick-meeting', true);
        alert('Quick meeting scheduled successfully! Check your Google Calendar.');
      }
    } catch (error) {
      console.error('Failed to create quick meeting:', error);
      onActionComplete?.('quick-meeting', false);
      alert('Failed to schedule meeting. Please make sure you have Calendar access and try again.');
    }
  };

  const handleServicesConnected = (services: string[]) => {
    setConnectedServices(services);
    onActionComplete?.('google-services-connected', true);
    setShowServiceSelector(false);
  };

  const handleEmailSent = (success: boolean) => {
    onActionComplete?.('email-sent', success);
    if (success) {
      setShowGmailActions(false);
    }
  };

  const handleEventCreated = () => {
    onActionComplete?.('event-created', true);
    setShowCalendarActions(false);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Connection Status */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Google Services
            </h3>
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {isConnected ? 'Connected and ready to use' : 'Not connected - click to set up'}
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map(action => {
            const isDisabled = action.requiresAuth && !isConnected;
            
            return (
              <button
                key={action.id}
                onClick={action.action}
                disabled={isDisabled}
                className={`
                  p-3 rounded-lg text-left transition-all duration-200 border
                  ${isDisabled
                    ? 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 opacity-50 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-500 cursor-pointer'
                  }
                `}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg text-white ${action.color}`}>
                    {action.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {action.name}
                    </h4>
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {action.description}
                </p>
                {isDisabled && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                    Requires Google connection
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {/* Connected Services */}
        {isConnected && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Connected Services
            </h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className={`text-lg font-bold ${hasGmailAccess ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                  <Mail className="h-4 w-4 inline mr-1" />
                  Gmail
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {hasGmailAccess ? 'Connected' : 'Not connected'}
                </p>
              </div>
              <div>
                <div className={`text-lg font-bold ${hasCalendarAccess ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Calendar
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {hasCalendarAccess ? 'Connected' : 'Not connected'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Test Integration Button */}
        {isConnected && hasCalendarAccess && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-800 dark:text-green-300 font-medium">
                  Test Real Integration
                </p>
                <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                  Verify your Google Calendar connection is working
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setShowCalendarTest(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Test Calendar
              </Button>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-blue-800 dark:text-blue-300 font-medium">
                Pro Tip
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                {isConnected
                  ? 'Use quick actions to compose emails and schedule meetings instantly!'
                  : 'Connect your Google account to unlock powerful email and calendar features.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <GoogleServiceSelector
        isOpen={showServiceSelector}
        onClose={() => setShowServiceSelector(false)}
        onServicesConnected={handleServicesConnected}
      />

      <GoogleCalendarActions
        isOpen={showCalendarActions}
        onClose={() => setShowCalendarActions(false)}
        onEventCreated={handleEventCreated}
      />

      <GmailActions
        isOpen={showGmailActions}
        onClose={() => setShowGmailActions(false)}
        onEmailSent={handleEmailSent}
      />

      <GoogleCalendarTest
        isOpen={showCalendarTest}
        onClose={() => setShowCalendarTest(false)}
      />
    </>
  );
}
