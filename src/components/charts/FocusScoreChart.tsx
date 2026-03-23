import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DataPoint {
  day: string;
  score: number;
}

export const FocusScoreChart: React.FC = () => {
  // Mock data - will be replaced with real data from API
  const data: DataPoint[] = [
    { day: 'Mon', score: 72 },
    { day: 'Tue', score: 68 },
    { day: 'Wed', score: 85 },
    { day: 'Thu', score: 79 },
    { day: 'Fri', score: 91 },
    { day: 'Sat', score: 45 },
    { day: 'Sun', score: 52 },
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="day"
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          domain={[0, 100]}
        />
        <Tooltip
          contentStyle={{
            background: '#16161e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: '#f8fafc',
          }}
          itemStyle={{ color: '#8b5cf6' }}
        />
        <Area
          type="monotone"
          dataKey="score"
          stroke="#8b5cf6"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorScore)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
