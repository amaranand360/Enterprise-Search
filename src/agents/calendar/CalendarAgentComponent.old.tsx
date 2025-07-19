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

  const initializeAgent = async () => {
    setIsInitializing(true);
    
    try {
      const response = await fetch('/api/calendar-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'initialize',
          sessionId,
          config: {}
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setIsInitialized(true);
        addMessage('system', '✅ Calendar Agent initialized successfully! I can help you manage your Google Calendar. Try asking me to schedule a meeting, find events, or check your availability.');
        loadAgentStats();
      } else {
        addMessage('system', `❌ Failed to initialize Calendar Agent: ${data.error}`);
      }
    } catch (error) {
      addMessage('system', `❌ Failed to initialize Calendar Agent: ${error instanceof Error ? error.message : 'Network error'}`);
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
      const stats = await agentInstance.getAgentStats();
      setAgentStats(stats);
    } catch (error) {
      console.error('Failed to load agent stats:', error);
    }
  };

  const addMessage = (type: 'user' | 'agent' | 'system', content: string) => {
    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !agent || isProcessing) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    addMessage('user', userMessage);
    setIsProcessing(true);

    try {
      const response = await agent.processUserRequest(userMessage);
      addMessage('agent', response);
    } catch (error) {
      addMessage('system', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  const clearChat = () => {
    setMessages([]);
    if (agent) {
      agent.reset();
      addMessage('system', '🔄 Chat history cleared. Starting fresh!');
    }
  };

  const showSessionHistory = async () => {
    if (!agent) return;
    
    try {
      const history = await agent.getSessionHistory();
      setShowHistory(true);
      // In a real implementation, you'd display this in a modal or sidebar
      console.log('Session History:', history);
    } catch (error) {
      addMessage('system', `Failed to load session history: ${error}`);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSampleQuestions = () => [
    "Schedule a team meeting tomorrow at 2 PM",
    "Find all my meetings next week",
    "Check my availability on Friday afternoon",
    "Create a recurring standup every Monday at 9 AM",
    "Cancel my 3 PM meeting today",
    "Add someone to my marketing review meeting"
  ];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Calendar Agent"
    >
      <div className="flex flex-col h-[70vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Google Calendar Agent</h3>
              <p className="text-sm text-gray-400">
                {isInitialized ? 'Ready to help' : isInitializing ? 'Initializing...' : 'Not initialized'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStats(!showStats)}
              disabled={!isInitialized}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={showSessionHistory}
              disabled={!isInitialized}
            >
              <History className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats Panel */}
        {showStats && agentStats && (
          <div className="p-4 bg-gray-800 border-b border-gray-700">
            <h4 className="font-medium text-white mb-2">Agent Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Average Session:</span>
                <span className="ml-2 text-white">{agentStats.averageSessionLength}</span>
              </div>
              <div>
                <span className="text-gray-400">Error Rate:</span>
                <span className="ml-2 text-white">{agentStats.errorRate.toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-gray-400">Common Actions:</span>
                <span className="ml-2 text-white">{agentStats.mostCommonActions[0]?.action || 'None'}</span>
              </div>
              <div>
                <span className="text-gray-400">Suggestions:</span>
                <span className="ml-2 text-white">{agentStats.suggestions.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && isInitialized && (
            <div className="text-center space-y-4">
              <div className="p-6 bg-gray-800 rounded-lg">
                <Bot className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">How can I help with your calendar?</h3>
                <p className="text-gray-400 mb-4">Try one of these example requests:</p>
                <div className="grid gap-2">
                  {getSampleQuestions().slice(0, 3).map((question, index) => (
                    <button
                      key={index}
                      onClick={() => setInputValue(question)}
                      className="text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300 transition-colors"
                    >
                      "{question}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.type === 'system'
                    ? 'bg-yellow-900 text-yellow-100 border border-yellow-700'
                    : 'bg-gray-700 text-gray-100'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className="text-xs opacity-70 mt-1">
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-gray-700 text-gray-100 p-3 rounded-lg flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing your request...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex gap-2">
            <div className="flex-1">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  isInitialized 
                    ? "Ask me about your calendar..." 
                    : isInitializing 
                    ? "Initializing agent..."
                    : "Agent not ready"
                }
                disabled={!isInitialized || isProcessing}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || !isInitialized || isProcessing}
              className="self-end"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {isInitialized && (
            <div className="flex justify-between items-center mt-2">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearChat}
                  className="text-xs"
                >
                  Clear Chat
                </Button>
              </div>
              <div className="text-xs text-gray-400">
                Press Enter to send, Shift+Enter for new line
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
