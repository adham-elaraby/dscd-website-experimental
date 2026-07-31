import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';
import { dbEventToEvent } from '@/lib/utils/converters';

export const runtime = 'edge';

// Read-only on purpose. Events are created, edited and deleted exclusively through
// /api/admin/events/[eventId], which requires a signed-in admin via verifyAdminRequest().

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId } = await params;

    // Create Supabase client that works with Cloudflare env bindings
    const supabase = createSupabaseClient();

    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: 'Event not found',
            message: 'The requested event does not exist'
          },
          { status: 404 }
        );
      }
      console.error('Supabase error:', error);
      throw error;
    }

    const convertedEvent = dbEventToEvent(event);

    return NextResponse.json({
      success: true,
      data: convertedEvent,
      message: 'Event fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch event',
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
