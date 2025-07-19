import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const oauth2Client = new OAuth2Client(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
    );

    if (action === 'login') {
      // Generate Google OAuth URL
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events'
        ],
        prompt: 'consent'
      });

      return NextResponse.json({ 
        success: true, 
        authUrl 
      });
    }

    if (action === 'callback') {
      const code = searchParams.get('code');
      
      if (!code) {
        return NextResponse.json(
          { error: 'Authorization code not provided' },
          { status: 400 }
        );
      }

      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // Store tokens in session/database (for demo, we'll return them)
      return NextResponse.json({
        success: true,
        tokens: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: tokens.expiry_date
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, tokens } = await request.json();

    if (action === 'verify') {
      const oauth2Client = new OAuth2Client(
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      oauth2Client.setCredentials(tokens);

      // Verify the tokens by making a test request
      const { calendar } = require('googleapis').google;
      const calendarApi = calendar({ version: 'v3', auth: oauth2Client });
      
      await calendarApi.calendarList.list({ maxResults: 1 });

      return NextResponse.json({
        success: true,
        message: 'Tokens verified successfully'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { error: 'Token verification failed' },
      { status: 500 }
    );
  }
}
