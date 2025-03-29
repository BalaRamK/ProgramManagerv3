import React from 'react';
import { AlertTriangle, Clock, Bell } from 'lucide-react';
import { format, isAfter, isBefore, addDays } from 'date-fns';

interface Notification {
  type: 'approaching' | 'overdue' | 'info';
  message: string;
}

interface NotificationBarProps {
  milestones: Array<{
    id: string;
    title: string;
    due_date: string;
    status: string;
  }>;
}

export function NotificationBar({ milestones }: NotificationBarProps) {
  const notifications: Notification[] = React.useMemo(() => {
    const today = new Date();
    const notifs: Notification[] = [];

    milestones.forEach(milestone => {
      const dueDate = new Date(milestone.due_date);
      
      // Check for approaching milestones (within next 7 days)
      if (
        isBefore(today, dueDate) &&
        isAfter(dueDate, today) &&
        isBefore(dueDate, addDays(today, 7)) &&
        milestone.status !== 'completed'
      ) {
        notifs.push({
          type: 'approaching',
          message: `${milestone.title} is due on ${format(dueDate, 'MMM d, yyyy')}`
        });
      }

      // Check for overdue milestones
      if (isBefore(dueDate, today) && milestone.status !== 'completed') {
        notifs.push({
          type: 'overdue',
          message: `${milestone.title} is overdue (due: ${format(dueDate, 'MMM d, yyyy')})`
        });
      }
    });

    return notifs;
  }, [milestones]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Bell className="h-5 w-5 text-violet-600" />
        <h2 className="text-lg font-semibold">Notifications</h2>
      </div>
      <div className="space-y-2">
        {notifications.map((notification, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 p-2 rounded-md ${
              notification.type === 'overdue'
                ? 'bg-red-50 text-red-700'
                : notification.type === 'approaching'
                ? 'bg-yellow-50 text-yellow-700'
                : 'bg-blue-50 text-blue-700'
            }`}
          >
            {notification.type === 'overdue' ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
            <span className="text-sm">{notification.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
} 