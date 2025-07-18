'use client';

import { useState, useEffect } from 'react';
import { Menu, Bell, Settings, User, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConnectionStatusDashboard } from '@/components/connections/ConnectionStatusDashboard';
import { ConnectionSettings } from '@/components/connections/ConnectionSettings';
import { connectionStatusService, ConnectionStats } from '@/services/ConnectionStatusService';

interface HeaderProps {
  onSidebarToggle: () => void;
  sidebarOpen: boolean;
}

export function Header({ onSidebarToggle, sidebarOpen }: HeaderProps) {
  const [showConnectionDashboard, setShowConnectionDashboard] = useState(false);
  const [showConnectionSettings, setShowConnectionSettings] = useState(false);
  const [connectionStats, setConnectionStats] = useState<ConnectionStats | null>(null);

  useEffect(() => {
    const updateStats = () => {
      setConnectionStats(connectionStatusService.getConnectionStats());
    };

    // Initial load
    updateStats();

    // Update every 30 seconds
    const interval = setInterval(updateStats, 30000);

    return () => clearInterval(interval);
  }, []);

  const getConnectionStatusIcon = () => {
    if (!connectionStats) return <WifiOff className="h-4 w-4 text-gray-400" />;

    if (connectionStats.errorConnections > 0) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }

    if (connectionStats.connectedTools > 0) {
      return <Wifi className="h-4 w-4 text-green-500" />;
    }

    return <WifiOff className="h-4 w-4 text-gray-400" />;
  };

  const getConnectionStatusText = () => {
    if (!connectionStats) return 'Loading...';

    if (connectionStats.connectedTools === 0) {
      return 'No connections';
    }

    return `${connectionStats.connectedTools}/${connectionStats.totalTools} connected`;
  };
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-4 lg:px-6 transition-colors duration-200">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onSidebarToggle}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          aria-label="Toggle sidebar"
        >
        </button>

        <div className="flex items-center gap-3">
          <div
            className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm cursor-pointer hover:opacity-80 transition-opacity duration-200"
            onClick={() => window.location.href = '/'}
          >
            <span className="text-white font-bold text-sm">ES</span>
          </div>
          <div
            className="hidden sm:block cursor-pointer hover:opacity-80 transition-opacity duration-200"
            onClick={() => window.location.href = '/'}
          >
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-200">
              Enterprise Search
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">
              Unified Intelligence Terminal
            </p>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Connection Status */}
        <button
          onClick={() => setShowConnectionDashboard(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          title="Connection Status"
        >
          {getConnectionStatusIcon()}
          <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-300 transition-colors duration-200">
            {getConnectionStatusText()}
          </span>
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 relative">
          <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300 transition-colors duration-200" />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center animate-pulse">
            3
          </span>
        </button>

      

        {/* Settings */}
        <button
          onClick={() => setShowConnectionSettings(true)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          title="Connection Settings"
        >
          <Settings className="h-5 w-5 text-gray-600 dark:text-gray-300 transition-colors duration-200" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 ml-2">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Amar Kumar
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              amar.kumar@company.com
            </p>
          </div>
          <button className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors">
            <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Connection Status Dashboard */}
      <ConnectionStatusDashboard
        isOpen={showConnectionDashboard}
        onClose={() => setShowConnectionDashboard(false)}
      />

      {/* Connection Settings */}
      <ConnectionSettings
        isOpen={showConnectionSettings}
        onClose={() => setShowConnectionSettings(false)}
      />
    </header>
  );
}
