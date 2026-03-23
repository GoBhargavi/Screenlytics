import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

export interface AppUsage {
  app_name: string;
  category: string;
  total_minutes: number;
  percentage: number;
}

export interface DailySummary {
  date: string;
  total_active_minutes: number;
  total_idle_minutes: number;
  context_switches: number;
  deep_work_blocks: number;
  focus_score: number;
  top_apps: AppUsage[];
}

export interface HourlyData {
  hour: number;
  active_minutes: number;
  idle_minutes: number;
  context_switches: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface ActivityState {
  todaySummary: DailySummary | null;
  hourlyData: HourlyData[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTodaySummary: () => Promise<void>;
  fetchHourlyData: (date: string) => Promise<void>;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
}

export const useActivityStore = create<ActivityState>((set) => ({
  todaySummary: null,
  hourlyData: [],
  isLoading: false,
  error: null,

  fetchTodaySummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await invoke<ApiResponse<DailySummary>>('get_today_summary');
      if (response.success && response.data) {
        set({ todaySummary: response.data, isLoading: false });
      } else {
        set({ error: response.error || 'Failed to fetch summary', isLoading: false });
      }
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  fetchHourlyData: async (date: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await invoke<ApiResponse<HourlyData[]>>('get_hourly_data', { date });
      if (response.success && response.data) {
        set({ hourlyData: response.data, isLoading: false });
      } else {
        set({ error: response.error || 'Failed to fetch hourly data', isLoading: false });
      }
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  startTracking: async () => {
    try {
      await invoke('start_tracking');
    } catch (err) {
      console.error('Failed to start tracking:', err);
    }
  },

  stopTracking: async () => {
    try {
      await invoke('stop_tracking');
    } catch (err) {
      console.error('Failed to stop tracking:', err);
    }
  },
}));
