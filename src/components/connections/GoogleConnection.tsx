'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader2, Mail, Calendar, HardDrive, FileSpreadsheet, Video } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { googleAuth } from '@/services/googleAuth';
import { gmailService } from '@/services/gmailService';
import { calendarService } from '@/services/calendarService';
import { driveService } from '@/services/driveService';
import { GoogleCredentials } from '@/types';

interface GoogleConnectionProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionComplete: (success: boolean) => void;
}

interface ServiceStatus {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: 'pending' | 'testing' | 'connected' | 'failed';
  error?: string;
}

export function GoogleConnection({ isOpen, onClose, onConnectionComplete }: GoogleConnectionProps) {
  const [step, setStep] = useState<'auth' | 'testing' | 'complete' | 'error'>('auth');
  const [credentials, setCredentials] = useState<GoogleCredentials | null>(null);
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      id: 'gmail',
      name: 'Gmail',
      icon: <Mail className="h-4 w-4" />,
      status: 'pending'
    },
    {
      id: 'calendar',
      name: 'Google Calendar',
      icon: <Calendar className="h-4 w-4" />,
      status: 'pending'
    },
    {
      id: 'drive',
      name: 'Google Drive',
      icon: <HardDrive className="h-4 w-4" />,
      status: 'pending'
    },
    {
      id: 'sheets',
      name: 'Google Sheets',
      icon: <FileSpreadsheet className="h-4 w-4" />,
      status: 'pending'
    },
    {
      id: 'meet',
      name: 'Google Meet',
      icon: <Video className="h-4 w-4" />,
      status: 'pending'
    }
  ]);

  useEffect(() => {
    // Check if already authenticated
    const existingCredentials = googleAuth.getCredentials();
    if (existingCredentials && googleAuth.isSignedIn()) {
      setCredentials(existingCredentials);
      setStep('testing');
      testServices();
    }
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setStep('testing');
      const creds = await googleAuth.signIn();
      setCredentials(creds);
      await testServices();
    } catch (error) {
      console.error('Google sign-in failed:', error);
      setStep('error');
    }
  };

  const testServices = async () => {
    const serviceTests = [
      {
        id: 'gmail',
        test: async () => {
          const messages = await gmailService.getMessages('', 5);
          return messages.length >= 0; // Even 0 messages is a successful connection
        }
      },
      {
        id: 'calendar',
        test: async () => {
          const events = await calendarService.getEvents();
          return events.length >= 0;
        }
      },
      {
        id: 'drive',
        test: async () => {
          const files = await driveService.getFiles('', 5);
          return files.length >= 0;
        }
      },
      {
        id: 'sheets',
        test: async () => {
          // For sheets, we'll just test if we can access Drive (sheets are Drive files)
          const files = await driveService.getFiles("mimeType='application/vnd.google-apps.spreadsheet'", 5);
          return files.length >= 0;
        }
      },
      {
        id: 'meet',
        test: async () => {
          // For Meet, we'll test calendar access since Meet links are in calendar events
          const events = await calendarService.getEvents();
          return events.length >= 0;
        }
      }
    ];

    for (const serviceTest of serviceTests) {
      // Update status to testing
      setServices(prev => prev.map(service =>
        service.id === serviceTest.id
          ? { ...service, status: 'testing' }
          : service
      ));

      try {
        const success = await serviceTest.test();
        
        setServices(prev => prev.map(service =>
          service.id === serviceTest.id
            ? { 
                ...service, 
                status: success ? 'connected' : 'failed',
                error: success ? undefined : 'Connection test failed'
              }
            : service
        ));

        // Add a small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        setServices(prev => prev.map(service =>
          service.id === serviceTest.id
            ? { 
                ...service, 
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            : service
        ));
      }
    }

    // Check if all services connected successfully
    const allConnected = services.every(service => service.status === 'connected');
    if (allConnected) {
      setStep('complete');
      onConnectionComplete(true);
    } else {
      setStep('complete'); // Still show complete even if some services failed
      onConnectionComplete(true);
    }
  };

  const handleDisconnect = async () => {
    try {
      await googleAuth.signOut();
      setCredentials(null);
      setServices(prev => prev.map(service => ({ ...service, status: 'pending' })));
      setStep('auth');
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'auth':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">G</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Connect to Google Services
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Connect your Google account to search across Gmail, Calendar, Drive, and more.
            </p>
            
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                Real Google Integration
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                This will connect to your actual Google account using OAuth 2.0 authentication.
              </p>
            </div>

            <div className="space-y-3 text-left">
              <h4 className="font-medium text-gray-900 dark:text-white">Services included:</h4>
              <div className="grid grid-cols-2 gap-2">
                {services.map(service => (
                  <div key={service.id} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    {service.icon}
                    {service.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'testing':
        return (
          <div className="py-8">
            <div className="text-center mb-6">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Testing Google Services
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Verifying access to your Google services...
              </p>
            </div>

            <div className="space-y-4">
              {services.map(service => (
                <div key={service.id} className="flex items-center gap-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    service.status === 'connected' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' :
                    service.status === 'testing' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' :
                    service.status === 'failed' ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300' :
                    'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                  }`}>
                    {service.status === 'testing' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : service.status === 'failed' ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : service.status === 'connected' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      service.icon
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {service.name}
                    </h4>
                    {service.error && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {service.error}
                      </p>
                    )}
                  </div>
                  
                  {service.status === 'connected' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {service.status === 'failed' && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'complete':
        const connectedCount = services.filter(s => s.status === 'connected').length;
        const failedCount = services.filter(s => s.status === 'failed').length;

        return (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Google Services Connected!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {connectedCount} of {services.length} services connected successfully
              {failedCount > 0 && ` (${failedCount} failed)`}
            </p>
            
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-700 dark:text-green-300">
                You can now search across your Google data from the main search interface.
              </p>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Connection Failed
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Unable to connect to Google services. Please try again.
            </p>
            
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-700 dark:text-red-300">
                Make sure you have a stable internet connection and try again.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderFooter = () => {
    switch (step) {
      case 'auth':
        return (
          <ModalFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleGoogleSignIn}>
              Connect Google Account
            </Button>
          </ModalFooter>
        );

      case 'testing':
        return (
          <ModalFooter>
            <Button variant="outline" disabled>
              Testing Services...
            </Button>
          </ModalFooter>
        );

      case 'complete':
        return (
          <ModalFooter>
            <Button variant="outline" onClick={handleDisconnect}>
              Disconnect
            </Button>
            <Button onClick={onClose}>
              Done
            </Button>
          </ModalFooter>
        );

      case 'error':
        return (
          <ModalFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => setStep('auth')}>
              Try Again
            </Button>
          </ModalFooter>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      showCloseButton={step !== 'testing'}
    >
      {renderContent()}
      {renderFooter()}
    </Modal>
  );
}
