// frontend/src/pages/AdminLayout.js
import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';
import ConfirmationModal from '../components/ConfirmationModal';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';

const AdminLayout = () => {
  const { currentUser, logout } = useAuth();
  const { notification, showSuccess, showError, hideNotification } = useNotification();
  const location = useLocation();
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Mapeo de títulos según la ruta
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/admin') return 'Dashboard';
    if (path.includes('appointments')) return 'Citas';
    if (path.includes('clients')) return 'Clientes';
    if (path.includes('services')) return 'Servicios';
    if (path.includes('config')) return 'Configuración';
    return 'Panel';
  };

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

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden font-inter">
      {/* Sidebar Component */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onLogout={() => setShowLogoutModal(true)}
        currentUser={currentUser}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-zinc-950 relative">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-brand-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

        <TopBar 
          onMenuClick={() => setSidebarOpen(true)} 
          title={getPageTitle()}
          subtitle="Olimu BarberShop Admin"
        />

        {/* Content Area */}
        <div className="flex-1 overflow-auto relative z-10">
          <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <ConfirmationModal
          title="Cerrar Sesión"
          message="¿Estás seguro de que quieres cerrar sesión? Perderás el acceso al panel hasta que vuelvas a ingresar."
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutModal(false)}
          confirmText="Cerrar Sesión"
          cancelText="Cancelar"
          type="warning"
        />
      )}

    </div>
  );
};

export default AdminLayout;
