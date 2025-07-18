import { SearchResult } from '@/types';
import { BaseDemoConnector, DemoSearchOptions } from './BaseDemoConnector';

export class JiraDemoConnector extends BaseDemoConnector {
  private projects = ['PROJ', 'ALPHA', 'BETA', 'GAMMA', 'DELTA', 'WEB', 'API', 'MOBILE'];
  private issueTypes = ['Bug', 'Feature', 'Task', 'Story', 'Epic', 'Improvement'];
  private statuses = ['To Do', 'In Progress', 'Code Review', 'Testing', 'Done', 'Closed'];
  private priorities = ['Lowest', 'Low', 'Medium', 'High', 'Highest'];

  private titleTemplates = [
    'Fix login authentication issue',
    'Implement new dashboard design',
    'Add search functionality to user list',
    'Optimize database queries for performance',
    'Create API documentation',
    'Fix responsive layout on mobile',
    'Add unit tests for payment module',
    'Implement user role management',
    'Fix memory leak in background service',
    'Add export functionality to reports',
    'Update security headers configuration',
    'Implement real-time notifications',
    'Add dark mode support',
    'Fix pagination in data tables',
    'Implement OAuth 2.0 authentication',
    'Add file upload functionality',
    'Fix cross-browser compatibility issues',
    'Implement caching mechanism',
    'Add email notification system',
    'Fix performance issues in search'
  ];

  private descriptionTemplates = [
    'As a user, I want to be able to {action} so that I can {benefit}.',
    'The current implementation has issues with {problem}. We need to {solution}.',
    'This feature request came from the client meeting on {date}. Priority is {priority}.',
    'Bug reported by QA team. Steps to reproduce: {steps}. Expected: {expected}. Actual: {actual}.',
    'Technical debt item. Current code is {issue} and needs to be refactored to {improvement}.',
    'Performance improvement needed. Current response time is {current}, target is {target}.',
    'Security vulnerability found in {component}. Risk level: {risk}. Needs immediate attention.',
    'Integration with {system} is failing. Error: {error}. Need to investigate and fix.',
    'User feedback indicates that {feedback}. We should implement {solution}.',
    'Code review revealed {issue}. Needs to be addressed before deployment.'
  ];

  protected async generateSearchResults(options: DemoSearchOptions): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const dataSize = this.getDataSize();

    for (let i = 0; i < dataSize; i++) {
      const project = this.getRandomProject();
      const ticketNumber = Math.floor(Math.random() * 1000) + 1;
      const issueKey = `${project}-${ticketNumber}`;
      const issueType = this.getRandomIssueType();
      const status = this.getRandomStatus();
      const priority = this.getRandomPriority();
      const assignee = this.getRandomAuthor();
      const reporter = this.getRandomAuthor();
      const title = this.getRandomTitle();
      const description = this.getRandomDescription();
      const timestamp = this.getRandomTimestamp();

      const result = this.createSearchResult({
        title: `${issueKey}: ${title}`,
        content: description,
        type: 'issue',
        author: assignee,
        timestamp,
        metadata: {
          issueKey,
          project,
          issueType,
          status,
          priority,
          assignee,
          reporter,
          storyPoints: this.getRandomStoryPoints(),
          sprint: this.getRandomSprint(),
          components: this.getRandomComponents(),
          labels: this.getRandomTags(),
          department: this.getRandomDepartment(),
          estimatedHours: Math.floor(Math.random() * 40) + 1,
          loggedHours: Math.floor(Math.random() * 30)
        }
      });

      results.push(result);
    }

    return results;
  }

  private getRandomProject(): string {
    return this.projects[Math.floor(Math.random() * this.projects.length)];
  }

  private getRandomIssueType(): string {
    return this.issueTypes[Math.floor(Math.random() * this.issueTypes.length)];
  }

  protected getRandomStatus(): string {
    return this.statuses[Math.floor(Math.random() * this.statuses.length)];
  }

  protected getRandomPriority(): 'low' | 'medium' | 'high' {
    const priorities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
    return priorities[Math.floor(Math.random() * priorities.length)];
  }

  private getRandomTitle(): string {
    return this.titleTemplates[Math.floor(Math.random() * this.titleTemplates.length)];
  }

  private getRandomDescription(): string {
    const template = this.descriptionTemplates[Math.floor(Math.random() * this.descriptionTemplates.length)];
    return template
      .replace('{action}', 'login to the system')
      .replace('{benefit}', 'access my dashboard')
      .replace('{problem}', 'slow response times')
      .replace('{solution}', 'optimize the database queries')
      .replace('{date}', 'last Tuesday')
      .replace('{priority}', 'high')
      .replace('{steps}', '1. Navigate to login page 2. Enter credentials 3. Click submit')
      .replace('{expected}', 'User should be logged in')
      .replace('{actual}', 'Error message appears')
      .replace('{issue}', 'poorly structured')
      .replace('{improvement}', 'follow SOLID principles')
      .replace('{current}', '2.5 seconds')
      .replace('{target}', '500ms')
      .replace('{component}', 'authentication module')
      .replace('{risk}', 'medium')
      .replace('{system}', 'payment gateway')
      .replace('{error}', 'Connection timeout')
      .replace('{feedback}', 'the search is too slow')
      .replace('{solution}', 'better indexing');
  }

  private getRandomStoryPoints(): number {
    const points = [1, 2, 3, 5, 8, 13];
    return points[Math.floor(Math.random() * points.length)];
  }

  private getRandomSprint(): string {
    const sprintNumber = Math.floor(Math.random() * 20) + 1;
    return `Sprint ${sprintNumber}`;
  }

  private getRandomComponents(): string[] {
    const allComponents = [
      'Frontend', 'Backend', 'Database', 'API', 'Authentication',
      'Payment', 'Notifications', 'Search', 'Reports', 'Admin'
    ];
    
    const numComponents = Math.floor(Math.random() * 3) + 1; // 1-3 components
    const selectedComponents: string[] = [];
    
    for (let i = 0; i < numComponents; i++) {
      const component = allComponents[Math.floor(Math.random() * allComponents.length)];
      if (!selectedComponents.includes(component)) {
        selectedComponents.push(component);
      }
    }
    
    return selectedComponents;
  }

  // Jira-specific methods
  async getProjects(): Promise<string[]> {
    if (!this.isConnected) {
      throw new Error('Not connected to Jira');
    }

    await this.randomDelay(500, 1000);
    return [...this.projects];
  }

  async getIssuesByProject(project: string): Promise<SearchResult[]> {
    if (!this.isConnected) {
      throw new Error('Not connected to Jira');
    }

    const allResults = await this.generateSearchResults({ maxResults: 200 });
    return allResults.filter(result => result.metadata?.project === project);
  }

  async getIssuesByAssignee(assignee: string): Promise<SearchResult[]> {
    if (!this.isConnected) {
      throw new Error('Not connected to Jira');
    }

    const allResults = await this.generateSearchResults({ maxResults: 200 });
    return allResults.filter(result => 
      result.metadata?.assignee?.toLowerCase().includes(assignee.toLowerCase())
    );
  }

  async getIssuesByStatus(status: string): Promise<SearchResult[]> {
    if (!this.isConnected) {
      throw new Error('Not connected to Jira');
    }

    const allResults = await this.generateSearchResults({ maxResults: 200 });
    return allResults.filter(result => result.metadata?.status === status);
  }

  async getIssuesByPriority(priority: string): Promise<SearchResult[]> {
    if (!this.isConnected) {
      throw new Error('Not connected to Jira');
    }

    const allResults = await this.generateSearchResults({ maxResults: 200 });
    return allResults.filter(result => result.metadata?.priority === priority);
  }

  async getSprintIssues(sprint: string): Promise<SearchResult[]> {
    if (!this.isConnected) {
      throw new Error('Not connected to Jira');
    }

    const allResults = await this.generateSearchResults({ maxResults: 200 });
    return allResults.filter(result => result.metadata?.sprint === sprint);
  }

  async getIssueDetails(issueKey: string): Promise<SearchResult | null> {
    if (!this.isConnected) {
      throw new Error('Not connected to Jira');
    }

    const allResults = await this.generateSearchResults({ maxResults: 200 });
    return allResults.find(result => result.metadata?.issueKey === issueKey) || null;
  }

  async createIssue(data: {
    project: string;
    issueType: string;
    title: string;
    description: string;
    assignee?: string;
    priority?: string;
  }): Promise<SearchResult> {
    if (!this.isConnected) {
      throw new Error('Not connected to Jira');
    }

    await this.randomDelay(1000, 2000);

    const ticketNumber = Math.floor(Math.random() * 1000) + 1000;
    const issueKey = `${data.project}-${ticketNumber}`;

    return this.createSearchResult({
      title: `${issueKey}: ${data.title}`,
      content: data.description,
      type: 'issue',
      author: data.assignee || this.getRandomAuthor(),
      timestamp: new Date(),
      metadata: {
        issueKey,
        project: data.project,
        issueType: data.issueType,
        status: 'To Do',
        priority: data.priority || 'Medium',
        assignee: data.assignee || this.getRandomAuthor(),
        reporter: this.getRandomAuthor(),
        storyPoints: this.getRandomStoryPoints(),
        components: this.getRandomComponents(),
        labels: this.getRandomTags(),
        department: this.getRandomDepartment()
      }
    });
  }

  private async randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}
