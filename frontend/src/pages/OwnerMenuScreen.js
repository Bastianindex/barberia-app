// frontend/src/pages/OwnerMenuScreen.js
import React from 'react';
import { useAuth } from '../context/AuthContext'; // Importa el hook de autenticación
import { LogOut, CalendarDays, Briefcase } from 'lucide-react'; // Iconos de Lucide

const OwnerMenuScreen = ({ onGoToClientView, onGoToAdminPanel }) => {
  const { logout } = useAuth(); // Obtiene la función de logout del contexto

  const handleLogout = async () => {
    await logout(); // Cierra la sesión con Firebase
    // La lógica de App.js manejará la redirección a la pantalla de login
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-900 text-white p-6 text-center">
      <div className="mb-8">
        <span className="text-7xl">🧔</span>
        <h1 className="text-5xl font-extrabold mt-4">Bienvenido Dueño</h1>
        <p className="text-xl font-light text-gray-400 mt-2">¿Qué quieres hacer hoy?</p>
      </div>
      <div className="space-y-4 w-full max-w-sm">
        <button
          onClick={onGoToClientView}
          className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-3 px-8 rounded-xl shadow-lg text-lg transition duration-300 transform hover:scale-105 flex items-center justify-center"
        >
          <CalendarDays size={20} className="mr-2" /> Agendar una Cita (Vista de Cliente)
        </button>
        <button
          onClick={onGoToAdminPanel}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg text-lg transition duration-300 transform hover:scale-105 flex items-center justify-center"
        >
          <Briefcase size={20} className="mr-2" /> Acceder al Panel de Administración
        </button>
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg text-lg transition duration-300 transform hover:scale-105 flex items-center justify-center"
        >
          <LogOut size={20} className="mr-2 inline-block" /> Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default OwnerMenuScreen;
