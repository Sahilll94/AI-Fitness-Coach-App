'use client';

import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { UserProfile } from '@/types';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 py-10">
      <div className="container max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <a href="/" className="text-primary text-xl font-bold">← Back</a>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-white dark:bg-slate-700"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Form */}
        <div className="card">
          <h1 className="text-3xl font-bold mb-8 text-primary">Create Your Fitness Plan</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={userProfile.name}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="Enter your name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Age</label>
                    <input
                      type="number"
                      name="age"
                      value={userProfile.age}
                      onChange={handleChange}
                      required
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Gender</label>
                    <select
                      name="gender"
                      value={userProfile.gender}
                      onChange={handleChange}
                      className="input-field"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Height (cm)</label>
                    <input
                      type="number"
                      name="height"
                      value={userProfile.height}
                      onChange={handleChange}
                      required
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Weight (kg)</label>
                    <input
                      type="number"
                      name="weight"
                      value={userProfile.weight}
                      onChange={handleChange}
                      required
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Fitness Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Fitness Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Fitness Goal</label>
                  <select
                    name="fitnessGoal"
                    value={userProfile.fitnessGoal}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="weight_loss">Weight Loss</option>
                    <option value="muscle_gain">Muscle Gain</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="endurance">Endurance</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Fitness Level</label>
                    <select
                      name="fitnessLevel"
                      value={userProfile.fitnessLevel}
                      onChange={handleChange}
                      className="input-field"
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
                      className="input-field"
                    >
                      <option value="home">Home</option>
                      <option value="gym">Gym</option>
                      <option value="outdoor">Outdoor</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Dietary Preferences */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Dietary Preferences</h2>
              <div>
                <label className="block text-sm font-medium mb-2">Diet Type</label>
                <select
                  name="dietaryPreference"
                  value={userProfile.dietaryPreference}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="veg">Vegetarian</option>
                  <option value="non_veg">Non-Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="keto">Keto</option>
                </select>
              </div>
            </div>

            {/* Optional Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Optional Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Medical History</label>
                  <textarea
                    name="medicalHistory"
                    value={userProfile.medicalHistory}
                    onChange={handleChange}
                    className="input-field"
                    rows={3}
                    placeholder="Any medical conditions or injuries (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Stress Level (1-10)</label>
                  <input
                    type="range"
                    name="stressLevel"
                    min="1"
                    max="10"
                    value={userProfile.stressLevel}
                    onChange={handleChange}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-500 mt-2">Current: {userProfile.stressLevel}/10</div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-lg font-semibold"
            >
              {loading ? 'Generating Your Plan...' : 'Generate My Fitness Plan'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
