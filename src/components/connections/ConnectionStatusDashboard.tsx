'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  Zap,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { connectionStatusService, ConnectionHealth, ConnectionStats } from '@/services/ConnectionStatusService';
import { Connection } from '@/types';
import { ALL_TOOLS } from '@/lib/config';
import { formatRelativeTime, formatFileSize } from '@/lib/utils';

interface ConnectionStatusDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectionStatusDashboard({ isOpen, onClose }: ConnectionStatusDashboardProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [healthStatuses, setHealthStatuses] = useState<ConnectionHealth[]>([]);
  const [stats, setStats] = useState<ConnectionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadData = () => {
      setConnections(connectionStatusService.getAllConnections());
      setHealthStatuses(connectionStatusService.getAllHealthStatuses());
      setStats(connectionStatusService.getConnectionStats());
      setIsLoading(false);
    };

    // Initial load
    loadData();

    // Set up listener for connection changes
    const handleConnectionChange = (updatedConnections: Connection[]) => {
      setConnections(updatedConnections);
      setStats(connectionStatusService.getConnectionStats());
    };

    connectionStatusService.addConnectionListener(handleConnectionChange);

    // Refresh data every 10 seconds
    const interval = setInterval(() => {
      setHealthStatuses(connectionStatusService.getAllHealthStatuses());
      setStats(connectionStatusService.getConnectionStats());
    }, 10000);

    return () => {
      connectionStatusService.removeConnectionListener(handleConnectionChange);
      clearInterval(interval);
    };
  }, [isOpen]);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      await connectionStatusService.syncAllConnectedTools();
      setConnections(connectionStatusService.getAllConnections());
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncTool = async (toolId: string) => {
    try {
      await connectionStatusService.syncTool(toolId);
      setConnections(connectionStatusService.getAllConnections());
    } catch (error) {
      console.error(`Sync failed for ${toolId}:`, error);
    }
  };

  const getStatusIcon = (status: Connection['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-400" />;
    }
  };

  const getHealthIcon = (status: ConnectionHealth['status']) => {
    switch (status) {
      case 'healthy':
        return <Activity className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadgeVariant = (status: Connection['status']) => {
    switch (status) {
      case 'connected':
        return 'success';
      case 'connecting':
        return 'info';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Wifi className="h-6 w-6 text-blue-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Connection Status
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Monitor and manage your tool connections
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncAll}
              disabled={isSyncing}
              loading={isSyncing}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync All
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.connectedTools}/{stats.totalTools}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Connected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.healthyConnections}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Healthy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(stats.averageResponseTime)}ms
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Avg Response</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(stats.totalUptime / (1000 * 60 * 60))}h
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Uptime</div>
              </div>
            </div>
          </div>
        )}

        {/* Connection List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <LoadingSpinner text="Loading connection status..." />
          ) : (
            <div className="space-y-4">
              {connections.map(connection => {
                const tool = ALL_TOOLS.find(t => t.id === connection.toolId);
                const health = healthStatuses.find(h => h.toolId === connection.toolId);
                
                if (!tool) return null;

                return (
                  <div
                    key={connection.toolId}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg"
                        style={{ backgroundColor: tool.color }}
                      >
                        {tool.icon}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {tool.name}
                          </h3>
                          <Badge 
                            variant={getStatusBadgeVariant(connection.status)}
                            size="sm"
                          >
                            {connection.status}
                          </Badge>
                          {tool.isDemo && (
                            <Badge variant="secondary" size="sm">Demo</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            {getStatusIcon(connection.status)}
                            <span>
                              {connection.lastSync 
                                ? `Synced ${formatRelativeTime(connection.lastSync)}`
                                : 'Never synced'
                              }
                            </span>
                          </div>
                          
                          {health && health.responseTime && (
                            <div className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              <span>{health.responseTime}ms</span>
                            </div>
                          )}
                          
                          {health && health.uptime && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{Math.round(health.uptime / (1000 * 60))}m uptime</span>
                            </div>
                          )}
                        </div>
                        
                        {connection.error && (
                          <div className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {connection.error}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {health && (
                        <div className="flex items-center gap-1">
                          {getHealthIcon(health.status)}
                          <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                            {health.status}
                          </span>
                        </div>
                      )}
                      
                      {connection.status === 'connected' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSyncTool(connection.toolId)}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Sync
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
