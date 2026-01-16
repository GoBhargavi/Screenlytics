/**
 * AI Insights Panel Component
 * Displays AI-generated insights with refresh capability
 */

import React from 'react';

// Icons for insight types
const SuccessIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const WarningIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

const InfoIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
);

const TipIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);

const RefreshIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
);

const iconMap = {
    success: SuccessIcon,
    warning: WarningIcon,
    info: InfoIcon,
    tip: TipIcon,
};

const styleMap = {
    success: {
        background: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgba(16, 185, 129, 0.3)',
        iconColor: '#10b981',
    },
    warning: {
        background: 'rgba(245, 158, 11, 0.1)',
        borderColor: 'rgba(245, 158, 11, 0.3)',
        iconColor: '#f59e0b',
    },
    info: {
        background: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        iconColor: '#3b82f6',
    },
    tip: {
        background: 'rgba(139, 92, 246, 0.1)',
        borderColor: 'rgba(139, 92, 246, 0.3)',
        iconColor: '#8b5cf6',
    },
};

function InsightCard({ insight, index }) {
    const type = insight.type || 'info';
    const Icon = iconMap[type] || InfoIcon;
    const style = styleMap[type] || styleMap.info;

    return (
        <div
            className="animate-fadeIn"
            style={{
                display: 'flex',
                gap: '1rem',
                padding: '1rem',
                background: style.background,
                border: `1px solid ${style.borderColor}`,
                borderRadius: 'var(--radius-md)',
                animationDelay: `${index * 100}ms`,
                opacity: 0,
            }}
        >
            <div style={{ color: style.iconColor, flexShrink: 0, marginTop: '2px' }}>
                <Icon />
            </div>
            <div>
                <h4
                    style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        marginBottom: '0.25rem',
                    }}
                >
                    {insight.title}
                </h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {insight.message}
                </p>
            </div>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[...Array(4)].map((_, i) => (
                <div
                    key={i}
                    className="skeleton"
                    style={{ height: '80px', borderRadius: 'var(--radius-md)' }}
                />
            ))}
        </div>
    );
}

export default function InsightsPanel({ insights, loading, onRefresh }) {
    return (
        <div
            style={{
                background: 'var(--bg-card)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                height: '100%',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.25rem',
                }}
            >
                <div>
                    <h3
                        style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            marginBottom: '0.25rem',
                        }}
                    >
                        AI Insights
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Powered by Ollama
                    </p>
                </div>

                <button
                    onClick={onRefresh}
                    disabled={loading}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 150ms ease',
                        opacity: loading ? 0.5 : 1,
                    }}
                    onMouseOver={(e) => {
                        if (!loading) {
                            e.currentTarget.style.borderColor = 'var(--accent-primary)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                        }
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                >
                    <span
                        style={{
                            display: 'inline-block',
                            animation: loading ? 'spin 1s linear infinite' : 'none',
                        }}
                    >
                        <RefreshIcon />
                    </span>
                    Refresh
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <LoadingSkeleton />
            ) : insights && insights.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    {insights.map((insight, index) => (
                        <InsightCard key={index} insight={insight} index={index} />
                    ))}
                </div>
            ) : (
                <div
                    style={{
                        textAlign: 'center',
                        padding: '2rem',
                        color: 'var(--text-muted)',
                    }}
                >
                    <p>No insights available. Click refresh to generate.</p>
                </div>
            )}

            {/* Inline keyframes for spinning animation */}
            <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
