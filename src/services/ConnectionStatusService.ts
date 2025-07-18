'use client';

import { Tool, Connection } from '@/types';
import { ALL_TOOLS } from '@/lib/config';
import { googleAuth } from './googleAuth';
import { demoConnectorManager } from './demo/DemoConnectorManager';

export interface ConnectionHealth {
  toolId: string;
  status: 'healthy' | 'warning' | 'error' | 'disconnected';
  lastCheck: Date;
  responseTime?: number;
  errorMessage?: string;
  uptime?: number;
  lastSync?: Date;
}

export interface ConnectionStats {
  totalTools: number;
  connectedTools: number;
  healthyConnections: number;
  warningConnections: number;
  errorConnections: number;
  averageResponseTime: number;
  totalUptime: number;
}

export class ConnectionStatusService {
  private static instance: ConnectionStatusService;
  private connections: Map<string, Connection> = new Map();
  private healthChecks: Map<string, ConnectionHealth> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(connections: Connection[]) => void> = new Set();

  private constructor() {
    this.initializeConnections();
    this.startHealthChecking();
  }

  static getInstance(): ConnectionStatusService {
    if (!ConnectionStatusService.instance) {
      ConnectionStatusService.instance = new ConnectionStatusService();
    }
    return ConnectionStatusService.instance;
  }

  private initializeConnections(): void {
    ALL_TOOLS.forEach(tool => {
      this.connections.set(tool.id, {
        toolId: tool.id,
        status: 'disconnected',
        lastSync: undefined,
        error: undefined
      });

      this.healthChecks.set(tool.id, {
        toolId: tool.id,
        status: 'disconnected',
        lastCheck: new Date()
      });
    });
  }

  private startHealthChecking(): void {
    // Check health every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, 30000);

    // Initial health check
    this.performHealthChecks();
  }

  private async performHealthChecks(): Promise<void> {
    const connectedTools = Array.from(this.connections.values())
      .filter(conn => conn.status === 'connected')
      .map(conn => conn.toolId);

    for (const toolId of connectedTools) {
      try {
        const startTime = Date.now();
        await this.checkToolHealth(toolId);
        const responseTime = Date.now() - startTime;

        this.updateHealthStatus(toolId, {
          status: 'healthy',
          lastCheck: new Date(),
          responseTime,
          uptime: this.calculateUptime(toolId)
        });
      } catch (error) {
        this.updateHealthStatus(toolId, {
          status: 'error',
          lastCheck: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  private async checkToolHealth(toolId: string): Promise<void> {
    const tool = ALL_TOOLS.find(t => t.id === toolId);
    if (!tool) {
      throw new Error(`Tool ${toolId} not found`);
    }

    if (tool.isDemo) {
      // Check demo connector health
      const status = demoConnectorManager.getConnectionStatus(toolId);
      if (!status.isConnected) {
        throw new Error('Demo connector is not connected');
      }
      
      // Perform a quick search to test functionality
      await demoConnectorManager.searchTool(toolId, { maxResults: 1 });
    } else {
      // Check Google services health
      if (!googleAuth.isSignedIn()) {
        throw new Error('Google authentication expired');
      }

      const credentials = googleAuth.getCredentials();
      if (!credentials || credentials.expiry_date <= Date.now()) {
        throw new Error('Google credentials expired');
      }

      // Perform a simple API call to test connectivity
      await this.testGoogleServiceHealth(toolId);
    }
  }

  private async testGoogleServiceHealth(toolId: string): Promise<void> {
    switch (toolId) {
      case 'gmail':
        await googleAuth.makeAuthenticatedRequest('https://gmail.googleapis.com/gmail/v1/users/me/profile');
        break;
      case 'google-calendar':
        await googleAuth.makeAuthenticatedRequest('https://www.googleapis.com/calendar/v3/users/me/calendarList');
        break;
      case 'google-drive':
        await googleAuth.makeAuthenticatedRequest('https://www.googleapis.com/drive/v3/about?fields=user');
        break;
      default:
        // For other Google services, just check if we have valid credentials
        break;
    }
  }

  private calculateUptime(toolId: string): number {
    const connection = this.connections.get(toolId);
    if (!connection || !connection.lastSync) {
      return 0;
    }

    const now = Date.now();
    const connectedTime = connection.lastSync.getTime();
    return now - connectedTime;
  }

  private updateHealthStatus(toolId: string, updates: Partial<ConnectionHealth>): void {
    const current = this.healthChecks.get(toolId);
    if (current) {
      this.healthChecks.set(toolId, { ...current, ...updates });
    }
  }

  async connectTool(toolId: string): Promise<void> {
    const tool = ALL_TOOLS.find(t => t.id === toolId);
    if (!tool) {
      throw new Error(`Tool ${toolId} not found`);
    }

    this.updateConnectionStatus(toolId, 'connecting');

    try {
      if (tool.isDemo) {
        await demoConnectorManager.connectTool(toolId);
      } else {
        // Handle Google services connection
        if (!googleAuth.isSignedIn()) {
          await googleAuth.signIn();
        }
      }

      this.updateConnectionStatus(toolId, 'connected', new Date());
      this.updateHealthStatus(toolId, {
        status: 'healthy',
        lastCheck: new Date()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      this.updateConnectionStatus(toolId, 'error', undefined, errorMessage);
      this.updateHealthStatus(toolId, {
        status: 'error',
        lastCheck: new Date(),
        errorMessage
      });
      throw error;
    }
  }

  async disconnectTool(toolId: string): Promise<void> {
    const tool = ALL_TOOLS.find(t => t.id === toolId);
    if (!tool) {
      throw new Error(`Tool ${toolId} not found`);
    }

    try {
      if (tool.isDemo) {
        await demoConnectorManager.disconnectTool(toolId);
      } else {
        // Handle Google services disconnection
        // Note: We don't sign out of Google entirely as other tools might be using it
      }

      this.updateConnectionStatus(toolId, 'disconnected');
      this.updateHealthStatus(toolId, {
        status: 'disconnected',
        lastCheck: new Date()
      });
    } catch (error) {
      console.error(`Failed to disconnect ${toolId}:`, error);
      // Still mark as disconnected even if cleanup failed
      this.updateConnectionStatus(toolId, 'disconnected');
    }
  }

  private updateConnectionStatus(
    toolId: string, 
    status: Connection['status'], 
    lastSync?: Date, 
    error?: string
  ): void {
    const connection = this.connections.get(toolId);
    if (connection) {
      const updated: Connection = {
        ...connection,
        status,
        lastSync,
        error
      };
      this.connections.set(toolId, updated);
      this.notifyListeners();
    }
  }

  getConnection(toolId: string): Connection | undefined {
    return this.connections.get(toolId);
  }

  getAllConnections(): Connection[] {
    return Array.from(this.connections.values());
  }

  getConnectedTools(): Connection[] {
    return Array.from(this.connections.values())
      .filter(conn => conn.status === 'connected');
  }

  getHealthStatus(toolId: string): ConnectionHealth | undefined {
    return this.healthChecks.get(toolId);
  }

  getAllHealthStatuses(): ConnectionHealth[] {
    return Array.from(this.healthChecks.values());
  }

  getConnectionStats(): ConnectionStats {
    const connections = this.getAllConnections();
    const healthStatuses = this.getAllHealthStatuses();

    const connectedTools = connections.filter(conn => conn.status === 'connected').length;
    const healthyConnections = healthStatuses.filter(health => health.status === 'healthy').length;
    const warningConnections = healthStatuses.filter(health => health.status === 'warning').length;
    const errorConnections = healthStatuses.filter(health => health.status === 'error').length;

    const responseTimes = healthStatuses
      .filter(health => health.responseTime !== undefined)
      .map(health => health.responseTime!);
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    const uptimes = healthStatuses
      .filter(health => health.uptime !== undefined)
      .map(health => health.uptime!);
    const totalUptime = uptimes.reduce((sum, uptime) => sum + uptime, 0);

    return {
      totalTools: connections.length,
      connectedTools,
      healthyConnections,
      warningConnections,
      errorConnections,
      averageResponseTime,
      totalUptime
    };
  }

  addConnectionListener(listener: (connections: Connection[]) => void): void {
    this.listeners.add(listener);
  }

  removeConnectionListener(listener: (connections: Connection[]) => void): void {
    this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const connections = this.getAllConnections();
    this.listeners.forEach(listener => {
      try {
        listener(connections);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  async syncTool(toolId: string): Promise<void> {
    const connection = this.connections.get(toolId);
    if (!connection || connection.status !== 'connected') {
      throw new Error(`Tool ${toolId} is not connected`);
    }

    try {
      const tool = ALL_TOOLS.find(t => t.id === toolId);
      if (tool?.isDemo) {
        await demoConnectorManager.syncTool(toolId);
      }
      
      this.updateConnectionStatus(toolId, 'connected', new Date());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      this.updateConnectionStatus(toolId, 'error', undefined, errorMessage);
      throw error;
    }
  }

  async syncAllConnectedTools(): Promise<void> {
    const connectedTools = this.getConnectedTools();
    const syncPromises = connectedTools.map(async (connection) => {
      try {
        await this.syncTool(connection.toolId);
      } catch (error) {
        console.error(`Sync failed for ${connection.toolId}:`, error);
      }
    });

    await Promise.all(syncPromises);
  }

  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.listeners.clear();
  }
}

export const connectionStatusService = ConnectionStatusService.getInstance();
