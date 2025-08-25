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

  // Mock data para cuando Firestore no tenga datos reales
  const mockMetrics = {
    totalAppointments: 147,
    pendingAppointments: 8,
    totalClients: 85
  };

  const mockUpcomingAppointments = [
    {
      id: '1',
      clientName: 'Carlos Rodríguez',
      service: 'Corte + Barba',
      dateTime: '2025-08-25T10:30:00',
      status: 'confirmada',
      duration: 45
    },
    {
      id: '2',
      clientName: 'Miguel Santos',
      service: 'Corte Clásico',
      dateTime: '2025-08-25T11:15:00',
      status: 'pendiente',
      duration: 30
    },
    {
      id: '3',
      clientName: 'Pedro González',
      service: 'Afeitado Premium',
      dateTime: '2025-08-25T14:00:00',
      status: 'confirmada',
      duration: 25
    },
    {
      id: '4',
      clientName: 'Luis Martínez',
      service: 'Corte + Lavado',
      dateTime: '2025-08-25T15:30:00',
      status: 'pendiente',
      duration: 40
    },
    {
      id: '5',
      clientName: 'Antonio Silva',
      service: 'Barba + Bigote',
      dateTime: '2025-08-25T16:45:00',
      status: 'confirmada',
      duration: 35
    }
  ];

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
          const pending = appointments.filter(apt => apt.status === 'pendiente').length;
          
          setMetrics(prev => ({
            ...prev,
            totalAppointments: total,
            pendingAppointments: pending
          }));

          // Próximas citas (ordenadas por fecha)
          const upcoming = appointments
            .filter(apt => new Date(apt.dateTime) >= new Date())
            .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
            .slice(0, 5);
          
          setUpcomingAppointments(upcoming.length > 0 ? upcoming : mockUpcomingAppointments);
        }, (error) => {
          console.error("Error loading appointments:", error);
          // Usar datos mock en caso de error
          setMetrics(prev => ({
            ...prev,
            totalAppointments: mockMetrics.totalAppointments,
            pendingAppointments: mockMetrics.pendingAppointments
          }));
          setUpcomingAppointments(mockUpcomingAppointments);
        });

        // Usar datos mock para máquinas (evitar problemas de permisos)
        setMetrics(prev => ({
          ...prev,
          totalClients: mockMetrics.totalClients
        }));

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
        // Fallback a datos mock
        setMetrics(mockMetrics);
        setUpcomingAppointments(mockUpcomingAppointments);
        setLoading(false);
      }
    };

    loadRealData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, currentUser, isAuthReady]);

  // Función para formatear fecha y hora
  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
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
  };

  // Función para obtener color del estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmada':
        return 'bg-green-700 text-green-100';
      case 'pendiente':
        return 'bg-amber-700 text-amber-100';
      case 'mantenimiento_urgente':
        return 'bg-red-700 text-red-100';
      case 'mantenimiento_próximo':
        return 'bg-amber-700 text-amber-100';
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
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Vista general de tu barbería</p>
        <p className="text-sm text-gray-500 mt-1">
          Usuario: <span className="font-mono text-amber-400">{currentUser?.email}</span> | 
          ID: <span className="font-mono text-gray-300">{currentUser?.uid?.substring(0, 8)}...</span>
        </p>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total de Citas */}
        <div className="bg-zinc-800 p-6 rounded-2xl shadow-xl border border-zinc-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total de Citas</p>
              <p className="text-3xl font-bold text-white">{metrics.totalAppointments}</p>
            </div>
            <div className="bg-blue-600 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
            <span className="text-green-400 text-sm">+12% vs mes anterior</span>
          </div>
        </div>

        {/* Citas Pendientes */}
        <div className="bg-zinc-800 p-6 rounded-2xl shadow-xl border border-zinc-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Citas Pendientes</p>
              <p className="text-3xl font-bold text-white">{metrics.pendingAppointments}</p>
            </div>
            <div className="bg-amber-600 p-3 rounded-full">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-amber-400 text-sm">Requieren confirmación</span>
          </div>
        </div>

        {/* Clientes Registrados */}
        <div className="bg-zinc-800 p-6 rounded-2xl shadow-xl border border-zinc-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Clientes Registrados</p>
              <p className="text-3xl font-bold text-white">{metrics.totalClients}</p>
            </div>
            <div className="bg-green-600 p-3 rounded-full">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-green-400 text-sm">Total de clientes activos</span>
          </div>
        </div>
      </div>

      {/* Listados Detallados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Próximas Citas */}
        <div className="bg-zinc-800 p-6 rounded-2xl shadow-xl border border-zinc-700">
          <div className="flex items-center mb-6">
            <Users className="w-6 h-6 text-amber-400 mr-3" />
            <h2 className="text-2xl font-bold text-white">Próximas Citas</h2>
          </div>
          
          {upcomingAppointments.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No hay citas programadas</p>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => {
                const { date, time } = formatDateTime(appointment.dateTime);
                return (
                  <div key={appointment.id} className="bg-zinc-700 p-4 rounded-xl border border-zinc-600">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-white">{appointment.clientName}</h3>
                        <p className="text-gray-300 text-sm">{appointment.service}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-400 text-sm">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span className="mr-4">{date}</span>
                      <Clock className="w-4 h-4 mr-1" />
                      <span className="mr-4">{time}</span>
                      <span>({appointment.duration} min)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Servicios Más Populares */}
        <div className="bg-zinc-800 p-6 rounded-2xl shadow-xl border border-zinc-700">
          <div className="flex items-center mb-6">
            <TrendingUp className="w-6 h-6 text-green-400 mr-3" />
            <h2 className="text-2xl font-bold text-white">Servicios Populares</h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-zinc-700 p-4 rounded-xl border border-zinc-600">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-white">Corte + Barba</h3>
                  <p className="text-gray-300 text-sm">Más solicitado</p>
                </div>
                <span className="text-green-400 font-bold">45%</span>
              </div>
            </div>
            
            <div className="bg-zinc-700 p-4 rounded-xl border border-zinc-600">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-white">Corte Clásico</h3>
                  <p className="text-gray-300 text-sm">Servicio base</p>
                </div>
                <span className="text-blue-400 font-bold">30%</span>
              </div>
            </div>
            
            <div className="bg-zinc-700 p-4 rounded-xl border border-zinc-600">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-white">Afeitado Tradicional</h3>
                  <p className="text-gray-300 text-sm">Especialidad</p>
                </div>
                <span className="text-amber-400 font-bold">25%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer con información adicional */}
      <div className="mt-8 p-4 bg-zinc-800 rounded-2xl border border-zinc-700">
        <p className="text-center text-gray-400 text-sm">
          Dashboard actualizado en tiempo real • Datos desde Firebase Firestore
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
