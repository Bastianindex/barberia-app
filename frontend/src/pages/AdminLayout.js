// frontend/src/pages/AdminLayout.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';
import ConfirmationModal from '../components/ConfirmationModal';
import Notification from '../components/Notification';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { 
  Scissors, 
  LayoutDashboard, 
  CalendarDays, 
  LogOut, 
  Users,
  Settings,
  BarChart3,
  Menu,
  X,
  User
} from 'lucide-react';

// Importar páginas de administración
import Dashboard from './Dashboard';
import Appointments from './Appointments';
import ManageServices from './ManageServices';
import ClientsAnalytics from './ClientsAnalytics';

const AdminLayout = () => {
  const { currentUser, logout } = useAuth();
  const { notification, showSuccess, showError, hideNotification } = useNotification();
  
  const [activeContent, setActiveContent] = useState('dashboard');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Elementos de navegación
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      component: Dashboard
    },
    {
      id: 'appointments',
      label: 'Citas',
      icon: CalendarDays,
      component: Appointments
    },
    {
      id: 'clients',
      label: 'Clientes',
      icon: Users,
      component: ClientsAnalytics
    },
    {
      id: 'services',
      label: 'Servicios',
      icon: Scissors,
      component: ManageServices
    }
  ];

  // Manejar cierre de sesión
  const handleLogout = async () => {
    setShowLogoutModal(false);
    
    try {
      await logout();
      showSuccess('Sesión cerrada exitosamente');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      showError('Error al cerrar sesión');
    }
  };

  // Renderizar contenido activo
  const renderActiveContent = () => {
    const activeItem = navigationItems.find(item => item.id === activeContent);
    if (activeItem && activeItem.component) {
      const Component = activeItem.component;
      return <Component />;
    }
    return <Dashboard />;
  };

  return (
    <div className="flex h-screen bg-zinc-900 text-white overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50 
        w-72 bg-zinc-800/95 backdrop-blur-sm border-r border-zinc-700 
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-zinc-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mr-3">
                  <Scissors className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">OLIMU</h1>
                  <p className="text-xs text-zinc-400">BarberShop Admin</p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-zinc-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-zinc-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {currentUser?.email || 'Administrador'}
                </p>
                <p className="text-xs text-zinc-400">Administrador</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-6">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeContent === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveContent(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg 
                      transition-all duration-200 text-left
                      ${isActive 
                        ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/30 text-amber-400' 
                        : 'text-zinc-300 hover:bg-zinc-700/50 hover:text-white'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-amber-400' : 'text-zinc-400'}`} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-6 border-t border-zinc-700">
            <Button
              onClick={() => setShowLogoutModal(true)}
              variant="secondary"
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-zinc-800/80 backdrop-blur-sm border-b border-zinc-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {navigationItems.find(item => item.id === activeContent)?.label || 'Dashboard'}
                </h2>
                <p className="text-sm text-zinc-400">
                  Panel de administración
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:block text-sm text-zinc-400">
                {new Date().toLocaleDateString('es-CO', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {renderActiveContent()}
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <ConfirmationModal
          title="Cerrar Sesión"
          message="¿Estás seguro de que quieres cerrar sesión?"
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutModal(false)}
          confirmText="Cerrar Sesión"
          cancelText="Cancelar"
          type="warning"
        />
      )}

      {/* Notifications */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}
    </div>
  );
};

export default AdminLayout;
