import React, { createContext, useContext, useState, ReactNode } from 'react';
import Notification, { NotificationType } from '../components/Notification';

interface NotificationContextProps {
  showNotification: (type: NotificationType, message: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const showNotification = (type: NotificationType, message: string, duration?: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, type, message, duration }]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          type={notification.type}
          message={notification.message}
          isVisible={true}
          onClose={() => removeNotification(notification.id)}
          duration={notification.duration}
        />
      ))}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextProps => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}; 