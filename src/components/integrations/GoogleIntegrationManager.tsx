'use client';

import { useState, useEffect } from 'react';
import { Calendar, Mail, CheckCircle, AlertCircle, Loader2, Settings, RefreshCw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { googleAuth } from '@/services/googleAuth';
import { gmailService } from '@/services/gmailService';
import { calendarService } from '@/services/calendarService';
import { connectionStatusService } from '@/services/ConnectionStatusService';
import { GoogleCredentials, GmailMessage, CalendarEvent } from '@/types';

interface GoogleIntegrationManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionComplete: (success: boolean) => void;
}

interface ServiceStatus {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: 'connected' | 'disconnected' | 'testing' | 'error';
  lastSync?: Date;
  error?: string;
  data?: any;
}

export function GoogleIntegrationManager({ isOpen, onClose, onConnectionComplete }: GoogleIntegrationManagerProps) {
  const [credentials, setCredentials] = useState<GoogleCredentials | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      id: 'gmail',
      name: 'Gmail',
      icon: <Mail className="h-4 w-4" />,
      status: 'disconnected'
    },
    {
      id: 'calendar',
      name: 'Google Calendar',
      icon: <Calendar className="h-4 w-4" />,
      status: 'disconnected'
    }
  ]);

  useEffect(() => {
    if (isOpen) {
      checkExistingConnection();
    }
  }, [isOpen]);

  const checkExistingConnection = async () => {
    try {
      const existingCredentials = googleAuth.getCredentials();
      if (existingCredentials && googleAuth.isSignedIn()) {
        setCredentials(existingCredentials);
        await testAllServices();
      }
    } catch (error) {
      console.error('Failed to check existing connection:', error);
    }
  };

  const handleGoogleConnect = async () => {
    setIsConnecting(true);
    try {
      const creds = await googleAuth.signIn();
      setCredentials(creds);
      await testAllServices();
      
      // Update connection status in the main system
      await connectionStatusService.connectTool('gmail');
      await connectionStatusService.connectTool('google-calendar');
      
      onConnectionComplete(true);
    } catch (error) {
      console.error('Google connection failed:', error);
      updateServiceStatus('gmail', 'error', undefined, error instanceof Error ? error.message : 'Connection failed');
      updateServiceStatus('calendar', 'error', undefined, error instanceof Error ? error.message : 'Connection failed');
      onConnectionComplete(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const testAllServices = async () => {
    const serviceTests = [
      {
        id: 'gmail',
        test: async () => {
          updateServiceStatus('gmail', 'testing');
          const messages = await gmailService.getMessages('', 5);
          const labels = await gmailService.getLabels();
          return { messages: messages.length, labels: labels.length };
        }
      },
      {
        id: 'calendar',
        test: async () => {
          updateServiceStatus('calendar', 'testing');
          const events = await calendarService.getEvents();
          const calendars = await calendarService.getCalendars();
          return { events: events.length, calendars: calendars.length };
        }
      }
    ];

    for (const serviceTest of serviceTests) {
      try {
        const data = await serviceTest.test();
        updateServiceStatus(serviceTest.id, 'connected', new Date(), undefined, data);
      } catch (error) {
        console.error(`${serviceTest.id} test failed:`, error);
        updateServiceStatus(serviceTest.id, 'error', undefined, error instanceof Error ? error.message : 'Test failed');
      }
    }
  };

  const updateServiceStatus = (
    serviceId: string, 
    status: ServiceStatus['status'], 
    lastSync?: Date, 
    error?: string,
    data?: any
  ) => {
    setServices(prev => prev.map(service => 
      service.id === serviceId 
        ? { ...service, status, lastSync, error, data }
        : service
    ));
  };

  const handleDisconnect = async () => {
    try {
      await googleAuth.signOut();
      setCredentials(null);
      setServices(prev => prev.map(service => ({
        ...service,
        status: 'disconnected' as const,
        lastSync: undefined,
        error: undefined,
        data: undefined
      })));
      
      // Update connection status in the main system
      await connectionStatusService.disconnectTool('gmail');
      await connectionStatusService.disconnectTool('google-calendar');
      
      onConnectionComplete(false);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const handleRefreshService = async (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    try {
      updateServiceStatus(serviceId, 'testing');
      
      if (serviceId === 'gmail') {
        const messages = await gmailService.getMessages('', 5);
        const labels = await gmailService.getLabels();
        updateServiceStatus(serviceId, 'connected', new Date(), undefined, { messages: messages.length, labels: labels.length });
      } else if (serviceId === 'calendar') {
        const events = await calendarService.getEvents();
        const calendars = await calendarService.getCalendars();
        updateServiceStatus(serviceId, 'connected', new Date(), undefined, { events: events.length, calendars: calendars.length });
      }
    } catch (error) {
      console.error(`Failed to refresh ${serviceId}:`, error);
      updateServiceStatus(serviceId, 'error', undefined, error instanceof Error ? error.message : 'Refresh failed');
    }
  };

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'testing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (service: ServiceStatus) => {
    switch (service.status) {
      case 'connected':
        return `Connected${service.lastSync ? ` • Last sync: ${service.lastSync.toLocaleTimeString()}` : ''}`;
      case 'testing':
        return 'Testing connection...';
      case 'error':
        return `Error: ${service.error}`;
      default:
        return 'Not connected';
    }
  };

  const isConnected = credentials && googleAuth.isSignedIn();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Google Integration">
      <div className="space-y-6">
        {/* Connection Status */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Google Account Connection
            </h3>
            {isConnected && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                className="text-red-600 hover:text-red-700"
              >
                Disconnect
              </Button>
            )}
          </div>
          
          {!isConnected ? (
            <div className="text-center py-6">
              <div className="mb-4">
                <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Connect Your Google Account
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Connect your Google account to access Gmail and Calendar data
              </p>
              <Button
                onClick={handleGoogleConnect}
                disabled={isConnecting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Connect Google Account
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-700 dark:text-green-400 font-medium">
                  Google account connected successfully
                </span>
              </div>
              
              {/* Service Status */}
              <div className="space-y-3">
                {services.map(service => (
                  <div key={service.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                      {service.icon}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {service.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {getStatusText(service)}
                        </p>
                        {service.data && service.status === 'connected' && (
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {service.id === 'gmail' && `${service.data.messages} messages, ${service.data.labels} labels`}
                            {service.id === 'calendar' && `${service.data.events} events, ${service.data.calendars} calendars`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(service.status)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRefreshService(service.id)}
                        disabled={service.status === 'testing'}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {isConnected && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => window.open('https://mail.google.com', '_blank')}
                className="justify-start"
              >
                <Mail className="h-4 w-4 mr-2" />
                Open Gmail
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open('https://calendar.google.com', '_blank')}
                className="justify-start"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Open Calendar
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
