import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  Shield, 
  Brain, 
  Users, 
  ArrowRight, 
  Clock,
  Sparkles,
  Target
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    id: 'welcome',
    title: 'Welcome to Screenlytics',
    description: 'The AI-powered focus intelligence platform that helps you and your team work smarter.',
    icon: Sparkles,
  },
  {
    id: 'privacy',
    title: 'Privacy First',
    description: 'Your detailed activity data never leaves your device. Only anonymized focus metrics sync to your team.',
    icon: Shield,
  },
  {
    id: 'tracking',
    title: 'Smart Tracking',
    description: 'We track window titles and app usage locally to calculate your focus score and deep work blocks.',
    icon: Clock,
  },
  {
    id: 'ai',
    title: 'AI Coach',
    description: 'Get personalized insights and recommendations from your local Ollama AI assistant.',
    icon: Brain,
  },
  {
    id: 'team',
    title: 'Team Intelligence',
    description: 'Optionally share anonymized focus trends with your team to identify meeting overload and improve productivity.',
    icon: Users,
  },
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsLoading(true);
      try {
        // Mark onboarding as complete
        await invoke('update_settings', {
          changes: { onboarding_completed: true }
        });
        onComplete();
      } catch (err) {
        console.error('Failed to save onboarding state:', err);
        onComplete();
      }
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = steps[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-bg-primary flex items-center justify-center z-50">
      <div className="w-full max-w-xl px-6">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-secondary mb-2">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <button 
              onClick={handleSkip}
              className="hover:text-primary transition-colors"
            >
              Skip tour
            </button>
          </div>
          <div className="h-1 bg-bg-tertiary rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-accent-purple to-accent-blue"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            {/* Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-accent-purple/20 to-accent-blue/20 flex items-center justify-center">
              <Icon className="w-10 h-10 text-accent-purple" />
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold mb-4">{step.title}</h2>

            {/* Description */}
            <p className="text-secondary text-lg mb-8 max-w-md mx-auto">
              {step.description}
            </p>

            {/* Feature highlights for specific steps */}
            {step.id === 'privacy' && (
              <div className="flex justify-center gap-6 mb-8">
                <div className="flex items-center gap-2 text-sm text-accent-green">
                  <CheckCircle className="w-4 h-4" />
                  <span>Local-only data</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-accent-green">
                  <CheckCircle className="w-4 h-4" />
                  <span>No cloud storage</span>
                </div>
              </div>
            )}

            {step.id === 'tracking' && (
              <div className="grid grid-cols-3 gap-4 mb-8 max-w-sm mx-auto">
                {['Window titles', 'App usage', 'Idle time'].map((item) => (
                  <div key={item} className="bg-bg-elevated rounded-lg p-3 text-xs text-secondary">
                    {item}
                  </div>
                ))}
              </div>
            )}

            {step.id === 'ai' && (
              <div className="flex justify-center gap-4 mb-8">
                <div className="bg-bg-elevated rounded-lg p-4 text-left max-w-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-accent-purple" />
                    <span className="text-sm font-medium">AI Insight</span>
                  </div>
                  <p className="text-xs text-secondary">
                    "You had 3 deep work sessions today. Your focus peaked between 9-11am."
                  </p>
                </div>
              </div>
            )}

            {step.id === 'team' && (
              <div className="flex justify-center gap-4 mb-8 text-sm">
                <div className="flex items-center gap-2 text-accent-red">
                  <Target className="w-4 h-4" />
                  <span>Never: App names, URLs</span>
                </div>
                <div className="flex items-center gap-2 text-accent-green">
                  <CheckCircle className="w-4 h-4" />
                  <span>Shared: Focus scores</span>
                </div>
              </div>
            )}

            {/* CTA Button */}
            <button
              onClick={handleNext}
              disabled={isLoading}
              className="btn btn-primary btn-lg inline-flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Setting up...
                </>
              ) : currentStep === steps.length - 1 ? (
                <>
                  Get Started
                  <CheckCircle className="w-5 h-5" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
