'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader2, Mail, Calendar, HardDrive, FileSpreadsheet, User, Shield, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { googleAuth } from '@/services/googleAuth';
import { demoGoogleAuth } from '@/services/demoGoogleAuth';
import { GoogleCredentials } from '@/types';

// Use demo mode for now to avoid authentication issues
const USE_DEMO_MODE = false;
const authService = USE_DEMO_MODE ? demoGoogleAuth : googleAuth;

interface GoogleServiceSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onServicesConnected: (services: string[]) => void;
}

interface GoogleService {
  id: 'gmail' | 'calendar' | 'drive' | 'sheets';
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  permissions: string[];
  connected: boolean;
  connecting: boolean;
}

export function GoogleServiceSelector({ isOpen, onClose, onServicesConnected }: GoogleServiceSelectorProps) {
  const [step, setStep] = useState<'auth' | 'services' | 'complete'>('auth');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [credentials, setCredentials] = useState<GoogleCredentials | null>(null);
  const [services, setServices] = useState<GoogleService[]>([
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Access your emails, compose messages, and manage your inbox',
      icon: <Mail className="h-6 w-6" />,
      color: 'bg-red-500',
      permissions: ['Read emails', 'Send emails', 'Manage labels'],
      connected: false,
      connecting: false
    },
    {
      id: 'calendar',
      name: 'Google Calendar',
      description: 'Create events, schedule meetings, and manage your calendar',
      icon: <Calendar className="h-6 w-6" />,
      color: 'bg-blue-500',
      permissions: ['View events', 'Create events', 'Manage calendars'],
      connected: false,
      connecting: false
    },
    {
      id: 'drive',
      name: 'Google Drive',
      description: 'Access your files and documents stored in Google Drive',
      icon: <HardDrive className="h-6 w-6" />,
      color: 'bg-green-500',
      permissions: ['View files', 'Download files', 'Search documents'],
      connected: false,
      connecting: false
    },
    {
      id: 'sheets',
      name: 'Google Sheets',
      description: 'Work with spreadsheets and analyze data',
      icon: <FileSpreadsheet className="h-6 w-6" />,
      color: 'bg-emerald-500',
      permissions: ['View sheets', 'Edit data', 'Create spreadsheets'],
      connected: false,
      connecting: false
    }
  ]);

  useEffect(() => {
    if (isOpen) {
      checkExistingAuth();
    }
  }, [isOpen]);

  const checkExistingAuth = async () => {
    try {
      const existingCredentials = authService.getCredentials();
      const existingUserInfo = authService.getUserInfo();

      if (existingCredentials && authService.isSignedIn() && existingUserInfo) {
        setCredentials(existingCredentials);
        setUserInfo(existingUserInfo);
        updateServiceStatus();
        setStep('services');
      }
    } catch (error) {
      console.error('Failed to check existing auth:', error);
    }
  };

  const updateServiceStatus = () => {
    setServices(prev => prev.map(service => ({
      ...service,
      connected: authService.hasServiceAccess(service.id)
    })));
  };

  const handleGoogleAuth = async () => {
    setIsAuthenticating(true);
    try {
      // First, authenticate with basic scopes
      const creds = await authService.signIn([
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ]);

      const userInfo = authService.getUserInfo();

      setCredentials(creds);
      setUserInfo(userInfo);
      setStep('services');
    } catch (error) {
      console.error('Google authentication failed:', error);
      alert('Authentication failed. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleServiceConnect = async (serviceId: 'gmail' | 'calendar' | 'drive' | 'sheets') => {
    setServices(prev => prev.map(service =>
      service.id === serviceId
        ? { ...service, connecting: true }
        : service
    ));

    try {
      const success = await authService.requestServiceAccess(serviceId);

      setServices(prev => prev.map(service =>
        service.id === serviceId
          ? { ...service, connected: success, connecting: false }
          : service
      ));

      if (!success) {
        alert(`Failed to connect ${serviceId}. Please try again.`);
      }
    } catch (error) {
      console.error(`Failed to connect ${serviceId}:`, error);
      setServices(prev => prev.map(service =>
        service.id === serviceId
          ? { ...service, connecting: false }
          : service
      ));
      alert(`Failed to connect ${serviceId}. Please try again.`);
    }
  };

  const handleComplete = () => {
    const connectedServices = services.filter(s => s.connected).map(s => s.id);
    onServicesConnected(connectedServices);
    setStep('complete');
    setTimeout(() => {
      onClose();
      setStep('auth');
    }, 2000);
  };

  const handleDisconnect = async () => {
    try {
      await authService.signOut();
      setCredentials(null);
      setUserInfo(null);
      setServices(prev => prev.map(service => ({
        ...service,
        connected: false,
        connecting: false
      })));
      setStep('auth');
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connect Google Services" size="lg">
      <div className="space-y-6">
        {/* Step 1: Authentication */}
        {step === 'auth' && (
          <div className="text-center py-8">
            {USE_DEMO_MODE && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  🚀 <strong>Demo Mode</strong> - This will simulate Google authentication for testing
                </p>
              </div>
            )}
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {USE_DEMO_MODE ? 'Demo Google Authentication' : 'Connect Your Google Account'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {USE_DEMO_MODE
                ? 'This will simulate the Google authentication process and let you test the service selection flow.'
                : 'First, we need to authenticate with your Google account. You\'ll then be able to choose which services to connect.'
              }
            </p>
            <Button
              onClick={handleGoogleAuth}
              disabled={isAuthenticating}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {USE_DEMO_MODE ? 'Simulating...' : 'Authenticating...'}
                </>
              ) : (
                <>
                  <User className="h-5 w-5 mr-2" />
                  {USE_DEMO_MODE ? 'Start Demo Authentication' : 'Sign in with Google'}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Step 2: Service Selection */}
        {step === 'services' && (
          <div className="space-y-6">
            {/* User Info */}
            {userInfo && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={userInfo.picture}
                      alt={userInfo.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {userInfo.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {userInfo.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnect}
                    className="text-red-600 hover:text-red-700"
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            )}

            <div>
              {USE_DEMO_MODE && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✅ <strong>Demo Mode Active</strong> - Service connections will be simulated
                  </p>
                </div>
              )}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Choose Services to Connect
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {USE_DEMO_MODE
                  ? 'Select which Google services you\'d like to simulate connecting to Enterprise Search.'
                  : 'Select which Google services you\'d like to integrate with Enterprise Search.'
                }
              </p>

              <div className="grid gap-4">
                {services.map(service => (
                  <div
                    key={service.id}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-3 rounded-lg text-white ${service.color}`}>
                          {service.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                            {service.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {service.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {service.permissions.map(permission => (
                              <span
                                key={permission}
                                className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded"
                              >
                                {permission}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {service.connected ? (
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <CheckCircle className="h-5 w-5" />
                            <span className="text-sm font-medium">Connected</span>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleServiceConnect(service.id)}
                            disabled={service.connecting}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {service.connecting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              'Connect'
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={!services.some(s => s.connected)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Complete Setup
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Complete */}
        {step === 'complete' && (
          <div className="text-center py-8">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Setup Complete!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your Google services have been connected successfully. You can now use them in Enterprise Search.
            </p>
            <div className="flex justify-center gap-2">
              {services.filter(s => s.connected).map(service => (
                <div key={service.id} className={`p-2 rounded-lg text-white ${service.color}`}>
                  {service.icon}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
