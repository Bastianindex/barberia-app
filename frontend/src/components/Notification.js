// frontend/src/components/Notification.js
import React from 'react';
import Notification from './ui/Notification';

// Wrapper para mantener compatibilidad con componente existente
const NotificationWrapper = ({ message, type, onClose, duration = 3000 }) => {
  return (
    <Notification
      message={message}
      type={type}
      onClose={onClose}
      duration={duration}
    />
  );
};

export default NotificationWrapper;
