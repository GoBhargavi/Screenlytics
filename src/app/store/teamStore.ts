import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

export interface TeamSummary {
  team_name: string;
  member_count: number;
  avg_focus_score: number;
  top_fragmentation_hours: number[];
}

export interface TeamMember {
  id: string;
  display_name: string;
  focus_score: number;
  is_overloaded: boolean;
  last_sync: Date;
}

interface TeamState {
  summary: TeamSummary | null;
  members: TeamMember[];
  isTeamSharingEnabled: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTeamSummary: () => Promise<void>;
  toggleTeamSharing: (enabled: boolean) => Promise<void>;
}

export const useTeamStore = create<TeamState>((set) => ({
  summary: null,
  members: [],
  isTeamSharingEnabled: false,
  isLoading: false,
  error: null,

  fetchTeamSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await invoke<{ success: boolean; data?: TeamSummary; error?: string }>('get_team_summary');
      if (response.success && response.data) {
        set({ summary: response.data, isLoading: false });
      } else {
        set({ error: response.error || 'Failed to fetch team summary', isLoading: false });
      }
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  toggleTeamSharing: async (enabled: boolean) => {
    set({ isLoading: true, error: null });
    try {
      const response = await invoke<{ success: boolean; data?: boolean; error?: string }>('toggle_team_sharing', { enabled });
      if (response.success) {
        set({ isTeamSharingEnabled: enabled, isLoading: false });
      } else {
        set({ error: response.error || 'Failed to toggle team sharing', isLoading: false });
      }
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },
}));
