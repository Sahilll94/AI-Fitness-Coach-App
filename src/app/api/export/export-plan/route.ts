import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fitnessPlan, format = 'json' } = body;

    if (!fitnessPlan) {
      return NextResponse.json(
        { error: 'Fitness plan is required' },
        { status: 400 }
      );
    }

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: fitnessPlan,
        format: 'json',
      });
    } else if (format === 'pdf') {
      // PDF generation would happen on the client-side using jsPDF
      return NextResponse.json({
        success: true,
        message: 'Use client-side PDF generation',
        format: 'pdf',
      });
    }

    return NextResponse.json(
      { error: 'Invalid format' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error exporting plan:', error);
    return NextResponse.json(
      { error: 'Failed to export plan' },
      { status: 500 }
    );
  }
}
