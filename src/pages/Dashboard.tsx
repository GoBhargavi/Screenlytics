import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, Zap, Target } from 'lucide-react';
import { useActivityStore } from '@app/store/activityStore';
import { FocusScoreChart } from '@components/charts/FocusScoreChart';
import { HourlyHeatmap } from '@components/charts/HourlyHeatmap';
import { AppBreakdown } from '@components/charts/AppBreakdown';

export const Dashboard: React.FC = () => {
  const { todaySummary, hourlyData, fetchTodaySummary, fetchHourlyData, isLoading } = useActivityStore();

  useEffect(() => {
    fetchTodaySummary();
    const today = new Date().toISOString().split('T')[0];
    fetchHourlyData(today);

    // Refresh every minute
    const interval = setInterval(() => {
      fetchTodaySummary();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchTodaySummary, fetchHourlyData]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-secondary mt-1">Your daily focus intelligence</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-secondary">
          <Activity className="w-4 h-4" />
          <span>Live tracking active</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="kpi-card"
        >
          <div className="kpi-label">Today's Focus Time</div>
          <div className="kpi-value">
            {todaySummary ? formatDuration(todaySummary.total_active_minutes) : '--'}
          </div>
          <div className="kpi-change">
            <Clock className="w-3 h-3" />
            <span>Today's total</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="kpi-card"
        >
          <div className="kpi-label">Focus Score</div>
          <div className="kpi-value" style={{ color: todaySummary && todaySummary.focus_score >= 70 ? 'var(--accent-green)' : todaySummary && todaySummary.focus_score >= 50 ? 'var(--accent-warning)' : 'var(--accent-danger)' }}>
            {todaySummary ? todaySummary.focus_score : '--'}
          </div>
          <div className="kpi-change">
            <Target className="w-3 h-3" />
            <span>Out of 100</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="kpi-card"
        >
          <div className="kpi-label">Context Switches</div>
          <div className="kpi-value" style={{ color: todaySummary && todaySummary.context_switches > 50 ? 'var(--accent-warning)' : 'var(--text-primary)' }}>
            {todaySummary ? todaySummary.context_switches : '--'}
          </div>
          <div className="kpi-change">
            <Activity className="w-3 h-3" />
            <span>App switches today</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="kpi-card"
        >
          <div className="kpi-label">Deep Work Blocks</div>
          <div className="kpi-value">
            {todaySummary ? todaySummary.deep_work_blocks : '--'}
          </div>
          <div className="kpi-change positive">
            <Zap className="w-3 h-3" />
            <span>25+ min sessions</span>
          </div>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="chart-container">
            <div className="flex items-center justify-between mb-4">
              <h3 className="card-title">Hourly Activity</h3>
              <Clock className="w-4 h-4 text-secondary" />
            </div>
            <HourlyHeatmap data={hourlyData} />
          </div>
        </div>

        <div>
          <div className="chart-container">
            <div className="flex items-center justify-between mb-4">
              <h3 className="card-title">App Breakdown</h3>
              <Target className="w-4 h-4 text-secondary" />
            </div>
            <AppBreakdown apps={todaySummary?.top_apps || []} />
          </div>
        </div>
      </div>

      {/* Focus Score Chart */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="card-title">Focus Score Trend</h3>
          <Activity className="w-4 h-4 text-secondary" />
        </div>
        <FocusScoreChart />
      </div>
    </motion.div>
  );
};
