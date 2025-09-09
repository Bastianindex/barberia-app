// frontend/src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';
import { 
  getAllAppointments, 
  getAllClients, 
  getActiveServices, 
  getBusinessAnalytics 
} from '../services/firestoreService';
import { 
  Calendar, 
  Clock, 
  Users, 
  TrendingUp,
  Scissors,
  DollarSign,
  Phone,
  Mail,
  BarChart3,
  CalendarDays,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import Notification from '../components/Notification';
import { collection, query, onSnapshot, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const Dashboard = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const { notification, showSuccess, showError, showInfo, hideNotification } = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalAppointments: 0,
    todayAppointments: 0,
    totalClients: 0,
    monthlyRevenue: 0,
    pendingAppointments: 0,
    completedAppointments: 0
  });
  
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);

  useEffect(() => {
    if (authLoading || !currentUser) {
      setLoading(false);
      return;
    }

    loadDashboardData();
  }, [currentUser, authLoading]);

  const loadDashboardData = async () => {
    setLoading(true);
    
    try {
      // Configurar listeners en tiempo real
      const today = new Date().toISOString().split('T')[0];
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      // Listener para citas de hoy
      const todayQuery = query(
        collection(db, 'appointments'),
        where('appointmentDate', '==', today),
        orderBy('appointmentTime')
      );

      const unsubscribeToday = onSnapshot(todayQuery, (snapshot) => {
        const todayApts = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        setTodayAppointments(todayApts);
        
        setMetrics(prev => ({
          ...prev,
          todayAppointments: todayApts.length
        }));
      });

      // Listener para todas las citas (últimas 50)
      const allAppointmentsQuery = query(
        collection(db, 'appointments'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const unsubscribeAll = onSnapshot(allAppointmentsQuery, (snapshot) => {
        const appointments = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        
        setRecentAppointments(appointments.slice(0, 10));
        
        // Calcular métricas
        const total = appointments.length;
        const pending = appointments.filter(apt => apt.status === 'confirmed').length;
        const completed = appointments.filter(apt => apt.status === 'completed').length;
        
        // Calcular ingresos del mes
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyRevenue = appointments
          .filter(apt => {
            const aptDate = new Date(apt.appointmentDateTime);
            return apt.status === 'completed' && 
                   aptDate.getMonth() === currentMonth && 
                   aptDate.getFullYear() === currentYear;
          })
          .reduce((total, apt) => total + (apt.servicePrice || 0), 0);

        setMetrics(prev => ({
          ...prev,
          totalAppointments: total,
          pendingAppointments: pending,
          completedAppointments: completed,
          monthlyRevenue
        }));
      });

      // Listener para clientes
      const clientsQuery = query(collection(db, 'clients'));
      const unsubscribeClients = onSnapshot(clientsQuery, (snapshot) => {
        setMetrics(prev => ({
          ...prev,
          totalClients: snapshot.docs.length
        }));
      });

      // Cleanup listeners
      return () => {
        unsubscribeToday();
        unsubscribeAll();
        unsubscribeClients();
      };

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showError('Error al cargar datos del dashboard');
      
      // Inicializar con datos vacíos
      setMetrics({
        totalAppointments: 0,
        todayAppointments: 0,
        totalClients: 0,
        monthlyRevenue: 0,
        pendingAppointments: 0,
        completedAppointments: 0
      });
      
      setTodayAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Formatear precio en pesos colombianos
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <LoadingSpinner 
        type="barbershop" 
        message="Cargando dashboard..." 
        fullScreen={true}
      />
    );
  }

  if (authLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
        <Card className="bg-zinc-800/80 border-zinc-700 text-center">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Acceso Restringido</h2>
          <p className="text-zinc-400">Debes iniciar sesión para acceder al dashboard</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
              <Scissors className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Dashboard</h1>
              <p className="text-zinc-400">Panel de administración - Olimu BarberShop</p>
            </div>
          </div>
          
          <div className="text-sm text-zinc-500">
            Última actualización: {new Date().toLocaleString('es-CO')}
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-sm font-medium">Citas Hoy</p>
                <p className="text-2xl font-bold text-white">{metrics.todayAppointments}</p>
              </div>
              <CalendarDays className="w-8 h-8 text-blue-400" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm font-medium">Total Clientes</p>
                <p className="text-2xl font-bold text-white">{metrics.totalClients}</p>
              </div>
              <Users className="w-8 h-8 text-green-400" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-400 text-sm font-medium">Ingresos del Mes</p>
                <p className="text-2xl font-bold text-white">{formatPrice(metrics.monthlyRevenue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-amber-400" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-400 text-sm font-medium">Total Citas</p>
                <p className="text-2xl font-bold text-white">{metrics.totalAppointments}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-400" />
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Appointments */}
          <Card className="bg-zinc-800/80 border-zinc-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                Citas de Hoy
              </h2>
              <Button variant="ghost" size="sm">
                Ver todas
              </Button>
            </div>

            <div className="space-y-4">
              {todayAppointments.length > 0 ? (
                todayAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 bg-zinc-700/50 rounded-lg border border-zinc-600"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{appointment.clientName}</p>
                        <p className="text-sm text-zinc-400">{appointment.serviceName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-amber-400 font-medium">{appointment.appointmentTime}</p>
                      <p className={`text-xs ${
                        appointment.status === 'confirmed' ? 'text-green-400' :
                        appointment.status === 'pending' ? 'text-yellow-400' :
                        'text-zinc-400'
                      }`}>
                        {appointment.status === 'confirmed' ? 'Confirmada' :
                         appointment.status === 'pending' ? 'Pendiente' : 'Completada'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400">No hay citas programadas para hoy</p>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-zinc-800/80 border-zinc-700">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              Acciones Rápidas
            </h2>

            <div className="space-y-4">
              <Button 
                className="w-full justify-start"
                variant="secondary"
              >
                <Calendar className="w-5 h-5 mr-3" />
                Nueva Cita
              </Button>

              <Button 
                className="w-full justify-start"
                variant="secondary"
              >
                <Users className="w-5 h-5 mr-3" />
                Gestionar Clientes
              </Button>

              <Button 
                className="w-full justify-start"
                variant="secondary"
              >
                <Scissors className="w-5 h-5 mr-3" />
                Administrar Servicios
              </Button>

              <Button 
                className="w-full justify-start"
                variant="secondary"
              >
                <BarChart3 className="w-5 h-5 mr-3" />
                Ver Reportes
              </Button>
            </div>

            {/* Status Summary */}
            <div className="mt-6 pt-6 border-t border-zinc-700">
              <h3 className="text-sm font-medium text-zinc-400 mb-3">Estado General</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Citas Pendientes:</span>
                  <span className="text-yellow-400 font-medium">{metrics.pendingAppointments}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Citas Completadas:</span>
                  <span className="text-green-400 font-medium">{metrics.completedAppointments}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

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

export default Dashboard;
