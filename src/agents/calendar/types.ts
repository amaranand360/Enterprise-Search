import { BaseMessage } from "@langchain/core/messages";

export interface CalendarAgentState {
  messages: BaseMessage[];
  currentAction: string;
  calendarData: any;
  error: string | null;
  isComplete: boolean;
  userRequest: string;
  context: any;
}

export interface CalendarAgentConfig {
  openaiApiKey: string;
  googleAuth: any; // OAuth2Client from google-auth-library
  useRealCalendar?: boolean; // Flag to enable real Google Calendar operations
}

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  recurrence?: string[];
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
  visibility?: 'default' | 'public' | 'private' | 'confidential';
  status?: 'confirmed' | 'tentative' | 'cancelled';
}

export interface EventSearchParams {
  timeMin?: string;
  timeMax?: string;
  q?: string;
  singleEvents?: boolean;
  orderBy?: 'startTime' | 'updated';
  maxResults?: number;
  calendarId?: string;
}

export interface CreateEventParams {
  summary: string;
  description?: string;
  location?: string;
  startDateTime: string;
  endDateTime: string;
  timeZone?: string;
  attendees?: string[];
  reminders?: boolean;
  reminderMinutes?: number[];
  visibility?: 'default' | 'public' | 'private' | 'confidential';
  recurrence?: {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    interval?: number;
    count?: number;
    until?: string;
    byDay?: string[];
  };
}

export interface UpdateEventParams {
  eventId: string;
  calendarId?: string;
  summary?: string;
  description?: string;
  location?: string;
  startDateTime?: string;
  endDateTime?: string;
  timeZone?: string;
  attendees?: string[];
  status?: 'confirmed' | 'tentative' | 'cancelled';
}

export interface DeleteEventParams {
  eventId: string;
  calendarId?: string;
  sendUpdates?: 'all' | 'externalOnly' | 'none';
}

export interface ListEventsParams {
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
  calendarId?: string;
  singleEvents?: boolean;
  orderBy?: 'startTime' | 'updated';
}

export interface FreeBusyParams {
  timeMin: string;
  timeMax: string;
  calendars: string[];
  groupExpansionMax?: number;
  calendarExpansionMax?: number;
}

export interface ManageAttendeesParams {
  eventId: string;
  calendarId?: string;
  action: 'add' | 'remove';
  attendees: string[];
  sendUpdates?: 'all' | 'externalOnly' | 'none';
}

export interface CalendarAuthTokens {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date?: number;
}

export interface GoogleAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope?: string[];
}

export interface CalendarServiceConfig {
  auth: CalendarAuthTokens | GoogleAuthConfig;
  calendarId?: string;
}

export interface EventConflict {
  eventId: string;
  summary: string;
  startTime: string;
  endTime: string;
  conflictType: 'overlap' | 'exact' | 'adjacent';
}

export interface FreeBusyResponse {
  timeMin: string;
  timeMax: string;
  calendars: {
    [calendarId: string]: {
      busy: Array<{
        start: string;
        end: string;
      }>;
      errors?: Array<{
        domain: string;
        reason: string;
      }>;
    };
  };
}

export interface RecurringEventConfig {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval?: number;
  count?: number;
  until?: string;
  byDay?: Array<'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU'>;
  byMonth?: number[];
  byMonthDay?: number[];
}

export interface AgentAnalysisResult {
  action: string;
  parameters: any;
  confidence: number;
  needsMoreInfo: boolean;
  clarificationQuestions: string[];
  extractedEntities?: {
    dates?: string[];
    times?: string[];
    emails?: string[];
    locations?: string[];
    names?: string[];
  };
}

export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    executionTime: number;
    apiCalls: number;
    tokensUsed?: number;
  };
}

export interface CalendarAgentResponse {
  message: string;
  success: boolean;
  data?: any;
  suggestedActions?: string[];
  error?: string;
}
