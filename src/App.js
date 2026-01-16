/**
 * Screen Time Pro - Enterprise Analytics Dashboard
 * Main Application Component
 */

import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import { KPIGrid } from './components/KPICard';
import { DailyTrendChart, HourlyDistributionChart, CategoryDonutChart, TopAppsChart } from './components/Charts';
import InsightsPanel from './components/InsightsPanel';
import AIChatPanel from './components/AIChatPanel';

const API_BASE = 'http://localhost:8000';

// Card wrapper component
function Card({ title, subtitle, children, style = {} }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        ...style,
      }}
    >
      {title && (
        <div style={{ marginBottom: '1.25rem' }}>
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: subtitle ? '0.25rem' : 0,
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

// Dashboard View
function DashboardView({ data, loading }) {
  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* KPI Cards */}
      <KPIGrid summary={data.summary} />

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <Card title="Daily Usage Trend" subtitle="Last 30 days">
          <DailyTrendChart data={data.daily} height={280} />
        </Card>

        <Card title="Category Breakdown" subtitle="Today's usage">
          <CategoryDonutChart data={data.categories} height={220} />
        </Card>
      </div>

      {/* Second Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <Card title="Hourly Distribution" subtitle="Usage by hour">
          <HourlyDistributionChart data={data.hourly} height={180} />
        </Card>

        <Card title="Top Apps" subtitle="Most used applications">
          <TopAppsChart data={data.apps} />
        </Card>
      </div>
    </div>
  );
}

// Analytics View (More detailed charts)
function AnalyticsView({ data }) {
  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Card title="Usage Trends" subtitle="Detailed daily breakdown">
        <DailyTrendChart data={data.daily} height={350} />
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <Card title="Category Distribution" subtitle="Time spent by category">
          <CategoryDonutChart data={data.categories} height={280} />
        </Card>

        <Card title="Top Applications" subtitle="Your most used apps">
          <TopAppsChart data={data.apps} height={280} />
        </Card>
      </div>

      <Card title="Hourly Activity" subtitle="When you use your device">
        <HourlyDistributionChart data={data.hourly} height={220} />
      </Card>
    </div>
  );
}

// Insights View
function InsightsView({ insights, loading, onRefresh }) {
  return (
    <div className="animate-fadeIn">
      <div style={{ maxWidth: '600px' }}>
        <InsightsPanel insights={insights} loading={loading} onRefresh={onRefresh} />
      </div>
    </div>
  );
}

// Chat View
function ChatView() {
  return (
    <div className="animate-fadeIn" style={{ maxWidth: '700px' }}>
      <AIChatPanel />
    </div>
  );
}

// Main App Component
export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [data, setData] = useState({
    daily: [],
    apps: [],
    hourly: [],
    categories: [],
    summary: null,
  });
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Fetch dashboard data
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/dashboard`);
      if (response.ok) {
        const result = await response.json();
        setData({
          daily: result.daily || [],
          apps: result.apps || [],
          hourly: result.hourly || [],
          categories: result.categories || [],
          summary: result.summary || null,
        });
        setInsights(result.insights || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Continue with empty data - UI will show skeletons
    } finally {
      setLoading(false);
    }
  };

  // Refresh insights
  const refreshInsights = async () => {
    setInsightsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/insights`);
      if (response.ok) {
        const result = await response.json();
        setInsights(result.insights || []);
      }
    } catch (error) {
      console.error('Failed to refresh insights:', error);
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Render the appropriate view
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView data={data} loading={loading} />;
      case 'analytics':
        return <AnalyticsView data={data} />;
      case 'insights':
        return <InsightsView insights={insights} loading={insightsLoading} onRefresh={refreshInsights} />;
      case 'chat':
        return <ChatView />;
      default:
        return <DashboardView data={data} loading={loading} />;
    }
  };

  // View titles
  const viewTitles = {
    dashboard: { title: 'Dashboard', subtitle: 'Overview of your screen time analytics' },
    analytics: { title: 'Analytics', subtitle: 'Detailed usage statistics and trends' },
    insights: { title: 'AI Insights', subtitle: 'Personalized recommendations powered by AI' },
    chat: { title: 'Ask AI', subtitle: 'Get answers about your screen time habits' },
  };

  const currentView = viewTitles[activeView];

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
      }}
    >
      {/* Sidebar */}
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <header
          style={{
            padding: '1.5rem 2rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            background: 'var(--bg-secondary)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1
                style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  marginBottom: '0.25rem',
                }}
              >
                {currentView.title}
              </h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {currentView.subtitle}
              </p>
            </div>

            {/* Status indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-2xl)',
                fontSize: '0.8125rem',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: loading ? 'var(--accent-warning)' : 'var(--accent-success)',
                }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>
                {loading ? 'Loading...' : 'Connected'}
              </span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div
          className="grid-pattern"
          style={{
            flex: 1,
            padding: '2rem',
            overflowY: 'auto',
            background: 'var(--gradient-mesh)',
          }}
        >
          {renderView()}
        </div>
      </main>
    </div>
  );
}
