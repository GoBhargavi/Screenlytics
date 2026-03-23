import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { HourlyData } from '@app/store/activityStore';

interface HourlyHeatmapProps {
  data: HourlyData[];
}

export const HourlyHeatmap: React.FC<HourlyHeatmapProps> = ({ data }) => {
  const chartData = data.map((h) => ({
    hour: `${h.hour}:00`,
    active: h.active_minutes,
    idle: h.idle_minutes,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="hour"
          stroke="#64748b"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          interval={2}
        />
        <YAxis
          stroke="#64748b"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}m`}
        />
        <Tooltip
          contentStyle={{
            background: '#16161e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: '#f8fafc',
          }}
        />
        <Bar dataKey="active" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="idle" fill="#334155" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};
