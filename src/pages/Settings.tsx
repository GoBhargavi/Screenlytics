import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Database, Bell, Shield } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

interface AppSettings {
  tracking_enabled: boolean;
  idle_threshold_seconds: number;
  sampling_interval_seconds: number;
  team_sharing_enabled: boolean;
  anonymize_team_data: boolean;
  data_retention_days: number;
  ollama_enabled: boolean;
  ollama_model: string;
  ollama_endpoint: string;
}

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    invoke<{ success: boolean; data?: AppSettings }>('get_settings')
      .then((res) => {
        if (res.success && res.data) {
          setSettings(res.data);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-secondary mt-1">Configure Screenlytics</p>
        </div>
        <SettingsIcon className="w-6 h-6 text-accent-purple" />
      </div>

      <div className="space-y-6 max-w-2xl">
        <div className="chart-container">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-accent-blue" />
            <h3 className="card-title">Tracking</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-secondary">Enable tracking</span>
              <span className="text-primary">{settings?.tracking_enabled ? 'On' : 'Off'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-secondary">Idle threshold</span>
              <span className="text-primary">{settings?.idle_threshold_seconds}s</span>
            </div>
          </div>
        </div>

        <div className="chart-container">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-accent-green" />
            <h3 className="card-title">Privacy</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-secondary">Data retention</span>
              <span className="text-primary">{settings?.data_retention_days} days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-secondary">Anonymize team data</span>
              <span className="text-primary">{settings?.anonymize_team_data ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        <div className="chart-container">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-accent-amber" />
            <h3 className="card-title">AI Integration</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-secondary">Ollama enabled</span>
              <span className="text-primary">{settings?.ollama_enabled ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-secondary">Model</span>
              <span className="text-primary">{settings?.ollama_model}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
