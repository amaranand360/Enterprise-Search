'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Tool } from '@/types';
import { IconRenderer } from '@/components/ui/IconRenderer';
import { sleep, randomDelay } from '@/lib/utils';
import { GoogleConnection } from './GoogleConnection';
import { GOOGLE_TOOLS } from '@/lib/config';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tool: Tool | null;
  onConnectionComplete: (toolId: string, success: boolean) => void;
}

type ConnectionStep = 'auth' | 'connecting' | 'success' | 'error';

export function ConnectionModal({
  isOpen,
  onClose,
  tool,
  onConnectionComplete
}: ConnectionModalProps) {
  const [step, setStep] = useState<ConnectionStep>('auth');
  const [error, setError] = useState<string | null>(null);
  const [showGoogleConnection, setShowGoogleConnection] = useState(false);

  if (!tool) return null;

  // Check if this is a Google service
  const isGoogleService = GOOGLE_TOOLS.some(googleTool => googleTool.id === tool.id);

  const handleConnect = async () => {
    if (isGoogleService) {
      setShowGoogleConnection(true);
      return;
    }

    setStep('connecting');
    setError(null);

    try {
      // Simulate connection process for demo tools
      await randomDelay(2000, 4000);

      // Simulate occasional failures for demo purposes
      if (Math.random() < 0.1) {
        throw new Error('Connection failed. Please try again.');
      }

      setStep('success');
      onConnectionComplete(tool.id, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setStep('error');
      onConnectionComplete(tool.id, false);
    }
  };

  const handleGoogleConnectionComplete = (success: boolean) => {
    setShowGoogleConnection(false);
    if (success) {
      setStep('success');
      onConnectionComplete(tool.id, true);
    } else {
      setStep('error');
      setError('Failed to connect to Google services');
      onConnectionComplete(tool.id, false);
    }
  };

  const handleClose = () => {
    setStep('auth');
    setError(null);
    onClose();
  };

  const renderContent = () => {
    switch (step) {
      case 'auth':
        return (
          <div className="text-center">
            <div 
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl text-white"
              style={{ backgroundColor: tool.color }}
            >
              <IconRenderer icon={tool.icon} className="text-white" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Connect to {tool.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {tool.description}
            </p>
            
            {tool.isDemo ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 mb-2">
                  <span className="text-sm font-medium">Demo Mode</span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  This is a demonstration connection. No real authentication is required.
                </p>
              </div>
            ) : (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-200 mb-2">
                  <span className="text-sm font-medium">Real Integration</span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  This will connect to your actual {tool.name} account using OAuth 2.0.
                </p>
              </div>
            )}

            <div className="space-y-3 text-left">
              <h4 className="font-medium text-gray-900 dark:text-white">Features you'll get:</h4>
              <ul className="space-y-2">
                {tool.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );

      case 'connecting':
        return (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Connecting to {tool.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {tool.isDemo 
                ? 'Setting up demo connection...' 
                : 'Authenticating with your account...'}
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Successfully Connected!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {tool.name} is now connected and ready to search.
            </p>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-700 dark:text-green-300">
                You can now search across your {tool.name} data from the main search interface.
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
              {error || 'Unable to connect to ' + tool.name}
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-700 dark:text-red-300">
                Please check your credentials and try again. If the problem persists, contact support.
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
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleConnect}>
              {isGoogleService ? 'Connect Google Account' : tool.isDemo ? 'Connect Demo' : 'Connect Account'}
            </Button>
          </ModalFooter>
        );

      case 'connecting':
        return (
          <ModalFooter>
            <Button variant="outline" disabled>
              Connecting...
            </Button>
          </ModalFooter>
        );

      case 'success':
        return (
          <ModalFooter>
            <Button onClick={handleClose}>
              Done
            </Button>
          </ModalFooter>
        );

      case 'error':
        return (
          <ModalFooter>
            <Button variant="outline" onClick={handleClose}>
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
    <>
      <Modal
        isOpen={isOpen && !showGoogleConnection}
        onClose={handleClose}
        size="md"
        showCloseButton={step !== 'connecting'}
      >
        {renderContent()}
        {renderFooter()}
      </Modal>

      {/* Google Connection Modal */}
      <GoogleConnection
        isOpen={showGoogleConnection}
        onClose={() => setShowGoogleConnection(false)}
        onConnectionComplete={handleGoogleConnectionComplete}
      />
    </>
  );
}
