export interface UserProfile {
  id?: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;
  fitnessGoal: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'endurance';
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  workoutLocation: 'home' | 'gym' | 'outdoor';
  dietaryPreference: 'veg' | 'non_veg' | 'vegan' | 'keto';
  medicalHistory?: string;
  stressLevel?: number;
  createdAt?: string;
}

export interface FitnessPlan {
  id?: string;
  userId?: string;
  userProfile: UserProfile;
  workoutPlan: string;
  dietPlan: string;
  tips: string;
  motivationalQuote: string;
  createdAt?: string;
}

export interface TextToSpeechRequest {
  text: string;
  voiceId?: string;
}

export interface ImageGenerationRequest {
  prompt: string;
  style?: string;
}

export interface ExportRequest {
  plan: FitnessPlan;
  format: 'pdf' | 'json';
}
