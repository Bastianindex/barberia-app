// frontend/src/pages/ServiceSelectionScreen.js
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Scissors,
  Clock,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import Notification from '../components/Notification';
import LoadingSpinner from '../components/LoadingSpinner';

const ServiceSelectionScreen = ({ 
  clientData, 
  onGoBack, 
  onServiceSelected 
}) => {
  // Estados principales
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
  // Cargar servicios disponibles
  useEffect(() => {
    const loadServices = async () => {
      try {
        if (!db) {
          setServices([]);
          setLoading(false);
          return;
        }
        
        // Cargar servicios desde la colección services
        const servicesRef = collection(db, 'services');
        const q = query(servicesRef, where('isActive', '==', true));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const servicesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setServices(servicesData);
        } else {
          setServices([]);
        }
      } catch (error) {
        console.error('Error loading services:', error);
        setServices([]);
        showNotification('Error al cargar servicios', 'error');
      }
      
      setLoading(false);
    };
    
    loadServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Función para mostrar notificaciones
  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 4000);
  };
  
  // Manejar selección de servicio
  const handleServiceSelection = (service) => {
    setSelectedService(service);
  };
  
  // Continuar con el servicio seleccionado
  const handleContinue = () => {
    if (!selectedService) {
      showNotification('Por favor, selecciona un servicio', 'error');
      return;
    }
    
    if (onServiceSelected) {
      onServiceSelected(selectedService);
    }
  };
  
  if (loading) {
    return (
      <LoadingSpinner 
        type="barbershop" 
        fullScreen={true}
        message="Cargando servicios disponibles..."
      />
    );
  }
  
  return (
    <div className="min-h-screen bg-zinc-900 text-white animate-fade-in">
      {/* Header */}
      <div className="bg-zinc-800 border-b border-zinc-700 px-4 py-4 animate-slide-in-left">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={onGoBack}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-all-smooth hover-scale micro-bounce"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Regresar</span>
          </button>
          
          <div className="flex items-center gap-2">
            <Scissors className="w-6 h-6 text-amber-400 animate-pulse-slow" />
            <h1 className="text-lg font-bold text-glow">BarberShop</h1>
          </div>
        </div>
      </div>
      
      <div className="max-w-md mx-auto p-6">
        {/* Información del cliente */}
        <div className="bg-zinc-800 rounded-lg p-4 mb-6 border border-zinc-700 animate-scale-in hover-lift transition-all-smooth">
          <h2 className="text-lg font-semibold text-amber-400 mb-2 text-shimmer">
            ¡Hola {clientData?.name}!
          </h2>
          <p className="text-zinc-300 text-sm animate-fade-in stagger-delay-1">
            Selecciona el servicio que deseas para tu cita
          </p>
        </div>
        
        {/* Lista de servicios */}
        <div className="mb-8 animate-slide-in-right stagger-delay-2">
          <h3 className="text-xl font-semibold mb-4 animate-fade-in">Nuestros Servicios</h3>
          
          <div className="space-y-3">
            {services.map((service, index) => (
              <div
                key={service.id}
                onClick={() => handleServiceSelection(service)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all-smooth hover-lift micro-bounce animate-fade-in ${
                  selectedService?.id === service.id
                    ? 'border-amber-300 bg-amber-300/70 shadow-xl shadow-amber-400/50 animate-glow'
                    : 'border-zinc-600 bg-zinc-800 hover:border-zinc-500'
                }`}
                style={{ 
                  animationDelay: `${(index * 150) + 500}ms`,
                  opacity: 0,
                  animationFillMode: 'forwards'
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className={`font-semibold ${
                    selectedService?.id === service.id ? 'text-black' : 'text-white'
                  }`}>{service.name}</h4>
                  <div className="text-right">
                    <div className={`font-bold ${
                      selectedService?.id === service.id ? 'text-amber-800' : 'text-amber-400'
                    }`}>
                      ${service.price?.toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <p className={`text-sm mb-3 ${
                  selectedService?.id === service.id ? 'text-zinc-700' : 'text-zinc-400'
                }`}>
                  {service.description}
                </p>
                
                <div className={`flex items-center gap-4 text-xs ${
                  selectedService?.id === service.id ? 'text-zinc-600' : 'text-zinc-500'
                }`}>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{service.duration} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    <span>Precio incluye todo</span>
                  </div>
                </div>
                
                {selectedService?.id === service.id && (
                  <div className="mt-3 p-3 bg-amber-300 rounded-lg border-2 border-amber-500 text-amber-900 text-sm flex items-center gap-2 animate-fade-in shadow-xl font-bold">
                    <Scissors className="w-4 h-4 animate-bounce-subtle text-amber-800" />
                    <span className="font-black">✓ SERVICIO SELECCIONADO</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Botón Continue */}
        <button
          onClick={handleContinue}
          disabled={!selectedService}
          className={`w-full py-4 rounded-lg font-semibold text-lg transition-all-smooth flex items-center justify-center gap-2 hover-lift micro-bounce animate-slide-in-up ${
            selectedService
              ? 'bg-amber-400 hover:bg-amber-500 text-black animate-glow-pulse shadow-lg shadow-amber-400/50'
              : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
          }`}
          style={{ 
            animationDelay: `${(services.length * 150) + 700}ms`,
            opacity: 0,
            animationFillMode: 'forwards'
          }}
        >
          {selectedService ? (
            <>
              <span className="text-shimmer">CONTINUAR</span>
              <ArrowRight className="w-5 h-5 animate-bounce-x" />
            </>
          ) : (
            <span className="animate-pulse">SELECCIONA UN SERVICIO</span>
          )}
        </button>
        
        {/* Información adicional */}
        <div className="mt-6 text-center text-sm text-zinc-400 animate-fade-in" 
             style={{ 
               animationDelay: `${(services.length * 150) + 900}ms`,
               opacity: 0,
               animationFillMode: 'forwards'
             }}>
          <p className="micro-bounce stagger-delay-1">Todos nuestros servicios incluyen asesoramiento personalizado</p>
          <p className="micro-bounce stagger-delay-2">Horarios disponibles de 9:00 AM a 9:00 PM</p>
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

export default ServiceSelectionScreen;
