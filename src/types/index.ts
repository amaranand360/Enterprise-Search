// Core types for Enterprise Search System

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user';
}

export interface Tool {
  id: string;
  name: string;
  category: ToolCategory;
  icon: string;
  color: string;
  isConnected: boolean;
  isDemo: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastSync?: Date;
  description: string;
  features: string[];
}

export type ToolCategory = 
  | 'communication'
  | 'project-management'
  | 'development'
  | 'documentation'
  | 'file-storage'
  | 'productivity'
  | 'crm'
  | 'analytics';

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  tool: Tool;
  type: ContentType;
  url?: string;
  timestamp: Date;
  author?: string;
  relevanceScore: number;
  metadata?: Record<string, any>;
}

export type ContentType =
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
  | 'ai-response';

export interface SearchQuery {
  query: string;
  filters: SearchFilters;
  sortBy: 'relevance' | 'date' | 'author';
  sortOrder: 'asc' | 'desc';
}

export interface SearchFilters {
  tools?: string[];
  contentTypes?: ContentType[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  author?: string;
}

export interface Connection {
  toolId: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  credentials?: any;
  lastSync?: Date;
  error?: string;
}

export interface AIAction {
  id: string;
  type: 'search' | 'compose' | 'schedule' | 'create' | 'update';
  description: string;
  parameters: Record<string, any>;
  toolId: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

// Google Services specific types
export interface GoogleCredentials {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string[];
  date: Date;
  body: string;
  labels: string[];
  isRead: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  attendees: string[];
  location?: string;
  meetingLink?: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  modifiedTime: Date;
  webViewLink: string;
  thumbnailLink?: string;
  parents: string[];
}

// Demo data types
export interface DemoData {
  users: User[];
  messages: any[];
  tasks: any[];
  files: any[];
  events: CalendarEvent[];
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  desktop: boolean;
  frequency: 'immediate' | 'hourly' | 'daily';
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultTools: string[];
  searchHistory: string[];
  notifications: NotificationSettings;
}
