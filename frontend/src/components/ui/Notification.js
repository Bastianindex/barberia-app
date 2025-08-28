/**
 * Componente Notification optimizado
 */

import React, { memo, useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

/**
 * Componente de notificación reutilizable
 */
const Notification = memo(({
  message,
  type = 'info',
  onClose,
  autoHide = true,
  duration = 5000,
  position = 'top-right'
}) => {
  // Configuración por tipo
  const typeConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-600',
      textColor: 'text-white',
      borderColor: 'border-green-500'
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-600',
      textColor: 'text-white',
      borderColor: 'border-red-500'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-600',
      textColor: 'text-white',
      borderColor: 'border-yellow-500'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-600',
      textColor: 'text-white',
      borderColor: 'border-blue-500'
    }
  };
  
  // Posiciones
  const positions = {
    'top-right': 'fixed top-4 right-4',
    'top-left': 'fixed top-4 left-4',
    'top-center': 'fixed top-4 left-1/2 transform -translate-x-1/2',
    'bottom-right': 'fixed bottom-4 right-4',
    'bottom-left': 'fixed bottom-4 left-4',
    'bottom-center': 'fixed bottom-4 left-1/2 transform -translate-x-1/2'
  };
  
  const config = typeConfig[type];
  const IconComponent = config.icon;
  
  // Auto-hide
  useEffect(() => {
    if (autoHide && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [autoHide, duration, onClose]);
  
  return (
    <div className={`${positions[position]} z-50 animate-in slide-in-from-top-2 duration-300`}>
      <div className={`
        ${config.bgColor} 
        ${config.textColor} 
        border 
        ${config.borderColor}
        rounded-lg 
        shadow-lg 
        p-4 
        pr-12 
        max-w-sm 
        min-w-[320px]
        backdrop-blur-sm
      `}>
        <div className="flex items-start space-x-3">
          <IconComponent className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="text-sm font-medium leading-5">{message}</p>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
});

Notification.displayName = 'Notification';

export default Notification;
