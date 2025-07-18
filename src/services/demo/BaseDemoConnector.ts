import { SearchResult, Tool, ContentType } from '@/types';
import { generateId, sleep, randomDelay } from '@/lib/utils';

export interface DemoConnectionConfig {
  tool: Tool;
  connectionDelay: [number, number]; // min, max delay in ms
  searchDelay: [number, number];
  failureRate: number; // 0-1, probability of connection failure
  dataSize: 'small' | 'medium' | 'large';
}

export interface DemoSearchOptions {
  query?: string;
  maxResults?: number;
  contentTypes?: ContentType[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export abstract class BaseDemoConnector {
  protected config: DemoConnectionConfig;
  protected isConnected: boolean = false;
  protected lastSync?: Date;

  constructor(config: DemoConnectionConfig) {
    this.config = config;
  }

  async connect(): Promise<boolean> {
    const [minDelay, maxDelay] = this.config.connectionDelay;
    await randomDelay(minDelay, maxDelay);

    // Simulate connection failure
    if (Math.random() < this.config.failureRate) {
      throw new Error(`Failed to connect to ${this.config.tool.name}`);
    }

    this.isConnected = true;
    this.lastSync = new Date();
    return true;
  }

  async disconnect(): Promise<void> {
    await sleep(500);
    this.isConnected = false;
    this.lastSync = undefined;
  }

  async search(options: DemoSearchOptions = {}): Promise<SearchResult[]> {
    if (!this.isConnected) {
      throw new Error(`Not connected to ${this.config.tool.name}`);
    }

    const [minDelay, maxDelay] = this.config.searchDelay;
    await randomDelay(minDelay, maxDelay);

    const results = await this.generateSearchResults(options);
    return this.filterResults(results, options);
  }

  async sync(): Promise<void> {
    if (!this.isConnected) {
      throw new Error(`Not connected to ${this.config.tool.name}`);
    }

    await randomDelay(1000, 3000);
    this.lastSync = new Date();
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      lastSync: this.lastSync,
      tool: this.config.tool
    };
  }

  // Abstract methods to be implemented by specific connectors
  protected abstract generateSearchResults(options: DemoSearchOptions): Promise<SearchResult[]>;
  
  // Optional methods that can be overridden
  protected async generateRecentItems(limit: number = 10): Promise<SearchResult[]> {
    const allResults = await this.generateSearchResults({ maxResults: 50 });
    return allResults
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  protected async generatePopularItems(limit: number = 10): Promise<SearchResult[]> {
    const allResults = await this.generateSearchResults({ maxResults: 50 });
    return allResults
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  protected filterResults(results: SearchResult[], options: DemoSearchOptions): SearchResult[] {
    let filtered = results;

    // Filter by query
    if (options.query) {
      const query = options.query.toLowerCase();
      filtered = filtered.filter(result =>
        result.title.toLowerCase().includes(query) ||
        result.content.toLowerCase().includes(query) ||
        result.author?.toLowerCase().includes(query)
      );
    }

    // Filter by content types
    if (options.contentTypes && options.contentTypes.length > 0) {
      filtered = filtered.filter(result =>
        options.contentTypes!.includes(result.type)
      );
    }

    // Filter by date range
    if (options.dateRange) {
      filtered = filtered.filter(result =>
        result.timestamp >= options.dateRange!.start &&
        result.timestamp <= options.dateRange!.end
      );
    }

    // Limit results
    if (options.maxResults) {
      filtered = filtered.slice(0, options.maxResults);
    }

    return filtered;
  }

  protected createSearchResult(data: {
    title: string;
    content: string;
    type: ContentType;
    author?: string;
    timestamp?: Date;
    url?: string;
    metadata?: Record<string, any>;
  }): SearchResult {
    return {
      id: generateId(),
      title: data.title,
      content: data.content,
      tool: this.config.tool,
      type: data.type,
      url: data.url || `https://${this.config.tool.name.toLowerCase().replace(' ', '')}.com/item/${generateId()}`,
      timestamp: data.timestamp || new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      author: data.author,
      relevanceScore: Math.random() * 100,
      metadata: data.metadata
    };
  }

  protected getDataSize(): number {
    switch (this.config.dataSize) {
      case 'small': return 10 + Math.floor(Math.random() * 20); // 10-30 items
      case 'medium': return 30 + Math.floor(Math.random() * 70); // 30-100 items
      case 'large': return 100 + Math.floor(Math.random() * 400); // 100-500 items
      default: return 50;
    }
  }

  protected getRandomAuthor(): string {
    const authors = [
      'John Smith', 'Sarah Johnson', 'Mike Chen', 'Emily Davis',
      'David Wilson', 'Lisa Anderson', 'Chris Brown', 'Amanda Taylor',
      'Ryan Martinez', 'Jessica Garcia', 'Kevin Lee', 'Michelle White',
      'Daniel Rodriguez', 'Ashley Thompson', 'Matthew Clark', 'Jennifer Lewis'
    ];
    return authors[Math.floor(Math.random() * authors.length)];
  }

  protected getRandomTimestamp(): Date {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    return new Date(thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo));
  }

  protected getRandomPriority(): 'low' | 'medium' | 'high' {
    const priorities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
    return priorities[Math.floor(Math.random() * priorities.length)];
  }

  protected getRandomStatus(): string {
    const statuses = ['Open', 'In Progress', 'Review', 'Done', 'Closed'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  protected getRandomTags(): string[] {
    const allTags = [
      'urgent', 'important', 'review', 'planning', 'meeting',
      'project', 'client', 'team', 'bug', 'feature', 'documentation',
      'testing', 'deployment', 'security', 'performance'
    ];
    
    const numTags = Math.floor(Math.random() * 4); // 0-3 tags
    const selectedTags: string[] = [];
    
    for (let i = 0; i < numTags; i++) {
      const tag = allTags[Math.floor(Math.random() * allTags.length)];
      if (!selectedTags.includes(tag)) {
        selectedTags.push(tag);
      }
    }
    
    return selectedTags;
  }

  protected getRandomDepartment(): string {
    const departments = [
      'Engineering', 'Marketing', 'Sales', 'HR', 'Finance',
      'Operations', 'Design', 'Product', 'Legal', 'Support'
    ];
    return departments[Math.floor(Math.random() * departments.length)];
  }
}
