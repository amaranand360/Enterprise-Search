/**
 * Calendar Service Integration for Enterprise Search
 * Bridges the Node.js Calendar Service with the frontend
 */

import { googleAuth } from './googleAuth';
import { CalendarEvent } from '@/types';

interface CalendarServiceResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface CreateEventRequest {
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  timeZone?: string;
  location?: string;
  attendees?: string[];
  reminders?: { useDefault: boolean };
  conferenceData?: any;
}

class CalendarServiceIntegration {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
  }

  /**
   * Initialize calendar service with current OAuth tokens
   */
  async initialize(): Promise<boolean> {
    try {
      const credentials = googleAuth.getCredentials();
      if (!credentials) {
        throw new Error('No Google credentials available');
      }

      const response = await fetch(`${this.baseUrl}/calendar/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokens: {
            access_token: credentials.access_token,
            refresh_token: credentials.refresh_token,
            scope: credentials.scope,
            token_type: credentials.token_type,
            expiry_date: credentials.expiry_date
          }
        })
      });

      const result: CalendarServiceResponse = await response.json();
      return result.success;
    } catch (error) {
      console.error('Failed to initialize calendar service:', error);
      return false;
    }
  }

  /**
   * Get list of calendars
   */
  async getCalendars(): Promise<any[]> {
    try {
      await this.ensureInitialized();

      const response = await fetch(`${this.baseUrl}/calendar/calendars`);
      const result: CalendarServiceResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch calendars');
      }

      return result.data || [];
    } catch (error) {
      console.error('Failed to get calendars:', error);
      return [];
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
    try {
      await this.ensureInitialized();

      const params = new URLSearchParams();
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`${this.baseUrl}/calendar/events?${params}`);
      const result: CalendarServiceResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch events');
      }

      return this.transformEvents(result.data || []);
    } catch (error) {
      console.error('Failed to get events:', error);
      return [];
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
  }): Promise<CalendarEvent | null> {
    try {
      await this.ensureInitialized();

      const createRequest: CreateEventRequest = {
        title: eventData.title,
        description: eventData.description || '',
        startDateTime: eventData.start.toISOString(),
        endDateTime: eventData.end.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        location: eventData.location || '',
        attendees: eventData.attendees || [],
        reminders: { useDefault: true }
      };

      // Add Google Meet conference data if requested
      if (eventData.createMeetLink) {
        createRequest.conferenceData = {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        };
      }

      const response = await fetch(`${this.baseUrl}/calendar/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createRequest)
      });

      const result: CalendarServiceResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create event');
      }

      return this.transformEvent(result.data);
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    }
  }

  /**
   * Update an existing event
   */
  async updateEvent(eventId: string, updates: {
    title?: string;
    description?: string;
    startDateTime?: string;
    endDateTime?: string;
    location?: string;
    attendees?: string[];
  }): Promise<CalendarEvent | null> {
    try {
      await this.ensureInitialized();

      const response = await fetch(`${this.baseUrl}/calendar/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      const result: CalendarServiceResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update event');
      }

      return this.transformEvent(result.data);
    } catch (error) {
      console.error('Failed to update event:', error);
      throw error;
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string, calendarId: string = 'primary'): Promise<boolean> {
    try {
      await this.ensureInitialized();

      const response = await fetch(`${this.baseUrl}/calendar/events/${eventId}?calendarId=${calendarId}`, {
        method: 'DELETE'
      });

      const result: CalendarServiceResponse = await response.json();
      return result.success;
    } catch (error) {
      console.error('Failed to delete event:', error);
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
   * Find available time slots
   */
  async findAvailableSlots(options: {
    duration?: number;
    startTime?: Date;
    endTime?: Date;
    workingHours?: { start: number; end: number };
  } = {}): Promise<any[]> {
    try {
      await this.ensureInitialized();

      const response = await fetch(`${this.baseUrl}/calendar/available-slots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options)
      });

      const result: CalendarServiceResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to find available slots');
      }

      return result.data || [];
    } catch (error) {
      console.error('Failed to find available slots:', error);
      return [];
    }
  }

  /**
   * Get calendar statistics
   */
  async getCalendarStats(): Promise<any> {
    try {
      await this.ensureInitialized();

      const response = await fetch(`${this.baseUrl}/calendar/stats`);
      const result: CalendarServiceResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to get calendar stats');
      }

      return result.data;
    } catch (error) {
      console.error('Failed to get calendar stats:', error);
      return null;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/calendar/health`);
      const result: CalendarServiceResponse = await response.json();

      return {
        status: result.success ? 'healthy' : 'error',
        message: result.error
      };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Ensure calendar service is initialized
   */
  private async ensureInitialized(): Promise<void> {
    const isInitialized = await this.initialize();
    if (!isInitialized) {
      throw new Error('Failed to initialize calendar service');
    }
  }

  /**
   * Transform API event data to CalendarEvent format
   */
  private transformEvent(eventData: any): CalendarEvent {
    return {
      id: eventData.id,
      title: eventData.title || eventData.summary,
      description: eventData.description,
      start: new Date(eventData.start?.dateTime || eventData.start?.date),
      end: new Date(eventData.end?.dateTime || eventData.end?.date),
      location: eventData.location,
      attendees: eventData.attendees?.map((a: any) => a.email) || [],
      meetingLink: eventData.meetingLink || eventData.hangoutLink
    };
  }

  /**
   * Transform API events array
   */
  private transformEvents(eventsData: any[]): CalendarEvent[] {
    return eventsData.map(event => this.transformEvent(event));
  }
}

// Export singleton instance
export const calendarServiceIntegration = new CalendarServiceIntegration();
