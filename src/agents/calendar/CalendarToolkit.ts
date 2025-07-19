import { GoogleCalendarService } from './GoogleCalendarService';
import { 
  CalendarEvent, 
  CreateEventParams, 
  UpdateEventParams, 
  DeleteEventParams,
  ListEventsParams,
  FreeBusyParams,
  ManageAttendeesParams,
  RecurringEventConfig,
  ToolExecutionResult
} from './types';
import { format, parseISO, addMinutes } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export class CalendarToolkit {
  constructor(private calendarService: GoogleCalendarService) {}

  async createEvent(params: CreateEventParams): Promise<ToolExecutionResult> {
    try {
      const startTime = Date.now();

      // Build the event object
      const event: CalendarEvent = {
        summary: params.summary,
        description: params.description,
        location: params.location,
        start: {
          dateTime: params.startDateTime,
          timeZone: params.timeZone || 'UTC'
        },
        end: {
          dateTime: params.endDateTime,
          timeZone: params.timeZone || 'UTC'
        }
      };

      // Add attendees if provided
      if (params.attendees && params.attendees.length > 0) {
        event.attendees = params.attendees.map(email => ({ email }));
      }

      // Add reminders if requested
      if (params.reminders) {
        event.reminders = {
          useDefault: false,
          overrides: (params.reminderMinutes || [15]).map(minutes => ({
            method: 'popup' as const,
            minutes
          }))
        };
      }

      // Add visibility setting
      if (params.visibility) {
        event.visibility = params.visibility;
      }

      // Add recurrence if provided
      if (params.recurrence) {
        event.recurrence = this.buildRecurrenceRule(params.recurrence as RecurringEventConfig);
      }

      const result = await this.calendarService.createEvent(event);
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          eventId: result.id,
          summary: result.summary,
          startTime: result.start?.dateTime || result.start?.date,
          endTime: result.end?.dateTime || result.end?.date,
          location: result.location,
          attendees: result.attendees?.map(a => a.email),
          htmlLink: result.htmlLink
        },
        metadata: {
          executionTime,
          apiCalls: 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          executionTime: 0,
          apiCalls: 0
        }
      };
    }
  }

  async updateEvent(params: UpdateEventParams): Promise<ToolExecutionResult> {
    try {
      const startTime = Date.now();

      const updateData: Partial<CalendarEvent> = {};
      
      if (params.summary) updateData.summary = params.summary;
      if (params.description) updateData.description = params.description;
      if (params.location) updateData.location = params.location;
      if (params.status) updateData.status = params.status;

      if (params.startDateTime) {
        updateData.start = {
          dateTime: params.startDateTime,
          timeZone: params.timeZone || 'UTC'
        };
      }

      if (params.endDateTime) {
        updateData.end = {
          dateTime: params.endDateTime,
          timeZone: params.timeZone || 'UTC'
        };
      }

      if (params.attendees) {
        updateData.attendees = params.attendees.map(email => ({ email }));
      }

      const result = await this.calendarService.updateEvent(params.eventId, updateData);
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          eventId: result.id,
          summary: result.summary,
          startTime: result.start?.dateTime || result.start?.date,
          endTime: result.end?.dateTime || result.end?.date,
          location: result.location,
          status: result.status,
          updated: result.updated
        },
        metadata: {
          executionTime,
          apiCalls: 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          executionTime: 0,
          apiCalls: 0
        }
      };
    }
  }

  async deleteEvent(params: DeleteEventParams): Promise<ToolExecutionResult> {
    try {
      const startTime = Date.now();

      await this.calendarService.deleteEvent(
        params.eventId, 
        params.sendUpdates || 'all'
      );

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          message: `Event ${params.eventId} has been successfully deleted`,
          eventId: params.eventId
        },
        metadata: {
          executionTime,
          apiCalls: 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          executionTime: 0,
          apiCalls: 0
        }
      };
    }
  }

  async searchEvents(params: { query: string; timeMin?: string; timeMax?: string; maxResults?: number }): Promise<ToolExecutionResult> {
    try {
      const startTime = Date.now();

      const events = await this.calendarService.searchEvents(params.query, {
        timeMin: params.timeMin,
        timeMax: params.timeMax,
        maxResults: params.maxResults || 20
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          events: events.map(event => ({
            id: event.id,
            summary: event.summary,
            description: event.description,
            location: event.location,
            startTime: event.start?.dateTime || event.start?.date,
            endTime: event.end?.dateTime || event.end?.date,
            attendees: event.attendees?.map(a => a.email),
            status: event.status,
            htmlLink: event.htmlLink,
            created: event.created,
            updated: event.updated
          })),
          totalFound: events.length,
          query: params.query
        },
        metadata: {
          executionTime,
          apiCalls: 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          executionTime: 0,
          apiCalls: 0
        }
      };
    }
  }

  async listEvents(params: ListEventsParams): Promise<ToolExecutionResult> {
    try {
      const startTime = Date.now();

      const events = await this.calendarService.listEvents({
        timeMin: params.timeMin,
        timeMax: params.timeMax,
        maxResults: params.maxResults || 50,
        singleEvents: params.singleEvents !== false,
        orderBy: params.orderBy || 'startTime'
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          events: events.map(event => ({
            id: event.id,
            summary: event.summary,
            description: event.description,
            location: event.location,
            startTime: event.start?.dateTime || event.start?.date,
            endTime: event.end?.dateTime || event.end?.date,
            attendees: event.attendees?.map(a => a.email),
            status: event.status,
            htmlLink: event.htmlLink,
            recurrence: event.recurrence,
            isRecurring: !!event.recurrence
          })),
          totalFound: events.length,
          timeRange: {
            min: params.timeMin,
            max: params.timeMax
          }
        },
        metadata: {
          executionTime,
          apiCalls: 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          executionTime: 0,
          apiCalls: 0
        }
      };
    }
  }

  async getFreeBusy(params: FreeBusyParams): Promise<ToolExecutionResult> {
    try {
      const startTime = Date.now();

      const result = await this.calendarService.getFreeBusy({
        timeMin: params.timeMin,
        timeMax: params.timeMax,
        calendars: params.calendars
      });

      const executionTime = Date.now() - startTime;

      // Process the result for better readability
      const processedResult = {
        timeRange: {
          min: result.timeMin,
          max: result.timeMax
        },
        calendars: Object.entries(result.calendars).map(([calendarId, data]) => ({
          calendarId,
          busy: data.busy || [],
          errors: data.errors || [],
          isFree: !data.busy || data.busy.length === 0
        }))
      };

      return {
        success: true,
        data: processedResult,
        metadata: {
          executionTime,
          apiCalls: 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          executionTime: 0,
          apiCalls: 0
        }
      };
    }
  }

  async createRecurringEvent(params: CreateEventParams): Promise<ToolExecutionResult> {
    if (!params.recurrence) {
      return {
        success: false,
        error: 'Recurrence configuration is required for creating recurring events',
        metadata: { executionTime: 0, apiCalls: 0 }
      };
    }

    return await this.createEvent(params);
  }

  async manageAttendees(params: ManageAttendeesParams): Promise<ToolExecutionResult> {
    try {
      const startTime = Date.now();

      let result;
      if (params.action === 'add') {
        result = await this.calendarService.addAttendees(params.eventId, params.attendees);
      } else {
        result = await this.calendarService.removeAttendees(params.eventId, params.attendees);
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          eventId: result.id,
          summary: result.summary,
          action: params.action,
          attendees: result.attendees?.map(a => ({
            email: a.email,
            displayName: a.displayName,
            responseStatus: a.responseStatus
          })),
          totalAttendees: result.attendees?.length || 0
        },
        metadata: {
          executionTime,
          apiCalls: 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          executionTime: 0,
          apiCalls: 0
        }
      };
    }
  }

  async findAvailableSlot(params: {
    duration: number;
    timeMin: string;
    timeMax: string;
    attendees?: string[];
  }): Promise<ToolExecutionResult> {
    try {
      const startTime = Date.now();

      const availableSlot = await this.calendarService.findAvailableTimeSlot(
        params.duration,
        params.timeMin,
        params.timeMax,
        params.attendees || []
      );

      const executionTime = Date.now() - startTime;

      if (availableSlot) {
        return {
          success: true,
          data: {
            availableSlot,
            duration: params.duration,
            suggestedTime: {
              start: availableSlot.start,
              end: availableSlot.end,
              durationMinutes: params.duration
            }
          },
          metadata: {
            executionTime,
            apiCalls: 1
          }
        };
      } else {
        return {
          success: false,
          error: 'No available time slot found in the specified time range',
          metadata: {
            executionTime,
            apiCalls: 1
          }
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          executionTime: 0,
          apiCalls: 0
        }
      };
    }
  }

  private buildRecurrenceRule(config: RecurringEventConfig): string[] {
    let rule = `FREQ=${config.frequency}`;

    if (config.interval && config.interval > 1) {
      rule += `;INTERVAL=${config.interval}`;
    }

    if (config.count) {
      rule += `;COUNT=${config.count}`;
    }

    if (config.until) {
      rule += `;UNTIL=${config.until}`;
    }

    if (config.byDay && config.byDay.length > 0) {
      rule += `;BYDAY=${config.byDay.join(',')}`;
    }

    if (config.byMonth && config.byMonth.length > 0) {
      rule += `;BYMONTH=${config.byMonth.join(',')}`;
    }

    if (config.byMonthDay && config.byMonthDay.length > 0) {
      rule += `;BYMONTHDAY=${config.byMonthDay.join(',')}`;
    }

    return [`RRULE:${rule}`];
  }
}
