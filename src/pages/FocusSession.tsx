import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Square, Timer, CheckCircle, Settings2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

interface FocusSessionData {
  id: number;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  was_completed: boolean;
  blocked_apps: string[];
}

const DEFAULT_DURATIONS = [25, 45, 60, 90];
const DEFAULT_BLOCKED_APPS = ['YouTube', 'Twitter', 'Reddit', 'Discord', 'Steam'];

export const FocusSession: React.FC = () => {
  const [activeSession, setActiveSession] = useState<FocusSessionData | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [blockedApps, setBlockedApps] = useState(DEFAULT_BLOCKED_APPS);
  const [showSettings, setShowSettings] = useState(false);
  const [newApp, setNewApp] = useState('');

  useEffect(() => {
    checkActiveSession();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const checkActiveSession = async () => {
    try {
      const response = await invoke<{ success: boolean; data?: FocusSessionData }>('get_active_focus_session');
      if (response.success && response.data) {
        setActiveSession(response.data);
        setIsRunning(true);
        const startTime = new Date(response.data.start_time).getTime();
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        const totalSeconds = selectedDuration * 60;
        setTimeLeft(Math.max(0, totalSeconds - elapsedSeconds));
      }
    } catch (err) {
      console.error('Failed to check active session:', err);
    }
  };

  const handleStart = async () => {
    try {
      const response = await invoke<{ success: boolean; data?: number; error?: string }>('start_focus_session', {
        durationMinutes: selectedDuration,
        blockedApps: blockedApps,
      });
      
      if (response.success && response.data) {
        setActiveSession({
          id: response.data,
          start_time: new Date().toISOString(),
          was_completed: false,
          blocked_apps: blockedApps,
        });
        setTimeLeft(selectedDuration * 60);
        setIsRunning(true);
      } else {
        alert(response.error || 'Failed to start session');
      }
    } catch (err) {
      console.error('Failed to start session:', err);
      alert('Failed to start focus session');
    }
  };

  const handleStop = async (completed: boolean) => {
    try {
      await invoke('stop_focus_session', { wasCompleted: completed });
      setIsRunning(false);
      setActiveSession(null);
      setTimeLeft(selectedDuration * 60);
    } catch (err) {
      console.error('Failed to stop session:', err);
    }
  };

  const handleComplete = () => {
    handleStop(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const addBlockedApp = () => {
    if (newApp.trim() && !blockedApps.includes(newApp.trim())) {
      setBlockedApps([...blockedApps, newApp.trim()]);
      setNewApp('');
    }
  };

  const removeBlockedApp = (app: string) => {
    setBlockedApps(blockedApps.filter(a => a !== app));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Focus Session</h1>
          <p className="text-secondary mt-1">Deep work timer with app blocking</p>
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="btn btn-ghost btn-sm"
        >
          <Settings2 className="w-4 h-4 mr-2" />
          Settings
        </button>
      </div>

      <div className="max-w-2xl mx-auto">
        {!isRunning && (
          <div className="flex justify-center gap-3 mb-8">
            {DEFAULT_DURATIONS.map((duration) => (
              <button
                key={duration}
                onClick={() => {
                  setSelectedDuration(duration);
                  setTimeLeft(duration * 60);
                }}
                className={`btn ${selectedDuration === duration ? 'btn-primary' : 'btn-secondary'}`}
              >
                {duration} min
              </button>
            ))}
          </div>
        )}

        <div className="chart-container text-center mb-6">
          <Timer className={`w-16 h-16 mx-auto mb-6 text-accent-purple ${isRunning ? 'animate-pulse' : 'opacity-50'}`} />
          <div className="focus-timer-display mb-4">{formatTime(timeLeft)}</div>
          
          {activeSession ? (
            <div className="mb-6">
              <div className="flex items-center justify-center gap-2 text-sm text-accent-green mb-2">
                <CheckCircle className="w-4 h-4" />
                <span>Focus session active</span>
              </div>
              <p className="text-secondary text-sm">
                Blocking: {activeSession.blocked_apps.slice(0, 3).join(', ')}
                {activeSession.blocked_apps.length > 3 && ` +${activeSession.blocked_apps.length - 3} more`}
              </p>
            </div>
          ) : (
            <p className="text-secondary mb-8">Ready to start a focus session</p>
          )}
          
          <div className="flex justify-center gap-4">
            {!isRunning ? (
              <button 
                onClick={handleStart}
                className="btn btn-primary btn-lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Session
              </button>
            ) : (
              <>
                <button 
                  onClick={() => handleStop(false)}
                  className="btn btn-secondary"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Cancel
                </button>
                <button 
                  onClick={() => handleStop(true)}
                  className="btn btn-primary"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete
                </button>
              </>
            )}
          </div>
        </div>

        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="chart-container mb-6"
          >
            <h3 className="card-title mb-4">Blocked Apps</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {blockedApps.map((app) => (
                <span 
                  key={app}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-accent-red/20 text-accent-red rounded-full text-sm"
                >
                  {app}
                  <button 
                    onClick={() => removeBlockedApp(app)}
                    className="hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newApp}
                onChange={(e) => setNewApp(e.target.value)}
                placeholder="Add app to block..."
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && addBlockedApp()}
              />
              <button 
                onClick={addBlockedApp}
                className="btn btn-secondary"
                disabled={!newApp.trim()}
              >
                Add
              </button>
            </div>
            <p className="text-secondary text-xs mt-3">
              These apps will be blocked during your focus session
            </p>
          </motion.div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="chart-container text-center">
            <div className="text-2xl font-bold text-accent-purple">{selectedDuration}</div>
            <div className="text-xs text-secondary uppercase tracking-wider">Minutes</div>
          </div>
          <div className="chart-container text-center">
            <div className="text-2xl font-bold text-accent-amber">{blockedApps.length}</div>
            <div className="text-xs text-secondary uppercase tracking-wider">Blocked Apps</div>
          </div>
          <div className="chart-container text-center">
            <div className="text-2xl font-bold text-accent-green">{formatTime(timeLeft)}</div>
            <div className="text-xs text-secondary uppercase tracking-wider">Remaining</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
