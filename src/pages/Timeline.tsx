import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, Briefcase, ExternalLink } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
}

interface WorkItem {
  id: string;
  title: string;
  url: string;
  status: string;
  source: string;
}

export const Timeline: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [eventsRes, itemsRes] = await Promise.all([
        invoke<{ success: boolean; data?: CalendarEvent[] }>('get_calendar_events'),
        invoke<{ success: boolean; data?: WorkItem[] }>('get_work_items'),
      ]);

      if (eventsRes.success && eventsRes.data) {
        setEvents(eventsRes.data);
      }
      if (itemsRes.success && itemsRes.data) {
        setWorkItems(itemsRes.data);
      }
    } catch (err) {
      console.error('Failed to load timeline data:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Timeline</h1>
          <p className="text-secondary mt-1">Activity history with calendar integration</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary btn-sm">
            <Calendar className="w-4 h-4 mr-2" />
            Today
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Calendar Events */}
        <div className="col-span-2 space-y-4">
          <div className="chart-container">
            <h3 className="card-title mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Calendar Events
            </h3>
            {events.length > 0 ? (
              <div className="space-y-2">
                {events.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 p-2 hover:bg-bg-elevated rounded">
                    <div className="w-12 text-xs text-secondary text-right">
                      {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{event.title}</div>
                      <div className="text-xs text-secondary">
                        {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                        {new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {event.is_recurring && (
                      <span className="text-xs px-2 py-0.5 bg-bg-tertiary rounded">Recurring</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-secondary">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No calendar events configured</p>
                <p className="text-xs mt-1">Connect ICS feeds in Settings</p>
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="chart-container">
            <h3 className="card-title mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Activity Timeline
            </h3>
            <div className="text-center py-12 text-secondary">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Activity data will appear here</p>
            </div>
          </div>
        </div>

        {/* Work Items Sidebar */}
        <div className="space-y-4">
          <div className="chart-container">
            <h3 className="card-title mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Work Items
            </h3>
            {workItems.length > 0 ? (
              <div className="space-y-2">
                {workItems.map((item) => (
                  <div key={item.id} className="p-2 hover:bg-bg-elevated rounded">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-accent-purple">{item.id}</span>
                      <span className="text-xs text-secondary">{item.status}</span>
                    </div>
                    <div className="text-sm mt-1">{item.title}</div>
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-accent-blue flex items-center gap-1 mt-1 hover:underline"
                    >
                      View in {item.source}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-secondary">
                <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No work items connected</p>
                <p className="text-xs mt-1">Connect JIRA/Linear in Settings</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
