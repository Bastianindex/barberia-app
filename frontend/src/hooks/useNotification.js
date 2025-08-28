/**
 * Hook personalizado para notificaciones
 */

import { useState, useCallback, useEffect } from 'react';

/**
 * Hook para manejar notificaciones
 * @param {number} autoHideDelay - Tiempo en ms para ocultar automáticamente
 * @returns {Object} Estado y funciones de notificaciones
 */
export const useNotification = (autoHideDelay = 5000) => {
  const [notification, setNotification] = useState(null);

  // Mostrar notificación
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
  }, []);

  // Ocultar notificación
  const hideNotification = useCallback(() => {
    setNotification(null);
  }, []);

  // Métodos de conveniencia
  const showSuccess = useCallback((message) => {
    showNotification(message, 'success');
  }, [showNotification]);

  const showError = useCallback((message) => {
    showNotification(message, 'error');
  }, [showNotification]);

  const showWarning = useCallback((message) => {
    showNotification(message, 'warning');
  }, [showNotification]);

  const showInfo = useCallback((message) => {
    showNotification(message, 'info');
  }, [showNotification]);

  // Auto-hide
  useEffect(() => {
    if (notification && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        hideNotification();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [notification, autoHideDelay, hideNotification]);

  return {
    notification,
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};
