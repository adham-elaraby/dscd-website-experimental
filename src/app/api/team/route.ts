import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';
import { dbTeamMemberToTeamMember } from '@/lib/utils/converters';

export const runtime = 'edge';

// Read-only on purpose. Writes go exclusively through
// /api/admin/team, which requires a signed-in admin via verifyAdminRequest().

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client that works with Cloudflare env bindings
    const supabase = createSupabaseClient();

    // Check for leadership filter
    const { searchParams } = new URL(request.url);
    const leadershipParam = searchParams.get('leadership');

    let query = supabase
      .from('team_members')
      .select('*')
      .order('order_index', { ascending: true, nullsFirst: false });

    // Add leadership filter if requested
    if (leadershipParam === 'true') {
      query = query.eq('is_leadership', true);
    } else if (leadershipParam === 'false') {
      query = query.eq('is_leadership', false);
    }

    const { data: teamMembers, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // Convert database team members to frontend format
    const convertedTeamMembers = teamMembers.map(dbTeamMemberToTeamMember);

    return NextResponse.json({
      success: true,
      data: convertedTeamMembers,
      message: `${leadershipParam === 'true' ? 'Leadership team' : leadershipParam === 'false' ? 'Core team members' : 'Team members'} fetched successfully`
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch team members',
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
