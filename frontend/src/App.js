// frontend/src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';

// Layouts
import AdminLayout from './pages/AdminLayout';

// Public Pages (Client Flow)
import ClientRegistrationScreen from './pages/ClientRegistrationScreen';
import ServiceSelectionScreen from './pages/ServiceSelectionScreen';
import AppointmentBookingScreen from './pages/AppointmentBookingScreen';
import ClientProfile from './pages/ClientProfile';

// Admin Pages
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import ManageServices from './pages/ManageServices';
import ClientsAnalytics from './pages/ClientsAnalytics';
import BusinessSettings from './pages/BusinessSettings';

// Global Components
import Notification from './components/Notification';
import { useNotification } from './hooks/useNotification';

const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-amber-500/20 border-t-brand-amber-500 rounded-full animate-spin"></div>
    </div>
  );

  return currentUser ? children : <Navigate to="/" />;
};

const AdminRoute = ({ children }) => {
  const { currentUser, isAdmin, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-amber-500/20 border-t-brand-amber-500 rounded-full animate-spin"></div>
    </div>
  );
  
  return currentUser && isAdmin ? children : <Navigate to="/" />;
};


const AppRoutes = () => {
  const { notification, hideNotification } = useNotification();

  return (
    <div className="min-h-screen bg-zinc-950 font-inter selection:bg-brand-amber-500/30 selection:text-brand-amber-200">
      <Routes>
        {/* Public Client Flow */}
        <Route path="/" element={<ClientRegistrationScreen />} />

        {/* Protected Client Flow */}
        <Route path="/select-service" element={
          <PrivateRoute>
            <ServiceSelectionScreen />
          </PrivateRoute>
        } />
        <Route path="/book" element={
          <PrivateRoute>
            <AppointmentBookingScreen />
          </PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute>
            <ClientProfile />
          </PrivateRoute>
        } />

        {/* Admin Area */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }>

          <Route index element={<Dashboard />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="clients" element={<ClientsAnalytics />} />
          <Route path="services" element={<ManageServices />} />
          <Route path="config" element={<BusinessSettings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Notification */}
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

const App = () => (
  <AuthProvider>
    <BookingProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </BookingProvider>
  </AuthProvider>
);

export default App;
