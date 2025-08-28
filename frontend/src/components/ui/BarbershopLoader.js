/**
 * Componente LoadingSpinner especializado para la barbería
 */

import React, { memo } from 'react';
import { Scissors } from 'lucide-react';

/**
 * Loading spinner temático de barbería
 */
const BarbershopLoader = memo(({ 
  message = 'Cargando...', 
  fullScreen = false,
  showMessage = true
}) => {
  const containerClasses = fullScreen 
    ? 'fixed inset-0 bg-zinc-900/80 flex items-center justify-center z-50'
    : 'flex items-center justify-center';

  return (
    <div className={containerClasses}>
      <div className="text-center animate-fade-in">
        <div className="relative">
          {/* Logo principal con animación */}
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-slow hover-glow">
            <Scissors className="w-10 h-10 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          
          {/* Mensaje y marca */}
          {showMessage && (
            <div className="space-y-2">
              <h3 className="text-amber-400 font-bold text-lg tracking-wider">
                OLIMU BARBERSHOP
              </h3>
              <p className="text-zinc-400 text-sm">{message}</p>
              
              {/* Barra de progreso animada */}
              <div className="w-32 h-1 bg-zinc-700 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full animate-loading-bar"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

BarbershopLoader.displayName = 'BarbershopLoader';

export default BarbershopLoader;
