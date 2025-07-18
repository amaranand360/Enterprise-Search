'use client';

import { SearchInterface } from '@/components/search/SearchInterface';
import { Header } from '@/components/layout/Header';
import { ConnectionRetryHandler, ConnectionHealthMonitor, useAutoRetry } from '@/components/connections/ConnectionRetryHandler';

export default function Home() {
  // Enable auto-retry for failed connections
  useAutoRetry(true, 60000); // Retry every minute

  return (
    <div className="flex h-screen bg-gray-900 transition-colors duration-200">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />

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
