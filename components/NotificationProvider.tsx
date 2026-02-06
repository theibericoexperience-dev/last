"use client";
import { createContext, useContext, useState, ReactNode } from 'react';
import Notification from './Notification';

interface NotificationItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, duration?: number) => void;
  success: (title: string, message: string, duration?: number) => void;
  error: (title: string, message: string, duration?: number) => void;
  warning: (title: string, message: string, duration?: number) => void;
  info: (title: string, message: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, duration = 5000) => {
    const id = Date.now().toString();
    const notification: NotificationItem = { id, type, title, message, duration };
    setNotifications(prev => [...prev, notification]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const success = (title: string, message: string, duration?: number) => showNotification('success', title, message, duration);
  const error = (title: string, message: string, duration?: number) => showNotification('error', title, message, duration);
  const warning = (title: string, message: string, duration?: number) => showNotification('warning', title, message, duration);
  const info = (title: string, message: string, duration?: number) => showNotification('info', title, message, duration);

  return (
    <NotificationContext.Provider value={{ showNotification, success, error, warning, info }}>
      {children}
      <div className="fixed top-0 right-0 z-50 space-y-2 p-4">
        {notifications.map((notification, index) => (
          <div key={notification.id} style={{ top: `${16 + index * 80}px` }}>
            <Notification
              type={notification.type}
              title={notification.title}
              message={notification.message}
              onClose={() => removeNotification(notification.id)}
              duration={notification.duration}
            />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
