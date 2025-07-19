/**
 * Real Google Calendar Service
 * Integrates directly with Google Calendar API
 */

import { googleAuth } from './googleAuth';
import { CalendarEvent } from '@/types';

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
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
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  organizer?: {
    email: string;
    displayName?: string;
  };
  status?: string;
  created?: string;
  updated?: string;
  htmlLink?: string;
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: Array<{
      uri: string;
      entryPointType: string;
    }>;
  };
}

class RealCalendarService {
  private isInitialized = false;

  /**
   * Initialize the Google Calendar API
   */
  async initialize(): Promise<boolean> {
    try {
      if (!googleAuth.isSignedIn()) {
        console.log('❌ User not signed in to Google');
        return false;
      }

      // Check if Google API client is available
      if (typeof window === 'undefined' || !window.gapi || !window.gapi.client) {
        console.log('❌ Google API client not available');
        return false;
      }

      // Calendar API should already be loaded via googleAuth initialization
      this.isInitialized = true;
      console.log('✅ Real Calendar service initialized');
      console.log('🔑 API Key configured:', process.env.NEXT_PUBLIC_GOOGLE_API_KEY ? 'Yes' : 'No');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Calendar service:', error);
      return false;
    }
  }

  /**
   * Get list of calendars
   */
  async getCalendars(): Promise<any[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await (window as any).gapi.client.calendar.calendarList.list();
      
      return response.result.items?.map((calendar: any) => ({
        id: calendar.id,
        name: calendar.summary,
        description: calendar.description,
        timeZone: calendar.timeZone,
        accessRole: calendar.accessRole,
        primary: calendar.primary || false,
        selected: calendar.selected || false,
        backgroundColor: calendar.backgroundColor,
        foregroundColor: calendar.foregroundColor
      })) || [];
    } catch (error) {
      console.error('❌ Error fetching calendars:', error);
      throw error;
    }
  }

  /**
   * Get events from calendar
   */
  async getEvents(options: {
    calendarId?: string;
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    q?: string;
  } = {}): Promise<CalendarEvent[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const {
      calendarId = 'primary',
      timeMin = new Date().toISOString(),
      timeMax,
      maxResults = 20,
      q
    } = options;

    try {
      const requestParams: any = {
        calendarId,
        timeMin,
        maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      };

      if (timeMax) requestParams.timeMax = timeMax;
      if (q) requestParams.q = q;

      const response = await (window as any).gapi.client.calendar.events.list(requestParams);
      
      return this.transformEvents(response.result.items || []);
    } catch (error) {
      console.error('❌ Error fetching events:', error);
      throw error;
    }
  }

  /**
   * Create a new calendar event
   */
  async createEvent(eventData: {
    title: string;
    description?: string;
    start: Date;
    end: Date;
    location?: string;
    attendees?: string[];
    createMeetLink?: boolean;
    calendarId?: string;
  }): Promise<CalendarEvent | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const {
      title,
      description = '',
      start,
      end,
      location = '',
      attendees = [],
      createMeetLink = false,
      calendarId = 'primary'
    } = eventData;

    try {
      const event: any = {
        summary: title,
        description,
        start: {
          dateTime: start.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: end.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        location,
        attendees: attendees.map(email => ({ email })),
        reminders: {
          useDefault: true
        }
      };

      // Add Google Meet conference if requested
      if (createMeetLink) {
        event.conferenceData = {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        };
      }

      const response = await (window as any).gapi.client.calendar.events.insert({
        calendarId,
        resource: event,
        conferenceDataVersion: createMeetLink ? 1 : 0,
        sendUpdates: 'all'
      });

      console.log('✅ Event created successfully:', response.result.id);
      return this.transformEvent(response.result);
    } catch (error) {
      console.error('❌ Error creating event:', error);
      throw error;
    }
  }

  /**
   * Update an existing event
   */
  async updateEvent(eventId: string, updates: {
    title?: string;
    description?: string;
    start?: Date;
    end?: Date;
    location?: string;
    attendees?: string[];
  }, calendarId: string = 'primary'): Promise<CalendarEvent | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Get existing event first
      const existingResponse = await (window as any).gapi.client.calendar.events.get({
        calendarId,
        eventId
      });

      const existingEvent = existingResponse.result;

      // Merge updates with existing data
      const updatedEvent: any = {
        ...existingEvent,
        summary: updates.title || existingEvent.summary,
        description: updates.description || existingEvent.description,
        location: updates.location || existingEvent.location
      };

      if (updates.start) {
        updatedEvent.start = {
          ...existingEvent.start,
          dateTime: updates.start.toISOString()
        };
      }

      if (updates.end) {
        updatedEvent.end = {
          ...existingEvent.end,
          dateTime: updates.end.toISOString()
        };
      }

      if (updates.attendees) {
        updatedEvent.attendees = updates.attendees.map(email => ({ email }));
      }

      const response = await (window as any).gapi.client.calendar.events.update({
        calendarId,
        eventId,
        resource: updatedEvent,
        sendUpdates: 'all'
      });

      console.log('✅ Event updated successfully:', eventId);
      return this.transformEvent(response.result);
    } catch (error) {
      console.error('❌ Error updating event:', error);
      throw error;
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string, calendarId: string = 'primary'): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await (window as any).gapi.client.calendar.events.delete({
        calendarId,
        eventId,
        sendUpdates: 'all'
      });

      console.log('✅ Event deleted successfully:', eventId);
      return true;
    } catch (error) {
      console.error('❌ Error deleting event:', error);
      return false;
    }
  }

  /**
   * Get today's events
   */
  async getTodaysEvents(): Promise<CalendarEvent[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    return this.getEvents({
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      maxResults: 50
    });
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(days: number = 7): Promise<CalendarEvent[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.getEvents({
      timeMin: now.toISOString(),
      timeMax: futureDate.toISOString(),
      maxResults: 50
    });
  }

  /**
   * Search events
   */
  async searchEvents(query: string): Promise<CalendarEvent[]> {
    return this.getEvents({
      q: query,
      maxResults: 50
    });
  }

  /**
   * Transform Google Calendar event to our CalendarEvent format
   */
  private transformEvent(googleEvent: GoogleCalendarEvent): CalendarEvent {
    return {
      id: googleEvent.id,
      title: googleEvent.summary || 'Untitled Event',
      description: googleEvent.description || '',
      start: new Date(googleEvent.start.dateTime || googleEvent.start.date || ''),
      end: new Date(googleEvent.end.dateTime || googleEvent.end.date || ''),
      location: googleEvent.location || '',
      attendees: googleEvent.attendees?.map(a => a.email) || [],
      meetingLink: googleEvent.hangoutLink || googleEvent.conferenceData?.entryPoints?.[0]?.uri || ''
    };
  }

  /**
   * Transform array of Google Calendar events
   */
  private transformEvents(googleEvents: GoogleCalendarEvent[]): CalendarEvent[] {
    return googleEvents.map(event => this.transformEvent(event));
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; message?: string }> {
    try {
      if (!googleAuth.isSignedIn()) {
        return { status: 'error', message: 'Not signed in to Google' };
      }

      if (!this.isInitialized) {
        await this.initialize();
      }

      // Try to fetch calendar list as a health check
      await (window as any).gapi.client.calendar.calendarList.list({ maxResults: 1 });
      
      return { 
        status: 'healthy', 
        timestamp: new Date().toISOString() 
      };
    } catch (error) {
      return { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
export const realCalendarService = new RealCalendarService();
