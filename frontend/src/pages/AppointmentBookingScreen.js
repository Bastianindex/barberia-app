// frontend/src/pages/AppointmentBookingScreen.js
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Calendar,
  Clock,
  User,
  Phone,
  Scissors
} from 'lucide-react';
import { doc, getDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { createAppointmentWithRelations } from '../utils/databaseUtils';
import ConfirmationModal from '../components/ConfirmationModal';
import Notification from '../components/Notification';

const AppointmentBookingScreen = ({ 
  clientData, 
  selectedServiceId, 
  onGoBack, 
  onBookAppointment 
}) => {
  // Estados principales
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [serviceDetails, setServiceDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estados de modales y notificaciones
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
  // Generar fechas disponibles (próximos 7 días)
  useEffect(() => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        date: date,
        dateString: date.toISOString().split('T')[0],
        displayName: i === 0 ? 'Hoy' : 
                    i === 1 ? 'Mañana' : 
                    date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' })
      });
    }
    
    setAvailableDates(dates);
  }, []);
  
  // Generar horarios disponibles (9:00 AM - 9:00 PM) y verificar disponibilidad
  useEffect(() => {
    const loadAvailableTimes = async () => {
      const times = [];
      
      // Generar todos los horarios posibles
      for (let hour = 9; hour <= 21; hour++) {
        const time24 = `${hour.toString().padStart(2, '0')}:00`;
        const time12 = hour > 12 ? `${hour - 12}:00 PM` : 
                      hour === 12 ? `${hour}:00 PM` : 
                      `${hour}:00 AM`;
        
        times.push({
          time24,
          time12,
          available: true // Por defecto disponible
        });
      }

      // Si hay fecha seleccionada y base de datos disponible, verificar citas existentes
      if (selectedDate && db) {
        try {
          const appointmentsRef = collection(db, 'appointments');
          const q = query(
            appointmentsRef, 
            where('date', '==', selectedDate.dateString)
          );
          const snapshot = await getDocs(q);
          
          // Obtener horarios ocupados
          const occupiedTimes = new Set();
          snapshot.docs.forEach(doc => {
            const appointmentData = doc.data();
            if (appointmentData.time) {
              occupiedTimes.add(appointmentData.time);
            }
          });
          
          // Marcar horarios ocupados
          times.forEach(timeSlot => {
            if (occupiedTimes.has(timeSlot.time24)) {
              timeSlot.available = false;
            }
          });
          
        } catch (error) {
          console.error('Error checking appointment availability:', error);
          // En caso de error, mantener todos los horarios como disponibles
        }
      }
      
      setAvailableTimes(times);
    };

    loadAvailableTimes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]); // Solo recargar cuando cambie la fecha seleccionada
  
  // Cargar detalles del servicio
  useEffect(() => {
    const loadServiceDetails = async () => {
      if (!selectedServiceId) {
        setServiceDetails(null);
        setLoading(false);
        return;
      }
      
      try {
        if (!db) {
          setServiceDetails(null);
          setLoading(false);
          return;
        }
        
        // Cargar detalles del servicio seleccionado
        const serviceRef = doc(db, 'services', selectedServiceId);
        const serviceDoc = await getDoc(serviceRef);
        
        if (serviceDoc.exists()) {
          setServiceDetails({ id: serviceDoc.id, ...serviceDoc.data() });
        } else {
          // Si no existe el servicio
          setServiceDetails(null);
        }
      } catch (error) {
        console.error('Error loading service details:', error);
        setServiceDetails(null);
      }
      
      setLoading(false);
    };
    
    loadServiceDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedServiceId]);
  
  // Función para mostrar notificaciones
  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 4000);
  };
  
  // Manejar selección de fecha
  const handleDateSelection = (dateObj) => {
    // Validar que el objeto de fecha tiene las propiedades requeridas
    if (dateObj && dateObj.dateString && dateObj.displayName) {
      setSelectedDate(dateObj);
      setSelectedTime(null); // Reset time selection when date changes
    } else {
      showNotification('Error al seleccionar la fecha. Inténtalo de nuevo', 'error');
    }
  };
  
  // Manejar selección de hora
  const handleTimeSelection = (timeObj) => {
    // Verificar si el horario está disponible
    if (!timeObj.available) {
      showNotification('Este horario ya está ocupado. Por favor selecciona otro horario.', 'warning');
      return;
    }
    
    // Validar que el objeto de hora tiene las propiedades requeridas
    if (timeObj && timeObj.time24 && timeObj.time12) {
      setSelectedTime(timeObj);
    } else {
      showNotification('Error al seleccionar la hora. Inténtalo de nuevo', 'error');
    }
  };
  
  // Validar selección antes de continuar
  const handleContinue = () => {
    if (!selectedDate) {
      showNotification('Por favor, selecciona una fecha', 'error');
      return;
    }
    
    if (!selectedTime) {
      showNotification('Por favor, selecciona una hora', 'error');
      return;
    }
    
    // Validación adicional de que los objetos tienen las propiedades requeridas
    if (!selectedDate.dateString || !selectedDate.displayName) {
      showNotification('Error con la fecha seleccionada. Inténtalo de nuevo', 'error');
      setSelectedDate(null);
      return;
    }
    
    if (!selectedTime.time24 || !selectedTime.time12) {
      showNotification('Error con la hora seleccionada. Inténtalo de nuevo', 'error');
      setSelectedTime(null);
      return;
    }
    
    setShowConfirmModal(true);
  };
  
  // Confirmar agendamiento
  const handleConfirmBooking = async () => {
    // Validación de seguridad antes de acceder a las propiedades
    if (!selectedDate || !selectedTime) {
      showNotification('Error: Fecha o hora no seleccionada', 'error');
      setShowConfirmModal(false);
      return;
    }

    if (!clientData || !clientData.name || !clientData.phone) {
      showNotification('Error: Datos del cliente incompletos', 'error');
      setShowConfirmModal(false);
      return;
    }
    
    try {
      // Usar la nueva función para crear cita con relaciones consistentes
      if (db && clientData.id && serviceDetails?.id) {
        const appointmentDetails = {
          date: selectedDate.dateString,
          time: selectedTime.time24,
          dateDisplay: selectedDate.displayName,
          timeDisplay: selectedTime.time12,
          notes: ''
        };
        
        const newAppointment = await createAppointmentWithRelations(
          clientData,
          serviceDetails,
          appointmentDetails
        );
        
        showNotification('¡Cita guardada con relaciones actualizadas!', 'success');
        
        setShowConfirmModal(false);
        
        setTimeout(() => {
          if (onBookAppointment) {
            onBookAppointment(newAppointment);
          }
        }, 2000);
        
      } else {
        // Fallback para estructura antigua o datos incompletos
        const appointmentData = {
          // Referencia del cliente
          clientId: clientData.id || null,
          clientPhone: clientData.phone,
          clientName: clientData.name,
          clientEmail: clientData.email || '',
          
          // Referencia del servicio
          serviceId: serviceDetails?.id || selectedServiceId,
          serviceName: serviceDetails?.name || 'Servicio no especificado',
          servicePrice: serviceDetails?.price || 0,
          serviceDuration: serviceDetails?.duration || 30,
          
          // Información de la cita
          date: selectedDate.dateString,
          time: selectedTime.time24,
          dateDisplay: selectedDate.displayName,
          timeDisplay: selectedTime.time12,
          status: 'pending',
          
          // Información adicional
          totalAmount: serviceDetails?.price || 0,
          paymentStatus: 'pending',
          notes: '',
          
          // Metadatos
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Guardar en Firebase usando método tradicional
        const appointmentsRef = collection(db, 'appointments');
        await addDoc(appointmentsRef, appointmentData);
        showNotification('¡Cita guardada en la base de datos!', 'success');
        
        setShowConfirmModal(false);
        
        // Simular delay y llamar al callback
        setTimeout(() => {
          if (onBookAppointment) {
            onBookAppointment(appointmentData);
          }
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error saving appointment:', error);
      showNotification('Error al guardar la cita', 'error');
      setShowConfirmModal(false);
    }
  };
  
  // Formatear fecha para mostrar
  const formatDisplayDate = (dateObj) => {
    return dateObj.date.toLocaleDateString('es-CO', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }
  
  const isDateSelected = (dateObj) => {
    return selectedDate && selectedDate.dateString === dateObj.dateString;
  };
  
  const isTimeSelected = (timeObj) => {
    return selectedTime && selectedTime.time24 === timeObj.time24;
  };
  
  const isContinueEnabled = selectedDate && selectedTime;
  
  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <div className="bg-zinc-800 border-b border-zinc-700 px-4 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={onGoBack}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Regresar</span>
          </button>
          
          <div className="flex items-center gap-2">
            <Scissors className="w-6 h-6 text-amber-400" />
            <h1 className="text-lg font-bold">BarberShop</h1>
          </div>
        </div>
      </div>
      
      <div className="max-w-md mx-auto p-6">
        {/* Información del cliente y servicio */}
        <div className="bg-zinc-800 rounded-lg p-4 mb-6 border border-zinc-700">
          <h2 className="text-lg font-semibold text-amber-400 mb-4">Resumen de tu cita</h2>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-zinc-400" />
              <span className="text-zinc-300">{clientData?.name || 'Cliente'}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-zinc-400" />
              <span className="text-zinc-300">{clientData?.phone || 'Teléfono'}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Scissors className="w-4 h-4 text-zinc-400" />
              <div>
                <span className="text-white font-medium">{serviceDetails?.name}</span>
                <div className="text-sm text-zinc-400">
                  ${serviceDetails?.price?.toLocaleString()} - {serviceDetails?.duration} min
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Selección de fecha */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            Selecciona una fecha
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            {availableDates.map((dateObj, index) => (
              <button
                key={index}
                onClick={() => handleDateSelection(dateObj)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  isDateSelected(dateObj)
                    ? 'border-amber-500 bg-amber-500/10 text-white'
                    : 'border-zinc-600 bg-zinc-800 hover:border-zinc-500 text-zinc-300 hover:text-white'
                }`}
              >
                <div className="font-medium">{dateObj.displayName}</div>
                <div className="text-sm opacity-75">
                  {formatDisplayDate(dateObj)}
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Selección de hora */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Selecciona una hora
            {selectedDate && (
              <span className="text-sm text-zinc-400 font-normal">
                para {selectedDate.displayName}
              </span>
            )}
          </h3>
          
          {/* Leyenda de disponibilidad */}
          {selectedDate && (
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 border border-zinc-600 bg-zinc-800 rounded"></div>
                  <span className="text-zinc-400">Disponible</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 border border-red-600 bg-red-900/30 rounded"></div>
                  <span className="text-red-400">Ocupado</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 border border-amber-500 bg-amber-500/10 rounded"></div>
                  <span className="text-amber-400">Seleccionado</span>
                </div>
              </div>
              <div className="text-xs text-zinc-400">
                {availableTimes.filter(t => t.available).length} horarios disponibles
              </div>
            </div>
          )}
          
          {!selectedDate ? (
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6 text-center">
              <Calendar className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-zinc-400">Primero selecciona una fecha</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {availableTimes.map((timeObj, index) => (
                <button
                  key={index}
                  onClick={() => handleTimeSelection(timeObj)}
                  disabled={!timeObj.available}
                  title={!timeObj.available ? 'Este horario ya está ocupado' : `Reservar cita a las ${timeObj.time12}`}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all relative ${
                    isTimeSelected(timeObj)
                      ? 'border-amber-500 bg-amber-500/10 text-white'
                      : timeObj.available
                      ? 'border-zinc-600 bg-zinc-800 hover:border-zinc-500 text-zinc-300 hover:text-white hover:bg-zinc-700'
                      : 'border-red-600 bg-red-900/30 text-red-400 cursor-not-allowed hover:border-red-500'
                  }`}
                >
                  <span className={!timeObj.available ? 'opacity-50' : ''}>{timeObj.time12}</span>
                  {!timeObj.available && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs bg-red-800 px-1 rounded font-bold">Ocupado</span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Botón Continue */}
        <button
          onClick={handleContinue}
          disabled={!isContinueEnabled}
          className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
            isContinueEnabled
              ? 'bg-amber-500 hover:bg-amber-600 text-black'
              : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
          }`}
        >
          {isContinueEnabled ? 'AGENDAR CITA' : 'SELECCIONA FECHA Y HORA'}
        </button>
        
        {/* Información adicional */}
        <div className="mt-6 text-center text-sm text-zinc-400">
          <p>Tu cita será confirmada inmediatamente</p>
          <p>Puedes cancelar hasta 2 horas antes</p>
        </div>
      </div>
      
      {/* Modal de confirmación */}
      {showConfirmModal && (
        <ConfirmationModal
          message={
            <div className="text-left space-y-3">
              <h3 className="text-lg font-semibold text-amber-400 mb-4 text-center">Confirmar Cita</h3>
              <p className="text-zinc-300 mb-4 text-center">¿Confirmas el agendamiento de tu cita?</p>
              
              <div className="bg-zinc-800 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Cliente:</span>
                  <span className="text-white font-medium">{clientData?.name}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-zinc-400">Teléfono:</span>
                  <span className="text-white">{clientData?.phone}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-zinc-400">Servicio:</span>
                  <span className="text-amber-400 font-medium">{serviceDetails?.name}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-zinc-400">Fecha:</span>
                  <span className="text-white">{selectedDate?.displayName}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-zinc-400">Hora:</span>
                  <span className="text-white">{selectedTime?.time12}</span>
                </div>
                
                <div className="flex justify-between border-t border-zinc-700 pt-2">
                  <span className="text-zinc-400">Total:</span>
                  <span className="text-amber-400 font-bold text-lg">
                    ${serviceDetails?.price?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          }
          onConfirm={handleConfirmBooking}
          onCancel={() => setShowConfirmModal(false)}
          confirmText="Confirmar Cita"
          cancelText="Cancelar"
          showCancelButton={true}
        />
      )}
      
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

export default AppointmentBookingScreen;
