import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { 
  CalendarEvent, 
  CalendarServiceConfig, 
  CalendarAuthTokens,
  GoogleAuthConfig,
  FreeBusyResponse,
  EventSearchParams
} from './types';

export class GoogleCalendarService {
  private auth: OAuth2Client;
  private calendar: calendar_v3.Calendar;
  private calendarId: string;

  constructor(config: CalendarServiceConfig) {
    this.calendarId = config.calendarId || 'primary';
    
    if (this.isAuthTokens(config.auth)) {
      // Using existing tokens
      this.auth = new OAuth2Client();
      this.auth.setCredentials(config.auth);
    } else {
      // Using OAuth config
      const authConfig = config.auth as GoogleAuthConfig;
      this.auth = new OAuth2Client(
        authConfig.clientId,
        authConfig.clientSecret,
        authConfig.redirectUri
      );
    }

    this.calendar = google.calendar({ version: 'v3', auth: this.auth });
  }

  private isAuthTokens(auth: any): auth is CalendarAuthTokens {
    return auth && typeof auth.access_token === 'string';
  }

  async initialize(): Promise<void> {
    try {
      // For demo purposes, create a mock initialization that doesn't require real OAuth
      // In production, this would verify the OAuth tokens
      console.log('Initializing Google Calendar Service in demo mode...');
      
      // Simulate successful initialization
      return Promise.resolve();
    } catch (error) {
      throw new Error(`Failed to initialize Google Calendar service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createEvent(event: CalendarEvent): Promise<calendar_v3.Schema$Event> {
    try {
      // For demo purposes, simulate event creation
      const demoEvent: calendar_v3.Schema$Event = {
        id: `demo_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        summary: event.summary,
        description: event.description,
        location: event.location,
        start: event.start,
        end: event.end,
        attendees: event.attendees,
        status: 'confirmed',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        htmlLink: `https://calendar.google.com/calendar/event?eid=demo_${Date.now()}`,
        organizer: {
          email: 'user@example.com',
          displayName: 'Calendar Agent User'
        }
      };

      // In a real implementation, this would make the actual API call:
      // const response = await this.calendar.events.insert({
      //   calendarId: this.calendarId,
      //   requestBody: event,
      //   sendUpdates: 'all'
      // });

      console.log('Demo: Created calendar event:', demoEvent.summary);
      return demoEvent;
    } catch (error) {
      throw new Error(`Failed to create event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<calendar_v3.Schema$Event> {
    try {
      // For demo purposes, simulate event update
      const updatedEvent: calendar_v3.Schema$Event = {
        id: eventId,
        summary: event.summary || 'Updated Event',
        description: event.description,
        location: event.location,
        start: event.start,
        end: event.end,
        attendees: event.attendees,
        status: 'confirmed',
        updated: new Date().toISOString(),
        htmlLink: `https://calendar.google.com/calendar/event?eid=${eventId}`
      };

      console.log('Demo: Updated calendar event:', eventId);
      return updatedEvent;
    } catch (error) {
      throw new Error(`Failed to update event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteEvent(eventId: string, sendUpdates: 'all' | 'externalOnly' | 'none' = 'all'): Promise<void> {
    try {
      // For demo purposes, simulate event deletion
      console.log('Demo: Deleted calendar event:', eventId);
      return Promise.resolve();
    } catch (error) {
      throw new Error(`Failed to delete event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getEvent(eventId: string): Promise<calendar_v3.Schema$Event> {
    try {
      const response = await this.calendar.events.get({
        calendarId: this.calendarId,
        eventId
      });

      if (!response.data) {
        throw new Error('Event not found');
      }

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async listEvents(params: EventSearchParams = {}): Promise<calendar_v3.Schema$Event[]> {
    try {
      // For demo purposes, return sample events
      const demoEvents: calendar_v3.Schema$Event[] = [
        {
          id: 'demo_event_1',
          summary: 'Team Standup',
          description: 'Daily team standup meeting',
          start: { 
            dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
            timeZone: 'America/New_York'
          },
          end: { 
            dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(), // Tomorrow + 30 min
            timeZone: 'America/New_York'
          },
          status: 'confirmed',
          attendees: [
            { email: 'team@example.com', responseStatus: 'accepted' }
          ]
        },
        {
          id: 'demo_event_2',
          summary: 'Project Review',
          description: 'Weekly project review meeting',
          start: { 
            dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
            timeZone: 'America/New_York'
          },
          end: { 
            dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // +1 hour
            timeZone: 'America/New_York'
          },
          status: 'confirmed',
          location: 'Conference Room A'
        }
      ];

      // Filter based on params
      let filteredEvents = demoEvents;
      
      if (params.q) {
        filteredEvents = demoEvents.filter(event => 
          event.summary?.toLowerCase().includes(params.q!.toLowerCase()) ||
          event.description?.toLowerCase().includes(params.q!.toLowerCase())
        );
      }

      console.log(`Demo: Listed ${filteredEvents.length} calendar events`);
      return filteredEvents;
    } catch (error) {
      throw new Error(`Failed to list events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchEvents(query: string, options: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
  } = {}): Promise<calendar_v3.Schema$Event[]> {
    try {
      const response = await this.calendar.events.list({
        calendarId: this.calendarId,
        q: query,
        timeMin: options.timeMin,
        timeMax: options.timeMax,
        maxResults: options.maxResults || 50,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items || [];
    } catch (error) {
      throw new Error(`Failed to search events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getFreeBusy(params: {
    timeMin: string;
    timeMax: string;
    calendars: string[];
  }): Promise<FreeBusyResponse> {
    try {
      const response = await this.calendar.freebusy.query({
        requestBody: {
          timeMin: params.timeMin,
          timeMax: params.timeMax,
          items: params.calendars.map(id => ({ id }))
        }
      });

      if (!response.data) {
        throw new Error('No free/busy data returned');
      }

      return response.data as FreeBusyResponse;
    } catch (error) {
      throw new Error(`Failed to get free/busy info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createRecurringEvent(event: CalendarEvent): Promise<calendar_v3.Schema$Event> {
    try {
      const response = await this.calendar.events.insert({
        calendarId: this.calendarId,
        requestBody: event,
        sendUpdates: 'all'
      });

      if (!response.data) {
        throw new Error('No data returned from recurring event creation');
      }

      return response.data;
    } catch (error) {
      throw new Error(`Failed to create recurring event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async addAttendees(eventId: string, attendees: string[]): Promise<calendar_v3.Schema$Event> {
    try {
      // First get the current event
      const currentEvent = await this.getEvent(eventId);
      
      // Merge new attendees with existing ones
      const existingAttendees = currentEvent.attendees || [];
      const newAttendees = attendees.map(email => ({ email }));
      const allAttendees = [...existingAttendees, ...newAttendees];

      // Remove duplicates
      const uniqueAttendees = allAttendees.filter((attendee, index, self) =>
        index === self.findIndex(a => a.email === attendee.email)
      );

      return await this.updateEvent(eventId, {
        attendees: uniqueAttendees as any
      });
    } catch (error) {
      throw new Error(`Failed to add attendees: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async removeAttendees(eventId: string, attendeesToRemove: string[]): Promise<calendar_v3.Schema$Event> {
    try {
      // First get the current event
      const currentEvent = await this.getEvent(eventId);
      
      // Filter out attendees to remove
      const remainingAttendees = (currentEvent.attendees || []).filter(
        attendee => !attendeesToRemove.includes(attendee.email || '')
      );

      return await this.updateEvent(eventId, {
        attendees: remainingAttendees as any
      });
    } catch (error) {
      throw new Error(`Failed to remove attendees: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCalendarList(): Promise<calendar_v3.Schema$CalendarListEntry[]> {
    try {
      const response = await this.calendar.calendarList.list();
      return response.data.items || [];
    } catch (error) {
      throw new Error(`Failed to get calendar list: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findAvailableTimeSlot(
    duration: number, // in minutes
    timeMin: string,
    timeMax: string,
    attendees: string[] = []
  ): Promise<{ start: string; end: string } | null> {
    try {
      const calendarsToCheck = [this.calendarId, ...attendees];
      const freeBusy = await this.getFreeBusy({
        timeMin,
        timeMax,
        calendars: calendarsToCheck
      });

      // Collect all busy periods
      const busyPeriods: Array<{ start: Date; end: Date }> = [];
      
      Object.values(freeBusy.calendars).forEach(calendar => {
        calendar.busy?.forEach(period => {
          busyPeriods.push({
            start: new Date(period.start),
            end: new Date(period.end)
          });
        });
      });

      // Sort busy periods by start time
      busyPeriods.sort((a, b) => a.start.getTime() - b.start.getTime());

      // Find available slot
      const startTime = new Date(timeMin);
      const endTime = new Date(timeMax);
      const durationMs = duration * 60 * 1000;

      let currentTime = startTime;

      for (const busyPeriod of busyPeriods) {
        if (currentTime.getTime() + durationMs <= busyPeriod.start.getTime()) {
          // Found a slot before this busy period
          return {
            start: currentTime.toISOString(),
            end: new Date(currentTime.getTime() + durationMs).toISOString()
          };
        }
        currentTime = new Date(Math.max(currentTime.getTime(), busyPeriod.end.getTime()));
      }

      // Check if there's time after the last busy period
      if (currentTime.getTime() + durationMs <= endTime.getTime()) {
        return {
          start: currentTime.toISOString(),
          end: new Date(currentTime.getTime() + durationMs).toISOString()
        };
      }

      return null; // No available slot found
    } catch (error) {
      throw new Error(`Failed to find available time slot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  setCalendarId(calendarId: string): void {
    this.calendarId = calendarId;
  }

  getCalendarId(): string {
    return this.calendarId;
  }
}
