import { SearchResult } from '@/types';
import { BaseDemoConnector, DemoSearchOptions } from './BaseDemoConnector';

export class GitHubDemoConnector extends BaseDemoConnector {
  private repositories = [
    'frontend-app', 'backend-api', 'mobile-app', 'data-pipeline',
    'auth-service', 'payment-gateway', 'notification-service', 'admin-dashboard',
    'user-management', 'analytics-engine', 'search-service', 'file-storage'
  ];

  private languages = ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C#', 'PHP'];
  
  private issueTemplates = [
    'Bug: Application crashes when {action}',
    'Feature Request: Add {feature} to {component}',
    'Enhancement: Improve {aspect} performance',
    'Documentation: Update {section} in README',
    'Security: Fix vulnerability in {component}',
    'Refactor: Clean up {module} code structure',
    'Test: Add unit tests for {functionality}',
    'CI/CD: Update deployment pipeline for {environment}',
    'Dependencies: Update {package} to latest version',
    'Performance: Optimize {operation} in {component}'
  ];

  private commitMessages = [
    'Fix authentication bug in login flow',
    'Add new user dashboard component',
    'Update API documentation',
    'Refactor database connection logic',
    'Implement real-time notifications',
    'Fix responsive design issues',
    'Add unit tests for payment module',
    'Update dependencies to latest versions',
    'Optimize search query performance',
    'Fix memory leak in background service',
    'Add error handling for API calls',
    'Implement dark mode support',
    'Fix cross-browser compatibility',
    'Add logging for debugging',
    'Update security headers configuration'
  ];

  private prTitles = [
    'Feature: Implement user authentication',
    'Fix: Resolve database connection issues',
    'Enhancement: Improve search performance',
    'Refactor: Clean up component structure',
    'Security: Update authentication flow',
    'Documentation: Add API usage examples',
    'Test: Increase code coverage',
    'CI: Update deployment workflow',
    'Dependencies: Bump package versions',
    'Performance: Optimize rendering'
  ];

  protected async generateSearchResults(options: DemoSearchOptions): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const dataSize = this.getDataSize();

    // Generate different types of GitHub content
    const contentTypes = ['issue', 'code', 'document'];
    
    for (let i = 0; i < dataSize; i++) {
      const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
      const repository = this.getRandomRepository();
      const author = this.getRandomAuthor();
      const timestamp = this.getRandomTimestamp();

      let result: SearchResult;

      switch (contentType) {
        case 'issue':
          result = this.generateIssueResult(repository, author, timestamp);
          break;
        case 'code':
          result = this.generateCodeResult(repository, author, timestamp);
          break;
        case 'document':
          result = this.generateDocumentResult(repository, author, timestamp);
          break;
        default:
          result = this.generateIssueResult(repository, author, timestamp);
      }

      results.push(result);
    }

    return results;
  }

  private generateIssueResult(repository: string, author: string, timestamp: Date): SearchResult {
    const template = this.issueTemplates[Math.floor(Math.random() * this.issueTemplates.length)];
    const title = template
      .replace('{action}', 'submitting form')
      .replace('{feature}', 'export functionality')
      .replace('{component}', 'user dashboard')
      .replace('{aspect}', 'database query')
      .replace('{section}', 'installation guide')
      .replace('{module}', 'authentication')
      .replace('{functionality}', 'payment processing')
      .replace('{environment}', 'production')
      .replace('{package}', 'react')
      .replace('{operation}', 'data fetching');

    const issueNumber = Math.floor(Math.random() * 1000) + 1;
    const state = Math.random() > 0.3 ? 'open' : 'closed';
    const labels = this.getRandomLabels();

    return this.createSearchResult({
      title: `#${issueNumber}: ${title}`,
      content: `Issue in ${repository} repository. ${this.getIssueDescription()}`,
      type: 'issue',
      author,
      timestamp,
      metadata: {
        repository,
        issueNumber,
        state,
        labels,
        comments: Math.floor(Math.random() * 20),
        assignees: this.getRandomAssignees(),
        milestone: this.getRandomMilestone(),
        tags: this.getRandomTags(),
        department: this.getRandomDepartment()
      }
    });
  }

  private generateCodeResult(repository: string, author: string, timestamp: Date): SearchResult {
    const commitMessage = this.commitMessages[Math.floor(Math.random() * this.commitMessages.length)];
    const language = this.getRandomLanguage();
    const fileName = this.getRandomFileName(language);
    const commitHash = this.generateCommitHash();

    return this.createSearchResult({
      title: `${fileName} - ${commitMessage}`,
      content: `Code changes in ${repository}/${fileName}. ${this.getCodeDescription()}`,
      type: 'code',
      author,
      timestamp,
      metadata: {
        repository,
        fileName,
        language,
        commitHash,
        commitMessage,
        linesAdded: Math.floor(Math.random() * 100) + 1,
        linesDeleted: Math.floor(Math.random() * 50),
        branch: this.getRandomBranch(),
        tags: this.getRandomTags(),
        department: this.getRandomDepartment()
      }
    });
  }

  private generateDocumentResult(repository: string, author: string, timestamp: Date): SearchResult {
    const docTypes = ['README.md', 'CONTRIBUTING.md', 'API.md', 'CHANGELOG.md', 'LICENSE'];
    const docName = docTypes[Math.floor(Math.random() * docTypes.length)];

    return this.createSearchResult({
      title: `${docName} - Documentation Update`,
      content: `Documentation update in ${repository}. ${this.getDocumentDescription()}`,
      type: 'document',
      author,
      timestamp,
      metadata: {
        repository,
        fileName: docName,
        documentType: 'markdown',
        section: this.getRandomDocSection(),
        tags: this.getRandomTags(),
        department: this.getRandomDepartment()
      }
    });
  }

  private getRandomRepository(): string {
    return this.repositories[Math.floor(Math.random() * this.repositories.length)];
  }

  private getRandomLanguage(): string {
    return this.languages[Math.floor(Math.random() * this.languages.length)];
  }

  private getRandomFileName(language: string): string {
    const extensions: Record<string, string> = {
      'JavaScript': '.js',
      'TypeScript': '.ts',
      'Python': '.py',
      'Java': '.java',
      'Go': '.go',
      'Rust': '.rs',
      'C#': '.cs',
      'PHP': '.php'
    };

    const baseNames = [
      'index', 'main', 'app', 'server', 'client', 'utils', 'helpers',
      'config', 'auth', 'database', 'api', 'service', 'controller'
    ];

    const baseName = baseNames[Math.floor(Math.random() * baseNames.length)];
    const extension = extensions[language] || '.txt';
    return `${baseName}${extension}`;
  }

  private generateCommitHash(): string {
    const chars = '0123456789abcdef';
    let hash = '';
    for (let i = 0; i < 7; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  }

  private getRandomBranch(): string {
    const branches = ['main', 'develop', 'feature/auth', 'feature/dashboard', 'bugfix/login', 'hotfix/security'];
    return branches[Math.floor(Math.random() * branches.length)];
  }

  private getRandomLabels(): string[] {
    const allLabels = [
      'bug', 'enhancement', 'documentation', 'good first issue',
      'help wanted', 'priority: high', 'priority: low', 'wontfix',
      'duplicate', 'question', 'feature', 'security'
    ];
    
    const numLabels = Math.floor(Math.random() * 4) + 1; // 1-4 labels
    const selectedLabels: string[] = [];
    
    for (let i = 0; i < numLabels; i++) {
      const label = allLabels[Math.floor(Math.random() * allLabels.length)];
      if (!selectedLabels.includes(label)) {
        selectedLabels.push(label);
      }
    }
    
    return selectedLabels;
  }

  private getRandomAssignees(): string[] {
    const assigneeCount = Math.floor(Math.random() * 3); // 0-2 assignees
    const assignees: string[] = [];
    
    for (let i = 0; i < assigneeCount; i++) {
      const assignee = this.getRandomAuthor();
      if (!assignees.includes(assignee)) {
        assignees.push(assignee);
      }
    }
    
    return assignees;
  }

  private getRandomMilestone(): string | undefined {
    const milestones = ['v1.0.0', 'v1.1.0', 'v2.0.0', 'Q1 Release', 'Q2 Release'];
    return Math.random() > 0.5 ? milestones[Math.floor(Math.random() * milestones.length)] : undefined;
  }

  private getRandomDocSection(): string {
    const sections = ['Installation', 'Usage', 'API Reference', 'Contributing', 'License', 'Changelog'];
    return sections[Math.floor(Math.random() * sections.length)];
  }

  private getIssueDescription(): string {
    const descriptions = [
      'Steps to reproduce the issue and expected behavior.',
      'Feature request with detailed requirements and use cases.',
      'Bug report with error logs and system information.',
      'Enhancement proposal with implementation details.',
      'Documentation improvement suggestions.',
      'Security vulnerability report with impact assessment.'
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  private getCodeDescription(): string {
    const descriptions = [
      'Refactored code for better performance and maintainability.',
      'Added new feature with comprehensive unit tests.',
      'Fixed critical bug affecting user authentication.',
      'Improved error handling and logging mechanisms.',
      'Updated dependencies and resolved security vulnerabilities.',
      'Optimized database queries for better performance.'
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  private getDocumentDescription(): string {
    const descriptions = [
      'Updated installation instructions with latest requirements.',
      'Added comprehensive API documentation with examples.',
      'Improved contributing guidelines for new developers.',
      'Updated changelog with recent feature additions.',
      'Added troubleshooting section for common issues.',
      'Enhanced README with better project description.'
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  // GitHub-specific methods
  async getRepositories(): Promise<string[]> {
    if (!this.isConnected) {
      throw new Error('Not connected to GitHub');
    }

    await this.randomDelay(500, 1000);
    return [...this.repositories];
  }

  async getIssues(repository?: string): Promise<SearchResult[]> {
    if (!this.isConnected) {
      throw new Error('Not connected to GitHub');
    }

    const allResults = await this.generateSearchResults({ maxResults: 200 });
    const issues = allResults.filter(result => result.type === 'issue');
    
    if (repository) {
      return issues.filter(result => result.metadata?.repository === repository);
    }
    
    return issues;
  }

  async getPullRequests(repository?: string): Promise<SearchResult[]> {
    if (!this.isConnected) {
      throw new Error('Not connected to GitHub');
    }

    const results: SearchResult[] = [];
    const count = Math.floor(Math.random() * 20) + 10;

    for (let i = 0; i < count; i++) {
      const repo = repository || this.getRandomRepository();
      const prTitle = this.prTitles[Math.floor(Math.random() * this.prTitles.length)];
      const prNumber = Math.floor(Math.random() * 500) + 1;
      const state = Math.random() > 0.4 ? 'open' : 'merged';

      const result = this.createSearchResult({
        title: `#${prNumber}: ${prTitle}`,
        content: `Pull request in ${repo} repository. ${this.getCodeDescription()}`,
        type: 'code',
        author: this.getRandomAuthor(),
        timestamp: this.getRandomTimestamp(),
        metadata: {
          repository: repo,
          prNumber,
          state,
          reviewers: this.getRandomAssignees(),
          branch: this.getRandomBranch(),
          commits: Math.floor(Math.random() * 10) + 1,
          filesChanged: Math.floor(Math.random() * 20) + 1,
          tags: this.getRandomTags(),
          department: this.getRandomDepartment()
        }
      });

      results.push(result);
    }

    return results;
  }

  async getCommits(repository?: string): Promise<SearchResult[]> {
    if (!this.isConnected) {
      throw new Error('Not connected to GitHub');
    }

    const allResults = await this.generateSearchResults({ maxResults: 200 });
    const commits = allResults.filter(result => result.type === 'code');
    
    if (repository) {
      return commits.filter(result => result.metadata?.repository === repository);
    }
    
    return commits;
  }

  private async randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}
