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
  ChevronLeft
} from 'lucide-react';
import { useForm } from '../hooks/useForm';
import { useNotification } from '../hooks/useNotification';
import { validateClientRegistration } from '../utils/validation';
import { saveUserData, findUserInCollections } from '../services/firestoreService';
import { COLLECTIONS, ROUTES } from '../constants';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import Notification from '../components/Notification';

const ClientRegistrationScreen = ({ onGoBack, onClientRegistered, onAdminAccess }) => {
  const { notification, showSuccess, showError, showInfo, hideNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [isReturningClient, setIsReturningClient] = useState(false);

  const {
    values: formData,
    errors,
    handleChange,
    handleBlur,
    validate,
    setValues,
    reset
  } = useForm({
    name: '',
    phone: '',
    email: ''
  }, validateClientRegistration);

  // Verificar si es un cliente que regresa
  useEffect(() => {
    const checkReturningClient = () => {
      const savedClientData = localStorage.getItem('olimubarbershop_client');
      if (savedClientData) {
        try {
          const clientData = JSON.parse(savedClientData);
          setValues(clientData);
          setIsReturningClient(true);
          showInfo(`¡Hola ${clientData.name}! Te recordamos. ¿Continuar con estos datos?`);
        } catch (error) {
          console.error('Error parsing saved client data:', error);
          localStorage.removeItem('olimubarbershop_client');
        }
      }
    };

    checkReturningClient();
  }, [setValues, showInfo]);

  // Función para limpiar datos de cliente guardados
  const clearSavedClientData = () => {
    localStorage.removeItem('olimubarbershop_client');
    setIsReturningClient(false);
    reset();
    showInfo('Datos borrados. Puedes ingresar información nueva.');
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      showError('Por favor, corrige los errores en el formulario');
      return;
    }

    setLoading(true);

    try {
      console.log('=== INICIO REGISTRO CLIENTE ===');
      console.log('Datos del formulario:', formData);
      
      // Verificar si el cliente ya existe
      const existingClient = await findUserInCollections(
        formData.email || formData.phone,
        ['email', 'phone']
      );

      console.log('Resultado búsqueda cliente existente:', existingClient);

      let clientData = {
        ...formData,
        lastVisit: new Date().toISOString(),
        registrationDate: existingClient.success ? existingClient.data.registrationDate : new Date().toISOString(),
        totalAppointments: existingClient.success ? (existingClient.data.totalAppointments || 0) + 1 : 1,
        role: 'client',
        isActive: true,
        emailVerified: false
      };

      console.log('Datos del cliente a guardar:', clientData);

      let result;
      
      if (existingClient.success) {
        // Actualizar cliente existente
        console.log('Actualizando cliente existente con ID:', existingClient.id);
        result = await saveUserData(existingClient.id, clientData, COLLECTIONS.CLIENTS);
        if (result.success) {
          clientData.id = existingClient.id;
          showSuccess(`¡Bienvenido de vuelta, ${formData.name}!`);
        }
      } else {
        // Crear nuevo cliente
        console.log('Creando nuevo cliente...');
        result = await saveUserData(null, clientData, COLLECTIONS.CLIENTS);
        if (result.success) {
          clientData.id = result.id;
          console.log('Cliente creado con ID:', result.id);
          showSuccess(`¡Bienvenido, ${formData.name}! Cliente registrado exitosamente.`);
        }
      }

      console.log('Resultado de saveUserData:', result);

      if (!result.success) {
        throw new Error(result.error || 'Error al guardar datos');
      }

      // Guardar datos en localStorage para futuras visitas
      localStorage.setItem('olimubarbershop_client', JSON.stringify(clientData));
      console.log('Datos guardados en localStorage:', clientData);

      // Notificar al componente padre y continuar al siguiente paso
      setTimeout(() => {
        onClientRegistered?.(clientData);
      }, 1500);

      console.log('=== FIN REGISTRO CLIENTE EXITOSO ===');

    } catch (error) {
      console.error('=== ERROR EN REGISTRO CLIENTE ===');
      console.error('Error completo:', error);
      showError(`Error al procesar el registro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LoadingSpinner 
        type="barbershop" 
        message="Registrando cliente..." 
        fullScreen={true}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          {onGoBack && (
            <Button
              variant="ghost"
              onClick={onGoBack}
              className="flex items-center gap-2 text-zinc-400 hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Regresar</span>
            </Button>
          )}
          
          {onAdminAccess && (
            <Button
              variant="ghost"
              onClick={onAdminAccess}
              className="flex items-center gap-2 text-zinc-400 hover:text-amber-400"
            >
              <Settings className="w-5 h-5" />
              <span>Admin</span>
            </Button>
          )}
        </div>

        {/* Branding */}
        <Card className="mb-8 text-center bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 backdrop-blur-sm border-zinc-700">
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
            {isReturningClient ? '¡Bienvenido de vuelta!' : 'Bienvenido'}
          </h2>
          <p className="text-zinc-400 text-sm">
            {isReturningClient 
              ? 'Confirma tus datos o actualízalos si han cambiado'
              : 'Completa tu información para agendar tu cita'
            }
          </p>
        </Card>

        {/* Formulario */}
        <Card className="bg-zinc-800/80 backdrop-blur-sm border-zinc-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Input
                type="text"
                name="name"
                placeholder="Nombre completo"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.name}
                disabled={loading}
                icon={User}
                required
              />

              <Input
                type="tel"
                name="phone"
                placeholder="Número de teléfono"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.phone}
                disabled={loading}
                icon={Phone}
                required
              />

              <Input
                type="email"
                name="email"
                placeholder="Correo electrónico (opcional)"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.email}
                disabled={loading}
                icon={Mail}
              />
            </div>

            {/* Botones de acción */}
            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                loading={loading}
              >
                <UserPlus className="w-5 h-5 mr-2" />
                {isReturningClient ? 'Continuar' : 'Registrar y Continuar'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              {isReturningClient && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={clearSavedClientData}
                  className="w-full"
                  disabled={loading}
                >
                  Usar datos nuevos
                </Button>
              )}
            </div>
          </form>

          {/* Información adicional */}
          <div className="mt-6 p-4 bg-zinc-900/50 rounded-lg">
            <p className="text-xs text-zinc-500 text-center">
              Tu información se guarda de forma segura y solo se usa para mejorar tu experiencia en nuestro barbershop.
            </p>
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

        {/* Botón de acceso administrativo - Más visible */}
        {onAdminAccess && (
          <div className="mt-8 text-center">
            <Button
              variant="ghost"
              onClick={onAdminAccess}
              className="text-zinc-500 hover:text-amber-400 text-sm"
            >
              <Settings className="w-4 h-4 mr-2" />
              Acceso Administrativo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientRegistrationScreen;
