'use client';

import { useState } from 'react';
import { SearchInterface } from '@/components/search/SearchInterface';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { KnowledgeTab } from '@/components/knowledge/KnowledgeTab';
import { ConnectionRetryHandler, ConnectionHealthMonitor, useAutoRetry } from '@/components/connections/ConnectionRetryHandler';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'search' | 'knowledge'>('search');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  // Enable auto-retry for failed connections
  useAutoRetry(true, 60000); // Retry every minute

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isExpanded={sidebarExpanded}
        onToggleExpanded={() => setSidebarExpanded(!sidebarExpanded)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-scroll bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          {activeTab === 'search' ? (
            <SearchInterface />
          ) : (
            <KnowledgeTab />
          )}
        </main>
      </div>

      {/* Connection Management Components */}
      <ConnectionRetryHandler />
      <ConnectionHealthMonitor />
    </div>
  );
}
