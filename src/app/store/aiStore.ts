import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

export interface AIInsight {
  summary: string;
  strengths: string[];
  improvements: string[];
  recommendation: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface AIState {
  insights: AIInsight | null;
  chatHistory: ChatMessage[];
  isLoading: boolean;
  isChatLoading: boolean;
  error: string | null;

  // Actions
  fetchInsights: () => Promise<void>;
  sendChatMessage: (message: string) => Promise<void>;
  clearChat: () => void;
}

export const useAIStore = create<AIState>((set, get) => ({
  insights: null,
  chatHistory: [],
  isLoading: false,
  isChatLoading: false,
  error: null,

  fetchInsights: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await invoke<{ success: boolean; data?: AIInsight; error?: string }>('get_ai_insights');
      if (response.success && response.data) {
        set({ insights: response.data, isLoading: false });
      } else {
        set({ error: response.error || 'Failed to fetch insights', isLoading: false });
      }
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  sendChatMessage: async (message: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    set((state) => ({
      chatHistory: [...state.chatHistory, userMessage],
      isChatLoading: true,
    }));

    try {
      const response = await invoke<{ success: boolean; data?: string; error?: string }>('chat_with_ai', {
        request: { message, model: null },
      });

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: response.success && response.data ? response.data : 'Sorry, I could not process your request.',
        timestamp: new Date(),
      };

      set((state) => ({
        chatHistory: [...state.chatHistory, aiMessage],
        isChatLoading: false,
      }));
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: 'An error occurred while processing your message.',
        timestamp: new Date(),
      };

      set((state) => ({
        chatHistory: [...state.chatHistory, errorMessage],
        isChatLoading: false,
      }));
    }
  },

  clearChat: () => {
    set({ chatHistory: [] });
  },
}));
