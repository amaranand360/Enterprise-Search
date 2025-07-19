import { NextResponse } from 'next/server';
import { CalendarAgent } from '@/agents/calendar/CalendarAgent';
import { CalendarAgentConfig } from '@/agents/calendar/types';
import { OAuth2Client } from 'google-auth-library';

// Store agent instances (in production, use a proper cache like Redis)
const agentInstances = new Map<string, CalendarAgent>();

export async function POST(request: Request) {
  try {
    const { action, userRequest, sessionId, config, accessToken } = await request.json();

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'initialize':
        return await handleInitialize(config, sessionId);
      
      case 'process':
        return await handleProcessRequest(userRequest, sessionId, accessToken);
      
      case 'getStats':
        return await handleGetStats(sessionId);
      
      case 'getHistory':
        return await handleGetHistory(sessionId);
      
      case 'reset':
        return await handleReset(sessionId);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Calendar Agent API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleInitialize(config: any, sessionId: string) {
  try {
    // Use environment variables for server-side authentication
    const openaiApiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET;
    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    if (!googleClientId || !googleClientSecret) {
      return NextResponse.json(
        { error: 'Google OAuth configuration is not complete' },
        { status: 500 }
      );
    }

    // Create OAuth2 client
    const oauth2Client = new OAuth2Client(
      googleClientId,
      googleClientSecret,
      process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback'
    );

    // Check if we have real authentication or use demo mode
    if (config.hasRealAuth && config.accessToken) {
      // Use real Google Calendar with provided access token
      oauth2Client.setCredentials({
        access_token: config.accessToken,
        scope: 'https://www.googleapis.com/auth/calendar',
        token_type: 'Bearer',
        expiry_date: Date.now() + 3600000
      });
    } else {
      // Demo mode - set dummy credentials
      oauth2Client.setCredentials({
        access_token: `demo_token_${Date.now()}`,
        refresh_token: `refresh_${Date.now()}`,
        scope: 'https://www.googleapis.com/auth/calendar',
        token_type: 'Bearer',
        expiry_date: Date.now() + 3600000
      });
    }

    const agentConfig: CalendarAgentConfig = {
      openaiApiKey,
      googleAuth: oauth2Client,
      useRealCalendar: config.hasRealAuth || false
    };

    const agent = new CalendarAgent(agentConfig);
    await agent.initialize();
    
    agentInstances.set(sessionId, agent);

    return NextResponse.json({
      success: true,
      message: '🤖 Calendar Agent initialized! I can help you manage your Google Calendar. Try commands like:\n\n• "Schedule a meeting tomorrow at 2 PM"\n• "What\'s on my calendar today?"\n• "Cancel my 3 PM appointment"\n• "Move my meeting to Friday"',
      sessionId
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to initialize agent: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

async function handleProcessRequest(userRequest: string, sessionId: string, accessToken?: string) {
  try {
    const agent = agentInstances.get(sessionId);
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not initialized. Call initialize first.' },
        { status: 400 }
      );
    }

    if (!userRequest?.trim()) {
      return NextResponse.json(
        { error: 'User request is required' },
        { status: 400 }
      );
    }

    // Update the agent's OAuth credentials if a new access token is provided
    if (accessToken) {
      // In a full implementation, you would update the agent's credentials here
      // For now, the agent will use the credentials from initialization
      console.log('Access token provided for calendar operations:', accessToken.substring(0, 20) + '...');
    }

    const response = await agent.processRequest(userRequest);

    return NextResponse.json({
      success: true,
      response,
      timestamp: new Date().toISOString(),
      calendarOperation: true // Indicate that this involved calendar operations
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to process request: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

async function handleGetStats(sessionId: string) {
  try {
    const agent = agentInstances.get(sessionId);
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not initialized' },
        { status: 400 }
      );
    }

    const stateManager = agent.getStateManager();
    const patterns = await agent.analyzeUserPatterns();

    return NextResponse.json({
      success: true,
      stats: {
        sessionCount: 1,
        totalRequests: patterns?.totalRequests || 0,
        patterns
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to get stats: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

async function handleGetHistory(sessionId: string) {
  try {
    const agent = agentInstances.get(sessionId);
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not initialized' },
        { status: 400 }
      );
    }

    const history = await agent.getSessionHistory();

    return NextResponse.json({
      success: true,
      history
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to get history: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

async function handleReset(sessionId: string) {
  try {
    // Simply remove the agent instance and create a new one
    agentInstances.delete(sessionId);

    return NextResponse.json({
      success: true,
      message: 'Agent session reset successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to reset: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return NextResponse.json({
    message: 'Calendar Agent API',
    endpoints: {
      POST: {
        '/api/calendar-agent': {
          actions: ['initialize', 'process', 'getStats', 'getHistory', 'reset'],
          description: 'Handle calendar agent operations'
        }
      }
    },
    version: '1.0.0'
  });
}
