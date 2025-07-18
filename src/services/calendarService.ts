import { CalendarEvent } from '@/types';
import { googleAuth } from './googleAuth';

export class CalendarService {
  private static instance: CalendarService;
  private baseUrl = 'https://www.googleapis.com/calendar/v3';

  private constructor() {}

  static getInstance(): CalendarService {
    if (!CalendarService.instance) {
      CalendarService.instance = new CalendarService();
    }
    return CalendarService.instance;
  }

  async getEvents(
    calendarId: string = 'primary',
    timeMin?: Date,
    timeMax?: Date,
    maxResults: number = 50
  ): Promise<CalendarEvent[]> {
    try {
      const params = new URLSearchParams({
        maxResults: maxResults.toString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        ...(timeMin && { timeMin: timeMin.toISOString() }),
        ...(timeMax && { timeMax: timeMax.toISOString() })
      });

      const response = await googleAuth.makeAuthenticatedRequest(
        `${this.baseUrl}/calendars/${calendarId}/events?${params}`
      );

      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.items?.map((item: any) => this.parseCalendarEvent(item)) || [];
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
      // Return demo data for development
      return this.getDemoEvents();
    }
  }

  async createEvent(event: Partial<CalendarEvent>, calendarId: string = 'primary'): Promise<CalendarEvent | null> {
    try {
      const eventData = {
        summary: event.title,
        description: event.description,
        start: {
          dateTime: event.start?.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: event.end?.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        attendees: event.attendees?.map(email => ({ email })),
        location: event.location,
        conferenceData: event.meetingLink ? {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        } : undefined
      };

      const response = await googleAuth.makeAuthenticatedRequest(
        `${this.baseUrl}/calendars/${calendarId}/events`,
        {
          method: 'POST',
          body: JSON.stringify(eventData)
        }
      );

      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseCalendarEvent(data);
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      // Return a demo event for development
      return {
        id: `demo-${Date.now()}`,
        title: event.title || 'New Event',
        description: event.description,
        start: event.start || new Date(),
        end: event.end || new Date(Date.now() + 60 * 60 * 1000),
        attendees: event.attendees || [],
        location: event.location,
        meetingLink: event.meetingLink
      };
    }
  }

  async updateEvent(
    eventId: string,
    updates: Partial<CalendarEvent>,
    calendarId: string = 'primary'
  ): Promise<CalendarEvent | null> {
    try {
      const eventData = {
        summary: updates.title,
        description: updates.description,
        start: updates.start ? {
          dateTime: updates.start.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        } : undefined,
        end: updates.end ? {
          dateTime: updates.end.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        } : undefined,
        attendees: updates.attendees?.map(email => ({ email })),
        location: updates.location
      };

      const response = await googleAuth.makeAuthenticatedRequest(
        `${this.baseUrl}/calendars/${calendarId}/events/${eventId}`,
        {
          method: 'PUT',
          body: JSON.stringify(eventData)
        }
      );

      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseCalendarEvent(data);
    } catch (error) {
      console.error('Failed to update calendar event:', error);
      return null;
    }
  }

  async deleteEvent(eventId: string, calendarId: string = 'primary'): Promise<boolean> {
    try {
      const response = await googleAuth.makeAuthenticatedRequest(
        `${this.baseUrl}/calendars/${calendarId}/events/${eventId}`,
        {
          method: 'DELETE'
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Failed to delete calendar event:', error);
      return false;
    }
  }

  async searchEvents(query: string, calendarId: string = 'primary'): Promise<CalendarEvent[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '50'
      });

      const response = await googleAuth.makeAuthenticatedRequest(
        `${this.baseUrl}/calendars/${calendarId}/events?${params}`
      );

      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.items?.map((item: any) => this.parseCalendarEvent(item)) || [];
    } catch (error) {
      console.error('Failed to search calendar events:', error);
      return this.getDemoEvents().filter(event =>
        event.title.toLowerCase().includes(query.toLowerCase()) ||
        event.description?.toLowerCase().includes(query.toLowerCase())
      );
    }
  }

  async getCalendars(): Promise<any[]> {
    try {
      const response = await googleAuth.makeAuthenticatedRequest(
        `${this.baseUrl}/users/me/calendarList`
      );

      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Failed to fetch calendars:', error);
      return [
        { id: 'primary', summary: 'Primary Calendar', primary: true },
        { id: 'work', summary: 'Work Calendar', primary: false },
        { id: 'personal', summary: 'Personal Calendar', primary: false }
      ];
    }
  }

  private parseCalendarEvent(item: any): CalendarEvent {
    return {
      id: item.id,
      title: item.summary || 'Untitled Event',
      description: item.description,
      start: new Date(item.start?.dateTime || item.start?.date),
      end: new Date(item.end?.dateTime || item.end?.date),
      attendees: item.attendees?.map((attendee: any) => attendee.email) || [],
      location: item.location,
      meetingLink: item.hangoutLink || item.conferenceData?.entryPoints?.[0]?.uri
    };
  }

  private getDemoEvents(): CalendarEvent[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return [
      {
        id: 'demo-event-1',
        title: 'Team Standup',
        description: 'Daily team standup meeting',
        start: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9 AM today
        end: new Date(today.getTime() + 9.5 * 60 * 60 * 1000), // 9:30 AM today
        attendees: ['team@company.com'],
        meetingLink: 'https://meet.google.com/abc-defg-hij'
      },
      {
        id: 'demo-event-2',
        title: 'Client Presentation',
        description: 'Quarterly business review with client',
        start: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 2 PM today
        end: new Date(today.getTime() + 15 * 60 * 60 * 1000), // 3 PM today
        attendees: ['client@external.com', 'sales@company.com'],
        location: 'Conference Room A',
        meetingLink: 'https://meet.google.com/xyz-uvw-rst'
      },
      {
        id: 'demo-event-3',
        title: 'Project Planning',
        description: 'Planning session for Q1 projects',
        start: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), // 10 AM tomorrow
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000), // 11 AM tomorrow
        attendees: ['managers@company.com'],
        location: 'Conference Room B'
      },
      {
        id: 'demo-event-4',
        title: 'All Hands Meeting',
        description: 'Monthly company-wide meeting',
        start: new Date(today.getTime() + 48 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000), // 3 PM day after tomorrow
        end: new Date(today.getTime() + 48 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000), // 4 PM day after tomorrow
        attendees: ['everyone@company.com'],
        meetingLink: 'https://meet.google.com/all-hands-meet'
      },
      {
        id: 'demo-event-5',
        title: 'Code Review Session',
        description: 'Weekly code review and architecture discussion',
        start: new Date(today.getTime() + 72 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000), // 11 AM in 3 days
        end: new Date(today.getTime() + 72 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000), // 12 PM in 3 days
        attendees: ['developers@company.com'],
        meetingLink: 'https://meet.google.com/code-review-123'
      }
    ];
  }
}

export const calendarService = CalendarService.getInstance();
