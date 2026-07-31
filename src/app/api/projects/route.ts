import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';
import { dbProjectToProject } from '@/lib/utils/converters';

export const runtime = 'edge';

// Read-only on purpose. Writes go exclusively through
// /api/admin/projects, which requires a signed-in admin via verifyAdminRequest().

export async function GET() {
  try {
    // Create Supabase client that works with Cloudflare env bindings
    const supabase = createSupabaseClient();
    
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // Convert database projects to frontend format
    const convertedProjects = projects.map(dbProjectToProject);

    return NextResponse.json({
      success: true,
      data: convertedProjects,
      message: 'Projects fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch projects',
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
