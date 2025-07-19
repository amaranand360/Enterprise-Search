# Calendar Agent - AI-Powered Google Calendar Automation

## Overview

The Calendar Agent is a sophisticated AI-powered system built with **LangChain.js** and **OpenAI GPT-4o-mini** that automates Google Calendar operations through natural language conversations. It seamlessly integrates with the Enterprise Search platform to provide intelligent calendar management capabilities.

## 🚀 Features

### Core Capabilities
- **Natural Language Processing**: Understand and execute calendar requests in plain English
- **Smart Event Creation**: Create events with intelligent date/time parsing
- **Event Management**: Update, delete, and search existing events
- **Availability Checking**: Find free time slots and check busy periods
- **Recurring Events**: Create and manage recurring appointments
- **Attendee Management**: Add/remove attendees with automatic notifications
- **Conflict Detection**: Identify and resolve scheduling conflicts

### AI-Powered Intelligence
- **Intent Recognition**: Accurately parse user intentions from natural language
- **Context Awareness**: Maintain conversation context across interactions
- **Smart Suggestions**: Provide intelligent recommendations based on usage patterns
- **Error Recovery**: Gracefully handle errors with helpful suggestions

### Advanced Features
- **Session Management**: Track conversation history and user patterns
- **Performance Analytics**: Monitor agent performance and usage statistics
- **Custom Actions**: Execute complex multi-step calendar operations
- **Integration Ready**: Easy integration with existing applications

## 🛠 Technology Stack

- **AI Framework**: LangChain.js for agent orchestration
- **Language Model**: OpenAI GPT-4o-mini for natural language understanding
- **Calendar API**: Google Calendar API v3
- **Authentication**: Google OAuth 2.0
- **Frontend**: React/Next.js with TypeScript
- **State Management**: Custom state management with session persistence

## 📦 Installation & Setup

### Prerequisites
```bash
Node.js 18+ 
npm or yarn
Google Cloud Console project
OpenAI API account
```

### 1. Install Dependencies
```bash
cd /path/to/Enterprise-Search
npm install
```

### 2. Environment Configuration
Create a `.env.local` file with the following variables:

```env
# OpenAI Configuration
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here

# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=your_google_client_secret_here
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# Optional: Pre-configured tokens
NEXT_PUBLIC_GOOGLE_ACCESS_TOKEN=your_access_token_here
NEXT_PUBLIC_GOOGLE_REFRESH_TOKEN=your_refresh_token_here
```

### 3. Google Cloud Setup

1. **Create a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Calendar API**:
   ```bash
   # Enable the Google Calendar API
   gcloud services enable calendar-json.googleapis.com
   ```

3. **Create OAuth Credentials**:
   - Go to APIs & Services > Credentials
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URIs: `http://localhost:3000/auth/callback`

4. **Configure OAuth Consent Screen**:
   - Add required scopes: `https://www.googleapis.com/auth/calendar`

### 4. Run the Application
```bash
npm run dev
```

## 🎯 Usage Examples

### Basic Calendar Operations

```typescript
// Initialize the Calendar Agent
import { CalendarAgentInterface } from '@/agents/calendar';

const agent = new CalendarAgentInterface({
  openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
  googleAuth: {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET!,
    redirectUri: 'http://localhost:3000/auth/callback'
  }
});

await agent.initialize();

// Process natural language requests
const response1 = await agent.processUserRequest(
  "Schedule a team meeting tomorrow at 2 PM for 1 hour"
);

const response2 = await agent.processUserRequest(
  "Find all my meetings next week"
);

const response3 = await agent.processUserRequest(
  "Check my availability on Friday afternoon"
);
```

### Supported Natural Language Commands

#### Event Creation
- "Schedule a meeting tomorrow at 2 PM"
- "Create a lunch appointment with John on Friday at noon"
- "Set up a recurring standup every Monday at 9 AM"
- "Book a conference room for the quarterly review next Tuesday"

#### Event Management
- "Cancel my 3 PM meeting today"
- "Move my dentist appointment to next week"
- "Add sarah@company.com to my marketing review meeting"
- "Change my team sync to 10 AM"

#### Information Retrieval
- "What's on my calendar today?"
- "Find all meetings with the sales team"
- "Show my schedule for next week"
- "When is my next available slot?"

#### Availability & Scheduling
- "Am I free Friday afternoon?"
- "Find a 30-minute slot for a call this week"
- "Check when everyone is available for a team meeting"
- "What's my busiest day next week?"

## 🏗 Architecture

### Component Structure
```
src/agents/calendar/
├── CalendarAgent.ts              # Main agent orchestrator
├── GoogleCalendarService.ts      # Google Calendar API wrapper
├── CalendarToolkit.ts           # Calendar operations toolkit
├── CalendarStateManager.ts      # Session and state management
├── CalendarAgentComponent.tsx   # React UI component
├── types.ts                     # TypeScript type definitions
└── index.ts                     # Public API exports
```

### Agent Workflow
1. **Request Analysis**: Parse natural language using GPT-4o-mini
2. **Intent Classification**: Determine the type of calendar operation
3. **Parameter Extraction**: Extract dates, times, attendees, etc.
4. **Action Execution**: Perform the calendar operation via Google API
5. **Response Generation**: Create natural language response
6. **State Management**: Track session and update user patterns

### State Management
The agent maintains conversation context through:
- **Session Tracking**: Each conversation gets a unique session ID
- **Message History**: Full conversation history with timestamps
- **User Patterns**: Analysis of common actions and preferences
- **Error Tracking**: Monitor and learn from failed requests

## 🔧 API Reference

### CalendarAgent Class

#### Methods

```typescript
// Initialize the agent
await agent.initialize(): Promise<void>

// Process user requests
await agent.processRequest(request: string): Promise<string>

// Get session analytics
await agent.analyzeUserPatterns(): Promise<UserPatternAnalysis>

// Get conversation history
await agent.getSessionHistory(): Promise<CalendarAgentState[]>
```

### GoogleCalendarService Class

```typescript
// Event operations
await service.createEvent(event: CalendarEvent): Promise<Event>
await service.updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<Event>
await service.deleteEvent(eventId: string): Promise<void>

// Information retrieval
await service.listEvents(options: ListEventsParams): Promise<Event[]>
await service.searchEvents(query: string): Promise<Event[]>
await service.getFreeBusy(params: FreeBusyParams): Promise<FreeBusyResponse>

// Advanced features
await service.findAvailableTimeSlot(duration: number, timeRange: TimeRange): Promise<TimeSlot>
await service.addAttendees(eventId: string, attendees: string[]): Promise<Event>
```

### REST API Endpoints

```bash
# Initialize agent session
POST /api/calendar-agent
{
  "action": "initialize",
  "config": { ... },
  "sessionId": "unique_session_id"
}

# Process user request
POST /api/calendar-agent
{
  "action": "process",
  "userRequest": "Schedule a meeting tomorrow",
  "sessionId": "unique_session_id"
}

# Get agent statistics
POST /api/calendar-agent
{
  "action": "getStats",
  "sessionId": "unique_session_id"
}
```

## 🎨 UI Components

### CalendarAgentComponent

A complete React component that provides:
- **Chat Interface**: Conversational UI for natural language interaction
- **Sample Questions**: Pre-built examples to get users started
- **Real-time Processing**: Live feedback during request processing
- **Session Management**: View history and analytics
- **Error Handling**: Graceful error display and recovery

### Integration with Enterprise Search

The Calendar Agent integrates seamlessly with the Enterprise Search interface:

```typescript
// In SearchInterface.tsx
import { CalendarAgentComponent } from '@/agents/calendar/CalendarAgentComponent';

// Add the calendar button and modal
<button onClick={() => setShowCalendarAgent(true)}>
  <Calendar className="h-4 w-4" />
  Calendar Agent
</button>

<CalendarAgentComponent
  isOpen={showCalendarAgent}
  onClose={() => setShowCalendarAgent(false)}
/>
```

## 🔍 Testing

### Running Tests
```bash
# Run the full test suite
npm test

# Run calendar agent specific tests
npm test src/agents/calendar

# Run with coverage
npm run test:coverage
```

### Manual Testing

1. **Start the Development Server**:
   ```bash
   npm run dev
   ```

2. **Open the Calendar Agent**:
   - Navigate to the Enterprise Search interface
   - Click the "Calendar Agent" button
   - Start with sample questions

3. **Test Different Scenarios**:
   - Event creation with various date formats
   - Meeting scheduling with multiple attendees
   - Availability checking across different time zones
   - Error handling with invalid requests

### Test Cases

```typescript
// Example test cases to verify
const testCases = [
  "Schedule a team meeting tomorrow at 2 PM",
  "Find all my meetings next week",
  "Cancel my 3 PM appointment today", 
  "Check my availability on Friday afternoon",
  "Create a recurring standup every Monday at 9 AM",
  "Add john@example.com to my marketing review meeting"
];
```

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**: Ensure all required environment variables are set
2. **Google OAuth**: Configure production redirect URIs
3. **Rate Limiting**: Implement proper rate limiting for API calls
4. **Error Monitoring**: Set up error tracking and monitoring
5. **Security**: Secure handling of OAuth tokens and API keys

### Docker Deployment
```dockerfile
# Add to your existing Dockerfile
COPY src/agents/ ./src/agents/
RUN npm run build
```

## 🔒 Security

### Best Practices
- **Token Security**: Never expose OAuth tokens in client-side code
- **API Key Protection**: Use environment variables for all API keys
- **Scope Limitation**: Request minimal required Google Calendar permissions
- **Session Management**: Implement secure session handling
- **Input Validation**: Validate all user inputs before processing

### Google OAuth Scopes
```javascript
const requiredScopes = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];
```

## 📊 Monitoring & Analytics

### Built-in Analytics
- **Usage Patterns**: Track common user actions and preferences
- **Performance Metrics**: Monitor response times and success rates
- **Error Analysis**: Identify and resolve common failure points
- **Session Analytics**: Understand user behavior and conversation flows

### Custom Monitoring
```typescript
// Get detailed analytics
const stats = await agent.analyzeUserPatterns();
console.log('Most common actions:', stats.mostCommonActions);
console.log('Error rate:', stats.errorRate);
console.log('Suggestions:', stats.suggestions);
```

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Code Style
- Follow existing TypeScript/React patterns
- Add comprehensive type definitions
- Include proper error handling
- Write descriptive commit messages

## 📝 License

This Calendar Agent is part of the Enterprise Search platform and follows the same licensing terms.

## 🆘 Support

### Common Issues

1. **Authentication Errors**: Verify Google OAuth credentials
2. **API Rate Limits**: Implement proper rate limiting
3. **Time Zone Issues**: Ensure proper time zone handling
4. **Network Errors**: Add retry logic for API calls

### Getting Help
- Check the troubleshooting guide
- Review the API documentation
- Submit issues on GitHub
- Contact the development team

## 🎉 What's Next

### Planned Features
- **Multi-calendar Support**: Manage multiple Google calendars
- **Smart Scheduling**: AI-powered optimal meeting time suggestions
- **Integration Expansion**: Support for Outlook, Apple Calendar
- **Voice Interface**: Voice-activated calendar commands
- **Mobile App**: Dedicated mobile application
- **Team Coordination**: Advanced team scheduling features

---

**Ready to revolutionize your calendar management? Start using the Calendar Agent today!** 🚀
