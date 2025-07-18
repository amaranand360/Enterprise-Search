import { Tool, ToolCategory } from '@/types';

export const GOOGLE_TOOLS: Tool[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    category: 'communication',
    icon: '📧',
    color: '#EA4335',
    isConnected: false,
    isDemo: false,
    connectionStatus: 'disconnected',
    description: 'Email management and search',
    features: ['Email search', 'Compose emails', 'Manage labels', 'Real-time sync']
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    category: 'productivity',
    icon: '📅',
    color: '#4285F4',
    isConnected: false,
    isDemo: false,
    connectionStatus: 'disconnected',
    description: 'Calendar events and scheduling',
    features: ['Event search', 'Create events', 'Schedule meetings', 'Availability check']
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    category: 'file-storage',
    icon: '💾',
    color: '#0F9D58',
    isConnected: false,
    isDemo: false,
    connectionStatus: 'disconnected',
    description: 'File storage and document management',
    features: ['File search', 'Upload files', 'Share documents', 'Version control']
  },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    category: 'productivity',
    icon: '📊',
    color: '#0F9D58',
    isConnected: false,
    isDemo: false,
    connectionStatus: 'disconnected',
    description: 'Spreadsheet management and data analysis',
    features: ['Data search', 'Create sheets', 'Formulas', 'Collaboration']
  },
  {
    id: 'google-meet',
    name: 'Google Meet',
    category: 'communication',
    icon: '🎥',
    color: '#00832D',
    isConnected: false,
    isDemo: false,
    connectionStatus: 'disconnected',
    description: 'Video conferencing and meetings',
    features: ['Schedule meetings', 'Join calls', 'Recording access', 'Participant management']
  }
];

export const DEMO_TOOLS: Tool[] = [
  // Communication Tools
  {
    id: 'slack',
    name: 'Slack',
    category: 'communication',
    icon: '💬',
    color: '#4A154B',
    isConnected: false,
    isDemo: true,
    connectionStatus: 'disconnected',
    description: 'Team communication and collaboration',
    features: ['Channel search', 'Direct messages', 'File sharing', 'Integrations']
  },
  {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    category: 'communication',
    icon: '👥',
    color: '#6264A7',
    isConnected: false,
    isDemo: true,
    connectionStatus: 'disconnected',
    description: 'Team collaboration and video meetings',
    features: ['Chat search', 'Video calls', 'File collaboration', 'Channel management']
  },
  {
    id: 'discord',
    name: 'Discord',
    category: 'communication',
    icon: '🎮',
    color: '#5865F2',
    isConnected: false,
    isDemo: true,
    connectionStatus: 'disconnected',
    description: 'Community and team communication',
    features: ['Server search', 'Voice channels', 'Message history', 'Bot integration']
  },
  
  // Project Management
  {
    id: 'jira',
    name: 'Jira',
    category: 'project-management',
    icon: '🎯',
    color: '#0052CC',
    isConnected: false,
    isDemo: true,
    connectionStatus: 'disconnected',
    description: 'Issue tracking and project management',
    features: ['Ticket search', 'Sprint planning', 'Workflow management', 'Reporting']
  },
  {
    id: 'asana',
    name: 'Asana',
    category: 'project-management',
    icon: '✅',
    color: '#F06A6A',
    isConnected: false,
    isDemo: true,
    connectionStatus: 'disconnected',
    description: 'Task and project management',
    features: ['Task search', 'Project tracking', 'Team collaboration', 'Timeline view']
  },
  {
    id: 'monday',
    name: 'Monday.com',
    category: 'project-management',
    icon: '📋',
    color: '#FF3D57',
    isConnected: false,
    isDemo: true,
    connectionStatus: 'disconnected',
    description: 'Work operating system',
    features: ['Board search', 'Workflow automation', 'Time tracking', 'Custom fields']
  },
  {
    id: 'trello',
    name: 'Trello',
    category: 'project-management',
    icon: '📌',
    color: '#0079BF',
    isConnected: false,
    isDemo: true,
    connectionStatus: 'disconnected',
    description: 'Kanban-style project management',
    features: ['Card search', 'Board management', 'Power-ups', 'Team collaboration']
  },
  
  // Development Tools
  {
    id: 'github',
    name: 'GitHub',
    category: 'development',
    icon: '🐙',
    color: '#181717',
    isConnected: false,
    isDemo: true,
    connectionStatus: 'disconnected',
    description: 'Code repository and collaboration',
    features: ['Code search', 'Issue tracking', 'Pull requests', 'Repository management']
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    category: 'development',
    icon: '🦊',
    color: '#FC6D26',
    isConnected: false,
    isDemo: true,
    connectionStatus: 'disconnected',
    description: 'DevOps platform and code management',
    features: ['Project search', 'CI/CD pipelines', 'Merge requests', 'Issue boards']
  },
  {
    id: 'bitbucket',
    name: 'Bitbucket',
    category: 'development',
    icon: '🪣',
    color: '#0052CC',
    isConnected: false,
    isDemo: true,
    connectionStatus: 'disconnected',
    description: 'Git repository management',
    features: ['Repository search', 'Branch management', 'Code review', 'Integrations']
  }
];

export const ALL_TOOLS = [...GOOGLE_TOOLS, ...DEMO_TOOLS];

export const TOOL_CATEGORIES: Record<ToolCategory, { name: string; icon: string; color: string }> = {
  'communication': { name: 'Communication', icon: '💬', color: '#4A90E2' },
  'project-management': { name: 'Project Management', icon: '📋', color: '#F5A623' },
  'development': { name: 'Development', icon: '💻', color: '#7ED321' },
  'documentation': { name: 'Documentation', icon: '📚', color: '#9013FE' },
  'file-storage': { name: 'File Storage', icon: '📁', color: '#FF6B6B' },
  'productivity': { name: 'Productivity', icon: '⚡', color: '#4ECDC4' },
  'crm': { name: 'CRM', icon: '👥', color: '#FF9500' },
  'analytics': { name: 'Analytics', icon: '📊', color: '#5AC8FA' }
};

export const GOOGLE_OAUTH_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
  scopes: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ]
};

export const SEARCH_CONFIG = {
  maxResults: 50,
  debounceDelay: 300,
  minQueryLength: 2,
  defaultSortBy: 'relevance' as const,
  defaultSortOrder: 'desc' as const
};

export const UI_CONFIG = {
  sidebarWidth: 280,
  headerHeight: 64,
  searchBarHeight: 48,
  animationDuration: 200
};
