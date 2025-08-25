// frontend/src/pages/LoginScreen.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Importa el hook de autenticación
import Notification from '../components/Notification'; // Importa el componente de notificación
import { LogIn, ChevronLeft } from 'lucide-react'; // Iconos de Lucide
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'; // Importamos Firebase Auth para el registro simulado

const LoginScreen = ({ onLoginSuccess, onShowSignUp, onGoBack }) => {
  const { login } = useAuth(); // Obtiene la función de login del contexto
  const [email, setEmail] = useState('owner@barber.com'); // Estado para el email
  const [password, setPassword] = useState('password'); // Estado para la contraseña
  const [notification, setNotification] = useState(null); // Estado para la notificación
  const [loading, setLoading] = useState(false); // Estado para manejar el loading del login

  const handleLogin = async (e) => {
    e.preventDefault();
    setNotification(null); // Limpia cualquier notificación previa
    setLoading(true); // Activa el estado de carga

    const result = await login(email, password); // Intenta iniciar sesión con Firebase Auth

    if (result.success) {
      setNotification({ message: 'Inicio de sesión exitoso.', type: 'success' });
      // Después de una pequeña pausa para que el usuario vea la notificación
      setTimeout(() => onLoginSuccess(), 1000);
    } else {
      setNotification({ message: result.error || 'Credenciales incorrectas.', type: 'error' });
    }
    setLoading(false); // Desactiva el estado de carga
  };

  const handleSignUpSimulation = async () => {
    // Esto es solo una SIMULACIÓN de registro para que puedas probar el login real.
    // EN UN PROYECTO REAL, tendrías una pantalla de registro completa y un backend.
    setNotification(null);
    setLoading(true);
    try {
      const authInstance = getAuth(); // Obtiene la instancia de auth
      await createUserWithEmailAndPassword(authInstance, 'owner@barber.com', 'password');
      setNotification({ message: 'Usuario de prueba "owner@barber.com" registrado. ¡Ahora puedes iniciar sesión!', type: 'success' });
      console.log("Usuario de prueba creado en Firebase Auth: owner@barber.com");
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setNotification({ message: 'El usuario de prueba "owner@barber.com" ya existe. Puedes iniciar sesión.', type: 'info' });
      } else {
        setNotification({ message: `Error al registrar usuario de prueba: ${error.message}`, type: 'error' });
      }
      console.error("Error al registrar usuario de prueba:", error);
    } finally {
      setLoading(false);
      // Simula el comportamiento de onShowSignUp, pero aquí lo usamos para registrar/informar
      if (onShowSignUp) onShowSignUp();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-900 text-white p-6">
      {/* Botón de regresar */}
      {onGoBack && (
        <div className="w-full max-w-md mb-4">
          <button
            onClick={onGoBack}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Regresar</span>
          </button>
        </div>
      )}

      <div className="w-full max-w-md bg-zinc-800 p-8 rounded-2xl shadow-xl border border-zinc-700 text-center">
        <div className="flex items-center justify-center mb-8">
          <span className="text-6xl mr-2">💈</span>
          <div>
            <h1 className="text-4xl font-extrabold">OLIMU</h1>
            <p className="text-sm text-zinc-400">Panel de Administración</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="E-Mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-zinc-700 bg-zinc-900 text-white shadow-sm focus:border-amber-500 focus:ring-amber-500 p-3"
              required
              disabled={loading}
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-zinc-700 bg-zinc-900 text-white shadow-sm focus:border-amber-500 focus:ring-amber-500 p-3"
              required
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg text-lg transition duration-300 transform hover:-translate-y-1 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? 'INGRESANDO...' : <><LogIn size={20} className="mr-2 inline-block" /> LOG IN</>}
          </button>
        </form>

        <div className="mt-6 text-sm flex justify-between">
          <button className="text-gray-400 hover:text-amber-400" disabled={loading}>Forgot Password?</button>
          <button onClick={handleSignUpSimulation} className="text-blue-500 hover:text-amber-400 font-semibold" disabled={loading}>New User? SIGN UP</button>
        </div>
      </div>
      {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
    </div>
  );
};

export default LoginScreen;
