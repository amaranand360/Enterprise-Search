// Calendar Agent - Client-side exports only
// Server-side components are accessed via API routes

export { CalendarAgentComponent } from './CalendarAgentComponent';
export type { CalendarAgentConfig, CalendarEvent, CalendarAgentState } from './types';
  private agent: CalendarAgent | null = null;
  private isInitialized = false;

  constructor(private config: CalendarAgentConfig) {
    CalendarAgentFactory.validateConfig(config);
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.agent = await CalendarAgentFactory.createAgent(this.config);
      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize Calendar Agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async processUserRequest(request: string): Promise<string> {
    if (!this.agent || !this.isInitialized) {
      throw new Error('Agent not initialized. Call initialize() first.');
    }

    try {
      return await this.agent.processRequest(request);
    } catch (error) {
      return `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`;
    }
  }

  public async getAgentStats(): Promise<any> {
    if (!this.agent) {
      throw new Error('Agent not initialized');
    }

    return await this.agent.analyzeUserPatterns();
  }

  public async getSessionHistory(): Promise<any[]> {
    if (!this.agent) {
      throw new Error('Agent not initialized');
    }

    return await this.agent.getSessionHistory();
  }

  public isReady(): boolean {
    return this.isInitialized && this.agent !== null;
  }

  public async reset(): Promise<void> {
    if (this.agent) {
      this.agent.getStateManager().startNewSession();
    }
  }
}

// Example usage functions
export const CalendarAgentExamples = {
  // Create an agent with environment variables
  createFromEnv: async (): Promise<CalendarAgentInterface> => {
    const config: CalendarAgentConfig = {
      openaiApiKey: process.env.OPENAI_API_KEY || '',
      googleAuth: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback',
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        accessToken: process.env.GOOGLE_ACCESS_TOKEN
      }
    };

    const agent = new CalendarAgentInterface(config);
    await agent.initialize();
    return agent;
  },

  // Test the agent with sample requests
  runTests: async (agent: CalendarAgentInterface): Promise<void> => {
    const testRequests = [
      "Schedule a team meeting tomorrow at 2 PM",
      "Find all my meetings next week",
      "Create a recurring standup every Monday at 9 AM",
      "Check my availability on Friday afternoon",
      "Cancel my 3 PM meeting today",
      "Add john@example.com to my marketing review meeting"
    ];

    console.log('🧪 Running Calendar Agent Tests...\n');

    for (const request of testRequests) {
      try {
        console.log(`👤 User: ${request}`);
        const response = await agent.processUserRequest(request);
        console.log(`🤖 Agent: ${response}\n`);
      } catch (error) {
        console.log(`❌ Error: ${error}\n`);
      }
    }
  },

  // Interactive demo
  interactiveDemo: async (): Promise<void> => {
    console.log('🚀 Starting Calendar Agent Interactive Demo...');
    
    try {
      const agent = await CalendarAgentExamples.createFromEnv();
      console.log('✅ Agent initialized successfully!');
      console.log('💡 Try asking me to:');
      console.log('  - "Schedule a meeting tomorrow at 2 PM"');
      console.log('  - "Find my meetings next week"');
      console.log('  - "Check my availability on Friday"');
      console.log('  - "Create a recurring team standup"\n');

      // In a real implementation, you'd set up a CLI or web interface here
      // For now, we'll just run the test suite
      await CalendarAgentExamples.runTests(agent);

    } catch (error) {
      console.error('❌ Failed to start demo:', error);
    }
  }
};

// Export main classes
export { CalendarAgent } from './CalendarAgent';
export { GoogleCalendarService } from './GoogleCalendarService';
export { CalendarToolkit } from './CalendarToolkit';
export { CalendarStateManager } from './CalendarStateManager';
export * from './types';
