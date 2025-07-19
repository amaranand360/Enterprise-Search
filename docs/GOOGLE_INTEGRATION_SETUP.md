# Google Integration Setup Guide

This guide will help you set up real Google Calendar and Gmail integration with your Enterprise Search application using a **step-by-step authentication flow**.

## 🔄 **Real Google Calendar Integration**

The integration now provides **REAL Google Calendar functionality**:
1. **Account Selection**: Choose which Google account to connect
2. **Real Authentication**: Actual Google OAuth with your credentials
3. **Live Calendar Operations**: Create, view, and manage real calendar events
4. **Google Meet Integration**: Automatic Google Meet links for meetings
5. **Multi-Calendar Support**: Access all your Google calendars

This is **NOT a demo** - it connects to your actual Google Calendar!

## Prerequisites

- Google Cloud Console account
- Your application running on `http://localhost:3001` (or your domain)
- Admin access to your Google Workspace (if using organizational account)

## Step 1: Google Cloud Console Setup

### 1.1 Create a New Project (or use existing)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name your project (e.g., "Enterprise Search Integration")
4. Click "Create"

### 1.2 Enable Required APIs

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Enable the following APIs:
   - **Gmail API**
   - **Google Calendar API**
   - **Google Drive API** (optional)
   - **Google Sheets API** (optional)

### 1.3 Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" (or "Internal" if using Google Workspace)
3. Fill in the required information:
   - **App name**: Enterprise Search
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Add scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.compose`
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
5. Add test users (your email addresses)
6. Save and continue

### 1.4 Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Configure:
   - **Name**: Enterprise Search Web Client
   - **Authorized JavaScript origins**: 
     - `http://localhost:3001`
     - `https://yourdomain.com` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:3001/auth/google/callback`
     - `https://yourdomain.com/auth/google/callback` (for production)
5. Click "Create"
6. **Save the Client ID and Client Secret** - you'll need these!

## Step 2: Environment Configuration

Your `.env.local` file should already have the Google credentials. Verify they match your Google Cloud Console:

```env
# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-from-google-console
GOOGLE_CLIENT_SECRET=your-client-secret-from-google-console
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback

# Application Settings
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secure-secret-key-here
```

## Step 3: Testing the New Authentication Flow

### 3.1 Step 1: Google Account Authentication

1. Open your application at `http://localhost:3001`
2. Open the sidebar (should be visible by default)
3. In the "Google Integration" section, click **"Connect Google"**
4. You'll see the **Google Service Selector** modal
5. Click **"Sign in with Google"**
6. Complete Google's OAuth flow (basic permissions only)
7. You'll be redirected back and see your profile information

### 3.2 Step 2: Service Selection

1. After authentication, you'll see the **"Choose Services to Connect"** screen
2. You'll see available services:
   - **Gmail** - Email management and search
   - **Google Calendar** - Event scheduling and management
   - **Google Drive** - File access and search
   - **Google Sheets** - Spreadsheet management
3. Click **"Connect"** next to each service you want to use
4. Each service will request specific permissions
5. Click **"Complete Setup"** when done

### 3.3 Test Gmail Integration

1. After connecting Gmail, click **"Compose Email"** in Quick Actions
2. Fill in the email form:
   - **To**: A test email address
   - **Subject**: Test from Enterprise Search
   - **Message**: This is a test email
3. Click **"Send Email"**
4. Check that the email was sent successfully

### 3.4 Test Calendar Integration

1. After connecting Calendar, click **"Create Event"** in Quick Actions
2. Fill in the event form:
   - **Title**: Test Meeting
   - **Start/End Time**: Set appropriate times
   - **Description**: Test event from Enterprise Search
   - **Attendees**: Optional email addresses
   - **Google Meet**: Check to add video conferencing
3. Click **"Create Event"**
4. Check your Google Calendar to verify the event was created

### 3.5 Test Quick Meeting

1. Click **"Quick Meeting"** for instant 30-minute meeting scheduling
2. A meeting will be created 5 minutes from now
3. Check your calendar for the new event

## Step 4: Features Available

### Gmail Features
- ✅ **Compose and send emails**
- ✅ **View inbox messages**
- ✅ **Search emails**
- ✅ **Real-time Gmail integration**

### Calendar Features
- ✅ **Create calendar events**
- ✅ **Schedule meetings with Google Meet links**
- ✅ **Add attendees and locations**
- ✅ **Quick meeting scheduling**
- ✅ **Real-time calendar integration**

### Quick Actions
- ✅ **Connect Google Account**
- ✅ **Compose Email**
- ✅ **Create Calendar Event**
- ✅ **Quick 30-minute Meeting**

## Step 5: Troubleshooting

### Common Issues

#### "Google Client ID not configured"
- Verify your `.env.local` file has the correct `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- Restart your development server after changing environment variables

#### "Redirect URI mismatch"
- Check that your redirect URI in Google Cloud Console matches exactly:
  - `http://localhost:3001/auth/google/callback`
- Ensure no trailing slashes or extra characters

#### "Access blocked: This app's request is invalid"
- Make sure you've configured the OAuth consent screen
- Add your email as a test user
- Verify all required scopes are added

#### "Gmail API error" or "Calendar API error"
- Ensure the Gmail API and Calendar API are enabled in Google Cloud Console
- Check that your OAuth token hasn't expired
- Try disconnecting and reconnecting your Google account

### API Quotas

Google APIs have usage quotas:
- **Gmail API**: 1 billion quota units per day
- **Calendar API**: 1 million requests per day

For production use, monitor your usage in the Google Cloud Console.

## Step 6: Production Deployment

For production deployment:

1. Update your OAuth credentials in Google Cloud Console:
   - Add your production domain to authorized origins
   - Add your production redirect URI
2. Update your `.env.production` file with production values
3. Ensure HTTPS is enabled for your production domain
4. Consider implementing proper error handling and logging

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use environment variables** for all sensitive data
3. **Implement proper error handling** for API failures
4. **Monitor API usage** to prevent quota exhaustion
5. **Regularly rotate secrets** in production

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Google Cloud Console configuration
3. Ensure all APIs are enabled and credentials are correct
4. Test with a fresh browser session (clear cookies/cache)

The integration provides a seamless experience for managing Gmail and Google Calendar directly from your Enterprise Search interface!
