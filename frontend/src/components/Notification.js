// frontend/src/components/Notification.js
import React, { useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  X 
} from 'lucide-react';

const Notification = ({ 
  message, 
  type = 'info', 
  onClose, 
  duration = 3000 
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const styles = {
    success: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/50',
      text: 'text-green-400',
      icon: CheckCircle
    },
    error: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/50',
      text: 'text-red-400',
      icon: XCircle
    },
    warning: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/50',
      text: 'text-amber-400',
      icon: AlertCircle
    },
    info: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/50',
      text: 'text-blue-400',
      icon: Info
    }
  };

  const style = styles[type] || styles.info;
  const Icon = style.icon;

  if (!message) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] animate-slide-in">
      <div className={`
        flex items-center gap-4 px-6 py-4 rounded-xl border-2 backdrop-blur-md shadow-2xl
        ${style.bg} ${style.border} ${style.text}
        min-w-[320px] max-w-md
      `}>
        <div className="shrink-0">
          <Icon className="w-6 h-6" />
        </div>
        
        <div className="flex-1 font-medium text-sm">
          {message}
        </div>
        
        <button 
          onClick={onClose}
          className="shrink-0 hover:opacity-70 transition-opacity p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Notification;
