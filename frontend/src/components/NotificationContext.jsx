import React, { createContext, useContext } from 'react';
import { useNotifications } from '../utils/useNotifications';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const value = useNotifications();
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotificationContext must be inside NotificationProvider');
  return ctx;
};
