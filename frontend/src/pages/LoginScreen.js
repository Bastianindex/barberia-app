// frontend/src/pages/LoginScreen.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useForm } from '../hooks/useForm';
import { useNotification } from '../hooks/useNotification';
import { validateLogin } from '../utils/validation';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import Notification from '../components/Notification';
import { LogIn, ChevronLeft, Scissors } from 'lucide-react';
import { ROUTES } from '../constants';

const LoginScreen = ({ onLoginSuccess, onShowSignUp, onGoBack }) => {
  const { login, registerAdmin } = useAuth();
  const { notification, showError, showSuccess, hideNotification } = useNotification();
  const [loading, setLoading] = useState(false);

  const {
    values,
    errors,
    handleChange,
    handleBlur,
    validate,
    reset
  } = useForm({
    email: 'owner@barber.com',
    password: 'password'
  }, validateLogin);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      showError('Por favor, corrige los errores en el formulario');
      return;
    }

    setLoading(true);
    
    try {
      const result = await login(values.email, values.password);
      
      if (result.success) {
        showSuccess('Inicio de sesión exitoso');
        setTimeout(() => {
          onLoginSuccess?.();
        }, 1000);
      } else {
        showError(result.error || 'Credenciales incorrectas');
      }
    } catch (error) {
      showError('Error al iniciar sesión');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    setLoading(true);
    
    try {
      const result = await registerAdmin(
        'owner@barber.com',
        'password',
        {
          name: 'Administrador OLIMU',
          role: 'admin'
        }
      );
      
      if (result.success) {
        showSuccess('Usuario administrador creado exitosamente');
        setTimeout(() => {
          onLoginSuccess?.();
        }, 1000);
      } else {
        showError(result.error || 'Error al crear usuario administrador');
      }
    } catch (error) {
      showError('Error al crear usuario administrador');
      console.error('Admin creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestUserCreation = async () => {
    if (onShowSignUp) {
      onShowSignUp();
    }
  };

  if (loading) {
    return (
      <LoadingSpinner 
        type="barbershop" 
        message="Iniciando sesión..." 
        fullScreen={true}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white p-6">
      {/* Botón de regresar */}
      {onGoBack && (
        <div className="w-full max-w-md mb-4">
          <Button
            variant="ghost"
            onClick={onGoBack}
            className="flex items-center gap-2 text-zinc-400 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Regresar</span>
          </Button>
        </div>
      )}

      <Card className="w-full max-w-md bg-zinc-800/80 backdrop-blur-sm border-zinc-700">
        {/* Header con branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mr-4">
              <Scissors className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                OLIMU
              </h1>
              <p className="text-sm text-zinc-400">Panel de Administración</p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.email}
            disabled={loading}
            required
          />

          <Input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.password}
            disabled={loading}
            required
          />

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
            loading={loading}
          >
            <LogIn className="w-5 h-5 mr-2" />
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>

          {/* Botón temporal para crear admin */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleCreateAdmin}
            disabled={loading}
          >
            Crear Usuario Admin (Temporal)
          </Button>
        </form>

        {/* Enlaces adicionales */}
        <div className="mt-6 space-y-3">
          <div className="text-center">
            <Button
              variant="link"
              onClick={handleTestUserCreation}
              className="text-sm text-zinc-400 hover:text-amber-400"
            >
              ¿No tienes cuenta? Crear usuario de prueba
            </Button>
          </div>
          
          <div className="text-xs text-zinc-500 text-center">
            <p>Usuario de prueba: owner@barber.com</p>
            <p>Contraseña: password</p>
          </div>
        </div>
      </Card>

      {/* Notificaciones */}
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

export default LoginScreen;
