/**
 * Componente LoadingSpinner optimizado
 */

import React, { memo } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Loading spinner reutilizable
 */
const LoadingSpinner = memo(({
  size = 'md',
  color = 'amber',
  fullScreen = false,
  message = '',
  className = ''
}) => {
  // Tamaños
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };
  
  // Colores
  const colors = {
    amber: 'text-amber-500',
    white: 'text-white',
    zinc: 'text-zinc-400',
    red: 'text-red-500',
    green: 'text-green-500'
  };
  
  const spinnerClasses = [
    'animate-spin',
    sizes[size],
    colors[color],
    className
  ].filter(Boolean).join(' ');
  
  const content = (
    <div className="flex flex-col items-center justify-center space-y-3">
      <Loader2 className={spinnerClasses} />
      {message && (
        <p className="text-zinc-400 text-sm">{message}</p>
      )}
    </div>
  );
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-zinc-800 rounded-lg p-6 shadow-xl">
          {content}
        </div>
      </div>
    );
  }
  
  return content;
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
