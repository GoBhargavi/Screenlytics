import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Bell, Shield, Save, Loader2 } from 'lucide-react';
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    invoke<{ success: boolean; data?: AppSettings }>('get_settings')
      .then((res) => {
        if (res.success && res.data) {
          setSettings(res.data);
        }
      })
      .catch(console.error);
  }, []);

  const updateField = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    if (settings) {
      setSettings({ ...settings, [key]: value });
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await invoke<{ success: boolean; error?: string }>('update_settings', {
        request: settings,
      });
      if (res.success) {
        setSaveMessage('Settings saved successfully');
      } else {
        setSaveMessage(res.error || 'Failed to save settings');
      }
    } catch (err) {
      setSaveMessage('Failed to save settings');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-accent-purple' : 'bg-bg-tertiary'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-accent-purple" />
      </div>
    );
  }

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
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className="text-sm text-accent-green animate-fadeIn">{saveMessage}</span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary inline-flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Tracking Section */}
        <div className="chart-container">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-accent-blue" />
            <h3 className="card-title">Tracking</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-primary text-sm font-medium">Enable tracking</span>
                <p className="text-xs text-secondary mt-0.5">Track active windows and app usage</p>
              </div>
              <Toggle
                checked={settings.tracking_enabled}
                onChange={(v) => updateField('tracking_enabled', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-primary text-sm font-medium">Idle threshold</span>
                <p className="text-xs text-secondary mt-0.5">Seconds of inactivity before marking idle</p>
              </div>
              <select
                value={settings.idle_threshold_seconds}
                onChange={(e) => updateField('idle_threshold_seconds', Number(e.target.value))}
                className="bg-bg-elevated border border-white/10 rounded-lg px-3 py-1.5 text-sm text-primary"
              >
                <option value={60}>60s</option>
                <option value={120}>120s</option>
                <option value={300}>300s (default)</option>
                <option value={600}>600s</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-primary text-sm font-medium">Sampling interval</span>
                <p className="text-xs text-secondary mt-0.5">How often to check active window</p>
              </div>
              <select
                value={settings.sampling_interval_seconds}
                onChange={(e) => updateField('sampling_interval_seconds', Number(e.target.value))}
                className="bg-bg-elevated border border-white/10 rounded-lg px-3 py-1.5 text-sm text-primary"
              >
                <option value={3}>3s</option>
                <option value={5}>5s (default)</option>
                <option value={10}>10s</option>
                <option value={30}>30s</option>
              </select>
            </div>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="chart-container">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-accent-green" />
            <h3 className="card-title">Privacy</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-primary text-sm font-medium">Data retention</span>
                <p className="text-xs text-secondary mt-0.5">How long to keep activity data</p>
              </div>
              <select
                value={settings.data_retention_days}
                onChange={(e) => updateField('data_retention_days', Number(e.target.value))}
                className="bg-bg-elevated border border-white/10 rounded-lg px-3 py-1.5 text-sm text-primary"
              >
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days (default)</option>
                <option value={180}>180 days</option>
                <option value={365}>1 year</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-primary text-sm font-medium">Team sharing</span>
                <p className="text-xs text-secondary mt-0.5">Share anonymized metrics with your team</p>
              </div>
              <Toggle
                checked={settings.team_sharing_enabled}
                onChange={(v) => updateField('team_sharing_enabled', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-primary text-sm font-medium">Anonymize team data</span>
                <p className="text-xs text-secondary mt-0.5">Strip identifiable info before sharing</p>
              </div>
              <Toggle
                checked={settings.anonymize_team_data}
                onChange={(v) => updateField('anonymize_team_data', v)}
              />
            </div>
          </div>
        </div>

        {/* AI Integration Section */}
        <div className="chart-container">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-accent-amber" />
            <h3 className="card-title">AI Integration</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-primary text-sm font-medium">Enable Ollama</span>
                <p className="text-xs text-secondary mt-0.5">Use local AI for insights and coaching</p>
              </div>
              <Toggle
                checked={settings.ollama_enabled}
                onChange={(v) => updateField('ollama_enabled', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-primary text-sm font-medium">Model</span>
                <p className="text-xs text-secondary mt-0.5">Ollama model to use</p>
              </div>
              <input
                type="text"
                value={settings.ollama_model}
                onChange={(e) => updateField('ollama_model', e.target.value)}
                className="bg-bg-elevated border border-white/10 rounded-lg px-3 py-1.5 text-sm text-primary w-40"
                placeholder="llama3.2"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-primary text-sm font-medium">Endpoint</span>
                <p className="text-xs text-secondary mt-0.5">Ollama server URL</p>
              </div>
              <input
                type="text"
                value={settings.ollama_endpoint}
                onChange={(e) => updateField('ollama_endpoint', e.target.value)}
                className="bg-bg-elevated border border-white/10 rounded-lg px-3 py-1.5 text-sm text-primary w-56"
                placeholder="http://localhost:11434"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
