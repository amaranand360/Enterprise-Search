# Enterprise Search API Documentation

This document provides comprehensive documentation for the Enterprise Search application's internal APIs and services.

## Table of Contents

- [Search API](#search-api)
- [Connection Management API](#connection-management-api)
- [Demo Connector API](#demo-connector-api)
- [Query Parser API](#query-parser-api)
- [Google Services API](#google-services-api)
- [Types and Interfaces](#types-and-interfaces)

## Search API

### SearchInterface Component

The main search interface component that handles user queries and displays results.

#### Props

```typescript
interface SearchInterfaceProps {
  // No props - self-contained component
}
```

#### Key Methods

```typescript
// Internal methods (not exposed)
const handleSearch = (value: string) => void
const handleSuggestionSelect = (suggestion: string) => void
const debouncedSearch = debounce(async (searchQuery: string, searchFilters?: SearchFilters) => void)
```

### Search Utilities

#### generateDemoSearchResults

Generates demo search results for testing and demonstration.

```typescript
function generateDemoSearchResults(
  query: string, 
  count: number = 20
): SearchResult[]
```

**Parameters:**
- `query` (string): Search query to generate results for
- `count` (number): Number of results to generate (default: 20)

**Returns:** Array of `SearchResult` objects

**Example:**
```typescript
const results = generateDemoSearchResults('project alpha', 10)
console.log(results.length) // 10
```

## Connection Management API

### ConnectionStatusService

Singleton service for managing tool connections and health monitoring.

#### getInstance()

```typescript
static getInstance(): ConnectionStatusService
```

Returns the singleton instance of the connection status service.

#### connectTool(toolId)

```typescript
async connectTool(toolId: string): Promise<void>
```

Connects to a specific tool.

**Parameters:**
- `toolId` (string): Unique identifier for the tool

**Throws:** Error if connection fails

**Example:**
```typescript
try {
  await connectionStatusService.connectTool('slack')
  console.log('Connected to Slack')
} catch (error) {
  console.error('Connection failed:', error)
}
```

#### disconnectTool(toolId)

```typescript
async disconnectTool(toolId: string): Promise<void>
```

Disconnects from a specific tool.

#### getConnectionStatus(toolId)

```typescript
getConnectionStatus(toolId: string): { isConnected: boolean; lastSync?: Date }
```

Gets the current connection status for a tool.

#### getAllConnections()

```typescript
getAllConnections(): Connection[]
```

Returns all connection objects.

#### getConnectionStats()

```typescript
getConnectionStats(): ConnectionStats
```

Returns aggregated connection statistics.

**Returns:**
```typescript
interface ConnectionStats {
  totalTools: number
  connectedTools: number
  healthyConnections: number
  warningConnections: number
  errorConnections: number
  averageResponseTime: number
  totalUptime: number
}
```

## Demo Connector API

### BaseDemoConnector

Abstract base class for all demo connectors.

#### Constructor

```typescript
constructor(config: DemoConnectionConfig)
```

**Parameters:**
```typescript
interface DemoConnectionConfig {
  tool: Tool
  connectionDelay: [number, number] // min, max delay in ms
  searchDelay: [number, number]
  failureRate: number // 0-1, probability of connection failure
  dataSize: 'small' | 'medium' | 'large'
}
```

#### connect()

```typescript
async connect(): Promise<boolean>
```

Establishes connection to the demo service.

#### search(options)

```typescript
async search(options: DemoSearchOptions = {}): Promise<SearchResult[]>
```

**Parameters:**
```typescript
interface DemoSearchOptions {
  query?: string
  maxResults?: number
  contentTypes?: ContentType[]
  dateRange?: {
    start: Date
    end: Date
  }
}
```

### SlackDemoConnector

Specific implementation for Slack demo data.

#### getChannels()

```typescript
async getChannels(): Promise<string[]>
```

Returns list of available Slack channels.

#### getChannelMessages(channel, limit)

```typescript
async getChannelMessages(channel: string, limit: number = 50): Promise<SearchResult[]>
```

Gets messages from a specific channel.

#### getDirectMessages(limit)

```typescript
async getDirectMessages(limit: number = 50): Promise<SearchResult[]>
```

Gets direct messages.

### DemoConnectorManager

Manages all demo connectors.

#### getInstance()

```typescript
static getInstance(): DemoConnectorManager
```

#### searchAllConnectedTools(options)

```typescript
async searchAllConnectedTools(options: DemoSearchOptions = {}): Promise<SearchResult[]>
```

Searches across all connected demo tools.

## Query Parser API

### parseQuery(query)

```typescript
function parseQuery(query: string): ParsedQuery
```

Parses a natural language query and extracts intent, entities, and filters.

**Returns:**
```typescript
interface ParsedQuery {
  originalQuery: string
  cleanQuery: string
  filters: SearchFilters
  intent: QueryIntent
  entities: QueryEntity[]
}
```

**Example:**
```typescript
const parsed = parseQuery('send email to team about deployment')
console.log(parsed.intent.type) // 'action'
console.log(parsed.intent.action) // 'send'
```

### generateSearchSuggestions(query)

```typescript
function generateSearchSuggestions(query: string): string[]
```

Generates search suggestions based on the input query.

### explainQuery(parsedQuery)

```typescript
function explainQuery(parsed: ParsedQuery): string
```

Generates a human-readable explanation of the parsed query.

## Google Services API

### GoogleAuthService

Handles Google OAuth authentication.

#### signIn()

```typescript
async signIn(): Promise<GoogleCredentials>
```

Initiates Google OAuth sign-in flow.

#### signOut()

```typescript
async signOut(): Promise<void>
```

Signs out from Google services.

#### isSignedIn()

```typescript
isSignedIn(): boolean
```

Checks if user is currently signed in.

### GmailService

Handles Gmail API interactions.

#### getMessages(query, maxResults)

```typescript
async getMessages(query?: string, maxResults: number = 50): Promise<GmailMessage[]>
```

Retrieves Gmail messages.

#### sendMessage(to, subject, body)

```typescript
async sendMessage(to: string[], subject: string, body: string): Promise<boolean>
```

Sends an email message.

### CalendarService

Handles Google Calendar API interactions.

#### getEvents(calendarId, timeMin, timeMax, maxResults)

```typescript
async getEvents(
  calendarId: string = 'primary',
  timeMin?: Date,
  timeMax?: Date,
  maxResults: number = 50
): Promise<CalendarEvent[]>
```

Retrieves calendar events.

#### createEvent(event, calendarId)

```typescript
async createEvent(event: Partial<CalendarEvent>, calendarId: string = 'primary'): Promise<CalendarEvent | null>
```

Creates a new calendar event.

## Types and Interfaces

### Core Types

```typescript
interface Tool {
  id: string
  name: string
  icon: string
  color: string
  category: string
  description: string
  isDemo: boolean
  isConnected: boolean
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error'
  lastSync?: Date
  features: string[]
}

interface SearchResult {
  id: string
  title: string
  content: string
  tool: Tool
  type: ContentType
  url: string
  timestamp: Date
  author?: string
  relevanceScore: number
  metadata?: Record<string, any>
}

type ContentType = 
  | 'email' 
  | 'document' 
  | 'message' 
  | 'task' 
  | 'issue' 
  | 'file' 
  | 'calendar-event' 
  | 'contact' 
  | 'note' 
  | 'code'

interface SearchFilters {
  tools?: string[]
  contentTypes?: ContentType[]
  dateRange?: {
    start: Date
    end: Date
  }
  author?: string
}
```

### Google Types

```typescript
interface GoogleCredentials {
  access_token: string
  refresh_token: string
  scope: string
  token_type: string
  expiry_date: number
}

interface GmailMessage {
  id: string
  threadId: string
  subject: string
  from: string
  to: string[]
  date: Date
  body: string
  labels: string[]
  isRead: boolean
}

interface CalendarEvent {
  id: string
  title: string
  description?: string
  start: Date
  end: Date
  attendees: string[]
  location?: string
  meetingLink?: string
}
```

## Error Handling

All API methods follow consistent error handling patterns:

1. **Connection Errors**: Thrown when a service is not connected
2. **Authentication Errors**: Thrown when credentials are invalid or expired
3. **Rate Limiting**: Handled with exponential backoff
4. **Network Errors**: Wrapped with descriptive messages

### Example Error Handling

```typescript
try {
  await connectionStatusService.connectTool('gmail')
} catch (error) {
  if (error.message.includes('authentication')) {
    // Handle auth error
  } else if (error.message.includes('network')) {
    // Handle network error
  } else {
    // Handle other errors
  }
}
```

## Rate Limiting

The application implements rate limiting for external API calls:

- **Google APIs**: Respects Google's rate limits with exponential backoff
- **Demo Connectors**: Simulated delays to mimic real-world performance
- **Search Operations**: Debounced to prevent excessive queries

## Caching

Caching strategies are implemented at multiple levels:

- **Connection Status**: Cached for 30 seconds
- **Search Results**: Cached for 5 minutes
- **Tool Metadata**: Cached until connection changes
- **User Preferences**: Persisted in localStorage

## Security Considerations

- All API keys and secrets are stored in environment variables
- OAuth tokens are stored securely and refreshed automatically
- Demo data contains no real user information
- All external API calls are made over HTTPS

## Performance Optimization

- Search operations are debounced to reduce API calls
- Results are paginated to improve load times
- Connection health checks run in the background
- Lazy loading for non-critical components
