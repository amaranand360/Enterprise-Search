'use client';

import { googleAuth } from './googleAuth';
import { CalendarEvent } from '../agents/calendar/types';

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
}

export class ClientGoogleCalendarService {
  private calendarId = 'primary';

  async createEvent(event: CalendarEvent): Promise<GoogleCalendarEvent> {
    const credentials = googleAuth.getCredentials();
    if (!credentials?.access_token) {
      throw new Error('Not authenticated with Google');
    }

    try {
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: event.summary,
          description: event.description,
          location: event.location,
          start: event.start,
          end: event.end,
          attendees: event.attendees,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google Calendar API error: ${errorData.error?.message || response.statusText}`);
      }

      const createdEvent = await response.json();
      console.log('Successfully created calendar event:', createdEvent.summary);
      return createdEvent;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  async listEvents(timeMin?: string, timeMax?: string, maxResults = 10): Promise<GoogleCalendarEvent[]> {
    const credentials = googleAuth.getCredentials();
    if (!credentials?.access_token) {
      throw new Error('Not authenticated with Google');
    }

    try {
      const params = new URLSearchParams({
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        maxResults: maxResults.toString(),
        singleEvents: 'true',
        orderBy: 'startTime',
      });

      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events?${params}`, {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google Calendar API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log(`Successfully retrieved ${data.items?.length || 0} calendar events`);
      return data.items || [];
    } catch (error) {
      console.error('Error listing calendar events:', error);
      throw error;
    }
  }

  async updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<GoogleCalendarEvent> {
    const credentials = googleAuth.getCredentials();
    if (!credentials?.access_token) {
      throw new Error('Not authenticated with Google');
    }

    try {
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google Calendar API error: ${errorData.error?.message || response.statusText}`);
      }

      const updatedEvent = await response.json();
      console.log('Successfully updated calendar event:', updatedEvent.summary);
      return updatedEvent;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    const credentials = googleAuth.getCredentials();
    if (!credentials?.access_token) {
      throw new Error('Not authenticated with Google');
    }

    try {
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
        },
      });

      if (!response.ok && response.status !== 404) {
        const errorData = await response.json();
        throw new Error(`Google Calendar API error: ${errorData.error?.message || response.statusText}`);
      }

      console.log('Successfully deleted calendar event:', eventId);
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  }

  async getFreeBusy(timeMin: string, timeMax: string): Promise<any> {
    const credentials = googleAuth.getCredentials();
    if (!credentials?.access_token) {
      throw new Error('Not authenticated with Google');
    }

    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeMin,
          timeMax,
          items: [{ id: this.calendarId }],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google Calendar API error: ${errorData.error?.message || response.statusText}`);
      }

      const freeBusyData = await response.json();
      console.log('Successfully retrieved free/busy information');
      return freeBusyData;
    } catch (error) {
      console.error('Error getting free/busy information:', error);
      throw error;
    }
  }
}

export const clientGoogleCalendar = new ClientGoogleCalendarService();
