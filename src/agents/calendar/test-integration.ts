/**
 * Calendar Agent Integration Test
 * 
 * This file demonstrates how to use the Calendar Agent system
 * and provides test cases for validation.
 */

import { CalendarAgentInterface, CalendarAgentExamples } from './index';

// Test configuration
const testConfig = {
  openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  googleAuth: {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET || '',
    redirectUri: 'http://localhost:3000/auth/callback'
  }
};

// Test cases for calendar operations
const testCases = [
  {
    description: 'Create a simple event',
    request: 'Schedule a team meeting tomorrow at 2 PM for 1 hour',
    expectedAction: 'CREATE_EVENT'
  },
  {
    description: 'Search for events',
    request: 'Find all my meetings next week',
    expectedAction: 'SEARCH_EVENTS'
  },
  {
    description: 'Check availability',
    request: 'Am I free Friday afternoon?',
    expectedAction: 'GET_FREE_BUSY'
  },
  {
    description: 'Create recurring event',
    request: 'Set up a daily standup at 9 AM every weekday',
    expectedAction: 'CREATE_RECURRING'
  },
  {
    description: 'Manage attendees',
    request: 'Add john@example.com to my marketing review meeting',
    expectedAction: 'MANAGE_ATTENDEES'
  },
  {
    description: 'Update event',
    request: 'Move my dentist appointment to next Tuesday at 3 PM',
    expectedAction: 'UPDATE_EVENT'
  },
  {
    description: 'Delete event',
    request: 'Cancel my lunch meeting today',
    expectedAction: 'DELETE_EVENT'
  }
];

/**
 * Run integration tests for the Calendar Agent
 */
export async function runCalendarAgentTests(): Promise<void> {
  console.log('🧪 Starting Calendar Agent Integration Tests...\n');

  // Check configuration
  if (!testConfig.openaiApiKey) {
    console.error('❌ OPENAI_API_KEY not configured');
    return;
  }

  if (!testConfig.googleAuth.clientId) {
    console.error('❌ Google OAuth not configured');
    return;
  }

  try {
    // Initialize the agent
    console.log('🚀 Initializing Calendar Agent...');
    const agent = new CalendarAgentInterface(testConfig);
    await agent.initialize();
    console.log('✅ Agent initialized successfully!\n');

    // Run test cases
    let passedTests = 0;
    let totalTests = testCases.length;

    for (const testCase of testCases) {
      try {
        console.log(`🔍 Testing: ${testCase.description}`);
        console.log(`📝 Request: "${testCase.request}"`);
        
        const startTime = Date.now();
        const response = await agent.processUserRequest(testCase.request);
        const duration = Date.now() - startTime;
        
        console.log(`🤖 Response: ${response}`);
        console.log(`⏱️  Duration: ${duration}ms`);
        console.log('✅ Test passed\n');
        
        passedTests++;
      } catch (error) {
        console.log(`❌ Test failed: ${error}\n`);
      }
    }

    // Show results
    console.log('📊 Test Results:');
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed!');
    }

    // Show agent statistics
    try {
      const stats = await agent.getAgentStats();
      console.log('\n📈 Agent Statistics:');
      console.log(`- Average Session Length: ${stats.averageSessionLength}`);
      console.log(`- Error Rate: ${stats.errorRate.toFixed(1)}%`);
      console.log(`- Most Common Actions: ${stats.mostCommonActions.map((a: any) => a.action).join(', ')}`);
      console.log(`- Suggestions: ${stats.suggestions.length}`);
    } catch (error) {
      console.log('⚠️  Could not retrieve agent statistics');
    }

  } catch (error) {
    console.error('❌ Failed to run tests:', error);
  }
}

/**
 * Interactive demo function
 */
export async function runInteractiveDemo(): Promise<void> {
  console.log('🎮 Starting Interactive Calendar Agent Demo...\n');
  
  try {
    await CalendarAgentExamples.interactiveDemo();
  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

/**
 * Validate environment configuration
 */
export function validateConfiguration(): boolean {
  console.log('🔧 Validating Configuration...\n');

  const checks = [
    {
      name: 'OpenAI API Key',
      check: () => !!process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      required: true
    },
    {
      name: 'Google Client ID',
      check: () => !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      required: true
    },
    {
      name: 'Google Client Secret',
      check: () => !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET,
      required: true
    },
    {
      name: 'Google Redirect URI',
      check: () => !!process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI,
      required: false
    },
    {
      name: 'Google Access Token',
      check: () => !!process.env.NEXT_PUBLIC_GOOGLE_ACCESS_TOKEN,
      required: false
    },
    {
      name: 'Google Refresh Token',
      check: () => !!process.env.NEXT_PUBLIC_GOOGLE_REFRESH_TOKEN,
      required: false
    }
  ];

  let allRequired = true;

  checks.forEach(check => {
    const status = check.check();
    const icon = status ? '✅' : (check.required ? '❌' : '⚠️ ');
    const label = check.required ? '(Required)' : '(Optional)';
    
    console.log(`${icon} ${check.name} ${label}`);
    
    if (check.required && !status) {
      allRequired = false;
    }
  });

  console.log(`\n${allRequired ? '✅' : '❌'} Configuration ${allRequired ? 'Valid' : 'Invalid'}`);
  
  if (!allRequired) {
    console.log('\n📝 To fix configuration issues:');
    console.log('1. Copy .env.example to .env.local');
    console.log('2. Fill in the required environment variables');
    console.log('3. Restart the development server');
  }

  return allRequired;
}

// Export for use in other files
export { testConfig, testCases };

// CLI interface for running tests
if (typeof window === 'undefined' && process.argv.includes('--test')) {
  runCalendarAgentTests();
}

if (typeof window === 'undefined' && process.argv.includes('--demo')) {
  runInteractiveDemo();
}

if (typeof window === 'undefined' && process.argv.includes('--validate')) {
  validateConfiguration();
}
