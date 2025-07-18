'use client';

import { useState, useEffect } from 'react';
import { Zap, CheckCircle, Clock, Download, X, Search, Home, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExecutionStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  duration?: number;
  timestamp?: string;
}

interface ActionExecutorProps {
  action: string;
  isVisible: boolean;
  onClose: () => void;
  onNewSearch?: () => void;
  onBackToHome?: () => void;
}

const ACTION_STEPS: Record<string, ExecutionStep[]> = {
  'Send a email to team': [
    {
      id: 'parse-request',
      title: 'Analyzing Email Request',
      description: 'Understanding email purpose and extracting key information',
      status: 'pending'
    },
    {
      id: 'fetch-contacts',
      title: 'Fetching Team Contacts',
      description: 'Retrieving team member email addresses from directory',
      status: 'pending'
    },
    {
      id: 'compose-email',
      title: 'Composing Professional Email',
      description: 'Generating email content with proper formatting and tone',
      status: 'pending'
    },
    {
      id: 'send-email',
      title: 'Sending Email via Gmail',
      description: 'Delivering email to all team members and tracking delivery',
      status: 'pending'
    }
  ],
  'Schedule meeting': [
    {
      id: 'parse-schedule',
      title: 'Parsing Meeting Requirements',
      description: 'Extracting meeting topic, duration, and attendee preferences',
      status: 'pending'
    },
    {
      id: 'check-availability',
      title: 'Checking Calendar Availability',
      description: 'Scanning Google Calendar for optimal time slots across all attendees',
      status: 'pending'
    },
    {
      id: 'create-event',
      title: 'Creating Calendar Event',
      description: 'Setting up meeting with agenda, location, and video conference link',
      status: 'pending'
    },
    {
      id: 'send-invites',
      title: 'Sending Meeting Invitations',
      description: 'Distributing calendar invites with meeting details to all participants',
      status: 'pending'
    }
  ],
  'Generate report': [
    {
      id: 'collect-data',
      title: 'Collecting Data Sources',
      description: 'Gathering data from connected databases, spreadsheets, and APIs',
      status: 'pending'
    },
    {
      id: 'analyze-data',
      title: 'Analyzing Data Patterns',
      description: 'Processing metrics, identifying trends, and calculating key insights',
      status: 'pending'
    },
    {
      id: 'generate-visualizations',
      title: 'Creating Visualizations',
      description: 'Building charts, graphs, and interactive dashboards',
      status: 'pending'
    },
    {
      id: 'compile-report',
      title: 'Compiling Final Report',
      description: 'Assembling executive summary, findings, and recommendations into PDF',
      status: 'pending'
    }
  ],
  'Create presentation': [
    {
      id: 'research-topic',
      title: 'Researching Topic',
      description: 'Gathering relevant information and identifying key talking points',
      status: 'pending'
    },
    {
      id: 'structure-content',
      title: 'Structuring Content Flow',
      description: 'Creating logical presentation outline with compelling narrative arc',
      status: 'pending'
    },
    {
      id: 'design-slides',
      title: 'Designing Professional Slides',
      description: 'Building visually appealing slides with consistent branding and layout',
      status: 'pending'
    },
    {
      id: 'export-presentation',
      title: 'Exporting Presentation',
      description: 'Generating PowerPoint file with speaker notes and handout version',
      status: 'pending'
    }
  ],
  'Find similar documents': [
    {
      id: 'analyze-query',
      title: 'Analyzing Search Parameters',
      description: 'Understanding document type, content requirements, and similarity criteria',
      status: 'pending'
    },
    {
      id: 'scan-repositories',
      title: 'Scanning Document Repositories',
      description: 'Searching across Google Drive, SharePoint, Notion, and local files',
      status: 'pending'
    },
    {
      id: 'calculate-similarity',
      title: 'Calculating Content Similarity',
      description: 'Using AI to analyze document content and identify semantic matches',
      status: 'pending'
    },
    {
      id: 'compile-results',
      title: 'Compiling Search Results',
      description: 'Ranking documents by relevance and preparing downloadable list',
      status: 'pending'
    }
  ]
};

export function ActionExecutor({ action, isVisible, onClose, onNewSearch, onBackToHome }: ActionExecutorProps) {
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    if (isVisible && action) {
      const actionSteps = ACTION_STEPS[action] || [];
      setSteps(actionSteps.map(step => ({ ...step, status: 'pending' })));
      setCurrentStep(0);
      setProgress(0);
      setIsExecuting(true);
      executeSteps(actionSteps);
    }
  }, [isVisible, action]);

  const executeSteps = async (actionSteps: ExecutionStep[]) => {
    for (let i = 0; i < actionSteps.length; i++) {
      // Update current step to executing
      setSteps(prev => prev.map((step, index) =>
        index === i
          ? { ...step, status: 'executing', timestamp: new Date().toLocaleTimeString() }
          : step
      ));

      // Realistic execution times based on step complexity
      let executionTime: number;
      const stepId = actionSteps[i].id;

      // Different steps take different amounts of time
      if (stepId.includes('analyze') || stepId.includes('parse')) {
        executionTime = Math.random() * 1500 + 800; // 0.8-2.3 seconds
      } else if (stepId.includes('search') || stepId.includes('scan') || stepId.includes('fetch')) {
        executionTime = Math.random() * 2500 + 1500; // 1.5-4 seconds
      } else if (stepId.includes('create') || stepId.includes('generate') || stepId.includes('compile')) {
        executionTime = Math.random() * 3000 + 2000; // 2-5 seconds
      } else if (stepId.includes('send') || stepId.includes('export')) {
        executionTime = Math.random() * 1000 + 500; // 0.5-1.5 seconds
      } else {
        executionTime = Math.random() * 2000 + 1000; // Default: 1-3 seconds
      }

      await new Promise(resolve => setTimeout(resolve, executionTime));

      // Mark step as completed
      setSteps(prev => prev.map((step, index) =>
        index === i
          ? { ...step, status: 'completed', duration: Math.floor(executionTime) }
          : step
      ));

      // Update progress
      const newProgress = ((i + 1) / actionSteps.length) * 100;
      setProgress(newProgress);
      setCurrentStep(i + 1);
    }

    setIsExecuting(false);
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getCompletionMessage = (actionName: string) => {
    const messages: Record<string, string> = {
      'Send a email to team': 'Email has been successfully sent to all team members. Delivery confirmations received.',
      'Schedule meeting': 'Meeting has been scheduled and calendar invitations sent to all participants.',
      'Generate report': 'Comprehensive report has been generated with all requested data and visualizations.',
      'Create presentation': 'Professional presentation has been created and is ready for download.',
      'Find similar documents': 'Document search completed. Found relevant files across all connected platforms.'
    };
    return messages[actionName] || 'Action completed successfully.';
  };

  const getDownloadButtonText = (actionName: string) => {
    const buttonTexts: Record<string, string> = {
      'Send a email to team': 'View Email Confirmation',
      'Schedule meeting': 'Download Meeting Details',
      'Generate report': 'Download Report (PDF)',
      'Create presentation': 'Download Presentation (PPTX)',
      'Find similar documents': 'Download Document List'
    };
    return buttonTexts[actionName] || 'Download Results';
  };

  const handleDownload = (actionName: string) => {
    // Simulate download action
    console.log(`Downloading results for: ${actionName}`);
    // In a real app, this would trigger actual file download
    alert(`${actionName} results would be downloaded here!`);
  };

  const handleNewSearch = () => {
    if (onNewSearch) {
      onNewSearch();
    } else {
      // Default behavior: close modal and focus search
      onClose();
    }
  };

  const handleBackToHome = () => {
    if (onBackToHome) {
      onBackToHome();
    } else {
      // Default behavior: close modal and go to homepage
      onClose();
      window.location.href = '/';
    }
  };

  const handleRunAnotherAction = () => {
    // Reset the current action and close modal to show Quick Actions again
    onClose();
    // This will take user back to homepage where they can see Quick Actions
    if (onBackToHome) {
      onBackToHome();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Executing Action
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Step {currentStep} of {steps.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(progress)}%
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Complete
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className="bg-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Execution Steps */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Execution Steps
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Follow the progress of your action execution
          </p>

          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.id} className="flex items-start gap-4">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                  step.status === 'completed' && "bg-green-100 dark:bg-green-900/30",
                  step.status === 'executing' && "bg-purple-100 dark:bg-purple-900/30",
                  step.status === 'pending' && "bg-gray-100 dark:bg-gray-700"
                )}>
                  {step.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : step.status === 'executing' ? (
                    <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Clock className="h-4 w-4 text-gray-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={cn(
                      "font-medium",
                      step.status === 'completed' && "text-green-600 dark:text-green-400",
                      step.status === 'executing' && "text-purple-600 dark:text-purple-400",
                      step.status === 'pending' && "text-gray-500 dark:text-gray-400"
                    )}>
                      {step.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {step.timestamp && (
                        <>
                          <Clock className="h-3 w-3" />
                          <span>{step.timestamp}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {step.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs">
                    {step.duration && (
                      <span className="flex items-center gap-1 text-gray-500">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                        {formatTime(step.duration)}
                      </span>
                    )}
                    {step.status === 'completed' && (
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <CheckCircle className="h-3 w-3" />
                        Completed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Results (when completed) */}
          {progress === 100 && !isExecuting && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h4 className="font-medium text-green-800 dark:text-green-200">
                    Action Completed Successfully
                  </h4>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {getCompletionMessage(action)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => handleDownload(action)}
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  <Download className="h-4 w-4" />
                  {getDownloadButtonText(action)}
                </button>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleNewSearch()}
                    className="flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-xs"
                  >
                    <Search className="h-3 w-3" />
                    New Search
                  </button>

                  <button
                    onClick={() => handleRunAnotherAction()}
                    className="flex items-center justify-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-colors text-xs"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Run Another
                  </button>

                  <button
                    onClick={() => handleBackToHome()}
                    className="flex items-center justify-center gap-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors text-xs"
                  >
                    <Home className="h-3 w-3" />
                    Home
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  <X className="h-4 w-4" />
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
