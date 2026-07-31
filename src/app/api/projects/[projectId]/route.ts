import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';
import { dbProjectToProject } from '@/lib/utils/converters';

export const runtime = 'edge';

// Read-only on purpose. Writes go exclusively through
// /api/admin/projects/[projectId], which requires a signed-in admin via verifyAdminRequest().

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;

    // Create Supabase client that works with Cloudflare env bindings
    const supabase = createSupabaseClient();

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: 'Project not found',
            message: 'The requested project does not exist'
          },
          { status: 404 }
        );
      }
      console.error('Supabase error:', error);
      throw error;
    }

    const convertedProject = dbProjectToProject(project);

    return NextResponse.json({
      success: true,
      data: convertedProject,
      message: 'Project fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch project',
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
