import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, EyeOff, Eye, BarChart3, Activity } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

interface TeamSummary {
  team_name: string;
  member_count: number;
  avg_focus_score: number;
  top_fragmentation_hours: number[];
}

export const Team: React.FC = () => {
  const [sharingEnabled, setSharingEnabled] = useState(false);
  const [summary, setSummary] = useState<TeamSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      const [summaryRes, settingsRes] = await Promise.all([
        invoke<{ success: boolean; data?: TeamSummary }>('get_team_summary'),
        invoke<{ success: boolean; data?: { team_sharing_enabled: boolean } }>('get_settings'),
      ]);

      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }
      if (settingsRes.success && settingsRes.data) {
        setSharingEnabled(settingsRes.data.team_sharing_enabled);
      }
    } catch (err) {
      console.error('Failed to load team data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    const newValue = !sharingEnabled;
    try {
      await invoke('toggle_team_sharing', { enabled: newValue });
      setSharingEnabled(newValue);
    } catch (err) {
      console.error('Failed to toggle sharing:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Team Intelligence</h1>
          <p className="text-secondary mt-1">Anonymized team focus analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-secondary">Share anonymized data</span>
          <button
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              sharingEnabled ? 'bg-accent-purple' : 'bg-bg-tertiary'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                sharingEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="chart-container mb-6">
        <div className="flex items-start gap-4">
          <Shield className="w-8 h-8 text-accent-green flex-shrink-0" />
          <div>
            <h3 className="card-title">Privacy-First Architecture</h3>
            <p className="text-secondary text-sm mt-2">
              Your detailed activity data stays on your device. When enabled, only anonymized metrics 
              (focus scores, category breakdowns) sync to your team dashboard. No app names, URLs, or 
              window titles ever leave your device.
            </p>
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm">
                <EyeOff className="w-4 h-4 text-accent-red" />
                <span className="text-secondary">Never synced: App names, URLs</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Eye className="w-4 h-4 text-accent-green" />
                <span className="text-secondary">Synced: Focus scores, categories</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {sharingEnabled ? (
        <>
          {/* Team Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="chart-container">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-accent-purple" />
                <span className="text-sm text-secondary uppercase tracking-wider">Team Size</span>
              </div>
              <div className="text-3xl font-bold">
                {summary?.member_count ?? '-'}
              </div>
            </div>
            <div className="chart-container">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-accent-green" />
                <span className="text-sm text-secondary uppercase tracking-wider">Avg Focus</span>
              </div>
              <div className="text-3xl font-bold">
                {summary?.avg_focus_score ?? '-'}
              </div>
            </div>
            <div className="chart-container">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-accent-amber" />
                <span className="text-sm text-secondary uppercase tracking-wider">Fragmentation</span>
              </div>
              <div className="text-3xl font-bold">
                {summary?.top_fragmentation_hours.length ?? '-'}h
              </div>
            </div>
          </div>

          {/* Placeholder for Team Dashboard */}
          <div className="chart-container text-center py-12">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-accent-purple opacity-50" />
            <h3 className="card-title mb-2">Team Dashboard</h3>
            <p className="text-secondary max-w-md mx-auto">
              Team analytics will appear here once your company admin configures the team sync endpoint. 
              You'll see anonymized team focus trends, meeting overload alerts, and productivity insights.
            </p>
            <div className="kpi-label">Avg Focus Score</div>
            <div className="kpi-value">{summary?.avg_focus_score ?? '-'}</div>
          </div>
        </>
      ) : (
        <div className="chart-container text-center py-12">
          <p className="text-secondary">
            No team data available. Enable team sharing to see aggregated insights.
          </p>
        </div>
      )}
    </motion.div>
  );
};
