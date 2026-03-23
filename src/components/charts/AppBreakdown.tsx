import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { AppUsage } from '@app/store/activityStore';

interface AppBreakdownProps {
  apps: AppUsage[];
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export const AppBreakdown: React.FC<AppBreakdownProps> = ({ apps }) => {
  const data = apps.slice(0, 5).map((app, index) => ({
    name: app.app_name,
    value: app.total_minutes,
    color: COLORS[index % COLORS.length],
  }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-secondary">
        No data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={150}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={60}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#16161e',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#f8fafc',
            }}
            formatter={(value: number) => [`${value}m`, 'Time']}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="space-y-2">
        {apps.slice(0, 5).map((app, index) => (
          <div key={app.app_name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-primary truncate max-w-[120px]">{app.app_name}</span>
            </div>
            <div className="flex items-center gap-2 text-secondary">
              <span>{app.total_minutes}m</span>
              <span className="text-xs">({Math.round(app.percentage)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
