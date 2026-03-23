import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from '@components/layout/Sidebar';
import { Header } from '@components/layout/Header';
import { Dashboard } from '@pages/Dashboard';
import { Timeline } from '@pages/Timeline';
import { FocusSession } from '@pages/FocusSession';
import { Insights } from '@pages/Insights';
import { Team } from '@pages/Team';
import { Settings } from '@pages/Settings';
import { Onboarding } from '@components/onboarding/Onboarding';
import { useActivityStore } from '@app/store/activityStore';
import { motion, AnimatePresence } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';

const App: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { startTracking } = useActivityStore();

  useEffect(() => {
    const init = async () => {
      // Check if onboarding is complete
      try {
        const response = await invoke<{ success: boolean; data?: { onboarding_completed?: boolean } }>('get_settings');
        if (response.success && response.data) {
          setShowOnboarding(!response.data.onboarding_completed);
        } else {
          setShowOnboarding(true);
        }
      } catch (err) {
        console.error('Failed to check onboarding status:', err);
        setShowOnboarding(true);
      }

      // Start tracking on app load
      startTracking();
      setIsLoading(false);
    };

    init();
  }, [startTracking]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-accent-purple/30 border-t-accent-purple rounded-full animate-spin" />
          <p className="text-secondary text-sm">Loading Screenlytics...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      <div className="app">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
          <Header />
          <main className="page-container">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/timeline" element={<Timeline />} />
                <Route path="/focus" element={<FocusSession />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/team" element={<Team />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </>
  );
};

export default App;
