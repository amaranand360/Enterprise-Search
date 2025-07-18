'use client';

import { useState } from 'react';
import { Search, Database, Plus, Wifi, WifiOff, Loader2, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALL_TOOLS, TOOL_CATEGORIES } from '@/lib/config';
import { Tool } from '@/types';
import { ConnectionModal } from '@/components/connections/ConnectionModal';
import { demoConnectorManager } from '@/services/demo/DemoConnectorManager';
import { connectionStatusService } from '@/services/ConnectionStatusService';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab: 'search' | 'knowledge';
  onTabChange: (tab: 'search' | 'knowledge') => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export function Sidebar({ isOpen, onToggle, activeTab, onTabChange, isExpanded, onToggleExpanded }: SidebarProps) {
  const [tools, setTools] = useState(ALL_TOOLS);
  const [connectingTool, setConnectingTool] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [showConnectionModal, setShowConnectionModal] = useState(false);

  const handleToolConnection = async (toolId: string) => {
    const tool = tools.find(t => t.id === toolId);
    if (!tool) return;

    if (tool.isConnected) {
      // Disconnect
      try {
        await connectionStatusService.disconnectTool(toolId);
      } catch (error) {
        console.error(`Failed to disconnect tool ${toolId}:`, error);
      }

      setTools(prevTools =>
        prevTools.map(t =>
          t.id === toolId
            ? {
                ...t,
                isConnected: false,
                connectionStatus: 'disconnected',
                lastSync: undefined
              }
            : t
        )
      );
    } else {
      // Show connection modal
      setSelectedTool(tool);
      setShowConnectionModal(true);
    }
  };

  const handleConnectionComplete = async (toolId: string, success: boolean) => {
    if (success) {
      try {
        await connectionStatusService.connectTool(toolId);
      } catch (error) {
        console.error(`Failed to connect tool ${toolId}:`, error);
      }

      setTools(prevTools =>
        prevTools.map(tool =>
          tool.id === toolId
            ? {
                ...tool,
                isConnected: true,
                connectionStatus: 'connected',
                lastSync: new Date()
              }
            : tool
        )
      );
    }
    setShowConnectionModal(false);
    setSelectedTool(null);
  };

  const connectedTools = tools.filter(tool => tool.isConnected);
  const availableTools = tools.filter(tool => !tool.isConnected);

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-all duration-200 ease-in-out flex flex-col shadow-sm dark:shadow-gray-900/20",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        isExpanded ? "w-80" : "w-16 lg:w-16"
      )}>
        {/* Header with Toggle */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            {isExpanded && (
              <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Enterprise Search
              </h2>
            )}
            <button
              onClick={onToggleExpanded}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 group"
              title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
            >
              <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200" />
            </button>
          </div>

          {/* Tab Navigation */}
          {isExpanded ? (
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => onTabChange('search')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                  activeTab === 'search'
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <Search className="h-4 w-4" />
                Search
              </button>
              <button
                onClick={() => onTabChange('knowledge')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                  activeTab === 'knowledge'
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <Database className="h-4 w-4" />
                Knowledge
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onTabChange('search')}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  activeTab === 'search'
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                title="Search"
              >
                <Search className="h-5 w-5" />
              </button>
              <button
                onClick={() => onTabChange('knowledge')}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  activeTab === 'knowledge'
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                title="Knowledge"
              >
                <Database className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'search' ? (
            <SearchSidebarContent
              connectedTools={connectedTools}
              availableTools={availableTools}
              onToolConnection={handleToolConnection}
              isExpanded={isExpanded}
            />
          ) : (
            <KnowledgeSidebarContent
              connectedTools={connectedTools}
              isExpanded={isExpanded}
            />
          )}
        </div>
      </div>

      {/* Connection Modal */}
      <ConnectionModal
        isOpen={showConnectionModal}
        onClose={() => {
          setShowConnectionModal(false);
          setSelectedTool(null);
        }}
        tool={selectedTool}
        onConnectionComplete={handleConnectionComplete}
      />
    </>
  );
}

interface SearchSidebarContentProps {
  connectedTools: Tool[];
  availableTools: Tool[];
  onToolConnection: (toolId: string) => void;
  isExpanded: boolean;
}

function SearchSidebarContent({
  connectedTools,
  availableTools,
  onToolConnection,
  isExpanded
}: SearchSidebarContentProps) {
  if (!isExpanded) {
    // Collapsed view - show only icons
    return (
      <div className="space-y-2">
        {connectedTools.slice(0, 8).map(tool => (
          <button
            key={tool.id}
            onClick={() => onToolConnection(tool.id)}
            className="w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={tool.name}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm mx-auto"
              style={{ backgroundColor: tool.color }}
            >
              {tool.icon}
            </div>
          </button>
        ))}
        {availableTools.slice(0, 4).map(tool => (
          <button
            key={tool.id}
            onClick={() => onToolConnection(tool.id)}
            className="w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors opacity-60"
            title={`Connect to ${tool.name}`}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm mx-auto"
              style={{ backgroundColor: tool.color }}
            >
              {tool.icon}
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connected Tools */}
      {connectedTools.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Connected Tools ({connectedTools.length})
          </h3>
          <div className="space-y-2">
            {connectedTools.map(tool => (
              <ToolItem
                key={tool.id}
                tool={tool}
                onToggle={() => onToolConnection(tool.id)}
                isExpanded={isExpanded}
              />
            ))}
          </div>
        </div>
      )}

      {/* Available Tools */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Available Tools ({availableTools.length})
        </h3>
        <div className="space-y-2">
          {availableTools.map(tool => (
            <ToolItem
              key={tool.id}
              tool={tool}
              onToggle={() => onToolConnection(tool.id)}
              isExpanded={isExpanded}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface KnowledgeSidebarContentProps {
  connectedTools: Tool[];
  isExpanded: boolean;
}

function KnowledgeSidebarContent({ connectedTools, isExpanded }: KnowledgeSidebarContentProps) {
  const toolsByCategory = connectedTools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, Tool[]>);

  if (!isExpanded) {
    // Collapsed view - show only category icons
    return (
      <div className="space-y-2">
        <div className="text-center py-4">
          <Database className="h-8 w-8 text-gray-400 mx-auto" />
        </div>
        {Object.entries(toolsByCategory).slice(0, 6).map(([category, tools]) => (
          <div
            key={category}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center"
            title={`${TOOL_CATEGORIES[category as keyof typeof TOOL_CATEGORIES]?.name} (${tools.length})`}
          >
            <span className="text-lg">
              {TOOL_CATEGORIES[category as keyof typeof TOOL_CATEGORIES]?.icon}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Knowledge Management
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage your connected tools and data sources
        </p>
      </div>

      {Object.entries(toolsByCategory).map(([category, tools]) => (
        <div key={category}>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <span>{TOOL_CATEGORIES[category as keyof typeof TOOL_CATEGORIES]?.icon}</span>
            {TOOL_CATEGORIES[category as keyof typeof TOOL_CATEGORIES]?.name}
          </h4>
          <div className="space-y-1">
            {tools.map(tool => (
              <div key={tool.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                <span className="text-lg">{tool.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{tool.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {tool.lastSync ? `Synced ${new Date(tool.lastSync).toLocaleDateString()}` : 'Never synced'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface ToolItemProps {
  tool: Tool;
  onToggle: () => void;
  isExpanded: boolean;
}

function ToolItem({ tool, onToggle, isExpanded }: ToolItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <span className="text-xl">{tool.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {tool.name}
          </p>
          {tool.isDemo && (
            <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded">
              Demo
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {tool.description}
        </p>
      </div>
      <button
        onClick={onToggle}
        className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        title={tool.isConnected ? 'Disconnect' : 'Connect'}
      >
        {tool.isConnected ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-gray-400" />
        )}
      </button>
    </div>
  );
}
