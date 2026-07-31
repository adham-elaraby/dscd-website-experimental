import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';
import { dbEventToEvent } from '@/lib/utils/converters';

export const runtime = 'edge';

// Read-only on purpose. Events are created, edited and deleted exclusively through
// /api/admin/events, which requires a signed-in admin via verifyAdminRequest().

export async function GET() {
  try {
    // Create Supabase client that works with Cloudflare env bindings
    const supabase = createSupabaseClient();
    
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // Convert database events to frontend format
    const convertedEvents = events.map(dbEventToEvent);

    return NextResponse.json({
      success: true,
      data: convertedEvents,
      message: 'Events fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch events',
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
