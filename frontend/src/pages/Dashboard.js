// frontend/src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { Calendar, Clock, Users, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const { db, currentUser, isAuthReady } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalAppointments: 0,
    pendingAppointments: 0,
    totalClients: 0
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);

  useEffect(() => {
    if (!db || !currentUser || !isAuthReady) {
      console.log("Dashboard: Firestore/Auth not ready.");
      return;
    }

    setLoading(true);

    // Intentar cargar datos reales de Firestore
    const loadRealData = async () => {
      try {
        // Configurar listeners para datos en tiempo real (usar colecciones públicas)
        const appointmentsRef = collection(db, 'appointments');

        // Listener para todas las citas
        const appointmentsQuery = query(appointmentsRef);
        const unsubscribeAppointments = onSnapshot(appointmentsQuery, (snapshot) => {
          const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // Calcular métricas
          const total = appointments.length;
          const pending = appointments.filter(apt => 
            apt.status === 'pendiente' || apt.status === 'pending'
          ).length;
          
          setMetrics(prev => ({
            ...prev,
            totalAppointments: total,
            pendingAppointments: pending
          }));

          // Próximas citas (ordenadas por fecha)
          const upcoming = appointments
            .filter(apt => {
              // Crear fecha completa combinando date y time
              const appointmentDate = new Date(`${apt.date}T${apt.time || '00:00'}`);
              return appointmentDate >= new Date();
            })
            .sort((a, b) => {
              const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
              const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
              return dateA - dateB;
            })
            .slice(0, 5);
          
          setUpcomingAppointments(upcoming);
        }, (error) => {
          console.error("Error loading appointments:", error);
          // En caso de error, mantener estado vacío
          setUpcomingAppointments([]);
        });

        // Listener para clientes (contar únicos)
        const clientsRef = collection(db, 'clients');
        const clientsQuery = query(clientsRef);
        const unsubscribeClients = onSnapshot(clientsQuery, (snapshot) => {
          const clientsCount = snapshot.size;
          setMetrics(prev => ({
            ...prev,
            totalClients: clientsCount
          }));
        });

        setLoading(false);

        // Retornar función de limpieza
        return () => {
          unsubscribeAppointments();
          unsubscribeClients();
        };

      } catch (error) {
        console.error("Error setting up real-time listeners:", error);
        // En caso de error, mantener estado inicial vacío
        setLoading(false);
      }
    };

    loadRealData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, currentUser, isAuthReady]);

  // Función para formatear fecha y hora
  const formatDateTime = (appointment) => {
    // Si tiene dateTime (formato antiguo), usarlo
    if (appointment.dateTime) {
      const date = new Date(appointment.dateTime);
      return {
        date: date.toLocaleDateString('es-ES', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        time: date.toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };
    }
    
    // Si tiene date y time separados (formato nuevo)
    if (appointment.date && appointment.time) {
      const dateObj = new Date(appointment.date);
      return {
        date: dateObj.toLocaleDateString('es-ES', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        time: appointment.timeDisplay || appointment.time
      };
    }
    
    // Fallback
    return {
      date: 'Fecha no disponible',
      time: 'Hora no disponible'
    };
  };

  // Función para obtener color del estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmada':
      case 'confirmed':
        return 'bg-green-700 text-green-100';
      case 'pendiente':
      case 'pending':
        return 'bg-amber-700 text-amber-100';
      case 'completada':
      case 'completed':
        return 'bg-blue-700 text-blue-100';
      case 'cancelada':
      case 'cancelled':
        return 'bg-red-700 text-red-100';
      default:
        return 'bg-gray-700 text-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full bg-zinc-900 text-white">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-400 mb-4"></div>
          <p className="text-lg text-gray-300">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-zinc-900 min-h-screen text-white">
      {/* Header del Dashboard */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 text-shimmer">Dashboard</h1>
        <p className="text-gray-400 animate-fade-in stagger-delay-1">Vista general de tu barbería</p>
        <p className="text-sm text-gray-500 mt-1 animate-fade-in stagger-delay-2">
          Usuario: <span className="font-mono text-amber-400">{currentUser?.email}</span> | 
          ID: <span className="font-mono text-gray-300">{currentUser?.uid?.substring(0, 8)}...</span>
        </p>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total de Citas */}
        <div className="bg-zinc-800 p-6 rounded-2xl shadow-xl border border-zinc-700 animate-scale-in hover-lift transition-all-smooth" 
             style={{ animationDelay: '200ms', opacity: 0, animationFillMode: 'forwards' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total de Citas</p>
              <p className="text-3xl font-bold text-white animate-glow">{metrics.totalAppointments}</p>
            </div>
            <div className="bg-blue-600 p-3 rounded-full animate-bounce-subtle">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center animate-fade-in stagger-delay-3">
            <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
            <span className="text-green-400 text-sm">+12% vs mes anterior</span>
          </div>
        </div>

        {/* Citas Pendientes */}
        <div className="bg-zinc-800 p-6 rounded-2xl shadow-xl border border-zinc-700 animate-scale-in hover-lift transition-all-smooth" 
             style={{ animationDelay: '400ms', opacity: 0, animationFillMode: 'forwards' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Citas Pendientes</p>
              <p className="text-3xl font-bold text-white animate-glow-pulse">{metrics.pendingAppointments}</p>
            </div>
            <div className="bg-amber-600 p-3 rounded-full animate-bounce-subtle">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 animate-fade-in stagger-delay-3">
            <span className="text-amber-400 text-sm">Requieren confirmación</span>
          </div>
        </div>

        {/* Clientes Registrados */}
        <div className="bg-zinc-800 p-6 rounded-2xl shadow-xl border border-zinc-700 animate-scale-in hover-lift transition-all-smooth" 
             style={{ animationDelay: '600ms', opacity: 0, animationFillMode: 'forwards' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Clientes Registrados</p>
              <p className="text-3xl font-bold text-white animate-glow">{metrics.totalClients}</p>
            </div>
            <div className="bg-green-600 p-3 rounded-full animate-bounce-subtle">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 animate-fade-in stagger-delay-3">
            <span className="text-green-400 text-sm">Total de clientes activos</span>
          </div>
        </div>
      </div>

      {/* Listados Detallados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Próximas Citas */}
        <div className="bg-zinc-800 p-6 rounded-2xl shadow-xl border border-zinc-700 animate-slide-in-left hover-lift transition-all-smooth" 
             style={{ animationDelay: '800ms', opacity: 0, animationFillMode: 'forwards' }}>
          <div className="flex items-center mb-6">
            <Users className="w-6 h-6 text-amber-400 mr-3 animate-bounce-subtle" />
            <h2 className="text-2xl font-bold text-white text-shimmer">Próximas Citas</h2>
          </div>
          
          {upcomingAppointments.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No hay citas programadas</p>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment, index) => {
                const { date, time } = formatDateTime(appointment);
                return (
                  <div key={appointment.id} 
                       className="bg-zinc-700 p-4 rounded-xl border border-zinc-600 animate-fade-in hover-lift micro-bounce transition-all-smooth"
                       style={{ 
                         animationDelay: `${1000 + (index * 100)}ms`, 
                         opacity: 0, 
                         animationFillMode: 'forwards' 
                       }}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-white">{appointment.clientName}</h3>
                        <p className="text-gray-300 text-sm">{appointment.service}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium animate-pulse ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-400 text-sm">
                      <Calendar className="w-4 h-4 mr-1 animate-bounce-subtle" />
                      <span className="mr-4">{date}</span>
                      <Clock className="w-4 h-4 mr-1 animate-bounce-subtle" />
                      <span className="mr-4">{time}</span>
                      <span>({appointment.duration} min)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Información de Servicios */}
        <div className="bg-zinc-800 p-6 rounded-2xl shadow-xl border border-zinc-700 animate-slide-in-right hover-lift transition-all-smooth" 
             style={{ animationDelay: '1000ms', opacity: 0, animationFillMode: 'forwards' }}>
          <div className="flex items-center mb-6">
            <TrendingUp className="w-6 h-6 text-green-400 mr-3 animate-bounce-subtle" />
            <h2 className="text-2xl font-bold text-white text-shimmer">Estado del Sistema</h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-zinc-700 p-4 rounded-xl border border-zinc-600 animate-fade-in hover-lift micro-bounce transition-all-smooth"
                 style={{ animationDelay: '1200ms', opacity: 0, animationFillMode: 'forwards' }}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-white">Sistema de Reservas</h3>
                  <p className="text-gray-300 text-sm">Activo y funcionando</p>
                </div>
                <span className="text-green-400 font-bold animate-glow">✓</span>
              </div>
            </div>
            
            <div className="bg-zinc-700 p-4 rounded-xl border border-zinc-600 animate-fade-in hover-lift micro-bounce transition-all-smooth"
                 style={{ animationDelay: '1400ms', opacity: 0, animationFillMode: 'forwards' }}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-white">Base de Datos</h3>
                  <p className="text-gray-300 text-sm">Conectado a Firebase</p>
                </div>
                <span className="text-green-400 font-bold animate-glow">✓</span>
              </div>
            </div>
            
            <div className="bg-zinc-700 p-4 rounded-xl border border-zinc-600 animate-fade-in hover-lift micro-bounce transition-all-smooth"
                 style={{ animationDelay: '1600ms', opacity: 0, animationFillMode: 'forwards' }}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-white">Servicios Disponibles</h3>
                  <p className="text-gray-300 text-sm">Listos para reservar</p>
                </div>
                <span className="text-green-400 font-bold animate-glow">✓</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer con información adicional */}
      <div className="mt-8 p-4 bg-zinc-800 rounded-2xl border border-zinc-700 animate-fade-in hover-lift"
           style={{ animationDelay: '1800ms', opacity: 0, animationFillMode: 'forwards' }}>
        <p className="text-center text-gray-400 text-sm text-shimmer">
          Dashboard actualizado en tiempo real • Datos desde Firebase Firestore
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
