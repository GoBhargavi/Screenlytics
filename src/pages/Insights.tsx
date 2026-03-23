import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send } from 'lucide-react';
import { useAIStore } from '@app/store/aiStore';

export const Insights: React.FC = () => {
  const { insights, fetchInsights, chatHistory, sendChatMessage, isChatLoading } = useAIStore();
  const [input, setInput] = useState('');

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isChatLoading) {
      sendChatMessage(input.trim());
      setInput('');
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
          <h1 className="text-2xl font-bold">AI Insights</h1>
          <p className="text-secondary mt-1">Personalized focus intelligence</p>
        </div>
        <Sparkles className="w-6 h-6 text-accent-purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-container">
          <h3 className="card-title mb-4">Daily Briefing</h3>
          {insights ? (
            <div className="space-y-4">
              <p className="text-secondary">{insights.summary}</p>
              <div>
                <h4 className="text-sm font-medium mb-2">Strengths</h4>
                <ul className="list-disc list-inside text-secondary text-sm">
                  {insights.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Areas for Improvement</h4>
                <ul className="list-disc list-inside text-secondary text-sm">
                  {insights.improvements.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-secondary">Loading insights...</p>
          )}
        </div>

        <div className="chart-container">
          <h3 className="card-title mb-4">Ask AI Coach</h3>
          <div className="h-[300px] overflow-y-auto space-y-4 mb-4">
            {chatHistory.length === 0 && (
              <p className="text-secondary text-center py-8">
                Start a conversation with your AI focus coach
              </p>
            )}
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-accent-purple/20 ml-8' : 'bg-bg-elevated mr-8'}`}
              >
                <p className="text-sm">{msg.content}</p>
              </div>
            ))}
            {isChatLoading && (
              <div className="typing-indicator bg-bg-elevated mr-8 w-fit">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your focus patterns..."
              className="flex-1"
              disabled={isChatLoading}
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isChatLoading || !input.trim()}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};
