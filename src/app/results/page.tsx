'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { FitnessPlan } from '@/types';
import jsPDF from 'jspdf';
import { Moon, Sun, ArrowLeft } from 'lucide-react';

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
    let yPosition = 25;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 25;
    const bottomMargin = 25;
    const contentWidth = pageWidth - 2 * margin;

    const addNewPageIfNeeded = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - bottomMargin) {
        doc.addPage();
        yPosition = 25;
      }
    };

    const addSectionHeader = (title: string, yPos: number) => {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.8);
      doc.line(margin, yPos - 8, pageWidth - margin, yPos - 8);
      
      doc.setFontSize(14);
      doc.setFont('times', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(title, margin, yPos);
      return yPos + 10;
    };

    doc.setFontSize(28);
    doc.setFont('times', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('PERSONALIZED FITNESS PLAN', margin, yPosition);
    yPosition += 12;

    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    doc.setTextColor(80, 80, 80);
    const subtitleLines = doc.splitTextToSize('AI-Generated Customized Fitness & Nutrition Program', contentWidth);
    doc.text(subtitleLines, margin, yPosition);
    yPosition += subtitleLines.length * 4 + 3;

    // Decorative line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // User Profile Section
    yPosition = addSectionHeader('CLIENT PROFILE', yPosition);
    
    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const profileData = [
      [`Name:`, `${plan.userProfile.name}`],
      [`Age:`, `${plan.userProfile.age} years old`],
      [`Gender:`, `${plan.userProfile.gender}`],
      [`Height:`, `${plan.userProfile.height} cm`],
      [`Weight:`, `${plan.userProfile.weight} kg`],
      [`Fitness Goal:`, `${plan.userProfile.fitnessGoal}`],
      [`Experience Level:`, `${plan.userProfile.fitnessLevel}`],
      [`Workout Location:`, `${plan.userProfile.workoutLocation || 'Not specified'}`],
    ];

    profileData.forEach(([label, value]) => {
      doc.setFont('times', 'bold');
      doc.text(label, margin, yPosition);
      doc.setFont('times', 'normal');
      const valueLines = doc.splitTextToSize(value, contentWidth - 55);
      doc.text(valueLines, margin + 50, yPosition);
      yPosition += Math.max(6, valueLines.length * 5);
    });

    yPosition += 5;

    // Workout Plan Section
    addNewPageIfNeeded(100);
    yPosition = addSectionHeader('WORKOUT PLAN', yPosition);
    
    doc.setFontSize(9.5);
    doc.setFont('times', 'normal');
    doc.setTextColor(0, 0, 0);
    
    // Process workout plan to convert asterisks to bullet points
    const workoutPlanProcessed = plan.workoutPlan
      .split('\n')
      .map((line: string) => {
        // Replace asterisks at the start of lines with proper bullet symbol
        if (line.trim().startsWith('*')) {
          return '• ' + line.trim().substring(1).trim();
        }
        return line;
      })
      .join('\n');
    
    const workoutLines = doc.splitTextToSize(workoutPlanProcessed, contentWidth - 5);
    doc.text(workoutLines, margin, yPosition);
    yPosition += workoutLines.length * 4.3 + 8;

    // Diet Plan Section
    addNewPageIfNeeded(100);
    yPosition = addSectionHeader('NUTRITIONAL PLAN', yPosition);
    
    doc.setFontSize(9.5);
    doc.setFont('times', 'normal');
    doc.setTextColor(0, 0, 0);
    
    // Process diet plan to convert asterisks to bullet points
    const dietPlanProcessed = plan.dietPlan
      .split('\n')
      .map((line: string) => {
        if (line.trim().startsWith('*')) {
          return '• ' + line.trim().substring(1).trim();
        }
        return line;
      })
      .join('\n');
    
    const dietLines = doc.splitTextToSize(dietPlanProcessed, contentWidth - 5);
    doc.text(dietLines, margin, yPosition);
    yPosition += dietLines.length * 4.3 + 8;

    // Fitness Tips Section
    addNewPageIfNeeded(100);
    yPosition = addSectionHeader('HEALTH & FITNESS RECOMMENDATIONS', yPosition);
    
    doc.setFontSize(9.5);
    doc.setFont('times', 'normal');
    doc.setTextColor(0, 0, 0);
    
    // Process tips to convert asterisks to bullet points
    const tipsProcessed = plan.tips
      .split('\n')
      .map((line: string) => {
        if (line.trim().startsWith('*')) {
          return '• ' + line.trim().substring(1).trim();
        }
        return line;
      })
      .join('\n');
    
    const tipLines = doc.splitTextToSize(tipsProcessed, contentWidth - 5);
    doc.text(tipLines, margin, yPosition);
    yPosition += tipLines.length * 4.3 + 8;

    // Motivational Quote Section
    addNewPageIfNeeded(50);
    yPosition = addSectionHeader('MOTIVATION', yPosition);
    
    doc.setFontSize(11);
    doc.setFont('times', 'italic');
    doc.setTextColor(40, 40, 40);
    
    const cleanQuote = plan.motivationalQuote
      .replace(/^"|"$/g, '')
      .replace(/^\*\*|^\*|^""|^""/, '')
      .replace(/\*\*$|\*$|""$|""$/, '')
      .trim();
    
    const quoteLines = doc.splitTextToSize(`"${cleanQuote}"`, contentWidth - 15);
    doc.text(quoteLines, margin + 10, yPosition);
    yPosition += quoteLines.length * 4.5 + 10;

    // Add new page for footer/credits if needed
    addNewPageIfNeeded(70);
    
    // Decorative separator line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 12;

    // Developer Section - Professional style
    doc.setFontSize(9);
    doc.setFont('times', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Document Generated By', margin, yPosition);
    yPosition += 6;

    doc.setFontSize(11);
    doc.setFont('times', 'bold');
    doc.text('AI Fitness Coach', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont('times', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Developed by: Sahil', margin, yPosition);
    yPosition += 6;

    // Portfolio link with hyperlink
    doc.setTextColor(0, 0, 255); // Blue for links
    doc.setFont('times', 'normal');
    doc.textWithLink('Portfolio: sahilfolio.live', margin, yPosition, { 
      url: 'https://sahilfolio.live',
    });
    doc.setTextColor(0, 0, 0); // Reset to black
    yPosition += 6;

    // GitHub link with hyperlink - wrapped to fit page
    doc.setTextColor(0, 0, 255); // Blue for links
    const githubText = 'Repository: github.com/Sahilll94/AI-Fitness-Coach-App';
    const githubLines = doc.splitTextToSize(githubText, contentWidth - 5);
    doc.textWithLink(githubLines[0], margin, yPosition, {
      url: 'https://github.com/Sahilll94/AI-Fitness-Coach-App',
    });
    if (githubLines.length > 1) {
      doc.setTextColor(0, 0, 0);
      doc.text(githubLines.slice(1), margin, yPosition + 5);
    }
    doc.setTextColor(0, 0, 0); // Reset to black
    yPosition += githubLines.length * 5 + 5;

    doc.setFontSize(8);
    doc.setFont('times', 'normal');
    doc.setTextColor(80, 80, 80);
    const taglineLines = doc.splitTextToSize('Powered by Advanced AI Technology', contentWidth);
    doc.text(taglineLines, margin, yPosition);
    yPosition += taglineLines.length * 4 + 2;

    const disclaimerLines = doc.splitTextToSize('This plan is personalized based on your profile and fitness goals.', contentWidth);
    doc.text(disclaimerLines, margin, yPosition);

    // Footer with timestamp and page numbers - Professional style
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('times', 'normal');
      doc.setTextColor(100, 100, 100);
      
      const date = new Date();
      const dateStr = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      const footerText = `Document generated on ${dateStr} | Page ${i} of ${pageCount}`;
      doc.text(footerText, margin, pageHeight - bottomMargin + 8);
    }

    // Save
    doc.save(`Fitness_Plan_${plan.userProfile.name.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
  };

  if (!plan) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: isDark ? '#0f172a' : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1rem' }}>No Plan Found</h1>
          <Link href="/app" style={{ 
            display: 'inline-block',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.375rem',
            textDecoration: 'none',
            fontWeight: '500',
            transition: 'background-color 0.3s'
          }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}>
            Create a New Plan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: isDark ? '#0f172a' : '#ffffff' }}>
      {/* Fixed Navigation */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        borderBottom: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        zIndex: 40,
        padding: '1rem 0'
      }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', paddingLeft: '1rem', paddingRight: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/app" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2563eb', textDecoration: 'none', fontWeight: '500', transition: 'opacity 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
              <ArrowLeft size={20} />
              <span>Back</span>
            </Link>
            <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: isDark ? '#ffffff' : '#000000', textDecoration: 'none', transition: 'opacity 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
              AI Fitness Coach
            </Link>
          </div>
          <button
            onClick={toggleTheme}
            style={{
              padding: '0.5rem',
              borderRadius: '0.375rem',
              border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
              backgroundColor: isDark ? '#1e293b' : '#f3f4f6',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#e5e7eb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDark ? '#1e293b' : '#f3f4f6'}
          >
            {isDark ? <Sun size={20} color="#fbbf24" /> : <Moon size={20} color="#374151" />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ paddingTop: '5rem', paddingBottom: '2.5rem' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', paddingLeft: '1rem', paddingRight: '1rem' }}>
        {/* User Info Card */}
        <div style={{
          marginBottom: '2rem',
          padding: '2rem',
          border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
          borderRadius: '0.375rem'
        }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1rem', color: isDark ? '#ffffff' : '#000000' }}>
            Your Personalized Fitness Plan
          </h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
            <div>
              <p style={{ fontWeight: '600', marginBottom: '0.25rem', color: isDark ? '#e2e8f0' : '#374151' }}>Name:</p>
              <p style={{ color: isDark ? '#cbd5e1' : '#6b7280' }}>{plan.userProfile.name}</p>
            </div>
            <div>
              <p style={{ fontWeight: '600', marginBottom: '0.25rem', color: isDark ? '#e2e8f0' : '#374151' }}>Goal:</p>
              <p style={{ color: isDark ? '#cbd5e1' : '#6b7280' }}>{plan.userProfile.fitnessGoal}</p>
            </div>
            <div>
              <p style={{ fontWeight: '600', marginBottom: '0.25rem', color: isDark ? '#e2e8f0' : '#374151' }}>Level:</p>
              <p style={{ color: isDark ? '#cbd5e1' : '#6b7280' }}>{plan.userProfile.fitnessLevel}</p>
            </div>
            <div>
              <p style={{ fontWeight: '600', marginBottom: '0.25rem', color: isDark ? '#e2e8f0' : '#374151' }}>Location:</p>
              <p style={{ color: isDark ? '#cbd5e1' : '#6b7280' }}>{plan.userProfile.workoutLocation}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          marginBottom: '2rem',
          padding: '2rem',
          border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
          borderRadius: '0.375rem'
        }}>
          <div style={{ display: 'flex', gap: '1rem', borderBottom: `1px solid ${isDark ? '#475569' : '#d1d5db'}`, marginBottom: '1.5rem', overflowX: 'auto' }}>
            {(['workout', 'diet', 'tips', 'quote'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '0.5rem 1rem',
                  fontWeight: '600',
                  transition: 'all 0.3s',
                  borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent',
                  color: activeTab === tab ? '#2563eb' : isDark ? '#9ca3af' : '#6b7280',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.9375rem'
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ marginBottom: '1.5rem' }}>
            {activeTab === 'workout' && (
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', color: isDark ? '#ffffff' : '#000000' }}>Workout Plan</h2>
                <div style={{ 
                  backgroundColor: isDark ? '#1e293b' : '#f9fafb',
                  padding: '1.5rem',
                  borderRadius: '0.375rem',
                  border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`
                }}>
                  <div style={{ color: isDark ? '#cbd5e1' : '#6b7280', fontSize: '0.9375rem', lineHeight: '1.6' }}>
                    {plan.workoutPlan.split('\n').map((line: string, index: number) => {
                      const trimmed = line.trim();
                      if (!trimmed) return <br key={index} />;
                      
                      // Style day headers (Monday, Tuesday, etc. - with or without asterisks)
                      if (trimmed.match(/^\*?(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i)) {
                        const dayName = trimmed.replace(/^\*+/, '').replace(/\*+$/, '').trim();
                        return (
                          <h4 key={index} style={{ fontWeight: 'bold', fontSize: '1rem', color: '#2563eb', marginTop: '1.25rem', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '2px solid rgba(37, 99, 235, 0.3)' }}>
                            {dayName}
                          </h4>
                        );
                      }
                      
                      // Style exercise items (contain colon or are indented with *)
                      if (line.includes(':') && !line.startsWith('*')) {
                        const parts = line.split(':');
                        return (
                          <p key={index} style={{ fontWeight: '600', color: isDark ? '#e2e8f0' : '#374151', margin: '0.5rem 0', marginLeft: '1rem' }}>
                            <span style={{ color: '#2563eb' }}>•</span> {parts[0].trim()}: <span style={{ fontWeight: 'normal' }}>{parts.slice(1).join(':').trim()}</span>
                          </p>
                        );
                      }
                      
                      // Style circuit/section headers
                      if (trimmed.toLowerCase().includes('circuit') || trimmed.match(/^Complete \d+ rounds/i)) {
                        return (
                          <p key={index} style={{ fontWeight: '600', color: '#2563eb', margin: '0.75rem 0', marginTop: '1rem' }}>
                            {trimmed}
                          </p>
                        );
                      }
                      
                      // Circuit items (indented with *)
                      if (trimmed.startsWith('*') && !trimmed.match(/^\*?(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i)) {
                        return (
                          <p key={index} style={{ marginLeft: '2rem', margin: '0.25rem 0', color: isDark ? '#cbd5e1' : '#6b7280' }}>
                            {trimmed.replace(/^\*/, '•')}
                          </p>
                        );
                      }
                      
                      // Regular text (intro, notes, etc.)
                      return (
                        <p key={index} style={{ margin: '0.5rem 0', fontStyle: 'italic', color: isDark ? '#94a3b8' : '#9ca3af', lineHeight: '1.6' }}>
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
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', color: isDark ? '#ffffff' : '#000000' }}>Diet Plan</h2>
                <div style={{ 
                  backgroundColor: isDark ? '#1e293b' : '#f9fafb',
                  padding: '1.5rem',
                  borderRadius: '0.375rem',
                  border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`
                }}>
                  <div style={{ color: isDark ? '#cbd5e1' : '#6b7280', fontSize: '0.9375rem', lineHeight: '1.6' }}>
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
                          <h4 key={index} style={{ fontWeight: 'bold', fontSize: '1rem', color: '#16a34a', marginTop: '1.25rem', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '2px solid rgba(22, 163, 74, 0.3)' }}>
                            {dayName}
                          </h4>
                        );
                      }
                      
                      // Style meal headers (Breakfast:, Lunch:, Dinner:, Snacks:)
                      if (trimmed.match(/^(Breakfast|Lunch|Dinner|Snacks|Brunch):/i)) {
                        return (
                          <p key={index} style={{ fontWeight: '600', color: '#16a34a', marginTop: '0.75rem', marginBottom: '0.5rem', marginLeft: '1rem' }}>
                            {trimmed}
                          </p>
                        );
                      }
                      
                      // Style food items (with bullets, dashes, or indented)
                      if (trimmed.match(/^[\•\-\*]/) || (line.startsWith('  ') && !trimmed.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Day \d+)/i))) {
                        return (
                          <p key={index} style={{ marginLeft: '2rem', margin: '0.25rem 0', color: isDark ? '#cbd5e1' : '#6b7280', lineHeight: '1.6' }}>
                            {trimmed.replace(/^[\•\-\*]\s*/, '• ')}
                          </p>
                        );
                      }
                      
                      // Regular text (intro, notes, calorie information)
                      return (
                        <p key={index} style={{ margin: '0.5rem 0', fontStyle: 'italic', color: isDark ? '#94a3b8' : '#9ca3af', lineHeight: '1.6' }}>
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
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', color: isDark ? '#ffffff' : '#000000' }}>Fitness Tips</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                          <div key={index} style={{
                            backgroundColor: isDark ? '#1e293b' : '#f9fafb',
                            padding: '1.25rem',
                            borderRadius: '0.375rem',
                            borderLeft: '4px solid #f59e0b'
                          }}>
                            <p style={{ fontWeight: 'bold', color: '#d97706', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                              {title}
                            </p>
                            {description && (
                              <p style={{ color: isDark ? '#cbd5e1' : '#6b7280', lineHeight: '1.6' }}>
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
                        <div key={index} style={{
                          backgroundColor: isDark ? '#1e293b' : '#f9fafb',
                          padding: '1.25rem',
                          borderRadius: '0.375rem',
                          borderLeft: '4px solid #f59e0b'
                        }}>
                          <p style={{ fontWeight: 'bold', color: '#d97706', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                            {title}
                          </p>
                          {description && (
                            <p style={{ color: isDark ? '#cbd5e1' : '#6b7280', lineHeight: '1.6' }}>
                              {description}
                            </p>
                          )}
                        </div>
                      );
                    }
                    
                    // Intro paragraph (lines that start with intro text)
                    if (trimmed.toLowerCase().includes('here are') || trimmed.toLowerCase().includes('tips')) {
                      return (
                        <p key={index} style={{
                          fontStyle: 'italic',
                          color: isDark ? '#94a3b8' : '#9ca3af',
                          marginBottom: '1rem',
                          padding: '1rem',
                          backgroundColor: isDark ? '#1e293b' : '#f9fafb',
                          borderRadius: '0.375rem'
                        }}>
                          {trimmed}
                        </p>
                      );
                    }
                    
                    // Regular tip content (continuation of previous tip)
                    return (
                      <p key={index} style={{ color: isDark ? '#cbd5e1' : '#6b7280', lineHeight: '1.6', marginLeft: '0.5rem' }}>
                        {trimmed}
                      </p>
                    );
                  })}
                </div>
              </div>
            )}
            
            {activeTab === 'quote' && (
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', color: isDark ? '#ffffff' : '#000000' }}>Motivation</h2>
                <div style={{
                  backgroundColor: isDark ? '#1e293b' : '#f3f4f6',
                  padding: '2.5rem',
                  borderRadius: '0.375rem',
                  border: `2px solid ${isDark ? '#475569' : '#d1d5db'}`
                }}>
                  <p style={{
                    fontSize: '1.25rem',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    color: '#2563eb',
                    fontWeight: '600',
                    lineHeight: '1.7'
                  }}>
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
            <div style={{
              marginBottom: '1.5rem',
              backgroundColor: isDark ? '#1e293b' : '#f9fafb',
              padding: '2rem',
              borderRadius: '0.375rem',
              border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`
            }}>
              <h3 style={{ fontWeight: '600', fontSize: '1.125rem', marginBottom: '1rem', color: isDark ? '#ffffff' : '#000000' }}>Generated Image</h3>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img
                  src={generatedImages[activeTab]}
                  alt="Generated"
                  style={{
                    width: '100%',
                    borderRadius: '0.375rem',
                    objectFit: 'contain',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.3s',
                    maxHeight: '500px'
                  }}
                  onClick={() => setExpandedImage(generatedImages[activeTab])}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                />
                <button
                  onClick={() => setExpandedImage(generatedImages[activeTab])}
                  style={{
                    marginTop: '1rem',
                    padding: '0.5rem 1.5rem',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    transition: 'background-color 0.3s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                >
                  🔍 View Full Size
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {isPlaying ? (
              <button
                onClick={stopAudio}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'background-color 0.3s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              >
                ⏹️ Stop Reading
              </button>
            ) : (
              <button
                onClick={generateAudio}
                disabled={loadingAudio}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: loadingAudio ? '#9ca3af' : '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: loadingAudio ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  transition: 'background-color 0.3s',
                  opacity: loadingAudio ? '0.5' : '1'
                }}
                onMouseEnter={(e) => !loadingAudio && (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                onMouseLeave={(e) => !loadingAudio && (e.currentTarget.style.backgroundColor = '#2563eb')}
              >
                🔊 {loadingAudio ? 'Generating...' : 'Read Aloud'}
              </button>
            )}
            <button
              onClick={generateImage}
              disabled={loadingImage}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                backgroundColor: loadingImage ? '#9ca3af' : isDark ? '#334155' : '#e5e7eb',
                color: isDark ? '#ffffff' : '#000000',
                border: `1px solid ${isDark ? '#475569' : '#d1d5db'}`,
                borderRadius: '0.375rem',
                cursor: loadingImage ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                transition: 'background-color 0.3s',
                opacity: loadingImage ? '0.5' : '1'
              }}
              onMouseEnter={(e) => !loadingImage && (e.currentTarget.style.backgroundColor = isDark ? '#475569' : '#d1d5db')}
              onMouseLeave={(e) => !loadingImage && (e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#e5e7eb')}
            >
              🖼️ {loadingImage ? 'Generating...' : 'Generate Image'}
            </button>
            <button
              onClick={regeneratePlan}
              disabled={regenerating}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                backgroundColor: regenerating ? '#9ca3af' : isDark ? '#334155' : '#e5e7eb',
                color: isDark ? '#ffffff' : '#000000',
                border: `1px solid ${isDark ? '#475569' : '#d1d5db'}`,
                borderRadius: '0.375rem',
                cursor: regenerating ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                transition: 'background-color 0.3s',
                opacity: regenerating ? '0.5' : '1'
              }}
              onMouseEnter={(e) => !regenerating && (e.currentTarget.style.backgroundColor = isDark ? '#475569' : '#d1d5db')}
              onMouseLeave={(e) => !regenerating && (e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#e5e7eb')}
            >
              🔄 {regenerating ? 'Regenerating...' : 'Regenerate Plan'}
            </button>
            <button
              onClick={exportAsPDF}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'transparent',
                color: isDark ? '#ffffff' : '#000000',
                border: `1px solid ${isDark ? '#475569' : '#d1d5db'}`,
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'background-color 0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#1e293b' : '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              📄 Export as PDF
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Image Modal */}
      {expandedImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1rem',
            cursor: 'pointer'
          }}
          onClick={() => setExpandedImage(null)}
        >
          <div
            style={{
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              borderRadius: '0.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxWidth: '56rem',
              maxHeight: '90vh',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '1.5rem', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>Full Size Image</h2>
                <button
                  onClick={() => setExpandedImage(null)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: isDark ? '#cbd5e1' : '#6b7280',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'color 0.3s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = isDark ? '#e2e8f0' : '#374151'}
                  onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#cbd5e1' : '#6b7280'}
                >
                  ✕
                </button>
              </div>
              <img
                src={expandedImage}
                alt="Full size generated"
                style={{ width: '100%', height: 'auto', borderRadius: '0.375rem', objectFit: 'contain', maxHeight: '75vh' }}
              />
              <button
                onClick={() => setExpandedImage(null)}
                style={{
                  marginTop: '1.5rem',
                  width: '100%',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'background-color 0.3s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
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
