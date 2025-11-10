'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { UserProfile } from '@/types';
import { Moon, Sun, ArrowLeft, Dumbbell } from 'lucide-react';

export default function AppPage() {
  const { isDark, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    age: 25,
    gender: 'male',
    height: 170,
    weight: 70,
    fitnessGoal: 'muscle_gain',
    fitnessLevel: 'intermediate',
    workoutLocation: 'gym',
    dietaryPreference: 'non_veg',
    medicalHistory: '',
    stressLevel: 5,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserProfile((prev) => ({
      ...prev,
      [name]: name === 'age' || name === 'height' || name === 'weight' || name === 'stressLevel' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/fitness/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userProfile }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate plan');
      }

      const data = await response.json();
      console.log('Generated plan:', data);
      // Store plan in local storage or state for display
      localStorage.setItem('currentPlan', JSON.stringify(data.data));
      // Redirect to results page
      window.location.href = '/results';
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate fitness plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black text-white' : 'bg-white text-black'}`}>
      {/* Navigation */}
      <nav className="fixed top-0 w-full border-b z-50" style={{borderColor: isDark ? '#1a1a1a' : '#e5e7eb', backgroundColor: isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)'}}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft size={20} />
            <span className="font-semibold">Back</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <Dumbbell size={24} className="text-blue-600" />
            <span className="font-semibold text-lg">FitCoach</span>
          </Link>
          <button onClick={toggleTheme} className="p-1.5">
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </nav>

      {/* Form */}
      <div className="pt-28 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Create Your Plan</h1>
          <p className={`mb-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Tell us about yourself and we'll generate a personalized fitness plan
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Personal Information</h2>
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={userProfile.name}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2 rounded border transition-colors ${isDark ? 'bg-slate-900 border-slate-700 focus:border-blue-600' : 'bg-white border-gray-200 focus:border-blue-600'} focus:outline-none`}
                  placeholder="Enter your name"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={userProfile.age}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-2 rounded border transition-colors ${isDark ? 'bg-slate-900 border-slate-700 focus:border-blue-600' : 'bg-white border-gray-200 focus:border-blue-600'} focus:outline-none`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Gender</label>
                  <select
                    name="gender"
                    value={userProfile.gender}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded border transition-colors ${isDark ? 'bg-slate-900 border-slate-700 focus:border-blue-600' : 'bg-white border-gray-200 focus:border-blue-600'} focus:outline-none`}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Height (cm)</label>
                  <input
                    type="number"
                    name="height"
                    value={userProfile.height}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-2 rounded border transition-colors ${isDark ? 'bg-slate-900 border-slate-700 focus:border-blue-600' : 'bg-white border-gray-200 focus:border-blue-600'} focus:outline-none`}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={userProfile.weight}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-2 rounded border transition-colors ${isDark ? 'bg-slate-900 border-slate-700 focus:border-blue-600' : 'bg-white border-gray-200 focus:border-blue-600'} focus:outline-none`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Stress Level (1-10)</label>
                  <input
                    type="number"
                    name="stressLevel"
                    min="1"
                    max="10"
                    value={userProfile.stressLevel}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded border transition-colors ${isDark ? 'bg-slate-900 border-slate-700 focus:border-blue-600' : 'bg-white border-gray-200 focus:border-blue-600'} focus:outline-none`}
                  />
                </div>
              </div>
            </div>

            {/* Fitness Information */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Fitness Information</h2>
              <div>
                <label className="block text-sm font-medium mb-2">Fitness Goal</label>
                <select
                  name="fitnessGoal"
                  value={userProfile.fitnessGoal}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded border transition-colors ${isDark ? 'bg-slate-900 border-slate-700 focus:border-blue-600' : 'bg-white border-gray-200 focus:border-blue-600'} focus:outline-none`}
                >
                  <option value="weight_loss">Weight Loss</option>
                  <option value="muscle_gain">Muscle Gain</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="endurance">Endurance</option>
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Fitness Level</label>
                  <select
                    name="fitnessLevel"
                    value={userProfile.fitnessLevel}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded border transition-colors ${isDark ? 'bg-slate-900 border-slate-700 focus:border-blue-600' : 'bg-white border-gray-200 focus:border-blue-600'} focus:outline-none`}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Workout Location</label>
                  <select
                    name="workoutLocation"
                    value={userProfile.workoutLocation}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded border transition-colors ${isDark ? 'bg-slate-900 border-slate-700 focus:border-blue-600' : 'bg-white border-gray-200 focus:border-blue-600'} focus:outline-none`}
                  >
                    <option value="home">Home</option>
                    <option value="gym">Gym</option>
                    <option value="outdoor">Outdoor</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dietary Preferences */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Dietary Preferences</h2>
              <select
                name="dietaryPreference"
                value={userProfile.dietaryPreference}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded border transition-colors ${isDark ? 'bg-slate-900 border-slate-700 focus:border-blue-600' : 'bg-white border-gray-200 focus:border-blue-600'} focus:outline-none`}
              >
                <option value="veg">Vegetarian</option>
                <option value="non_veg">Non-Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="keto">Keto</option>
              </select>
            </div>

            {/* Optional Information */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Additional Info</h2>
              <div>
                <label className="block text-sm font-medium mb-2">Medical History (Optional)</label>
                <textarea
                  name="medicalHistory"
                  value={userProfile.medicalHistory}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded border transition-colors ${isDark ? 'bg-slate-900 border-slate-700 focus:border-blue-600' : 'bg-white border-gray-200 focus:border-blue-600'} focus:outline-none`}
                  rows={3}
                  placeholder="Any medical conditions or injuries"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {loading ? 'Generating Your Plan...' : 'Generate My Fitness Plan'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
