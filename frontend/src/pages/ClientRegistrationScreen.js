// frontend/src/pages/ClientRegistrationScreen.js
import React, { useState, useEffect } from 'react';
import { 
  Scissors,
  User,
  Phone,
  Mail,
  ArrowRight,
  Settings
} from 'lucide-react';
import { collection, addDoc, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import Notification from '../components/Notification';

const ClientRegistrationScreen = ({ onGoBack, onClientRegistered, onAdminAccess }) => {
  // Estados del formulario
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [isReturningClient, setIsReturningClient] = useState(false);
  
  // Verificar si es un cliente que regresa al cargar el componente
  useEffect(() => {
    const checkReturningClient = () => {
      const savedClientData = localStorage.getItem('olimubarbershop_client');
      if (savedClientData) {
        try {
          const clientData = JSON.parse(savedClientData);
          setFormData(clientData);
          setIsReturningClient(true);
          showNotification(`¡Hola ${clientData.name}! Te recordamos. ¿Continuar con estos datos?`, 'info');
        } catch (error) {
          console.error('Error parsing saved client data:', error);
          localStorage.removeItem('olimubarbershop_client');
        }
      }
    };

    checkReturningClient();
  }, []);
  
  // Función para mostrar notificaciones
  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 4000);
  };
  
  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores cuando el usuario empiece a escribir
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
    
    // Validar nombre
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }
    
    // Validar teléfono
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es obligatorio';
    } else if (!/^[+]?[(]?[\d\s\-()]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Ingresa un número de teléfono válido';
    }
    
    // Validar email (opcional pero si se proporciona debe ser válido)
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ingresa un email válido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification('Por favor, corrige los errores en el formulario', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      // Si es un cliente que regresa y no ha modificado los datos, continuar directamente
      if (isReturningClient && !hasModifiedData()) {
        setLoading(false);
        if (onClientRegistered) {
          onClientRegistered(formData);
        }
        return;
      }

      // Verificar si el cliente ya existe en Firebase por teléfono
      const clientsRef = collection(db, 'clients');
      const q = query(clientsRef, where('phone', '==', formData.phone.trim()));
      const querySnapshot = await getDocs(q);
      
      let clientData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        
        // Estadísticas iniciales
        totalAppointments: 0,
        completedAppointments: 0,
        cancelledAppointments: 0,
        totalSpent: 0,
        firstVisit: new Date().toISOString(),
        lastVisit: null,
        
        // Estado del cliente
        status: 'active',
        loyaltyLevel: 'regular',
        
        // Preferencias
        notifications: {
          email: !!formData.email,
          sms: true,
          whatsapp: true
        },
        
        // Metadatos
        registeredAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      if (querySnapshot.empty) {
        // Cliente nuevo - guardarlo en Firebase
        const docRef = await addDoc(clientsRef, clientData);
        clientData = { ...clientData, id: docRef.id };
        showNotification('¡Registro exitoso! Ahora selecciona tu servicio', 'success');
      } else {
        // Cliente existente - usar datos existentes pero actualizar algunos campos
        const existingClient = querySnapshot.docs[0];
        const existingData = existingClient.data();
        
        // Actualizar campos que pueden haber cambiado
        const updatedFields = {
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          updatedAt: new Date().toISOString()
        };
        
        // Actualizar en Firebase
        await updateDoc(doc(db, 'clients', existingClient.id), updatedFields);
        
        clientData = { 
          ...existingData, 
          ...updatedFields, 
          id: existingClient.id 
        };
        showNotification('¡Bienvenido de vuelta a Olimu Barbershop!', 'success');
      }
      
      // Guardar en localStorage para futuras visitas
      localStorage.setItem('olimubarbershop_client', JSON.stringify(clientData));
      
      // Esperar un momento para mostrar la notificación
      setTimeout(() => {
        if (onClientRegistered) {
          onClientRegistered(clientData);
        }
      }, 1500);
      
    } catch (error) {
      console.error('Error registering client:', error);
      showNotification('Error al registrar. Inténtalo de nuevo', 'error');
    }
    
    setLoading(false);
  };

  // Función para verificar si el usuario modificó los datos
  const hasModifiedData = () => {
    const savedClientData = localStorage.getItem('olimubarbershop_client');
    if (!savedClientData) return true;
    
    try {
      const originalData = JSON.parse(savedClientData);
      return (
        formData.name !== originalData.name ||
        formData.phone !== originalData.phone ||
        formData.email !== originalData.email
      );
    } catch {
      return true;
    }
  };

  // Función para limpiar datos del cliente
  const clearClientData = () => {
    localStorage.removeItem('olimubarbershop_client');
    setFormData({ name: '', phone: '', email: '' });
    setIsReturningClient(false);
    showNotification('Datos limpiados. Puedes registrar un nuevo cliente', 'info');
  };
  
  const isFormValid = formData.name.trim() && formData.phone.trim();
  
  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <div className="bg-zinc-800 border-b border-zinc-700 px-4 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* Botón discreto de administrador - solo se muestra si está disponible */}
          {onAdminAccess && (
            <button
              onClick={onAdminAccess}
              className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Acceso administrador"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          
          <div className="flex items-center gap-2 mx-auto">
            <Scissors className="w-6 h-6 text-amber-400" />
            <h1 className="text-lg font-bold">Olimu BarberShop</h1>
          </div>
          
          {/* Espaciador para centrar el título */}
          <div className="w-6"></div>
        </div>
      </div>
      
      <div className="max-w-md mx-auto p-6">
        {/* Bienvenida */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Scissors className="w-10 h-10 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            ¡Bienvenido a Olimu BarberShop!
          </h2>
          <p className="text-zinc-400">
            Regístrate para agendar tu cita de forma rápida y sencilla
          </p>
        </div>
        
        {/* Formulario de registro */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Nombre completo *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 bg-zinc-800 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${
                errors.name ? 'border-red-500' : 'border-zinc-600'
              }`}
              placeholder="Ingresa tu nombre completo"
              disabled={loading}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name}</p>
            )}
          </div>
          
          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              <Phone className="w-4 h-4 inline mr-2" />
              Número de teléfono *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 bg-zinc-800 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${
                errors.phone ? 'border-red-500' : 'border-zinc-600'
              }`}
              placeholder="+57 300 123 4567"
              disabled={loading}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
            )}
          </div>
          
          {/* Email (opcional) */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Email (opcional)
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 bg-zinc-800 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${
                errors.email ? 'border-red-500' : 'border-zinc-600'
              }`}
              placeholder="tu@email.com"
              disabled={loading}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email}</p>
            )}
          </div>
          
          {/* Botón especial para clientes que regresan */}
          {isReturningClient && (
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setTimeout(() => {
                  setLoading(false);
                  if (onClientRegistered) {
                    onClientRegistered(formData);
                  }
                }, 500);
              }}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors mb-4"
            >
              <span>CONTINUAR CON ESTOS DATOS</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
          
          {/* Botón de envío */}
          <button
            type="submit"
            disabled={!isFormValid || loading}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
              isFormValid && !loading
                ? 'bg-amber-500 hover:bg-amber-600 text-black'
                : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
            ) : (
              <>
                <span>{isReturningClient ? 'ACTUALIZAR DATOS' : 'REGISTRARSE'}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
        
        {/* Botón para cambiar cliente (solo si es cliente que regresa) */}
        {isReturningClient && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={clearClientData}
              className="text-sm text-zinc-400 hover:text-amber-400 transition-colors underline"
            >
              ¿No eres {formData.name}? Cambiar cliente
            </button>
          </div>
        )}
        
        {/* Información adicional */}
        <div className="mt-8 text-center text-sm text-zinc-400">
          <p className="mb-2">* Campos obligatorios</p>
          <p>Tus datos están seguros y solo se usan para gestionar tu cita</p>
          <p className="mt-4 text-xs">
            Al registrarte aceptas nuestros términos de servicio y política de privacidad
          </p>
        </div>
        
        {/* Beneficios */}
        <div className="mt-8 bg-zinc-800 rounded-lg p-4 border border-zinc-700">
          <h3 className="font-semibold text-amber-400 mb-3">¿Por qué registrarse?</h3>
          <ul className="space-y-2 text-sm text-zinc-300">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
              <span>Agendamiento rápido y fácil</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
              <span>Recordatorios de cita por WhatsApp</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
              <span>Historial de servicios</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
              <span>Ofertas y descuentos exclusivos</span>
            </li>
          </ul>
        </div>
      </div>
      
      {/* Notificación */}
      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ show: false, message: '', type: '' })}
      />
    </div>
  );
};

export default ClientRegistrationScreen;
