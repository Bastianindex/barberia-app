// frontend/src/components/ClientAuth.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Notification from './Notification';
import LoadingSpinner from './LoadingSpinner';
import { User, Phone, Mail, Lock, Eye, EyeOff, UserPlus, LogIn, RefreshCw } from 'lucide-react';
import { testFirebaseConnection, testEmailRegistration } from '../utils/firebaseTest';

const ClientAuth = ({ onAuthSuccess, onSkip }) => {
  const { login, registerClient, registerAdmin, createEmergencyAdmin, testEmailConfiguration, resendVerificationEmail, getClientData } = useAuth();
  
  const [mode, setMode] = useState('login'); // 'login', 'register', 'verification'
  const [userType, setUserType] = useState('client'); // 'client', 'admin'
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    adminCode: '' // Para registro de administradores
  });
  
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [needsVerification, setNeedsVerification] = useState(false);

  // Manejar cambios en los inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error específico cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (mode === 'register') {
      // Validar nombre
      if (!formData.name.trim()) {
        newErrors.name = 'El nombre es requerido';
      }

      // Validar teléfono (solo para clientes)
      if (userType === 'client') {
        const phoneRegex = /^[0-9]{8,15}$/;
        if (!formData.phone.trim()) {
          newErrors.phone = 'El teléfono es requerido';
        } else if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
          newErrors.phone = 'Ingresa un teléfono válido (8-15 dígitos)';
        }
      }

      // Validar código de administrador (solo para admins)
      if (userType === 'admin') {
        if (!formData.adminCode.trim()) {
          newErrors.adminCode = 'El código de administrador es requerido';
        }
      }

      // Validar confirmación de contraseña
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Confirma tu contraseña';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Ingresa un correo electrónico válido';
    }

    // Validar contraseña
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar login
  const handleLogin = async (e) => {
    e.preventDefault();
    setNotification(null);
    setNeedsVerification(false);

    if (!validateForm()) {
      setNotification({ 
        message: 'Por favor corrige los errores en el formulario', 
        type: 'error' 
      });
      return;
    }

    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        setNotification({ 
          message: 'Inicio de sesión exitoso. Bienvenido!', 
          type: 'success' 
        });
        
        // Redirigir según el rol del usuario
        setTimeout(async () => {
          if (onAuthSuccess && result.user) {
            try {
              // Usar los datos que ya vienen del login
              const userData = result.userData;
              const userRole = result.role;
              
              if (userRole === 'admin') {
                // Redirigir a dashboard de administrador
                onAuthSuccess({
                  id: result.user.uid,
                  email: formData.email,
                  role: 'admin',
                  ...userData,
                  redirectTo: 'admin'
                });
              } else {
                // Redirigir al flujo de cliente
                onAuthSuccess({
                  id: result.user.uid,
                  email: formData.email,
                  role: 'client',
                  ...userData,
                  redirectTo: 'client',
                  isReturning: true
                });
              }
            } catch (error) {
              console.error('Error procesando datos del usuario:', error);
              // Fallback con datos básicos
              onAuthSuccess({
                id: result.user.uid,
                email: formData.email,
                name: 'Usuario',
                role: 'client',
                redirectTo: 'client',
                isReturning: true
              });
            }
          }
        }, 1500);
        
      } else {
        setNotification({ 
          message: result.error || 'Error al iniciar sesión', 
          type: 'error' 
        });

        if (result.needsVerification) {
          setNeedsVerification(true);
        }
      }
    } catch (error) {
      console.error('Error en login:', error);
      setNotification({ 
        message: 'Error inesperado al iniciar sesión', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Manejar registro
  const handleRegister = async (e) => {
    e.preventDefault();
    setNotification(null);

    if (!validateForm()) {
      setNotification({ 
        message: 'Por favor corrige los errores en el formulario', 
        type: 'error' 
      });
      return;
    }

    setLoading(true);

    try {
      let result;
      
      if (userType === 'admin') {
        // Registrar como administrador
        result = await registerAdmin(
          formData.name,
          formData.email,
          formData.password,
          formData.adminCode
        );
      } else {
        // Registrar como cliente
        result = await registerClient(
          formData.name,
          formData.phone,
          formData.email,
          formData.password
        );
      }

      if (result.success) {
        setNotification({ 
          message: result.message || 'Registro exitoso. Revisa tu correo para verificar tu cuenta.', 
          type: 'success' 
        });
        
        setMode('verification');
        
      } else {
        setNotification({ 
          message: result.error || 'Error al registrarse', 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('Error en registro:', error);
      setNotification({ 
        message: 'Error inesperado al registrarse', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Reenviar email de verificación
  const handleResendVerification = async () => {
    setLoading(true);
    const result = await resendVerificationEmail();
    
    if (result.success) {
      setNotification({ message: result.message, type: 'success' });
    } else {
      setNotification({ message: result.error, type: 'error' });
    }
    setLoading(false);
  };

  // Función de prueba de Firebase
  const handleTestFirebase = async () => {
    setLoading(true);
    const result = await testFirebaseConnection();
    setNotification({
      message: result.success ? result.message : result.error,
      type: result.success ? 'success' : 'error'
    });
    setLoading(false);
  };

  // Función de prueba de email mejorada
  const handleTestEmailConfiguration = async () => {
    setLoading(true);
    const result = await testEmailConfiguration();
    setNotification({
      message: result.success ? result.message : result.error,
      type: result.success ? 'success' : 'error'
    });
    setLoading(false);
  };

  // Renderizar pantalla de verificación
  if (mode === 'verification') {
    return (
      <div className="bg-zinc-800 p-6 rounded-2xl shadow-xl border border-zinc-700 max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-amber-600 rounded-full">
              <Mail className="w-6 h-6 text-white" />
            </div>
          </div>
          <h2 className="text-xl font-bold mb-2">Verifica tu correo</h2>
          <p className="text-zinc-300 text-sm">
            Te hemos enviado un enlace de verificación a:
          </p>
          <p className="text-amber-400 font-semibold mt-2">{formData.email}</p>
        </div>

        <div className="bg-zinc-700 p-4 rounded-lg mb-4">
          <div className="text-left space-y-2 text-sm text-zinc-300">
            <p>📧 Revisa tu bandeja de entrada</p>
            <p>📁 Si no lo encuentras, revisa spam</p>
            <p>🔗 Haz clic en el enlace de verificación</p>
            <p>🔄 Regresa aquí e inicia sesión</p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleResendVerification}
            className="w-full bg-zinc-600 hover:bg-zinc-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 flex items-center justify-center disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <RefreshCw size={18} className="mr-2" />
                Reenviar email
              </>
            )}
          </button>

          <button
            onClick={() => setMode('login')}
            className="w-full text-zinc-400 hover:text-white transition-colors py-2"
          >
            Ya verifiqué mi email - Iniciar sesión
          </button>
        </div>

        {notification && (
          <Notification 
            message={notification.message} 
            type={notification.type} 
            onClose={() => setNotification(null)} 
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-zinc-800 p-6 rounded-2xl shadow-xl border border-zinc-700 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">
          {mode === 'login' ? 'Inicia sesión' : 'Crear cuenta'}
        </h2>
        <p className="text-zinc-400 text-sm">
          {mode === 'login' 
            ? 'Accede a tu cuenta para continuar' 
            : 'Regístrate para agendar citas fácilmente'
          }
        </p>
      </div>

      {/* Selector de tipo de usuario - Solo en registro */}
      {mode === 'register' && (
        <div className="mb-4">
          <div className="flex space-x-2 bg-zinc-800 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setUserType('client')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                userType === 'client'
                  ? 'bg-amber-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Cliente
            </button>
            <button
              type="button"
              onClick={() => setUserType('admin')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                userType === 'admin'
                  ? 'bg-amber-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Administrador
            </button>
          </div>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
        {/* Nombre - Solo en registro */}
        {mode === 'register' && (
          <div>
            <div className="relative">
              <User className="absolute left-3 top-3.5 h-5 w-5 text-zinc-400" />
              <input
                type="text"
                name="name"
                placeholder="Nombre completo"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border bg-zinc-900 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 transition-colors ${
                  errors.name ? 'border-red-500 focus:ring-red-500' : 'border-zinc-700 focus:ring-amber-500'
                }`}
                disabled={loading}
              />
            </div>
            {errors.name && (
              <p className="text-red-400 text-sm mt-1">{errors.name}</p>
            )}
          </div>
        )}

        {/* Teléfono - Solo en registro de clientes */}
        {mode === 'register' && userType === 'client' && (
          <div>
            <div className="relative">
              <Phone className="absolute left-3 top-3.5 h-5 w-5 text-zinc-400" />
              <input
                type="tel"
                name="phone"
                placeholder="Teléfono"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border bg-zinc-900 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 transition-colors ${
                  errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-zinc-700 focus:ring-amber-500'
                }`}
                disabled={loading}
              />
            </div>
            {errors.phone && (
              <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
            )}
          </div>
        )}

        {/* Código de Administrador - Solo en registro de administradores */}
        {mode === 'register' && userType === 'admin' && (
          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-zinc-400" />
              <input
                type="password"
                name="adminCode"
                placeholder="Código de administrador"
                value={formData.adminCode}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border bg-zinc-900 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 transition-colors ${
                  errors.adminCode ? 'border-red-500 focus:ring-red-500' : 'border-zinc-700 focus:ring-amber-500'
                }`}
                disabled={loading}
              />
            </div>
            {errors.adminCode && (
              <p className="text-red-400 text-sm mt-1">{errors.adminCode}</p>
            )}
          </div>
        )}

        {/* Email */}
        <div>
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 h-5 w-5 text-zinc-400" />
            <input
              type="email"
              name="email"
              placeholder="Correo electrónico"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border bg-zinc-900 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 transition-colors ${
                errors.email ? 'border-red-500 focus:ring-red-500' : 'border-zinc-700 focus:ring-amber-500'
              }`}
              disabled={loading}
            />
          </div>
          {errors.email && (
            <p className="text-red-400 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        {/* Contraseña */}
        <div>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 h-5 w-5 text-zinc-400" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Contraseña"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-12 py-3 rounded-lg border bg-zinc-900 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 transition-colors ${
                errors.password ? 'border-red-500 focus:ring-red-500' : 'border-zinc-700 focus:ring-amber-500'
              }`}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-zinc-400 hover:text-white"
              disabled={loading}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-400 text-sm mt-1">{errors.password}</p>
          )}
        </div>

        {/* Confirmar contraseña - Solo en registro */}
        {mode === 'register' && (
          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-zinc-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirmar contraseña"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-12 py-3 rounded-lg border bg-zinc-900 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 transition-colors ${
                  errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-zinc-700 focus:ring-amber-500'
                }`}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3.5 text-zinc-400 hover:text-white"
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>
        )}

        {/* Botón de envío */}
        <button
          type="submit"
          className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg text-lg transition duration-300 transform hover:-translate-y-1 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          disabled={loading}
        >
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              {mode === 'login' ? (
                <>
                  <LogIn size={20} className="mr-2" />
                  INICIAR SESIÓN
                </>
              ) : (
                <>
                  <UserPlus size={20} className="mr-2" />
                  CREAR CUENTA
                </>
              )}
            </>
          )}
        </button>
      </form>

      {/* Botón para reenviar verificación */}
      {needsVerification && (
        <div className="mt-4 text-center">
          <button
            onClick={handleResendVerification}
            className="text-amber-500 hover:text-amber-400 font-semibold text-sm underline"
            disabled={loading}
          >
            Reenviar email de verificación
          </button>
        </div>
      )}

      {/* Toggle entre login y registro */}
      <div className="mt-4 text-center">
        <button
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setErrors({});
            setNotification(null);
            setNeedsVerification(false);
          }}
          className="text-zinc-400 hover:text-amber-400 transition-colors text-sm"
          disabled={loading}
        >
          {mode === 'login' 
            ? '¿No tienes cuenta? Regístrate aquí' 
            : '¿Ya tienes cuenta? Inicia sesión'
          }
        </button>
      </div>

      {/* Botón para saltar registro */}
      {onSkip && (
        <div className="mt-4 text-center">
          <button
            onClick={onSkip}
            className="text-zinc-500 hover:text-zinc-400 transition-colors text-xs underline"
            disabled={loading}
          >
            Continuar sin cuenta (solo esta vez)
          </button>
        </div>
      )}

      {/* Botones de prueba de Firebase - TEMPORAL */}
      <div className="mt-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
        <p className="text-red-400 text-xs mb-3">🔧 Herramientas de Prueba Firebase</p>
        <div className="space-y-2">
          <button
            onClick={handleTestFirebase}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded transition-colors"
            disabled={loading}
          >
            {loading ? '...' : '🔥 Probar Conexión Firebase'}
          </button>
          <button
            onClick={handleTestEmailConfiguration}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs py-2 px-3 rounded transition-colors"
            disabled={loading}
          >
            {loading ? '...' : '📧 Probar Config. Email Mejorada'}
          </button>
        </div>
      </div>

      {/* Notificación */}
      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}
    </div>
  );
};

export default ClientAuth;
