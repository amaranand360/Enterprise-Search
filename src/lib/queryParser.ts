import { SearchFilters, ContentType } from '@/types';
import { ALL_TOOLS } from './config';

export interface ParsedQuery {
  originalQuery: string;
  cleanQuery: string;
  filters: SearchFilters;
  intent: QueryIntent;
  entities: QueryEntity[];
}

export interface QueryIntent {
  type: 'search' | 'action' | 'question';
  action?: 'create' | 'send' | 'schedule' | 'find' | 'update' | 'delete';
  confidence: number;
}

export interface QueryEntity {
  type: 'person' | 'date' | 'tool' | 'content_type' | 'tag' | 'location';
  value: string;
  confidence: number;
}

// Keywords for different content types
const CONTENT_TYPE_KEYWORDS: Record<ContentType, string[]> = {
  'email': ['email', 'emails', 'mail', 'message', 'inbox'],
  'document': ['document', 'doc', 'file', 'pdf', 'report'],
  'message': ['message', 'chat', 'conversation', 'dm'],
  'task': ['task', 'todo', 'assignment', 'work'],
  'issue': ['issue', 'bug', 'ticket', 'problem'],
  'file': ['file', 'attachment', 'upload'],
  'calendar-event': ['meeting', 'event', 'calendar', 'appointment'],
  'contact': ['contact', 'person', 'user', 'colleague'],
  'note': ['note', 'notes', 'memo', 'reminder'],
  'code': ['code', 'repository', 'repo', 'commit', 'branch']
};

// Action keywords
const ACTION_KEYWORDS = {
  create: ['create', 'make', 'new', 'add', 'compose', 'write'],
  send: ['send', 'email', 'message', 'share'],
  schedule: ['schedule', 'book', 'plan', 'arrange'],
  find: ['find', 'search', 'look', 'get', 'show'],
  update: ['update', 'edit', 'change', 'modify'],
  delete: ['delete', 'remove', 'cancel']
};

// Date patterns
const DATE_PATTERNS = [
  /\b(today|yesterday|tomorrow)\b/i,
  /\b(this|last|next)\s+(week|month|year)\b/i,
  /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/,
  /\b\d{1,2}-\d{1,2}-\d{2,4}\b/,
  /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\b/i,
  /\b\d{1,2}\s+(days?|weeks?|months?)\s+ago\b/i
];

// Person name patterns (simple heuristic)
const PERSON_PATTERNS = [
  /\bfrom\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/,
  /\bby\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/,
  /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+sent\b/,
  /\b@([a-zA-Z0-9._-]+)\b/
];

export function parseQuery(query: string): ParsedQuery {
  const originalQuery = query;
  let cleanQuery = query.toLowerCase().trim();
  const filters: SearchFilters = {};
  const entities: QueryEntity[] = [];

  // Extract tool mentions
  const toolMatches = ALL_TOOLS.filter(tool => 
    cleanQuery.includes(tool.name.toLowerCase()) ||
    cleanQuery.includes(tool.id)
  );
  
  if (toolMatches.length > 0) {
    filters.tools = toolMatches.map(tool => tool.id);
    entities.push(...toolMatches.map(tool => ({
      type: 'tool' as const,
      value: tool.name,
      confidence: 0.9
    })));
    
    // Remove tool names from clean query
    toolMatches.forEach(tool => {
      cleanQuery = cleanQuery.replace(new RegExp(tool.name.toLowerCase(), 'g'), '');
    });
  }

  // Extract content type mentions
  const contentTypes: ContentType[] = [];
  Object.entries(CONTENT_TYPE_KEYWORDS).forEach(([type, keywords]) => {
    keywords.forEach(keyword => {
      if (cleanQuery.includes(keyword)) {
        contentTypes.push(type as ContentType);
        entities.push({
          type: 'content_type',
          value: type,
          confidence: 0.8
        });
        cleanQuery = cleanQuery.replace(new RegExp(`\\b${keyword}\\b`, 'g'), '');
      }
    });
  });
  
  if (contentTypes.length > 0) {
    filters.contentTypes = [...new Set(contentTypes)];
  }

  // Extract date mentions
  DATE_PATTERNS.forEach(pattern => {
    const matches = originalQuery.match(pattern);
    if (matches) {
      matches.forEach(match => {
        entities.push({
          type: 'date',
          value: match,
          confidence: 0.7
        });
        cleanQuery = cleanQuery.replace(match.toLowerCase(), '');
      });
    }
  });

  // Extract person mentions
  PERSON_PATTERNS.forEach(pattern => {
    const matches = originalQuery.match(pattern);
    if (matches && matches[1]) {
      entities.push({
        type: 'person',
        value: matches[1],
        confidence: 0.6
      });
      filters.author = matches[1];
      cleanQuery = cleanQuery.replace(matches[0].toLowerCase(), '');
    }
  });

  // Determine intent
  const intent = determineIntent(originalQuery);

  // Clean up the query
  cleanQuery = cleanQuery
    .replace(/\s+/g, ' ')
    .replace(/\b(in|from|by|on|at|the|a|an)\b/g, '')
    .trim();

  return {
    originalQuery,
    cleanQuery,
    filters,
    intent,
    entities
  };
}

function determineIntent(query: string): QueryIntent {
  const lowerQuery = query.toLowerCase();
  
  // Check for action keywords
  for (const [action, keywords] of Object.entries(ACTION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerQuery.includes(keyword)) {
        return {
          type: 'action',
          action: action as any,
          confidence: 0.8
        };
      }
    }
  }

  // Check for question patterns
  const questionWords = ['what', 'when', 'where', 'who', 'why', 'how'];
  if (questionWords.some(word => lowerQuery.startsWith(word))) {
    return {
      type: 'question',
      confidence: 0.9
    };
  }

  // Default to search
  return {
    type: 'search',
    confidence: 0.7
  };
}

export function generateSearchSuggestions(query: string): string[] {
  const parsed = parseQuery(query);
  const suggestions: string[] = [];

  // Suggest based on detected entities
  parsed.entities.forEach(entity => {
    switch (entity.type) {
      case 'tool':
        suggestions.push(`${query} in ${entity.value}`);
        break;
      case 'content_type':
        suggestions.push(`${entity.value} about ${query}`);
        break;
      case 'person':
        suggestions.push(`${query} from ${entity.value}`);
        break;
    }
  });

  // Suggest common patterns
  if (parsed.intent.type === 'search') {
    suggestions.push(
      `${query} from last week`,
      `${query} documents`,
      `${query} meetings`,
      `recent ${query}`
    );
  }

  return suggestions.slice(0, 5);
}

export function explainQuery(parsed: ParsedQuery): string {
  const parts: string[] = [];
  
  if (parsed.cleanQuery) {
    parts.push(`Searching for "${parsed.cleanQuery}"`);
  }
  
  if (parsed.filters.tools?.length) {
    const toolNames = parsed.filters.tools
      .map(id => ALL_TOOLS.find(t => t.id === id)?.name)
      .filter(Boolean);
    parts.push(`in ${toolNames.join(', ')}`);
  }
  
  if (parsed.filters.contentTypes?.length) {
    parts.push(`for ${parsed.filters.contentTypes.join(', ')}`);
  }
  
  if (parsed.filters.author) {
    parts.push(`by ${parsed.filters.author}`);
  }
  
  return parts.join(' ');
}
