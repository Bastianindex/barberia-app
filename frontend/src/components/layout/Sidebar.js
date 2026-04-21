import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Scissors, 
  LayoutDashboard, 
  CalendarDays, 
  LogOut, 
  Users,
  Settings,
  X,
  User
} from 'lucide-react';
import Button from '../ui/Button';

const Sidebar = ({ isOpen, onClose, onLogout, currentUser }) => {
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin'
    },
    {
      id: 'appointments',
      label: 'Citas',
      icon: CalendarDays,
      path: '/admin/appointments'
    },
    {
      id: 'clients',
      label: 'Clientes',
      icon: Users,
      path: '/admin/clients'
    },
    {
      id: 'services',
      label: 'Servicios',
      icon: Scissors,
      path: '/admin/services'
    },
    {
      id: 'config',
      label: 'Configuración',
      icon: Settings,
      path: '/admin/config'
    }
  ];

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50 
        w-72 bg-zinc-900 border-r border-zinc-800 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-amber-400 to-brand-amber-600 rounded-xl flex items-center justify-center shadow-glow">
                  <Scissors className="w-5 h-5 text-zinc-950" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tighter">OLIMU</h1>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">BarberShop Admin</p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="lg:hidden p-2 text-zinc-400 hover:text-white"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* User Info */}
          <div className="px-6 py-6 border-b border-zinc-800">
            <div className="flex items-center gap-3 p-3 bg-zinc-850 rounded-2xl border border-zinc-800">
              <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700">
                <User className="w-5 h-5 text-zinc-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {currentUser?.email?.split('@')[0] || 'Administrador'}
                </p>
                <p className="text-[10px] uppercase text-brand-amber-500/80 font-bold tracking-wider">Admin Level</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  end={item.path === '/admin'}
                  onClick={onClose}
                  className={({ isActive }) => `
                    nav-btn ${isActive ? 'active' : ''}
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-6 border-t border-zinc-800">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium
                         transition-all duration-200 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
