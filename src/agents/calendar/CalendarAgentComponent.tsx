'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar, Bot, Send, Loader2, MessageSquare, Settings, History, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface CalendarAgentComponentProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
}

export function CalendarAgentComponent({ isOpen, onClose }: CalendarAgentComponentProps) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [agentStats, setAgentStats] = useState<any>(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !isInitialized && !isInitializing) {
      initializeAgent();
    }
  }, [isOpen, isInitialized, isInitializing]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (type: 'user' | 'agent' | 'system', content: string) => {
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const initializeAgent = async () => {
    setIsInitializing(true);
    
    try {
      // Check if user is authenticated with Google
      const { googleAuth } = await import('@/services/googleAuth');
      await googleAuth.initialize();
      
      const isAuthenticated = googleAuth.isSignedIn();
      
      if (!isAuthenticated) {
        // Show authentication required message
        addMessage('system', 'Welcome to the Calendar Agent! To access your Google Calendar, please sign in first using the Connections settings.');
        setIsInitialized(true);
        setIsInitializing(false);
        return;
      }

      // Initialize agent with authentication
      const response = await fetch('/api/calendar-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'initialize',
          sessionId,
          config: {
            hasRealAuth: true,
            accessToken: googleAuth.getCredentials()?.access_token
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to initialize agent: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      setIsInitialized(true);
      
      // Welcome message with helpful examples
      const welcomeContent = `🎉 Calendar Agent initialized successfully! I'm connected to your Google Calendar and ready to help.

Here are some things you can ask me to do:

📅 **Create Events:**
• "Create a team meeting tomorrow at 2 PM for 1 hour"
• "Schedule a doctor's appointment on Friday at 10 AM"
• "Add a reminder to call mom this evening at 7 PM"

🔍 **Find Events:**
• "What meetings do I have this week?"
• "Show me my schedule for tomorrow"
• "Do I have anything planned for next Monday?"

✏️ **Manage Events:**
• "Move my 3 PM meeting to 4 PM"
• "Cancel my lunch meeting today"
• "Add John to my team standup meeting"

⏰ **Check Availability:**
• "Am I free tomorrow afternoon?"
• "What time slots are available this week?"
• "When is my next available 2-hour block?"

Just tell me what you'd like to do with your calendar in natural language!`;
      
      addMessage('agent', welcomeContent);
      loadAgentStats();
      
    } catch (error) {
      console.error('Failed to initialize calendar agent:', error);
      addMessage('system', `❌ Failed to initialize Calendar Agent: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or check your connection settings.`);
    } finally {
      setIsInitializing(false);
    }
  };

  const loadAgentStats = async () => {
    try {
      const response = await fetch('/api/calendar-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getStats',
          sessionId
        })
      });

      const data = await response.json();
      if (data.success) {
        setAgentStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load agent stats:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !isInitialized || isProcessing) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    addMessage('user', userMessage);
    setIsProcessing(true);

    try {
      // Check authentication status
      const { googleAuth } = await import('@/services/googleAuth');
      const isAuthenticated = googleAuth.isSignedIn();
      
      if (!isAuthenticated) {
        addMessage('agent', '🔐 I need access to your Google Calendar to help you. Please sign in through the Connections settings first, then try again.');
        setIsProcessing(false);
        return;
      }

      const accessToken = googleAuth.getCredentials()?.access_token;
      
      const response = await fetch('/api/calendar-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'process',
          userRequest: userMessage,
          sessionId,
          accessToken // Pass the access token for real Google Calendar operations
        })
      });

      const data = await response.json();
      
      if (data.success) {
        addMessage('agent', data.response);
        
        // If there was calendar data returned, update stats
        if (data.calendarOperation) {
          loadAgentStats();
        }
      } else {
        addMessage('system', `❌ Error: ${data.error}`);
      }
    } catch (error) {
      addMessage('system', `❌ Failed to process request: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = async () => {
    setMessages([]);
    try {
      await fetch('/api/calendar-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reset',
          sessionId
        })
      });
    } catch (error) {
      console.error('Failed to reset session:', error);
    }
  };

  const handleShowHistory = async () => {
    if (!isInitialized) return;
    
    try {
      const response = await fetch('/api/calendar-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getHistory',
          sessionId
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowHistory(true);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const handleShowStats = () => {
    if (agentStats) {
      setShowStats(true);
    } else {
      loadAgentStats();
    }
  };

  const sampleQuestions = [
    "Schedule a team meeting tomorrow at 2 PM",
    "What meetings do I have this week?",
    "Find me a free time slot on Friday afternoon",
    "Create a recurring standup every Monday at 9 AM",
    "Check my availability for next Tuesday"
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Calendar Agent"
    >
      <div className="flex h-full">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Calendar Agent</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isInitialized ? 'Ready to help' : isInitializing ? 'Initializing...' : 'Not initialized'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handleShowStats}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                disabled={!isInitialized}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleShowHistory}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                disabled={!isInitialized}
              >
                <History className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setShowSettings(true)}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !isInitializing && (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Welcome to Calendar Agent
                </h4>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  I can help you manage your Google Calendar with natural language commands.
                </p>
                
                <div className="space-y-2 max-w-md mx-auto">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Try these sample questions:
                  </p>
                  {sampleQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => setInputValue(question)}
                      className="w-full text-left text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-2 rounded-lg transition-colors"
                    >
                      "{question}"
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.type === 'system'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Agent is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex gap-2">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={isInitialized ? "Ask me about your calendar..." : "Please wait for initialization..."}
                disabled={!isInitialized || isProcessing}
                className="flex-1 resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                rows={2}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || !isInitialized || isProcessing}
                className="px-4 py-2"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            {isInitialized && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Press Enter to send, Shift+Enter for new line
                </span>
                <Button
                  onClick={handleClearHistory}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Clear Chat
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Modal */}
      {showStats && agentStats && (
        <Modal
          isOpen={showStats}
          onClose={() => setShowStats(false)}
          title="Agent Statistics"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {agentStats.totalRequests || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Requests</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {agentStats.sessionCount || 1}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Sessions</div>
              </div>
            </div>
            {agentStats.patterns && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Usage Patterns</h4>
                <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {JSON.stringify(agentStats.patterns, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Modal>
      )}
    </Modal>
  );
}