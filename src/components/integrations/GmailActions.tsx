'use client';

import { useState, useEffect } from 'react';
import { Mail, Send, Paperclip, Users, Search, RefreshCw, Eye, Archive } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { gmailService } from '@/services/gmailService';
import { GmailMessage } from '@/types';

interface GmailActionsProps {
  isOpen: boolean;
  onClose: () => void;
  onEmailSent?: (success: boolean) => void;
}

interface EmailForm {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  body: string;
}

interface EmailTab {
  id: 'compose' | 'inbox' | 'search';
  name: string;
  icon: React.ReactNode;
}

export function GmailActions({ isOpen, onClose, onEmailSent }: GmailActionsProps) {
  const [activeTab, setActiveTab] = useState<'compose' | 'inbox' | 'search'>('compose');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState<EmailForm>({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: ''
  });

  const tabs: EmailTab[] = [
    { id: 'compose', name: 'Compose', icon: <Mail className="h-4 w-4" /> },
    { id: 'inbox', name: 'Inbox', icon: <Eye className="h-4 w-4" /> },
    { id: 'search', name: 'Search', icon: <Search className="h-4 w-4" /> }
  ];

  useEffect(() => {
    if (isOpen && activeTab === 'inbox') {
      loadInboxMessages();
    }
  }, [isOpen, activeTab]);

  const handleInputChange = (field: keyof EmailForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSendEmail = async () => {
    if (!form.to || !form.subject) {
      alert('Please fill in the recipient and subject fields');
      return;
    }

    setIsSending(true);
    try {
      const recipients = form.to.split(',').map(email => email.trim());
      const success = await gmailService.sendMessage(recipients, form.subject, form.body);
      
      if (success) {
        onEmailSent?.(true);
        resetForm();
        alert('Email sent successfully!');
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      onEmailSent?.(false);
      alert('Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const loadInboxMessages = async () => {
    setIsLoading(true);
    try {
      const inboxMessages = await gmailService.getMessages('', 20);
      setMessages(inboxMessages);
    } catch (error) {
      console.error('Failed to load inbox messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const searchResults = await gmailService.searchMessages(searchQuery);
      setMessages(searchResults);
    } catch (error) {
      console.error('Failed to search messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      to: '',
      cc: '',
      bcc: '',
      subject: '',
      body: ''
    });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gmail Actions" size="lg">
      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-600">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </div>

        {/* Compose Tab */}
        {activeTab === 'compose' && (
          <div className="space-y-4">
            {/* Recipients */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To *
              </label>
              <input
                type="email"
                value={form.to}
                onChange={(e) => handleInputChange('to', e.target.value)}
                placeholder="recipient@example.com, another@example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* CC/BCC */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CC
                </label>
                <input
                  type="email"
                  value={form.cc}
                  onChange={(e) => handleInputChange('cc', e.target.value)}
                  placeholder="cc@example.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  BCC
                </label>
                <input
                  type="email"
                  value={form.bcc}
                  onChange={(e) => handleInputChange('bcc', e.target.value)}
                  placeholder="bcc@example.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject *
              </label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="Enter email subject"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message
              </label>
              <textarea
                value={form.body}
                onChange={(e) => handleInputChange('body', e.target.value)}
                placeholder="Enter your message here..."
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Send Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSendEmail}
                disabled={isSending || !form.to || !form.subject}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSending ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Inbox Tab */}
        {activeTab === 'inbox' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Recent Messages
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={loadInboxMessages}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {messages.map(message => (
                <div
                  key={message.id}
                  className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {message.from}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(message.date)}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                        {message.subject}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {truncateText(message.body, 100)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {messages.length === 0 && !isLoading && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No messages found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search emails..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                onClick={handleSearch}
                disabled={isLoading || !searchQuery.trim()}
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {messages.map(message => (
                <div
                  key={message.id}
                  className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {message.from}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(message.date)}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                        {message.subject}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {truncateText(message.body, 100)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {messages.length === 0 && searchQuery && !isLoading && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No messages found for "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
