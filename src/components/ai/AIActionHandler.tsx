'use client';

import { useState } from 'react';
import { Bot, Send, Calendar, Mail, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { ParsedQuery } from '@/lib/queryParser';
import { sleep } from '@/lib/utils';

interface AIActionHandlerProps {
  isOpen: boolean;
  onClose: () => void;
  parsedQuery: ParsedQuery;
}

interface ActionStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  icon: React.ReactNode;
}

export function AIActionHandler({ isOpen, onClose, parsedQuery }: AIActionHandlerProps) {
  const [steps, setSteps] = useState<ActionStep[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const generateActionSteps = (query: ParsedQuery): ActionStep[] => {
    const { intent, entities, originalQuery } = query;
    
    if (intent.type !== 'action' || !intent.action) {
      return [];
    }

    switch (intent.action) {
      case 'send':
        return [
          {
            id: 'compose',
            title: 'Compose Message',
            description: 'Creating email draft based on your request',
            status: 'pending',
            icon: <Mail className="h-4 w-4" />
          },
          {
            id: 'recipients',
            title: 'Add Recipients',
            description: 'Adding recipients from your query',
            status: 'pending',
            icon: <Send className="h-4 w-4" />
          },
          {
            id: 'send',
            title: 'Send Email',
            description: 'Sending the email message',
            status: 'pending',
            icon: <CheckCircle className="h-4 w-4" />
          }
        ];

      case 'schedule':
        return [
          {
            id: 'parse-time',
            title: 'Parse Time',
            description: 'Understanding the requested time and date',
            status: 'pending',
            icon: <Calendar className="h-4 w-4" />
          },
          {
            id: 'check-availability',
            title: 'Check Availability',
            description: 'Checking calendar for conflicts',
            status: 'pending',
            icon: <Calendar className="h-4 w-4" />
          },
          {
            id: 'create-event',
            title: 'Create Event',
            description: 'Creating calendar event',
            status: 'pending',
            icon: <CheckCircle className="h-4 w-4" />
          }
        ];

      case 'create':
        return [
          {
            id: 'analyze',
            title: 'Analyze Request',
            description: 'Understanding what you want to create',
            status: 'pending',
            icon: <Bot className="h-4 w-4" />
          },
          {
            id: 'generate',
            title: 'Generate Content',
            description: 'Creating the requested content',
            status: 'pending',
            icon: <FileText className="h-4 w-4" />
          },
          {
            id: 'save',
            title: 'Save Document',
            description: 'Saving to your preferred location',
            status: 'pending',
            icon: <CheckCircle className="h-4 w-4" />
          }
        ];

      default:
        return [
          {
            id: 'process',
            title: 'Process Request',
            description: 'Processing your request',
            status: 'pending',
            icon: <Bot className="h-4 w-4" />
          }
        ];
    }
  };

  const executeAction = async () => {
    const actionSteps = generateActionSteps(parsedQuery);
    setSteps(actionSteps);
    setIsExecuting(true);
    setCurrentStep(0);

    for (let i = 0; i < actionSteps.length; i++) {
      setCurrentStep(i);
      
      // Update step to executing
      setSteps(prev => prev.map((step, index) => 
        index === i ? { ...step, status: 'executing' } : step
      ));

      // Simulate processing time
      await sleep(1500 + Math.random() * 1000);

      // Simulate occasional failures for demo
      const shouldFail = Math.random() < 0.1;
      
      if (shouldFail) {
        setSteps(prev => prev.map((step, index) => 
          index === i ? { ...step, status: 'failed' } : step
        ));
        setIsExecuting(false);
        return;
      }

      // Mark as completed
      setSteps(prev => prev.map((step, index) => 
        index === i ? { ...step, status: 'completed' } : step
      ));
    }

    setIsExecuting(false);
  };

  const getActionTitle = () => {
    const { intent, originalQuery } = parsedQuery;
    
    if (intent.type === 'action' && intent.action) {
      const actionTitles = {
        send: 'Send Email',
        schedule: 'Schedule Meeting',
        create: 'Create Document',
        find: 'Find Information',
        update: 'Update Content',
        delete: 'Delete Item'
      };
      return actionTitles[intent.action] || 'Execute Action';
    }
    
    return 'AI Assistant';
  };

  const getActionDescription = () => {
    return `I'll help you execute: "${parsedQuery.originalQuery}"`;
  };

  const renderContent = () => {
    if (steps.length === 0) {
      return (
        <div className="text-center py-8">
          <Bot className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {getActionTitle()}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {getActionDescription()}
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Detected Intent: {parsedQuery.intent.type}
              {parsedQuery.intent.action && ` (${parsedQuery.intent.action})`}
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Confidence: {Math.round(parsedQuery.intent.confidence * 100)}%
            </p>
          </div>

          {parsedQuery.entities.length > 0 && (
            <div className="text-left">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Extracted Information:
              </h4>
              <div className="space-y-2">
                {parsedQuery.entities.map((entity, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 capitalize">
                      {entity.type.replace('_', ' ')}:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {entity.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="py-4">
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-4">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                step.status === 'completed' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' :
                step.status === 'executing' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' :
                step.status === 'failed' ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300' :
                'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
              }`}>
                {step.status === 'executing' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : step.status === 'failed' ? (
                  <AlertCircle className="h-4 w-4" />
                ) : step.status === 'completed' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  step.icon
                )}
              </div>
              
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {step.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {step.description}
                </p>
              </div>
              
              {step.status === 'completed' && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              {step.status === 'failed' && (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFooter = () => {
    if (steps.length === 0) {
      return (
        <ModalFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={executeAction}>
            Execute Action
          </Button>
        </ModalFooter>
      );
    }

    if (isExecuting) {
      return (
        <ModalFooter>
          <Button variant="outline" disabled>
            Executing...
          </Button>
        </ModalFooter>
      );
    }

    const hasFailedSteps = steps.some(step => step.status === 'failed');
    const allCompleted = steps.every(step => step.status === 'completed');

    return (
      <ModalFooter>
        {hasFailedSteps && (
          <Button variant="outline" onClick={() => setSteps([])}>
            Try Again
          </Button>
        )}
        <Button onClick={onClose} variant={allCompleted ? 'primary' : 'outline'}>
          {allCompleted ? 'Done' : 'Close'}
        </Button>
      </ModalFooter>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getActionTitle()}
      size="md"
      showCloseButton={!isExecuting}
    >
      {renderContent()}
      {renderFooter()}
    </Modal>
  );
}
