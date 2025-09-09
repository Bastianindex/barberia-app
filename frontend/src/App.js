// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext'; // Importa el proveedor y el hook de Auth
import LoginScreen from './pages/LoginScreen';
import AdminLayout from './pages/AdminLayout';
import ClientRegistrationScreen from './pages/ClientRegistrationScreen';
import ServiceSelectionScreen from './pages/ServiceSelectionScreen';
import AppointmentBookingScreen from './pages/AppointmentBookingScreen';
import Notification from './components/Notification';
import ConfirmationModal from './components/ConfirmationModal'; // Aunque no se usa directamente aquí, se importa si se necesitara a nivel global

// Componente Wrapper para manejar las rutas y el estado de la aplicación
const AppContent = () => {
  const { currentUser, loading } = useAuth(); // Obtiene el usuario actual y el estado de carga del contexto
  const [currentPage, setCurrentPage] = useState('clientRegistration'); // Empezar con el registro de cliente
  const [notification, setNotification] = useState(null); // Estado para notificaciones globales, si es necesario
  // eslint-disable-next-line no-unused-vars
  const [modalProps, setModalProps] = useState(null); // Estado para el modal de confirmación global
  
  // Estados para el flujo de cliente
  const [clientData, setClientData] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  // Efecto para manejar la página inicial
  useEffect(() => {
    if (!loading) {
      // Si hay usuario autenticado y estamos en flujo público, ir al panel administrativo
      if (currentUser && ['clientRegistration', 'serviceSelection', 'appointmentBooking'].includes(currentPage)) {
        setCurrentPage('adminPanel');
      } else if (!currentUser && ['adminPanel'].includes(currentPage)) {
        // Si no hay usuario y estamos en rutas privadas, ir al flujo público
        setCurrentPage('clientRegistration');
      }
    }
  }, [currentUser, loading, currentPage]);

  // Función global para mostrar alertas usando el ConfirmationModal (comentada por ahora)
  // const globalShowAlert = (message) => {
  //   setModalProps({
  //     message: message,
  //     onConfirm: () => setModalProps(null),
  //     confirmText: "Entendido",
  //     showCancelButton: false
  //   });
  // };

  // Puedes hacer esta función disponible globalmente si muchos componentes la necesitan.
  // window.showAlert = globalShowAlert; // Si quisieras usarlo como window.showAlert('mensaje');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-900 text-white space-y-6">
        <div className="text-center">
          <p className="text-xl mb-4">Cargando aplicación...</p>
          <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-6"></div>
        </div>
        
        {/* Botón de escape después de unos segundos */}
        <div className="text-center space-y-4">
          <p className="text-zinc-500 text-sm">
            Si esto tarda mucho, puede haber un problema de conexión
          </p>
          <button 
            onClick={() => {
              console.log('🔄 Forzando salida del loading...');
              window.location.reload();
            }}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors"
          >
            Recargar Página
          </button>
        </div>
      </div>
    );
  }

  let content;
  // Lógica de enrutamiento principal
  switch (currentPage) {
    // Flujo público de agendamiento (pantalla de inicio)
    case 'clientRegistration':
      content = (
        <ClientRegistrationScreen
          onGoBack={() => setCurrentPage('clientRegistration')} // Mantener en la misma pantalla
          onClientRegistered={(data) => {
            console.log('=== APP.JS - CLIENTE REGISTRADO ===');
            console.log('Datos recibidos en App.js:', data);
            setClientData(data);
            setCurrentPage('serviceSelection');
          }}
          onAdminAccess={() => setCurrentPage('login')} // Botón discreto para admin
        />
      );
      break;
    case 'serviceSelection':
      content = (
        <ServiceSelectionScreen
          clientData={clientData}
          onGoBack={() => setCurrentPage('clientRegistration')}
          onServiceSelected={(service) => {
            setSelectedService(service);
            setCurrentPage('appointmentBooking');
          }}
        />
      );
      break;
    case 'appointmentBooking':
      content = (
        <AppointmentBookingScreen
          clientData={clientData}
          selectedService={selectedService}
          onGoBack={() => setCurrentPage('serviceSelection')}
          onBookAppointment={(appointmentData) => {
            setNotification({ 
              message: '¡Cita agendada exitosamente! Recibirás confirmación por WhatsApp.', 
              type: 'success' 
            });
            // Reset del flujo
            setClientData(null);
            setSelectedService(null);
            setTimeout(() => setCurrentPage('clientRegistration'), 3000); // Volver al inicio
          }}
        />
      );
      break;
    // Rutas de administración (requieren autenticación)
    case 'login':
      content = (
        <LoginScreen
          onLoginSuccess={() => setCurrentPage('adminPanel')} // Ir directo al panel administrativo
          onGoBack={() => setCurrentPage('clientRegistration')} // Volver al flujo público
        />
      );
      break;
    case 'adminPanel':
      if (!currentUser) {
        setCurrentPage('login');
        break;
      }
      content = <AdminLayout />;
      break;
    default:
      // Por defecto, mostrar el flujo de agendamiento público
      content = (
        <ClientRegistrationScreen
          onGoBack={() => setCurrentPage('clientRegistration')}
          onClientRegistered={(data) => {
            setClientData(data);
            setCurrentPage('serviceSelection');
          }}
          onAdminAccess={() => setCurrentPage('login')}
        />
      );
      break;
  }

  return (
    <div className="min-h-screen bg-zinc-900 font-inter">
      {content}
      {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      {modalProps && <ConfirmationModal {...modalProps} />}
    </div>
  );
};

// Componente principal que envuelve toda la aplicación con el AuthProvider
const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
