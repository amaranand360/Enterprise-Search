'use client';

import { useState } from 'react';
import { SearchInterface } from '@/components/search/SearchInterface';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { ConnectionRetryHandler, ConnectionHealthMonitor, useAutoRetry } from '@/components/connections/ConnectionRetryHandler';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true); // Start with sidebar open
  const [sidebarExpanded, setSidebarExpanded] = useState(true); // Start expanded
  const [activeTab, setActiveTab] = useState<'search' | 'knowledge'>('search');

  // Enable auto-retry for failed connections
  useAutoRetry(true, 60000); // Retry every minute

  return (
    <div className="flex h-screen bg-gray-900 transition-colors duration-200">
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
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-scroll bg-gray-900 transition-colors duration-200">
          <SearchInterface />
        </main>
      </div>

      {/* Connection Management Components */}
      <ConnectionRetryHandler />
      <ConnectionHealthMonitor />
    </div>
  );
}
