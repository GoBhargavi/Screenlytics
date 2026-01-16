/**
 * Premium KPI Cards Component
 * Enterprise-grade stat cards with gradients, icons, and trend indicators
 */

import React from 'react';

const TrendUp = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M23 6l-9.5 9.5-5-5L1 18" />
        <path d="M17 6h6v6" />
    </svg>
);

const TrendDown = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M23 18l-9.5-9.5-5 5L1 6" />
        <path d="M17 18h6v-6" />
    </svg>
);

const ClockIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
    </svg>
);

const CalendarIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const FireIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
);

const TargetIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
    </svg>
);

const iconMap = {
    clock: ClockIcon,
    calendar: CalendarIcon,
    fire: FireIcon,
    target: TargetIcon,
};

const gradientMap = {
    purple: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(99, 102, 241, 0.1))',
    cyan: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(14, 165, 233, 0.1))',
    emerald: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1))',
    amber: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.1))',
};

const accentMap = {
    purple: '#8b5cf6',
    cyan: '#06b6d4',
    emerald: '#10b981',
    amber: '#f59e0b',
};

export default function KPICard({
    title,
    value,
    unit = '',
    icon = 'clock',
    trend = null,
    trendValue = null,
    color = 'purple',
    delay = 0
}) {
    const Icon = iconMap[icon] || ClockIcon;
    const gradient = gradientMap[color] || gradientMap.purple;
    const accent = accentMap[color] || accentMap.purple;

    return (
        <div
            className="animate-fadeIn"
            style={{
                background: 'var(--bg-card)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                transition: 'all 200ms ease',
                cursor: 'default',
                animationDelay: `${delay}ms`,
                opacity: 0,
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)';
                e.currentTarget.style.borderColor = `${accent}33`;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 10px 30px -10px ${accent}40`;
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.background = 'var(--bg-card)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <p
                        style={{
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)',
                            marginBottom: '0.5rem',
                            fontWeight: '500',
                        }}
                    >
                        {title}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                        <span
                            style={{
                                fontSize: '2rem',
                                fontWeight: '700',
                                color: 'var(--text-primary)',
                                lineHeight: 1,
                            }}
                        >
                            {typeof value === 'number' ? value.toLocaleString() : value}
                        </span>
                        {unit && (
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                                {unit}
                            </span>
                        )}
                    </div>
                </div>

                {/* Icon */}
                <div
                    style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--radius-md)',
                        background: gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: accent,
                    }}
                >
                    <Icon />
                </div>
            </div>

            {/* Trend Indicator */}
            {trend && trendValue !== null && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        marginTop: '1rem',
                        paddingTop: '1rem',
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                >
                    <span
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            color: trend === 'up' ? 'var(--accent-danger)' : 'var(--accent-success)',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                        }}
                    >
                        {trend === 'up' ? <TrendUp /> : <TrendDown />}
                        {trendValue}%
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>vs last week</span>
                </div>
            )}
        </div>
    );
}

// Pre-configured KPI cards for the dashboard
export function KPIGrid({ summary }) {
    if (!summary) {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="skeleton"
                        style={{ height: '140px', borderRadius: 'var(--radius-lg)' }}
                    />
                ))}
            </div>
        );
    }

    // summary.total_hours already calculated by backend

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
            }}
        >
            <KPICard
                title="Total This Week"
                value={summary.total_hours}
                unit="hrs"
                icon="clock"
                color="purple"
                trend={summary.trend}
                trendValue={summary.trend_percentage}
                delay={0}
            />
            <KPICard
                title="Daily Average"
                value={summary.daily_average}
                unit="min"
                icon="calendar"
                color="cyan"
                delay={100}
            />
            <KPICard
                title="Peak Day"
                value={summary.peak_day?.total_minutes || 0}
                unit="min"
                icon="fire"
                color="amber"
                delay={200}
            />
            <KPICard
                title="Lowest Day"
                value={summary.lowest_day?.total_minutes || 0}
                unit="min"
                icon="target"
                color="emerald"
                delay={300}
            />
        </div>
    );
}
