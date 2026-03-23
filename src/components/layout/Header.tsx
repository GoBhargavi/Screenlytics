import React from 'react';
import { Bell, User } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-title">
        <span className="text-gradient">Screenlytics</span>
        <span className="text-secondary ml-2 text-sm">Enterprise</span>
      </div>
      <div className="header-actions">
        <button className="btn btn-ghost btn-sm" title="Notifications">
          <Bell className="w-4 h-4" />
        </button>
        <button className="btn btn-ghost btn-sm" title="Profile">
          <User className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
