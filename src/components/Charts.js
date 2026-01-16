/**
 * Enhanced Charts Component
 * Premium chart visualizations using Recharts
 */

import React from 'react';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from 'recharts';

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div
                style={{
                    background: 'var(--bg-card)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    boxShadow: 'var(--shadow-lg)',
                }}
            >
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    {label}
                </p>
                <p style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: '600' }}>
                    {payload[0].value} {payload[0].name === 'total_minutes' ? 'minutes' : payload[0].name}
                </p>
            </div>
        );
    }
    return null;
};

// Area Chart for Daily Trends
export function DailyTrendChart({ data, height = 300 }) {
    if (!data || data.length === 0) {
        return (
            <div className="skeleton" style={{ height: `${height}px`, borderRadius: 'var(--radius-md)' }} />
        );
    }

    // Format dates for display
    const formattedData = data.map((d) => ({
        ...d,
        shortDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));

    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                    dataKey="shortDate"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dx={-10}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                    type="monotone"
                    dataKey="total_minutes"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorMinutes)"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

// Bar Chart for Hourly Distribution
export function HourlyDistributionChart({ data, height = 200 }) {
    if (!data || data.length === 0) {
        return (
            <div className="skeleton" style={{ height: `${height}px`, borderRadius: 'var(--radius-md)' }} />
        );
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                    dataKey="hour_label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    interval={2}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="minutes" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}

// Category Pie/Donut Chart
const CATEGORY_COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#6b7280'];

export function CategoryDonutChart({ data, height = 250 }) {
    if (!data || data.length === 0) {
        return (
            <div className="skeleton" style={{ height: `${height}px`, borderRadius: 'var(--radius-md)' }} />
        );
    }

    // Total calculated by the donut chart

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <ResponsiveContainer width="50%" height={height}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="minutes"
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.color || CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div style={{ flex: 1 }}>
                {data.map((item, index) => (
                    <div
                        key={item.category}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.5rem 0',
                            borderBottom:
                                index < data.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span
                                style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '2px',
                                    background: item.color || CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                                }}
                            />
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                {item.category}
                            </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.875rem' }}>
                                {item.minutes}m
                            </span>
                            <span
                                style={{
                                    color: 'var(--text-muted)',
                                    fontSize: '0.75rem',
                                    marginLeft: '0.5rem',
                                }}
                            >
                                ({item.percentage}%)
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Top Apps Bar Chart
export function TopAppsChart({ data, height = 250 }) {
    if (!data || data.length === 0) {
        return (
            <div className="skeleton" style={{ height: `${height}px`, borderRadius: 'var(--radius-md)' }} />
        );
    }

    const topApps = data.slice(0, 5);
    const maxMinutes = Math.max(...topApps.map((a) => a.minutes));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {topApps.map((app, index) => (
                <div key={app.app_name}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '0.375rem',
                        }}
                    >
                        <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: '500' }}>
                            {app.app_name}
                        </span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            {app.minutes} min
                        </span>
                    </div>
                    <div
                        style={{
                            height: '8px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '4px',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                height: '100%',
                                width: `${(app.minutes / maxMinutes) * 100}%`,
                                background: `linear-gradient(90deg, ${CATEGORY_COLORS[index]} 0%, ${CATEGORY_COLORS[index]}99 100%)`,
                                borderRadius: '4px',
                                transition: 'width 0.5s ease',
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
