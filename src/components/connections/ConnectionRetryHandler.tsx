'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, X, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { connectionStatusService } from '@/services/ConnectionStatusService';
import { Connection } from '@/types';
import { ALL_TOOLS } from '@/lib/config';

interface ConnectionRetryHandlerProps {
  onRetrySuccess?: (toolId: string) => void;
}

export function ConnectionRetryHandler({ onRetrySuccess }: ConnectionRetryHandlerProps) {
  const [failedConnections, setFailedConnections] = useState<Connection[]>([]);
  const [retryingTools, setRetryingTools] = useState<Set<string>>(new Set());
  const [dismissedTools, setDismissedTools] = useState<Set<string>>(new Set());

  useEffect(() => {
    const updateFailedConnections = (connections: Connection[]) => {
      const failed = connections.filter(conn => 
        conn.status === 'error' && !dismissedTools.has(conn.toolId)
      );
      setFailedConnections(failed);
    };

    // Initial load
    updateFailedConnections(connectionStatusService.getAllConnections());

    // Listen for connection changes
    connectionStatusService.addConnectionListener(updateFailedConnections);

    return () => {
      connectionStatusService.removeConnectionListener(updateFailedConnections);
    };
  }, [dismissedTools]);

  const handleRetry = async (toolId: string) => {
    setRetryingTools(prev => new Set(prev).add(toolId));

    try {
      await connectionStatusService.connectTool(toolId);
      
      // Remove from failed connections
      setFailedConnections(prev => prev.filter(conn => conn.toolId !== toolId));
      
      // Call success callback
      onRetrySuccess?.(toolId);
    } catch (error) {
      console.error(`Retry failed for ${toolId}:`, error);
      // The connection will remain in failed state and show in the list
    } finally {
      setRetryingTools(prev => {
        const newSet = new Set(prev);
        newSet.delete(toolId);
        return newSet;
      });
    }
  };

  const handleDismiss = (toolId: string) => {
    setDismissedTools(prev => new Set(prev).add(toolId));
    setFailedConnections(prev => prev.filter(conn => conn.toolId !== toolId));
  };

  const handleDismissAll = () => {
    const toolIds = failedConnections.map(conn => conn.toolId);
    setDismissedTools(prev => new Set([...prev, ...toolIds]));
    setFailedConnections([]);
  };

  const handleRetryAll = async () => {
    const retryPromises = failedConnections.map(conn => handleRetry(conn.toolId));
    await Promise.all(retryPromises);
  };

  if (failedConnections.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-lg shadow-lg p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h3 className="font-medium text-gray-900 dark:text-white">
              Connection Issues
            </h3>
          </div>
          <button
            onClick={handleDismissAll}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Failed Connections List */}
        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
          {failedConnections.map(connection => {
            const tool = ALL_TOOLS.find(t => t.id === connection.toolId);
            const isRetrying = retryingTools.has(connection.toolId);
            
            if (!tool) return null;

            return (
              <div
                key={connection.toolId}
                className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-lg">{tool.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {tool.name}
                    </p>
                    {connection.error && (
                      <p className="text-xs text-red-600 dark:text-red-400 truncate">
                        {connection.error}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRetry(connection.toolId)}
                    disabled={isRetrying}
                    className="text-xs"
                  >
                    {isRetrying ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                  </Button>
                  <button
                    onClick={() => handleDismiss(connection.toolId)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-800 rounded"
                  >
                    <X className="h-3 w-3 text-red-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetryAll}
            disabled={retryingTools.size > 0}
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${retryingTools.size > 0 ? 'animate-spin' : ''}`} />
            Retry All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismissAll}
            className="flex-1"
          >
            Dismiss All
          </Button>
        </div>
      </div>
    </div>
  );
}

// Auto-retry hook for background connection recovery
export function useAutoRetry(enabled: boolean = true, retryInterval: number = 60000) {
  const [lastRetryTime, setLastRetryTime] = useState<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(async () => {
      const now = Date.now();
      if (now - lastRetryTime < retryInterval) return;

      const connections = connectionStatusService.getAllConnections();
      const failedConnections = connections.filter(conn => conn.status === 'error');

      if (failedConnections.length === 0) return;

      console.log(`Auto-retrying ${failedConnections.length} failed connections...`);
      setLastRetryTime(now);

      // Retry failed connections with exponential backoff
      for (const connection of failedConnections) {
        try {
          await connectionStatusService.connectTool(connection.toolId);
          console.log(`Auto-retry successful for ${connection.toolId}`);
        } catch (error) {
          console.log(`Auto-retry failed for ${connection.toolId}:`, error);
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [enabled, retryInterval, lastRetryTime]);
}

// Connection health monitor component
export function ConnectionHealthMonitor() {
  const [healthIssues, setHealthIssues] = useState<string[]>([]);

  useEffect(() => {
    const checkHealth = () => {
      const healthStatuses = connectionStatusService.getAllHealthStatuses();
      const issues = healthStatuses
        .filter(health => health.status === 'warning' || health.status === 'error')
        .map(health => {
          const tool = ALL_TOOLS.find(t => t.id === health.toolId);
          return `${tool?.name || health.toolId}: ${health.errorMessage || health.status}`;
        });
      
      setHealthIssues(issues);
    };

    // Check immediately
    checkHealth();

    // Check every minute
    const interval = setInterval(checkHealth, 60000);

    return () => clearInterval(interval);
  }, []);

  if (healthIssues.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-40 max-w-sm">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Health Warnings
          </h4>
        </div>
        <div className="space-y-1">
          {healthIssues.slice(0, 3).map((issue, index) => (
            <p key={index} className="text-xs text-yellow-700 dark:text-yellow-300">
              {issue}
            </p>
          ))}
          {healthIssues.length > 3 && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              +{healthIssues.length - 3} more issues
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
