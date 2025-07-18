import { Tool, SearchResult } from '@/types';
import { DEMO_TOOLS } from '@/lib/config';
import { BaseDemoConnector, DemoConnectionConfig, DemoSearchOptions } from './BaseDemoConnector';
import { SlackDemoConnector } from './SlackDemoConnector';
import { JiraDemoConnector } from './JiraDemoConnector';
import { GitHubDemoConnector } from './GitHubDemoConnector';

export class DemoConnectorManager {
  private static instance: DemoConnectorManager;
  private connectors: Map<string, BaseDemoConnector> = new Map();
  private connectionStates: Map<string, boolean> = new Map();

  private constructor() {
    this.initializeConnectors();
  }

  static getInstance(): DemoConnectorManager {
    if (!DemoConnectorManager.instance) {
      DemoConnectorManager.instance = new DemoConnectorManager();
    }
    return DemoConnectorManager.instance;
  }

  private initializeConnectors(): void {
    DEMO_TOOLS.forEach(tool => {
      const config: DemoConnectionConfig = {
        tool,
        connectionDelay: [1500, 3000],
        searchDelay: [300, 800],
        failureRate: 0.05, // 5% failure rate for realism
        dataSize: this.getDataSizeForTool(tool.id)
      };

      const connector = this.createConnectorForTool(tool.id, config);
      if (connector) {
        this.connectors.set(tool.id, connector);
        this.connectionStates.set(tool.id, false);
      }
    });
  }

  private getDataSizeForTool(toolId: string): 'small' | 'medium' | 'large' {
    // Different tools have different amounts of typical data
    const largeSizeTools = ['slack', 'gmail', 'github', 'jira'];
    const mediumSizeTools = ['microsoft-teams', 'asana', 'notion', 'confluence'];
    
    if (largeSizeTools.includes(toolId)) return 'large';
    if (mediumSizeTools.includes(toolId)) return 'medium';
    return 'small';
  }

  private createConnectorForTool(toolId: string, config: DemoConnectionConfig): BaseDemoConnector | null {
    switch (toolId) {
      case 'slack':
        return new SlackDemoConnector(config);
      case 'jira':
        return new JiraDemoConnector(config);
      case 'github':
        return new GitHubDemoConnector(config);
      // Add more connectors as they are implemented
      default:
        // Return a generic connector for tools not yet implemented
        return new GenericDemoConnector(config);
    }
  }

  async connectTool(toolId: string): Promise<boolean> {
    const connector = this.connectors.get(toolId);
    if (!connector) {
      throw new Error(`No connector found for tool: ${toolId}`);
    }

    try {
      await connector.connect();
      this.connectionStates.set(toolId, true);
      return true;
    } catch (error) {
      this.connectionStates.set(toolId, false);
      throw error;
    }
  }

  async disconnectTool(toolId: string): Promise<void> {
    const connector = this.connectors.get(toolId);
    if (!connector) {
      throw new Error(`No connector found for tool: ${toolId}`);
    }

    await connector.disconnect();
    this.connectionStates.set(toolId, false);
  }

  async searchTool(toolId: string, options: DemoSearchOptions = {}): Promise<SearchResult[]> {
    const connector = this.connectors.get(toolId);
    if (!connector) {
      throw new Error(`No connector found for tool: ${toolId}`);
    }

    return await connector.search(options);
  }

  async searchAllConnectedTools(options: DemoSearchOptions = {}): Promise<SearchResult[]> {
    const connectedTools = Array.from(this.connectionStates.entries())
      .filter(([, isConnected]) => isConnected)
      .map(([toolId]) => toolId);

    const searchPromises = connectedTools.map(async (toolId) => {
      try {
        return await this.searchTool(toolId, options);
      } catch (error) {
        console.error(`Search failed for ${toolId}:`, error);
        return [];
      }
    });

    const results = await Promise.all(searchPromises);
    return results.flat().sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  async syncTool(toolId: string): Promise<void> {
    const connector = this.connectors.get(toolId);
    if (!connector) {
      throw new Error(`No connector found for tool: ${toolId}`);
    }

    await connector.sync();
  }

  async syncAllConnectedTools(): Promise<void> {
    const connectedTools = Array.from(this.connectionStates.entries())
      .filter(([, isConnected]) => isConnected)
      .map(([toolId]) => toolId);

    const syncPromises = connectedTools.map(async (toolId) => {
      try {
        await this.syncTool(toolId);
      } catch (error) {
        console.error(`Sync failed for ${toolId}:`, error);
      }
    });

    await Promise.all(syncPromises);
  }

  getConnectionStatus(toolId: string): { isConnected: boolean; lastSync?: Date } {
    const connector = this.connectors.get(toolId);
    const isConnected = this.connectionStates.get(toolId) || false;
    
    if (!connector) {
      return { isConnected: false };
    }

    const status = connector.getConnectionStatus();
    return {
      isConnected,
      lastSync: status.lastSync
    };
  }

  getAllConnectionStatuses(): Record<string, { isConnected: boolean; lastSync?: Date }> {
    const statuses: Record<string, { isConnected: boolean; lastSync?: Date }> = {};
    
    for (const toolId of this.connectors.keys()) {
      statuses[toolId] = this.getConnectionStatus(toolId);
    }
    
    return statuses;
  }

  getConnectedTools(): string[] {
    return Array.from(this.connectionStates.entries())
      .filter(([, isConnected]) => isConnected)
      .map(([toolId]) => toolId);
  }

  getAvailableTools(): string[] {
    return Array.from(this.connectors.keys());
  }

  // Tool-specific methods
  async getSlackChannels(): Promise<string[]> {
    const connector = this.connectors.get('slack') as SlackDemoConnector;
    if (!connector) {
      throw new Error('Slack connector not found');
    }
    return await connector.getChannels();
  }

  async getJiraProjects(): Promise<string[]> {
    const connector = this.connectors.get('jira') as JiraDemoConnector;
    if (!connector) {
      throw new Error('Jira connector not found');
    }
    return await connector.getProjects();
  }

  async getGitHubRepositories(): Promise<string[]> {
    const connector = this.connectors.get('github') as GitHubDemoConnector;
    if (!connector) {
      throw new Error('GitHub connector not found');
    }
    return await connector.getRepositories();
  }
}

// Generic connector for tools that don't have specific implementations yet
class GenericDemoConnector extends BaseDemoConnector {
  protected async generateSearchResults(options: DemoSearchOptions): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const dataSize = Math.min(this.getDataSize(), 20); // Limit generic results

    const contentTypes = ['document', 'message', 'task', 'file'];
    const genericTitles = [
      'Project Update Document',
      'Team Meeting Notes',
      'Client Feedback Summary',
      'Weekly Status Report',
      'Process Documentation',
      'Training Materials',
      'Policy Guidelines',
      'Performance Metrics',
      'Budget Analysis',
      'Strategic Planning'
    ];

    const genericContent = [
      'This document contains important information about ongoing projects and initiatives.',
      'Meeting summary with key decisions and action items for the team.',
      'Comprehensive feedback from client interactions and recommendations.',
      'Weekly progress report covering all major activities and milestones.',
      'Detailed documentation of current processes and procedures.',
      'Training materials for new team members and skill development.',
      'Company policies and guidelines for employee reference.',
      'Performance metrics and KPI analysis for the current quarter.',
      'Financial analysis and budget allocation for upcoming projects.',
      'Strategic planning documents for long-term business objectives.'
    ];

    for (let i = 0; i < dataSize; i++) {
      const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)] as any;
      const title = genericTitles[Math.floor(Math.random() * genericTitles.length)];
      const content = genericContent[Math.floor(Math.random() * genericContent.length)];

      const result = this.createSearchResult({
        title,
        content,
        type: contentType,
        author: this.getRandomAuthor(),
        timestamp: this.getRandomTimestamp(),
        metadata: {
          priority: this.getRandomPriority(),
          tags: this.getRandomTags(),
          department: this.getRandomDepartment()
        }
      });

      results.push(result);
    }

    return results;
  }
}

export const demoConnectorManager = DemoConnectorManager.getInstance();
