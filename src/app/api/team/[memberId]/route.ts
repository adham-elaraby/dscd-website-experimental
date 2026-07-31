import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';
import { dbTeamMemberToTeamMember } from '@/lib/utils/converters';

export const runtime = 'edge';

// Read-only on purpose. Writes go exclusively through
// /api/admin/team/[memberId], which requires a signed-in admin via verifyAdminRequest().

interface RouteParams {
  params: Promise<{ memberId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { memberId } = await params;

    // Create Supabase client that works with Cloudflare env bindings
    const supabase = createSupabaseClient();

    const { data: teamMember, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', memberId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: 'Team member not found',
            message: 'The requested team member does not exist'
          },
          { status: 404 }
        );
      }
      console.error('Supabase error:', error);
      throw error;
    }

    const convertedTeamMember = dbTeamMemberToTeamMember(teamMember);

    return NextResponse.json({
      success: true,
      data: convertedTeamMember,
      message: 'Team member fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching team member:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch team member',
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
