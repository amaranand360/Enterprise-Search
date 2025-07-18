import { v4 as uuidv4 } from 'uuid';
import { SearchResult, ContentType, User, CalendarEvent } from '@/types';
import { ALL_TOOLS } from '@/lib/config';

// Demo users
export const DEMO_USERS: User[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@company.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
    role: 'user'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b9c5e8e1?w=32&h=32&fit=crop&crop=face',
    role: 'admin'
  },
  {
    id: '3',
    name: 'Mike Chen',
    email: 'mike.chen@company.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
    role: 'user'
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily.davis@company.com',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face',
    role: 'user'
  }
];

// Demo search results generator
export function generateDemoSearchResults(query: string, count: number = 20): SearchResult[] {
  const results: SearchResult[] = [];
  const contentTypes: ContentType[] = ['email', 'document', 'message', 'task', 'issue', 'file', 'calendar-event'];
  
  const sampleTitles = [
    'Q4 Planning Meeting Notes',
    'Project Alpha Status Update',
    'Budget Review Discussion',
    'Team Standup Summary',
    'Client Feedback Analysis',
    'Marketing Campaign Results',
    'Technical Architecture Review',
    'User Research Findings',
    'Product Roadmap Update',
    'Security Audit Report'
  ];
  
  const sampleContent = [
    'This document contains important information about our upcoming initiatives and strategic planning.',
    'The project is progressing well with all milestones on track. Next steps include testing and deployment.',
    'Budget allocation has been reviewed and approved by the finance team. Implementation starts next quarter.',
    'Daily standup covered current blockers and upcoming deliverables. Team morale is high.',
    'Client feedback has been overwhelmingly positive with some suggestions for improvement.',
    'Marketing metrics show strong engagement across all channels with ROI exceeding expectations.',
    'Technical review identified several optimization opportunities and scalability improvements.',
    'User research reveals key insights about customer behavior and preferences.',
    'Product roadmap has been updated to reflect market changes and customer requests.',
    'Security audit completed with no critical vulnerabilities found. Minor recommendations included.'
  ];
  
  for (let i = 0; i < count; i++) {
    const tool = ALL_TOOLS[Math.floor(Math.random() * ALL_TOOLS.length)];
    const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
    const user = DEMO_USERS[Math.floor(Math.random() * DEMO_USERS.length)];
    const titleIndex = Math.floor(Math.random() * sampleTitles.length);
    const contentIndex = Math.floor(Math.random() * sampleContent.length);
    
    results.push({
      id: uuidv4(),
      title: sampleTitles[titleIndex] + (query ? ` - ${query}` : ''),
      content: sampleContent[contentIndex],
      tool,
      type: contentType,
      url: `https://${tool.name.toLowerCase().replace(' ', '')}.com/item/${i}`,
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
      author: user.name,
      relevanceScore: Math.random() * 100,
      metadata: {
        tags: ['important', 'review', 'planning'].slice(0, Math.floor(Math.random() * 3) + 1),
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        department: ['Engineering', 'Marketing', 'Sales', 'HR'][Math.floor(Math.random() * 4)]
      }
    });
  }
  
  return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

// Demo calendar events
export function generateDemoCalendarEvents(): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const eventTitles = [
    'Team Standup',
    'Client Meeting',
    'Project Review',
    'All Hands Meeting',
    'Design Review',
    'Sprint Planning',
    'Code Review',
    'Product Demo',
    'Strategy Session',
    'Training Workshop'
  ];
  
  for (let i = 0; i < 15; i++) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 14)); // Next 2 weeks
    startDate.setHours(9 + Math.floor(Math.random() * 8)); // 9 AM to 5 PM
    startDate.setMinutes(0);
    
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1); // 1 hour duration
    
    const attendees = DEMO_USERS
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 3) + 2)
      .map(user => user.email);
    
    events.push({
      id: uuidv4(),
      title: eventTitles[Math.floor(Math.random() * eventTitles.length)],
      description: 'Important meeting to discuss project progress and next steps.',
      start: startDate,
      end: endDate,
      attendees,
      location: Math.random() > 0.5 ? 'Conference Room A' : undefined,
      meetingLink: Math.random() > 0.3 ? 'https://meet.google.com/abc-defg-hij' : undefined
    });
  }
  
  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}

// Demo Slack messages
export function generateDemoSlackMessages() {
  const channels = ['#general', '#development', '#marketing', '#design', '#random'];
  const messages = [];
  
  const sampleMessages = [
    'Hey team, just pushed the latest changes to the repo. Please review when you get a chance!',
    'Great job on the presentation today! The client was really impressed.',
    'Can someone help me with the deployment process? Having some issues.',
    'Lunch meeting moved to 1 PM in the main conference room.',
    'New design mockups are ready for review. Check them out!',
    'Server maintenance scheduled for this weekend. Plan accordingly.',
    'Congratulations to Sarah on her promotion! Well deserved! 🎉',
    'Quick reminder: All-hands meeting tomorrow at 10 AM.',
    'Coffee machine is broken again. IT has been notified.',
    'Great article about our industry trends. Worth a read!'
  ];
  
  for (let i = 0; i < 50; i++) {
    const user = DEMO_USERS[Math.floor(Math.random() * DEMO_USERS.length)];
    const channel = channels[Math.floor(Math.random() * channels.length)];
    const message = sampleMessages[Math.floor(Math.random() * sampleMessages.length)];
    
    messages.push({
      id: uuidv4(),
      channel,
      user: user.name,
      message,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Last 7 days
      reactions: Math.floor(Math.random() * 5),
      replies: Math.floor(Math.random() * 3)
    });
  }
  
  return messages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// Demo Jira tickets
export function generateDemoJiraTickets() {
  const projects = ['PROJ', 'ALPHA', 'BETA', 'GAMMA'];
  const statuses = ['To Do', 'In Progress', 'Code Review', 'Testing', 'Done'];
  const priorities = ['Low', 'Medium', 'High', 'Critical'];
  const types = ['Bug', 'Feature', 'Task', 'Story'];
  
  const tickets = [];
  
  const sampleTitles = [
    'Fix login authentication issue',
    'Implement new dashboard design',
    'Add search functionality to user list',
    'Optimize database queries for performance',
    'Create API documentation',
    'Fix responsive layout on mobile',
    'Add unit tests for payment module',
    'Implement user role management',
    'Fix memory leak in background service',
    'Add export functionality to reports'
  ];
  
  for (let i = 0; i < 30; i++) {
    const project = projects[Math.floor(Math.random() * projects.length)];
    const ticketNumber = Math.floor(Math.random() * 1000) + 1;
    const assignee = DEMO_USERS[Math.floor(Math.random() * DEMO_USERS.length)];
    
    tickets.push({
      id: `${project}-${ticketNumber}`,
      title: sampleTitles[Math.floor(Math.random() * sampleTitles.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      type: types[Math.floor(Math.random() * types.length)],
      assignee: assignee.name,
      reporter: DEMO_USERS[Math.floor(Math.random() * DEMO_USERS.length)].name,
      created: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      updated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      description: 'Detailed description of the issue or feature request with acceptance criteria and technical requirements.'
    });
  }
  
  return tickets.sort((a, b) => b.updated.getTime() - a.updated.getTime());
}
