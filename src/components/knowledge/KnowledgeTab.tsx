'use client';

import { useState } from 'react';
import { BarChart3, Settings, Users, Clock, TrendingUp, Database, Zap } from 'lucide-react';
import { ALL_TOOLS, TOOL_CATEGORIES } from '@/lib/config';
import { formatRelativeTime } from '@/lib/utils';

export function KnowledgeTab() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Mock data for connected tools
  const connectedTools = ALL_TOOLS.filter(tool => Math.random() > 0.6);
  const totalConnections = connectedTools.length;
  const totalTools = ALL_TOOLS.length;
  
  // Mock usage statistics
  const usageStats = {
    totalSearches: 1247,
    avgResponseTime: '0.8s',
    dataIndexed: '2.4TB',
    lastSync: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
  };

  const toolsByCategory = connectedTools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, typeof connectedTools>);

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Knowledge Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your connected tools, monitor usage, and optimize your search experience
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Database className="h-6 w-6" />}
            title="Connected Tools"
            value={`${totalConnections}/${totalTools}`}
            subtitle="Tools connected"
            color="blue"
          />
          <StatCard
            icon={<BarChart3 className="h-6 w-6" />}
            title="Total Searches"
            value={usageStats.totalSearches.toLocaleString()}
            subtitle="This month"
            color="green"
          />
          <StatCard
            icon={<Zap className="h-6 w-6" />}
            title="Avg Response Time"
            value={usageStats.avgResponseTime}
            subtitle="Search performance"
            color="yellow"
          />
          <StatCard
            icon={<TrendingUp className="h-6 w-6" />}
            title="Data Indexed"
            value={usageStats.dataIndexed}
            subtitle="Across all tools"
            color="purple"
          />
        </div>

        {/* Connection Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Connection Status
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              Last sync: {formatRelativeTime(usageStats.lastSync)}
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              All Categories
            </button>
            {Object.entries(TOOL_CATEGORIES).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  selectedCategory === key
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span>{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(toolsByCategory)
              .filter(([category]) => !selectedCategory || category === selectedCategory)
              .flatMap(([, tools]) => tools)
              .map(tool => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
          </div>

          {connectedTools.length === 0 && (
            <div className="text-center py-12">
              <Database className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No tools connected yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Connect your first tool to start searching across your data
              </p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Connect a Tool
              </button>
            </div>
          )}
        </div>

        {/* Usage Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Search Activity
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Today</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">47 searches</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">This week</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">312 searches</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">This month</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">1,247 searches</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Most Used Tools
            </h3>
            <div className="space-y-3">
              {connectedTools.slice(0, 5).map((tool, index) => (
                <div key={tool.id} className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400 w-4">
                    {index + 1}
                  </span>
                  <span className="text-lg">{tool.icon}</span>
                  <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
                    {tool.name}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {Math.floor(Math.random() * 100) + 20} searches
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}

function StatCard({ icon, title, value, subtitle, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
    green: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </h3>
      </div>
      <div className="mb-1">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </span>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {subtitle}
      </p>
    </div>
  );
}

interface ToolCardProps {
  tool: typeof ALL_TOOLS[0];
}

function ToolCard({ tool }: ToolCardProps) {
  const statusColors = {
    connected: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    disconnected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    connecting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{tool.icon}</span>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              {tool.name}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {TOOL_CATEGORIES[tool.category]?.name}
            </p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[tool.connectionStatus]}`}>
          {tool.connectionStatus}
        </span>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
        {tool.description}
      </p>
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">
          {tool.lastSync ? `Synced ${formatRelativeTime(tool.lastSync)}` : 'Never synced'}
        </span>
        <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
