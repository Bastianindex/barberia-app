// frontend/src/components/LoadingSpinner.js
import React from 'react';
import { Scissors } from 'lucide-react';

const LoadingSpinner = ({ 
  size = 'md', 
  message = 'Cargando...', 
  fullScreen = false,
  showMessage = true,
  type = 'default' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const containerClasses = fullScreen 
    ? 'fixed inset-0 bg-zinc-900/80 flex items-center justify-center z-50'
    : 'flex items-center justify-center';

  if (type === 'barbershop') {
    return (
      <div className={containerClasses}>
        <div className="text-center animate-fade-in">
          <div className="relative">
            {/* Logo principal con animación */}
            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-slow hover-glow">
              <Scissors className="w-10 h-10 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            
            {/* Anillos de carga */}
            <div className="absolute inset-0 w-20 h-20 mx-auto">
              <div className="w-full h-full border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
            </div>
            <div className="absolute inset-1 w-18 h-18 mx-auto">
              <div className="w-full h-full border-2 border-amber-300/20 border-b-amber-300 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
            </div>
          </div>
          
          {showMessage && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-white mb-1 text-shimmer">
                Olimu BarberShop
              </h3>
              <p className="text-zinc-400 animate-fade-in stagger-delay-1">
                {message}
              </p>
              
              {/* Indicador de progreso animado */}
              <div className="mt-3 w-48 h-1 bg-zinc-700 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full animate-pulse shimmer"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

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
        <div className={`${sizeClasses[size]} border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto`}></div>
        {showMessage && (
          <p className="mt-2 text-zinc-400 text-sm animate-fade-in stagger-delay-1">{message}</p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
