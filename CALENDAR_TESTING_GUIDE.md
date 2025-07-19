# Calendar Agent Testing Guide

## 🎯 Overview

Your Calendar Agent system is now ready for testing! This guide will help you test both the Google OAuth authentication and the Google Calendar integration functionality.

## 🚀 Quick Start Testing

### Step 1: Access the Application
1. Open your browser and go to: `http://localhost:3000`
2. The development server should be running without errors

### Step 2: Test Google Authentication
1. Click on the **Settings** button (gear icon) in the header
2. In the Connection Settings modal, locate the **Google** section
3. Click **"Sign in with Google"**
4. You should see the Google OAuth flow with your configured credentials:
   - Client ID: `your-google-client-id.apps.googleusercontent.com`
   - Using scopes: Calendar, Email, Profile

### Step 3: Access the Calendar Test Suite
1. Click the **"Test Calendar"** link in the header (blue calendar icon)
2. This opens a comprehensive test suite at: `http://localhost:3000/test-calendar`

## 🧪 Comprehensive Testing with Test Suite

The Calendar Test Suite runs 7 automated tests to verify your Google Calendar integration:

### Test 1: Google Auth Initialization ✅
- **Purpose**: Verifies that Google APIs load correctly
- **What it tests**: Google Identity Services and API client initialization
- **Expected result**: "Google Auth initialized successfully"

### Test 2: Google Sign-in ✅
- **Purpose**: Tests the OAuth flow and token acquisition
- **What it tests**: Real Google authentication with your credentials
- **Expected result**: Shows partial access token and sets authentication status

### Test 3: Create Test Event ✅
- **Purpose**: Creates a real calendar event in your Google Calendar
- **What it tests**: Google Calendar API write permissions
- **Event details**:
  - Title: "🤖 Calendar Agent Test Event"
  - Time: Tomorrow for 1 hour
  - Location: Virtual Meeting
  - Attendee: test@example.com

### Test 4: List Recent Events ✅
- **Purpose**: Retrieves events from your calendar
- **What it tests**: Google Calendar API read permissions
- **Scope**: Next 7 days, up to 10 events

### Test 5: Update Test Event ✅
- **Purpose**: Modifies the previously created test event
- **What it tests**: Google Calendar API update permissions
- **Changes**: Updates title to include "(Updated)" and changes description

### Test 6: Get Free/Busy Information ✅
- **Purpose**: Checks your calendar availability
- **What it tests**: Google Calendar free/busy API
- **Scope**: Tomorrow to day after tomorrow

### Test 7: Delete Test Event ✅
- **Purpose**: Removes the test event
- **What it tests**: Google Calendar API delete permissions
- **Cleanup**: Ensures no test data remains in your calendar

## 🤖 Testing the Calendar Agent

### Method 1: Through the Main Interface
1. Go to `http://localhost:3000`
2. Click the **Calendar** tab in the sidebar
3. Click **"Open Calendar Agent"**
4. Try these test commands:

#### Event Creation Commands:
```
"Create a team meeting tomorrow at 2 PM for 1 hour"
"Schedule a doctor's appointment on Friday at 10 AM"
"Add a lunch meeting with John on Thursday at 12:30 PM"
"Set up a recurring standup every Monday at 9 AM"
```

#### Event Query Commands:
```
"What meetings do I have this week?"
"Show me my schedule for tomorrow"
"Do I have anything planned for next Monday?"
"What's my next meeting?"
```

#### Availability Commands:
```
"Am I free tomorrow afternoon?"
"When is my next available 2-hour block?"
"Find me time for a 30-minute meeting this week"
```

#### Event Management Commands:
```
"Move my 3 PM meeting to 4 PM"
"Cancel my lunch meeting today"
"Add Sarah to my team standup meeting"
"Change the location of my doctor appointment to virtual"
```

### Method 2: Using the Test Suite (Recommended)
1. Go to `http://localhost:3000/test-calendar`
2. Ensure authentication status shows "Signed In"
3. Click **"Run All Tests"**
4. Watch each test execute in real-time
5. Check your Google Calendar to see the actual events created/modified/deleted

## 🔍 Expected Results

### ✅ Successful Test Results
- **Authentication**: Green status, access token displayed
- **Event Creation**: Event appears in your Google Calendar
- **Event Listing**: Shows your actual calendar events
- **Event Updates**: Changes reflected in Google Calendar
- **Free/Busy**: Returns actual availability data
- **Event Deletion**: Event removed from Google Calendar

### ❌ Common Issues and Solutions

#### Issue: "Google sign-in failed: {}"
**Solution**: 
1. Check that your Google OAuth credentials are correctly configured in `.env.local`
2. Ensure the redirect URI matches: `http://localhost:3000/auth/google/callback`
3. Verify your Google Cloud Console project has the Calendar API enabled

#### Issue: "Not authenticated with Google"
**Solution**:
1. Complete the Google sign-in process first
2. Check the Connection Settings to verify authentication status
3. Try refreshing the page and signing in again

#### Issue: Calendar API errors
**Solution**:
1. Verify the Google Calendar API is enabled in your Google Cloud project
2. Check that your API key has the necessary permissions
3. Ensure the OAuth scopes include calendar access

## 🔧 Environment Configuration

Verify your `.env.local` file contains:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_GOOGLE_API_KEY=your-google-api-key
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🎉 Success Criteria

Your Calendar Agent is working correctly if:

1. ✅ **Authentication**: Google sign-in completes without errors
2. ✅ **Calendar Access**: Test suite shows all tests passing
3. ✅ **Real Events**: Events actually appear in your Google Calendar
4. ✅ **Natural Language**: Agent responds appropriately to calendar requests
5. ✅ **Error Handling**: Graceful handling of authentication and API errors

## 🔄 Continuous Testing

For ongoing development:

1. **Run the test suite** after any changes to calendar functionality
2. **Test with real scenarios** using natural language commands
3. **Verify in Google Calendar** that changes are actually applied
4. **Check error logs** in browser console and terminal for any issues

## 📊 Monitoring

Watch these areas during testing:

1. **Browser Console**: For client-side errors and authentication flows
2. **Terminal Output**: For server-side processing and API calls
3. **Google Calendar**: For actual event creation/modification/deletion
4. **Test Suite Results**: For comprehensive functionality verification

Your Calendar Agent is now ready for comprehensive testing! 🚀
