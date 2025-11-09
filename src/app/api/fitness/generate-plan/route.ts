import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function generatePersonalizedPlan(userProfile: any, apiKey: string) {
  // Build a comprehensive prompt based on user profile
  const dietPref = userProfile.dietPreference || 'no specific dietary restrictions';
  const medicalHist = userProfile.medicalHistory || 'none reported';
  
  const prompt = `You are a professional fitness coach and nutritionist. Create a personalized fitness and diet plan based on the following user profile:

User Information:
- Name: ${userProfile.name}
- Age: ${userProfile.age}
- Gender: ${userProfile.gender}
- Height: ${userProfile.height}cm
- Weight: ${userProfile.weight}kg
- Fitness Goal: ${userProfile.fitnessGoal}
- Current Fitness Level: ${userProfile.fitnessLevel}
- Workout Location: ${userProfile.workoutLocation}
- Diet Preference: ${dietPref}
- Medical History: ${medicalHist}
- Stress Level: ${userProfile.stressLevel}

Based on this information, provide the following in plain text format (NOT JSON):

1. WORKOUT PLAN (provide a detailed 7-day workout plan with specific exercises, sets, reps, and rest days. Consider their fitness level and location):
[Write the workout plan here in clear, readable text format]

2. DIET PLAN (provide a personalized 7-day meal plan with breakfast, lunch, dinner, and snacks. Consider their diet preference and fitness goals):
[Write the diet plan here in clear, readable text format]

3. FITNESS TIPS (provide 5-7 personalized fitness tips specific to their goals, age, and current fitness level):
[Write the tips here]

4. MOTIVATIONAL QUOTE (provide an inspiring, personalized motivational quote for their fitness journey):
[Write the quote here]

Format your response exactly as shown above with these four sections separated by the numbered headers. Do NOT use JSON format.`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 1,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Gemini API error: ${JSON.stringify(error)}`);
  }

  const data = await response.json();

  // Extract text from Gemini response
  if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
    const textContent = data.candidates[0].content.parts[0].text;
    
    // Parse the sections from the response
    try {
      const sections = {
        workoutPlan: extractSection(textContent, 'WORKOUT PLAN'),
        dietPlan: extractSection(textContent, 'DIET PLAN'),
        tips: extractSection(textContent, 'FITNESS TIPS'),
        motivationalQuote: extractSection(textContent, 'MOTIVATIONAL QUOTE'),
      };
      
      return sections;
    } catch (parseError) {
      console.error('Parse error:', parseError);
      // If parsing fails, return the raw content split by sections
      return {
        workoutPlan: textContent,
        dietPlan: '',
        tips: '',
        motivationalQuote: '',
      };
    }
  }

  throw new Error('No content in Gemini response');
}

function cleanContent(text: string): string {
  return text
    .replace(/\*\*/g, '') // Remove markdown bold markers (**)
    .replace(/(?:^|\n)\*(?!\s)/gm, '\n') // Remove leading asterisks that aren't followed by space
    .replace(/undefined/g, 'balanced') // Replace "undefined" with sensible defaults
    .trim();
}

function extractSection(text: string, sectionName: string): string {
  // First, try to find the section header and get everything after it
  const sectionStart = text.indexOf(sectionName);
  if (sectionStart === -1) {
    return '';
  }
  
  // Find the next numbered section (e.g., "4. ", "5. ")
  const afterSection = text.substring(sectionStart + sectionName.length);
  let nextSectionIndex = -1;
  
  // Look for pattern like "\n4. ", "\n5. ", etc.
  const nextSectionMatch = afterSection.match(/\n\d+\.\s+[A-Z]/);
  if (nextSectionMatch) {
    nextSectionIndex = afterSection.indexOf(nextSectionMatch[0]);
  }
  
  // Extract the content
  let content = nextSectionIndex !== -1 
    ? afterSection.substring(0, nextSectionIndex)
    : afterSection;
  
  // Clean up the content
  content = content
    .replace(/^[:\s]+/, '') // Remove leading colons and whitespace
    .replace(/^\[Write.*?\]\s*/i, '') // Remove placeholder text
    .trim();
  
  return cleanContent(content);
}

// This is a placeholder. Connect to Gemini API when environment variables are set.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userProfile } = body;

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Generate personalized plan using Gemini
    const plan = await generatePersonalizedPlan(userProfile, apiKey);

    // Ensure all fields are strings for React rendering
    const displayPlan = {
      workoutPlan: cleanContent(String(plan.workoutPlan || '')),
      dietPlan: cleanContent(String(plan.dietPlan || '')),
      tips: cleanContent(String(plan.tips || '')),
      motivationalQuote: cleanContent(String(plan.motivationalQuote || '')),
    };

    return NextResponse.json({
      success: true,
      data: {
        userProfile,
        ...displayPlan,
      },
    });
  } catch (error) {
    console.error('Error generating plan:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to generate fitness plan', details: errorMsg },
      { status: 500 }
    );
  }
}
