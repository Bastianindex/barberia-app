// frontend/src/components/LoadingSpinner.js
import React from 'react';
import { Loader2 } from 'lucide-react';
import BarbershopLoader from './ui/BarbershopLoader';

const LoadingSpinner = ({ 
  size = 'md', 
  message = 'Cargando...', 
  fullScreen = false,
  showMessage = true,
  type = 'default' 
}) => {
  // Si se solicita el loader temático de barbería
  if (type === 'barbershop') {
    return (
      <BarbershopLoader 
        message={message} 
        fullScreen={fullScreen}
        showMessage={showMessage}
      />
    );
  }

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const containerClasses = fullScreen 
    ? 'fixed inset-0 bg-zinc-900/80 flex items-center justify-center z-50'
    : 'flex items-center justify-center';

  if (type === 'dots') {
    return (
      <div className={containerClasses}>
        <div className="text-center">
          <div className="flex space-x-2 justify-center items-center mb-4">
            <div className="w-3 h-3 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-3 h-3 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          {showMessage && (
            <p className="text-zinc-400 text-sm animate-fade-in">{message}</p>
          )}
        </div>
      </div>
    );
  }

  if (type === 'pulse') {
    return (
      <div className={containerClasses}>
        <div className="text-center">
          <div className="relative">
            <div className={`${sizeClasses[size]} border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto`}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
            </div>
          </div>
          {showMessage && (
            <p className="mt-2 text-zinc-400 text-sm animate-fade-in">{message}</p>
          )}
        </div>
      </div>
    );
  }

  // Spinner por defecto
  return (
    <div className={containerClasses}>
      <div className="text-center animate-fade-in">
        <Loader2 className={`${sizeClasses[size]} text-amber-400 animate-spin mx-auto`} />
        {showMessage && (
          <p className="mt-2 text-zinc-400 text-sm animate-fade-in">{message}</p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
