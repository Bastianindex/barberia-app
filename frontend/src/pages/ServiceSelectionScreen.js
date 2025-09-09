// frontend/src/pages/ServiceSelectionScreen.js
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Scissors,
  Clock,
  DollarSign,
  ArrowRight,
  Check,
  Star
} from 'lucide-react';
import { useNotification } from '../hooks/useNotification';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import Notification from '../components/Notification';

const ServiceSelectionScreen = ({ 
  clientData, 
  onGoBack, 
  onServiceSelected 
}) => {
  const { notification, showSuccess, showError, showInfo, hideNotification } = useNotification();
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Cargar servicios disponibles
  useEffect(() => {
    const loadServices = async () => {
      setLoading(true);
      try {
        // Cargar servicios directamente desde Firebase sin autenticación
        const servicesRef = collection(db, 'services');
        const q = query(servicesRef, where('isActive', '==', true), orderBy('name'));
        const querySnapshot = await getDocs(q);
        
        const servicesData = [];
        querySnapshot.forEach((doc) => {
          const serviceData = { id: doc.id, ...doc.data() };
          // Solo agregar servicios con datos válidos
          if (serviceData.id && serviceData.name && serviceData.price !== undefined) {
            servicesData.push(serviceData);
          }
        });
        
        setServices(servicesData);
        
        if (servicesData.length === 0) {
          showInfo('No hay servicios disponibles en este momento');
        }
      } catch (error) {
        console.error('Error loading services:', error);
        showError('Error al cargar los servicios. Por favor intenta más tarde.');
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, [showError, showInfo]);

  // Manejar selección de servicio
  const handleServiceSelect = (service) => {
    setSelectedService(service);
  };

  // Continuar con el servicio seleccionado
  const handleContinue = () => {
    if (!selectedService) {
      showError('Por favor, selecciona un servicio');
      return;
    }

    showSuccess(`¡Excelente elección! ${selectedService.name} seleccionado`);
    
    setTimeout(() => {
      onServiceSelected?.({
        ...selectedService,
        clientData
      });
    }, 1000);
  };

  // Formatear precio en pesos colombianos
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Formatear duración
  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  if (loading) {
    return (
      <LoadingSpinner 
        type="barbershop" 
        message="Cargando servicios..." 
        fullScreen={true}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={onGoBack}
            className="flex items-center gap-2 text-zinc-400 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Regresar</span>
          </Button>
        </div>

        {/* Welcome Message */}
        <Card className="mb-8 text-center bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 backdrop-blur-sm border-zinc-700">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mr-3">
              <Scissors className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                ¡Hola {clientData?.name}!
              </h1>
              <p className="text-sm text-zinc-400">Selecciona tu servicio</p>
            </div>
          </div>
          <p className="text-zinc-300">
            Elige el servicio que mejor se adapte a lo que necesitas hoy
          </p>
        </Card>

        {/* Services Grid */}
        <div className="space-y-4 mb-8">
          {services.map((service) => (
            <Card
              key={service.id}
              className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] relative overflow-hidden ${
                selectedService?.id === service.id
                  ? 'bg-gradient-to-br from-amber-500/15 via-amber-600/10 to-amber-700/15 border-2 border-amber-500 shadow-2xl shadow-amber-500/25 transform scale-[1.03]'
                  : 'bg-gradient-to-br from-zinc-800/90 via-zinc-800/80 to-zinc-900/90 border border-zinc-700 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10'
              }`}
              onClick={() => handleServiceSelect(service)}
            >
              {/* Selected glow effect */}
              {selectedService?.id === service.id && (
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/10 animate-pulse"></div>
              )}
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      selectedService?.id === service.id 
                        ? 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/50' 
                        : 'bg-gradient-to-br from-zinc-700 to-zinc-800 group-hover:from-amber-600/20 group-hover:to-amber-700/20'
                    }`}>
                      <Scissors className={`w-6 h-6 transition-all duration-300 ${
                        selectedService?.id === service.id ? 'text-white rotate-12' : 'text-zinc-300'
                      }`} />
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                        selectedService?.id === service.id ? 'text-amber-100' : 'text-white'
                      }`}>
                        {service.name}
                      </h3>
                      {service.category && (
                        <span className={`text-xs uppercase tracking-wide font-medium transition-colors duration-300 ${
                          selectedService?.id === service.id 
                            ? 'text-amber-300' 
                            : 'text-amber-400'
                        }`}>
                          {service.category}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className={`text-sm mb-3 transition-colors duration-300 ${
                    selectedService?.id === service.id ? 'text-zinc-200' : 'text-zinc-400'
                  }`}>
                    {service.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className={`flex items-center gap-1 font-semibold transition-colors duration-300 ${
                      selectedService?.id === service.id ? 'text-green-300' : 'text-green-400'
                    }`}>
                      <DollarSign className="w-4 h-4" />
                      <span>
                        {formatPrice(service.price)}
                      </span>
                    </div>
                    <div className={`flex items-center gap-1 transition-colors duration-300 ${
                      selectedService?.id === service.id ? 'text-blue-300' : 'text-blue-400'
                    }`}>
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(service.duration)}</span>
                    </div>
                  </div>
                </div>

                {/* Selection Indicator */}
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  selectedService?.id === service.id
                    ? 'border-amber-400 bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/50 scale-110'
                    : 'border-zinc-600 hover:border-amber-400/50'
                }`}>
                  {selectedService?.id === service.id && (
                    <Check className="w-5 h-5 text-white font-bold animate-bounce" />
                  )}
                  {selectedService?.id !== service.id && (
                    <div className="w-2 h-2 rounded-full bg-zinc-600 transition-all duration-300 hover:bg-amber-400/50"></div>
                  )}
                </div>
              </div>

              {/* Popular Badge */}
              {service.isPopular && (
                <div className="absolute top-3 right-3 z-20">
                  <div className={`text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 transition-all duration-300 ${
                    selectedService?.id === service.id
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 shadow-lg shadow-amber-500/50'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600'
                  }`}>
                    <Star className={`w-3 h-3 ${selectedService?.id === service.id ? 'animate-spin' : ''}`} />
                    <span className="font-medium">Popular</span>
                  </div>
                </div>
              )}

              {/* Selected corner decoration */}
              {selectedService?.id === service.id && (
                <div className="absolute top-0 left-0 w-0 h-0 border-t-[20px] border-r-[20px] border-t-amber-500 border-r-transparent"></div>
              )}
            </Card>
          ))}
        </div>

        {/* Continue Button */}
        {selectedService && (
          <div className="animate-fadeIn">
            <Card className="bg-gradient-to-br from-amber-500/15 via-amber-600/10 to-amber-700/15 border-2 border-amber-500/70 shadow-2xl shadow-amber-500/25 backdrop-blur-sm">
              <div className="text-center relative">
                {/* Decorative elements */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent animate-pulse"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/50">
                      <Check className="w-6 h-6 text-white animate-pulse" />
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-amber-100 mb-1">
                    ¡Excelente Elección!
                  </h3>
                  <p className="text-amber-300 font-semibold mb-1">
                    {selectedService.name}
                  </p>
                  <p className="text-amber-400/80 text-sm mb-4">
                    {formatPrice(selectedService.price)} • {formatDuration(selectedService.duration)}
                  </p>
                  
                  <Button
                    onClick={handleContinue}
                    className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:via-amber-700 hover:to-amber-800 shadow-xl shadow-amber-500/30 transform hover:scale-105 transition-all duration-300 font-semibold"
                  >
                    <Scissors className="w-5 h-5 mr-2 animate-pulse" />
                    Continuar con {selectedService.name}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {services.length === 0 && !loading && (
          <Card className="text-center bg-zinc-800/50">
            <div className="py-8">
              <Scissors className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-zinc-400 mb-2">
                No hay servicios disponibles
              </h3>
              <p className="text-zinc-500 text-sm">
                Por favor, contacta al barbershop para más información
              </p>
            </div>
          </Card>
        )}

        {/* Notifications */}
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={hideNotification}
          />
        )}
      </div>
    </div>
  );
};

export default ServiceSelectionScreen;
