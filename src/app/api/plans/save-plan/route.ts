import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This is a placeholder. Connect to Supabase when environment variables are set.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userProfile, fitnessPlan } = body;

    if (!userProfile || !fitnessPlan) {
      return NextResponse.json(
        { error: 'User profile and fitness plan are required' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual Supabase insert
    // const { data, error } = await supabase
    //   .from('fitness_plans')
    //   .insert([
    //     {
    //       user_profile: userProfile,
    //       fitness_plan: fitnessPlan,
    //       created_at: new Date(),
    //     },
    //   ]);

    return NextResponse.json({
      success: true,
      message: 'Plan saved successfully',
      id: 'mock-id-' + Date.now(),
    });
  } catch (error) {
    console.error('Error saving plan:', error);
    return NextResponse.json(
      { error: 'Failed to save plan' },
      { status: 500 }
    );
  }
}
