// frontend/src/pages/AdminLayout.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';
import { Scissors, LayoutDashboard, CalendarDays, Bell, LogOut, ListTodo, Users } from 'lucide-react'; // Añadido Users para Clientes
import ManageServices from './ManageServices'; // Importamos el nuevo componente ManageServices
import Dashboard from './Dashboard'; // Importamos el nuevo componente Dashboard
import Appointments from './Appointments'; // Importamos el nuevo componente Appointments
import ClientsAnalytics from './ClientsAnalytics'; // Importamos el nuevo componente ClientsAnalytics

const AdminLayout = () => {
  const { currentUser, logout } = useAuth();
  const [activeContent, setActiveContent] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const handleLogout = async () => {
    await logout();
  };

  const showAlert = (message) => {
    setModalMessage(message);
    setShowModal(true);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-zinc-900 text-white">
      {/* Sidebar */}
      <aside className="bg-zinc-800 text-white w-full lg:w-64 p-6 flex flex-col shadow-lg border-r border-zinc-700">
        <div className="flex items-center mb-10 border-b border-zinc-700 pb-4">
          <Scissors className="w-8 h-8 text-amber-400 mr-3" />
          <h1 className="text-3xl font-extrabold">BarberShop</h1>
        </div>
        <nav className="flex-1 space-y-4">
          <button
            onClick={() => setActiveContent('dashboard')}
            className={`nav-btn flex items-center ${activeContent === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
          </button>
          <button
            onClick={() => setActiveContent('appointments')}
            className={`nav-btn flex items-center ${activeContent === 'appointments' ? 'active' : ''}`}
          >
            <CalendarDays className="w-5 h-5 mr-3" /> Citas
          </button>
          <button
            onClick={() => setActiveContent('clients')}
            className={`nav-btn flex items-center ${activeContent === 'clients' ? 'active' : ''}`}
          >
            <Users className="w-5 h-5 mr-3" /> Clientes
          </button>
          {/* Nuevo botón para Servicios */}
          <button
            onClick={() => setActiveContent('services')}
            className={`nav-btn flex items-center ${activeContent === 'services' ? 'active' : ''}`}
          >
            <ListTodo className="w-5 h-5 mr-3" /> Servicios
          </button>
        </nav>
        <div className="mt-auto pt-6 border-t border-zinc-700">
          <p className="text-sm text-gray-400">ID de Sesión: <span className="font-mono text-gray-200 break-words">{currentUser?.uid || 'N/A'}</span></p>
          <div className="mt-4 space-y-2">
            <button className="btn btn-green w-full flex items-center justify-center" onClick={() => showAlert('La integración con WhatsApp requiere un servicio de backend.')}>
              <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="h-5 w-5 mr-2" />
              WhatsApp Automático
            </button>
            <button className="btn btn-blue w-full flex items-center justify-center" onClick={() => showAlert('Las notificaciones por correo electrónico requieren un servicio de backend.')}>
              <Bell className="w-5 h-5 mr-2" /> Notificaciones Email
            </button>
            <button onClick={handleLogout} className="btn btn-red w-full flex items-center justify-center">
              <LogOut className="w-5 h-5 mr-2" /> Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Contenido Principal del Admin */}
      <main className="flex-1 bg-zinc-900 p-8">
        {activeContent === 'dashboard' && (
          <Dashboard />
        )}
        {activeContent === 'appointments' && (
          <Appointments />
        )}
        {activeContent === 'clients' && (
          <ClientsAnalytics />
        )}
        {/* Nuevo contenido para Servicios */}
        {activeContent === 'services' && (
          <ManageServices /> // Renderizamos el nuevo componente aquí
        )}
      </main>

      {showModal && (
        <ConfirmationModal
          message={modalMessage}
          onConfirm={() => setShowModal(false)}
          onCancel={() => setShowModal(false)}
          confirmText="Entendido"
          showCancelButton={false}
        />
      )}
    </div>
  );
};

export default AdminLayout;
