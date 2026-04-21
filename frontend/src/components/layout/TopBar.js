import React from 'react';
import { Menu } from 'lucide-react';
import Button from '../ui/Button';

const TopBar = ({ onMenuClick, title, subtitle }) => {
  return (
    <header className="bg-zinc-900/50 backdrop-blur-md border-b border-zinc-800 px-6 py-4 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {title}
            </h2>
            <p className="text-xs text-zinc-500 font-medium">
              {subtitle || 'Panel de administración'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Fecha Actual</span>
            <span className="text-sm text-zinc-300 font-medium">
              {new Date().toLocaleDateString('es-CO', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
