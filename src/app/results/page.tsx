'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { FitnessPlan } from '@/types';
import jsPDF from 'jspdf';

export default function ResultsPage() {
  const { isDark, toggleTheme } = useTheme();
  const [plan, setPlan] = useState<FitnessPlan | null>(null);
  const [activeTab, setActiveTab] = useState<'workout' | 'diet' | 'tips' | 'quote'>('workout');
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string | null>>({
    workout: null,
    diet: null,
    tips: null,
    quote: null,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    const savedPlan = localStorage.getItem('currentPlan');
    if (savedPlan) {
      setPlan(JSON.parse(savedPlan));
    }
  }, []);

  const regeneratePlan = async () => {
    if (!plan) return;

    setRegenerating(true);
    try {
      const response = await fetch('/api/fitness/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userProfile: plan.userProfile }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate plan');
      }

      const data = await response.json();
      // Update the plan with new data
      setPlan(data.data);
      localStorage.setItem('currentPlan', JSON.stringify(data.data));
      // Clear generated images when regenerating
      setGeneratedImages({
        workout: null,
        diet: null,
        tips: null,
        quote: null,
      });
      // Reset to workout tab to show the updated content
      setActiveTab('workout');
      // Stop any playing audio
      stopAudio();
      alert('✓ Fitness plan regenerated successfully!\n\nWorkout Plan, Diet Plan, and Tips have been updated with fresh content.');
    } catch (error) {
      console.error('Error:', error);
      alert(`Failed to regenerate plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setRegenerating(false);
    }
  };

  const generateAudio = async () => {
    if (!plan) return;

    setLoadingAudio(true);
    try {
      const textToRead = activeTab === 'workout' 
        ? plan.workoutPlan 
        : activeTab === 'diet' 
        ? plan.dietPlan 
        : activeTab === 'tips' 
        ? plan.tips 
        : plan.motivationalQuote;

      const response = await fetch('/api/tts/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: textToRead }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate audio');
      }

      const data = await response.json();
      
      if (!data.audioUrl) {
        throw new Error('No audio URL returned');
      }

      const audio = new Audio(data.audioUrl);
      
      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setIsPlaying(false);
        alert('Failed to play audio');
      };

      setCurrentAudio(audio);
      audio.play();
    } catch (error) {
      console.error('Error:', error);
      alert(`Failed to generate audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingAudio(false);
    }
  };

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlaying(false);
      setCurrentAudio(null);
    }
  };

  const generateImage = async () => {
    if (!plan) return;

    setLoadingImage(true);
    try {
      const prompt = activeTab === 'workout' 
        ? 'Professional gym workout exercise form demonstration, proper form, athletic'
        : activeTab === 'diet'
        ? 'Healthy nutritious meal preparation, colorful, appetizing, professional food photography'
        : 'Fitness motivation quote, inspiring, energetic, gym background';

      const response = await fetch('/api/images/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, imageType: activeTab }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
      }

      const data = await response.json();
      
      if (!data.imageUrl) {
        throw new Error('No image URL returned');
      }

      // Store image for the current tab
      setGeneratedImages(prev => ({
        ...prev,
        [activeTab]: data.imageUrl,
      }));
    } catch (error) {
      console.error('Error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to generate image: ${errorMsg}\n\nNote: Free tier has rate limits of 6 requests/minute. Please wait a moment before trying again.`);
    } finally {
      setLoadingImage(false);
    }
  };

  const exportAsPDF = () => {
    if (!plan) return;

    const doc = new jsPDF();
    let yPosition = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;

    const addNewPageIfNeeded = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - 10) {
        doc.addPage();
        yPosition = 15;
      }
    };

    // Title
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Your Personalized Fitness Plan', margin, yPosition);
    yPosition += 12;

    // User Profile Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('User Profile', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${plan.userProfile.name}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Age: ${plan.userProfile.age} | Gender: ${plan.userProfile.gender}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Height: ${plan.userProfile.height}cm | Weight: ${plan.userProfile.weight}kg`, margin, yPosition);
    yPosition += 5;
    doc.text(`Fitness Goal: ${plan.userProfile.fitnessGoal}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Fitness Level: ${plan.userProfile.fitnessLevel}`, margin, yPosition);
    yPosition += 10;

    // Workout Plan Section
    addNewPageIfNeeded(40);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Workout Plan', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const workoutLines = doc.splitTextToSize(plan.workoutPlan, contentWidth);
    doc.text(workoutLines, margin, yPosition);
    yPosition += workoutLines.length * 4.5 + 8;

    // Diet Plan Section
    addNewPageIfNeeded(40);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Diet Plan', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const dietLines = doc.splitTextToSize(plan.dietPlan, contentWidth);
    doc.text(dietLines, margin, yPosition);
    yPosition += dietLines.length * 4.5 + 8;

    // Fitness Tips Section
    addNewPageIfNeeded(40);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Fitness Tips', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const tipLines = doc.splitTextToSize(plan.tips, contentWidth);
    doc.text(tipLines, margin, yPosition);
    yPosition += tipLines.length * 4.5 + 8;

    // Motivational Quote Section
    addNewPageIfNeeded(30);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Motivational Quote', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(70, 130, 180); // Steel blue color
    const quoteLines = doc.splitTextToSize(`"${plan.motivationalQuote.replace(/^"|"$/g, '')}"`, contentWidth);
    doc.text(quoteLines, margin, yPosition);
    
    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Footer with date
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    const footerText = `Generated on ${new Date().toLocaleDateString()}`;
    doc.text(footerText, margin, pageHeight - 8);

    // Save
    doc.save(`fitness-plan-${plan.userProfile.name}-${new Date().getTime()}.pdf`);
  };

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Plan Found</h1>
          <a href="/app" className="btn-primary px-6 py-2">
            Create a New Plan
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 py-10">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <a href="/app" className="text-primary text-xl font-bold">← New Plan</a>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-white dark:bg-slate-700"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>

        {/* User Info Card */}
        <div className="card mb-8">
          <h1 className="text-3xl font-bold mb-4 text-primary">
            Your Personalized Fitness Plan
          </h1>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold">Name:</p>
              <p>{plan.userProfile.name}</p>
            </div>
            <div>
              <p className="font-semibold">Goal:</p>
              <p>{plan.userProfile.fitnessGoal}</p>
            </div>
            <div>
              <p className="font-semibold">Level:</p>
              <p>{plan.userProfile.fitnessLevel}</p>
            </div>
            <div>
              <p className="font-semibold">Location:</p>
              <p>{plan.userProfile.workoutLocation}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="card mb-8">
          <div className="flex gap-4 border-b border-gray-300 dark:border-gray-600 mb-6">
            {(['workout', 'diet', 'tips', 'quote'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-semibold transition-all border-b-2 ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-600 dark:text-gray-400'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="mb-6">
            {activeTab === 'workout' && (
              <div>
                <h2 className="text-2xl font-semibold mb-6 text-primary">Workout Plan</h2>
                <div className="bg-blue-50 dark:bg-slate-700/30 p-6 rounded-lg border border-blue-200 dark:border-slate-600 space-y-3">
                  <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                    {plan.workoutPlan.split('\n').map((line: string, index: number) => {
                      const trimmed = line.trim();
                      if (!trimmed) return <br key={index} />;
                      
                      // Style day headers (Monday, Tuesday, etc. - with or without asterisks)
                      if (trimmed.match(/^\*?(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i)) {
                        const dayName = trimmed.replace(/^\*+/, '').replace(/\*+$/, '').trim();
                        return (
                          <h4 key={index} className="font-bold text-lg text-primary mt-5 mb-3 pb-2 border-b-2 border-primary/30">
                            {dayName}
                          </h4>
                        );
                      }
                      
                      // Style exercise items (contain colon or are indented with *)
                      if (line.includes(':') && !line.startsWith('*')) {
                        const parts = line.split(':');
                        return (
                          <p key={index} className="font-semibold text-gray-800 dark:text-gray-200 my-2 ml-4">
                            <span className="text-primary">•</span> {parts[0].trim()}: <span className="font-normal">{parts.slice(1).join(':').trim()}</span>
                          </p>
                        );
                      }
                      
                      // Style circuit/section headers
                      if (trimmed.toLowerCase().includes('circuit') || trimmed.match(/^Complete \d+ rounds/i)) {
                        return (
                          <p key={index} className="font-semibold text-primary my-3 mt-4">
                            {trimmed}
                          </p>
                        );
                      }
                      
                      // Circuit items (indented with *)
                      if (trimmed.startsWith('*') && !trimmed.match(/^\*?(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i)) {
                        return (
                          <p key={index} className="ml-8 my-1 text-gray-700 dark:text-gray-300">
                            {trimmed.replace(/^\*/, '•')}
                          </p>
                        );
                      }
                      
                      // Regular text (intro, notes, etc.)
                      return (
                        <p key={index} className="my-2 leading-relaxed italic text-gray-600 dark:text-gray-400">
                          {trimmed}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'diet' && (
              <div>
                <h2 className="text-2xl font-semibold mb-6 text-primary">Diet Plan</h2>
                <div className="bg-green-50 dark:bg-slate-700/30 p-6 rounded-lg border border-green-200 dark:border-slate-600 space-y-3">
                  <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                    {plan.dietPlan.split('\n').map((line: string, index: number) => {
                      const trimmed = line.trim();
                      if (!trimmed) return <br key={index} />;
                      
                      // Style day headers (• Monday:, • Tuesday:, etc or *Monday:, Day 1:, etc)
                      if (trimmed.match(/^[•\*]?\s*(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i) || trimmed.match(/^\*?Day \d+/i)) {
                        const dayName = trimmed
                          .replace(/^[•\*]\s*/, '')
                          .replace(/^\*/, '')
                          .replace(/\*$/, '')
                          .trim();
                        return (
                          <h4 key={index} className="font-bold text-lg text-green-600 dark:text-green-400 mt-5 mb-3 pb-2 border-b-2 border-green-300/50">
                            {dayName}
                          </h4>
                        );
                      }
                      
                      // Style meal headers (Breakfast:, Lunch:, Dinner:, Snacks:)
                      if (trimmed.match(/^(Breakfast|Lunch|Dinner|Snacks|Brunch):/i)) {
                        return (
                          <p key={index} className="font-semibold text-green-700 dark:text-green-300 mt-3 mb-2 ml-4">
                            {trimmed}
                          </p>
                        );
                      }
                      
                      // Style food items (with bullets, dashes, or indented)
                      if (trimmed.match(/^[\•\-\*]/) || (line.startsWith('  ') && !trimmed.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Day \d+)/i))) {
                        return (
                          <p key={index} className="ml-8 my-1 text-gray-700 dark:text-gray-300 leading-relaxed">
                            {trimmed.replace(/^[\•\-\*]\s*/, '• ')}
                          </p>
                        );
                      }
                      
                      // Regular text (intro, notes, calorie information)
                      return (
                        <p key={index} className="my-2 leading-relaxed italic text-gray-600 dark:text-gray-400">
                          {trimmed}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'tips' && (
              <div>
                <h2 className="text-2xl font-semibold mb-6 text-primary">Fitness Tips</h2>
                <div className="space-y-4">
                  {plan.tips.split('\n').map((line: string, index: number) => {
                    const trimmed = line.trim();
                    if (!trimmed) return null;
                    
                    // Handle bullet points with titles and descriptions
                    // Pattern: "* Title: description" or "• Title: description"
                    if (trimmed.match(/^[\*•]\s+[A-Z]/)) {
                      const content = trimmed.replace(/^[\*•]\s+/, '').trim();
                      const colonIndex = content.indexOf(':');
                      
                      if (colonIndex !== -1) {
                        const title = content.substring(0, colonIndex).trim();
                        const description = content.substring(colonIndex + 1).trim();
                        
                        return (
                          <div key={index} className="bg-amber-50 dark:bg-slate-700/50 p-5 rounded-lg border-l-4 border-amber-500">
                            <p className="font-bold text-amber-700 dark:text-amber-300 text-lg mb-2">
                              {title}
                            </p>
                            {description && (
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                {description}
                              </p>
                            )}
                          </div>
                        );
                      }
                    }
                    
                    // Style tip headers (lines that end with colon, no bullet)
                    if (trimmed.match(/^[A-Z][^:]*:\s/) && !trimmed.startsWith('*')) {
                      const cleanTitle = trimmed
                        .replace(/^\*\*/, '')
                        .replace(/\*\*/, '')
                        .trim();
                      
                      // Extract title and description
                      const colonIndex = cleanTitle.indexOf(':');
                      const title = colonIndex !== -1 ? cleanTitle.substring(0, colonIndex) : cleanTitle;
                      const description = colonIndex !== -1 ? cleanTitle.substring(colonIndex + 1).trim() : '';
                      
                      return (
                        <div key={index} className="bg-amber-50 dark:bg-slate-700/50 p-5 rounded-lg border-l-4 border-amber-500">
                          <p className="font-bold text-amber-700 dark:text-amber-300 text-lg mb-2">
                            {title}
                          </p>
                          {description && (
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                              {description}
                            </p>
                          )}
                        </div>
                      );
                    }
                    
                    // Intro paragraph (lines that start with intro text)
                    if (trimmed.toLowerCase().includes('here are') || trimmed.toLowerCase().includes('tips')) {
                      return (
                        <p key={index} className="italic text-gray-600 dark:text-gray-400 mb-4 p-4 bg-amber-50 dark:bg-slate-700/30 rounded-lg">
                          {trimmed}
                        </p>
                      );
                    }
                    
                    // Regular tip content (continuation of previous tip)
                    return (
                      <p key={index} className="text-gray-700 dark:text-gray-300 leading-relaxed ml-2">
                        {trimmed}
                      </p>
                    );
                  })}
                </div>
              </div>
            )}
            
            {activeTab === 'quote' && (
              <div>
                <h2 className="text-2xl font-semibold mb-6 text-primary">Motivation</h2>
                <div className="bg-gradient-to-r from-purple-500/10 via-primary/10 to-blue-500/10 dark:from-purple-500/20 dark:via-primary/20 dark:to-blue-500/20 p-10 rounded-lg border-2 border-primary/50 shadow-lg">
                  <p className="text-xl md:text-2xl italic text-center text-primary font-semibold leading-relaxed">
                    "{plan.motivationalQuote
                      .replace(/^"|"$/g, '')
                      .replace(/^\*\*|^\*|^""|^""/, '')
                      .replace(/\*\*$|\*$|""$|""$/, '')
                      .trim()}"
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Generated Image */}
          {generatedImages[activeTab] && (
            <div className="mb-6 bg-white dark:bg-slate-700/50 p-8 rounded-lg border-2 border-gray-200 dark:border-slate-600">
              <h3 className="font-semibold text-lg mb-4">Generated Image</h3>
              <div className="flex flex-col items-center">
                <img
                  src={generatedImages[activeTab]}
                  alt="Generated"
                  className="w-full rounded-lg object-contain cursor-pointer hover:shadow-xl transition-shadow duration-300 max-h-full"
                  onClick={() => setExpandedImage(generatedImages[activeTab])}
                  style={{ maxHeight: '500px' }}
                />
                <button
                  onClick={() => setExpandedImage(generatedImages[activeTab])}
                  className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-semibold"
                >
                  🔍 View Full Size
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 flex-wrap">
            {isPlaying ? (
              <button
                onClick={stopAudio}
                className="btn-primary flex items-center gap-2"
              >
                ⏹️ Stop Reading
              </button>
            ) : (
              <button
                onClick={generateAudio}
                disabled={loadingAudio}
                className="btn-primary flex items-center gap-2"
              >
                🔊 {loadingAudio ? 'Generating...' : 'Read Aloud'}
              </button>
            )}
            <button
              onClick={generateImage}
              disabled={loadingImage}
              className="btn-secondary flex items-center gap-2"
            >
              🖼️ {loadingImage ? 'Generating...' : 'Generate Image'}
            </button>
            <button
              onClick={regeneratePlan}
              disabled={regenerating}
              className="btn-secondary flex items-center gap-2"
            >
              🔄 {regenerating ? 'Regenerating...' : 'Regenerate Plan'}
            </button>
            <button
              onClick={exportAsPDF}
              className="btn-outline flex items-center gap-2"
            >
              📄 Export as PDF
            </button>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {expandedImage && (
        <div
          className="fixed inset-0 bg-black/80 dark:bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setExpandedImage(null)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-5xl max-h-[90vh] overflow-auto flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-primary">Full Size Image</h2>
                <button
                  onClick={() => setExpandedImage(null)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>
              <img
                src={expandedImage}
                alt="Full size generated"
                className="w-full h-auto rounded-lg object-contain max-h-[75vh]"
              />
              <button
                onClick={() => setExpandedImage(null)}
                className="mt-6 w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
