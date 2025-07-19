import { NextRequest, NextResponse } from 'next/server';
import { clientGoogleCalendar } from '@/services/clientGoogleCalendar';

export async function POST(request: NextRequest) {
  try {
    const { action, data, accessToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 401 }
      );
    }

    // Set the access token for this request
    // We'll need to pass it to the calendar service
    
    switch (action) {
      case 'createEvent':
        const createdEvent = await clientGoogleCalendar.createEvent(data);
        return NextResponse.json({ 
          success: true, 
          data: createdEvent,
          message: `Successfully created event: ${createdEvent.summary}`
        });

      case 'listEvents':
        const events = await clientGoogleCalendar.listEvents(
          data?.timeMin,
          data?.timeMax,
          data?.maxResults
        );
        return NextResponse.json({ 
          success: true, 
          data: events,
          message: `Retrieved ${events.length} events`
        });

      case 'updateEvent':
        const updatedEvent = await clientGoogleCalendar.updateEvent(
          data.eventId,
          data.updates
        );
        return NextResponse.json({ 
          success: true, 
          data: updatedEvent,
          message: `Successfully updated event: ${updatedEvent.summary}`
        });

      case 'deleteEvent':
        await clientGoogleCalendar.deleteEvent(data.eventId);
        return NextResponse.json({ 
          success: true, 
          message: `Successfully deleted event: ${data.eventId}`
        });

      case 'getFreeBusy':
        const freeBusy = await clientGoogleCalendar.getFreeBusy(
          data.timeMin,
          data.timeMax
        );
        return NextResponse.json({ 
          success: true, 
          data: freeBusy,
          message: 'Retrieved free/busy information'
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Calendar operation error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}

// Handle preflight OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
