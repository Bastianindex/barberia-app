// frontend/src/pages/ClientRegistrationScreen.js
import React, { useState, useEffect } from 'react';
import { 
  Scissors,
  User,
  Phone,
  Mail,
  ArrowRight,
  Settings,
  UserPlus,
  ChevronLeft,
  LogIn,
  Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForm } from '../hooks/useForm';
import { useNotification } from '../hooks/useNotification';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { validateClientRegistration, validateLogin } from '../utils/validation';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';

const ClientRegistrationScreen = () => {
  const navigate = useNavigate();
  const { notification, showSuccess, showError, hideNotification } = useNotification();
  const { login, registerClient, userData, isAuthenticated, isClient, isAdmin } = useAuth();
  const { setClientData } = useBooking();
  const [loading, setLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true); // Por defecto, login profesional

  // Formulario para registro
  const {
    values: regValues,
    errors: regErrors,
    handleChange: handleRegChange,
    handleBlur: handleRegBlur,
    validate: validateReg,
    reset: resetReg
  } = useForm({
    name: '',
    phone: '',
    email: '',
    password: ''
  }, validateClientRegistration);

  // Formulario para login
  const {
    values: loginValues,
    errors: loginErrors,
    handleChange: handleLoginChange,
    handleBlur: handleLoginBlur,
    validate: validateLoginForm,
    reset: resetLogin
  } = useForm({
    email: '',
    password: ''
  }, validateLogin);

  // Auto-login si ya existe sesión
  useEffect(() => {
    if (isAuthenticated && userData) {
      if (isAdmin) {
        navigate('/admin');
      } else if (isClient) {
        showSuccess(`¡Bienvenido de vuelta, ${userData.name}!`);
        setClientData(userData);
        navigate('/select-service');
      }
    }
  }, [isAuthenticated, isClient, isAdmin, userData, navigate, setClientData, showSuccess]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateLoginForm()) {
      showError('Por favor verifica los campos obligatorios.');
      return;
    }

    setLoading(true);
    try {
      const result = await login(loginValues.email, loginValues.password);
      
      if (!result.success) {
        showError(result.error || 'Credenciales incorrectas');
        setLoading(false);
        return;
      }

      // Si fue exitoso, el useEffect de auto-login se encargará del redireccionamiento
      // cuando userData se actualice desde el AuthContext
    } catch (error) {
      console.error('Error en login de cliente:', error);
      showError('Error al iniciar sesión');
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateReg()) {
      showError('Por favor verifica los campos obligatorios para el registro.');
      return;
    }

    setLoading(true);
    try {
      const result = await registerClient({
        name: regValues.name,
        phone: regValues.phone,
        email: regValues.email,
        password: regValues.password
      });

      if (!result.success) {
        showError(result.error || 'Error al crear la cuenta');
        setLoading(false);
        return;
      }

      // Si fue exitoso, el useEffect de auto-login se encargará del redireccionamiento
    } catch (error) {
      console.error('Error en registro de cliente:', error);
      showError('Error al crear cuenta');
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    resetReg();
    resetLogin();
  };

  // Si estamos cargando o ya estamos autenticados (esperando redirección), mostrar spinner
  if (loading || isAuthenticated) {
    return (
      <LoadingSpinner 
        type="barbershop" 
        message={isAuthenticated ? "Entrando..." : "Cargando..."} 
        fullScreen={true}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md mx-auto">
        {/* Header con botón regresar (solo visible en modo registro) */}
        <div className="flex items-center justify-between mb-8 w-full min-h-[40px]">
          {!isLoginMode && (
            <Button
              variant="ghost"
              onClick={() => setIsLoginMode(true)}
              className="flex items-center gap-2 text-zinc-400 hover:text-white -ml-4"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Regresar</span>
            </Button>
          )}
          
          <div className="flex-1"></div>
        </div>

        {/* Branding */}
        <Card className="mb-6 text-center bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 backdrop-blur-sm border-zinc-700">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mr-4">
              <Scissors className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                OLIMU
              </h1>
              <p className="text-sm text-zinc-400">BarberShop</p>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            {isLoginMode ? 'Inicia Sesión' : 'Crea tu Cuenta'}
          </h2>
          <p className="text-zinc-400 text-sm">
            {isLoginMode 
              ? 'Accede para gestionar tus citas'
              : 'Regístrate para reservar tu turno fácil y rápido'
            }
          </p>
        </Card>

        {/* Formulario Login / Registro */}
        <Card className="bg-zinc-800/80 backdrop-blur-sm border-zinc-700">
          {isLoginMode ? (
            // FORMULARIO DE LOGIN
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="space-y-4">
                <Input
                  type="email"
                  name="email"
                  placeholder="Correo electrónico"
                  value={loginValues.email}
                  onChange={handleLoginChange}
                  onBlur={handleLoginBlur}
                  error={loginErrors.email}
                  disabled={loading}
                  icon={Mail}
                  required
                />
                <Input
                  type="password"
                  name="password"
                  placeholder="Contraseña"
                  value={loginValues.password}
                  onChange={handleLoginChange}
                  onBlur={handleLoginBlur}
                  error={loginErrors.password}
                  disabled={loading}
                  icon={Lock}
                  required
                />
              </div>

              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                  loading={loading}
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Iniciar Sesión
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={toggleMode}
                  className="w-full text-zinc-400 hover:text-amber-400"
                  disabled={loading}
                >
                  ¿No tienes cuenta? Regístrate
                </Button>
              </div>
            </form>
          ) : (
            // FORMULARIO DE REGISTRO
            <form onSubmit={handleRegisterSubmit} className="space-y-6">
              <div className="space-y-4">
                <Input
                  type="text"
                  name="name"
                  placeholder="Nombre completo"
                  value={regValues.name}
                  onChange={handleRegChange}
                  onBlur={handleRegBlur}
                  error={regErrors.name}
                  disabled={loading}
                  icon={User}
                  required
                />
                <Input
                  type="tel"
                  name="phone"
                  placeholder="Número de teléfono"
                  value={regValues.phone}
                  onChange={handleRegChange}
                  onBlur={handleRegBlur}
                  error={regErrors.phone}
                  disabled={loading}
                  icon={Phone}
                  required
                />
                <Input
                  type="email"
                  name="email"
                  placeholder="Correo electrónico"
                  value={regValues.email}
                  onChange={handleRegChange}
                  onBlur={handleRegBlur}
                  error={regErrors.email}
                  disabled={loading}
                  icon={Mail}
                  required
                />
                <Input
                  type="password"
                  name="password"
                  placeholder="Crea una contraseña"
                  value={regValues.password}
                  onChange={handleRegChange}
                  onBlur={handleRegBlur}
                  error={regErrors.password}
                  disabled={loading}
                  icon={Lock}
                  required
                />
              </div>

              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                  loading={loading}
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Crear Cuenta
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={toggleMode}
                  className="w-full text-zinc-400 hover:text-amber-400"
                  disabled={loading}
                >
                  ¿Ya tienes cuenta? Inicia sesión
                </Button>
              </div>
            </form>
          )}

          {/* Información adicional */}
          <div className="mt-6 p-4 bg-zinc-900/50 rounded-lg">
            <p className="text-xs text-zinc-500 text-center">
              Tu información está cifrada de extremo a extremo y protegida bajo estándares ISO para garantizar tu privacidad.
            </p>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default ClientRegistrationScreen;
