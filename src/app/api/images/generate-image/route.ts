import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Replicate API configuration
const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';
const MODEL_VERSION = 'black-forest-labs/flux-1.1-pro';

async function generateImageWithReplicate(prompt: string, apiToken: string): Promise<string> {
  const requestBody = {
    version: MODEL_VERSION,
    input: {
      prompt: prompt,
      aspect_ratio: '1:1',
      output_format: 'jpg',
      output_quality: 80,
    },
  };

  const response = await fetch(REPLICATE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${apiToken}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Replicate API error: ${JSON.stringify(error)}`);
  }

  const data = await response.json();

  // If prediction is still processing, poll for completion
  if (data.status === 'processing' || data.status === 'starting') {
    // Poll the status URL until completion
    let attempts = 0;
    const maxAttempts = 120; // 2 minutes max
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before polling
      
      const statusResponse = await fetch(data.urls.get, {
        headers: {
          'Authorization': `Token ${apiToken}`,
        },
      });

      if (!statusResponse.ok) {
        throw new Error(`Failed to check prediction status: ${statusResponse.status}`);
      }

      const statusData = await statusResponse.json();

      if (statusData.status === 'succeeded') {
        if (statusData.output && Array.isArray(statusData.output)) {
          return statusData.output[0];
        } else if (statusData.output) {
          return statusData.output;
        }
        throw new Error('Prediction succeeded but no output');
      }

      if (statusData.status === 'failed') {
        throw new Error(`Prediction failed: ${statusData.error}`);
      }

      attempts++;
    }

    throw new Error('Image generation timed out after 2 minutes');
  }

  // If output is available immediately
  if (data.output) {
    if (Array.isArray(data.output)) {
      return data.output[0];
    }
    return data.output;
  }

  throw new Error('No image URL in Replicate response');
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, imageType = 'workout' } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const apiToken = process.env.REPLICATE_API_TOKEN;
    
    if (!apiToken) {
      return NextResponse.json(
        { error: 'Replicate API token not configured' },
        { status: 500 }
      );
    }

    // Enhance prompt based on image type
    let enhancedPrompt = prompt;
    if (imageType === 'workout') {
      enhancedPrompt = `Professional fitness workout illustration: ${prompt}. Show exercise form, equipment, and movement. High quality, motivating, clear details.`;
    } else if (imageType === 'diet') {
      enhancedPrompt = `Healthy meal and nutrition image: ${prompt}. Show appetizing, colorful food presentation. Professional photography style, well-lit, fresh ingredients.`;
    } else if (imageType === 'tips') {
      enhancedPrompt = `Fitness tips and wellness infographic: ${prompt}. Clean, modern design with clear visual elements. Professional, educational, motivating.`;
    } else if (imageType === 'quote') {
      enhancedPrompt = `Inspirational fitness quote visualization: ${prompt}. Motivational design with fitness imagery. Professional, eye-catching, modern aesthetic.`;
    }

    // Generate image using Replicate
    const imageUrl = await generateImageWithReplicate(enhancedPrompt, apiToken);

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: 'Failed to generate image', details: String(error) },
      { status: 500 }
    );
  }
}
