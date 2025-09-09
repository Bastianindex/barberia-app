// frontend/src/pages/ClientsAnalytics.js
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Star,
  Phone,
  Mail,
  DollarSign,
  UserCheck,
  BarChart3,
  Search,
  Calendar,
  TrendingUp,
  Award,
  Clock,
  Filter,
  Download,
  Eye,
  MapPin,
  Heart
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy,
  where,
  Timestamp 
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/LoadingSpinner';
import Notification from '../components/Notification';

const ClientsAnalytics = () => {
  const { db, isAuthReady } = useAuth();
  const { notification, showSuccess, showError, hideNotification } = useNotification();
  
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [sortBy, setSortBy] = useState('appointmentCount');
  const [selectedClient, setSelectedClient] = useState(null);

  // Cargar datos en tiempo real
  useEffect(() => {
    if (!db || !isAuthReady) return;

    setLoading(true);
    
    const unsubscribes = [];

    try {
      // Suscribirse a clientes
      const clientsQuery = query(collection(db, 'clients'), orderBy('name'));
      const unsubClients = onSnapshot(clientsQuery, (snapshot) => {
        const clientsData = snapshot.docs.map(doc => {
          const data = { id: doc.id, ...doc.data() };
          return data.id && data.name ? data : null;
        }).filter(Boolean);
        setClients(clientsData);
      });
      unsubscribes.push(unsubClients);

      // Suscribirse a citas
      const appointmentsQuery = query(collection(db, 'appointments'));
      const unsubAppointments = onSnapshot(appointmentsQuery, (snapshot) => {
        const appointmentsData = snapshot.docs.map(doc => {
          const data = { id: doc.id, ...doc.data() };
          return data.id && data.clientId ? data : null;
        }).filter(Boolean);
        setAppointments(appointmentsData);
      });
      unsubscribes.push(unsubAppointments);

      // Suscribirse a servicios
      const servicesQuery = query(collection(db, 'services'));
      const unsubServices = onSnapshot(servicesQuery, (snapshot) => {
        const servicesData = snapshot.docs.map(doc => {
          const data = { id: doc.id, ...doc.data() };
          return data.id && data.name ? data : null;
        }).filter(Boolean);
        setServices(servicesData);
        setLoading(false);
      });
      unsubscribes.push(unsubServices);

      return () => {
        unsubscribes.forEach(unsub => unsub());
      };
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Error al cargar los datos');
      setLoading(false);
      
      // Inicializar con datos vacíos
      setClients([]);
      setAppointments([]);
      setServices([]);
    }
  }, [db, isAuthReady, showError]);

  // Calcular estadísticas de clientes
  const clientsWithStats = useMemo(() => {
    return clients.map(client => {
      const clientAppointments = appointments.filter(apt => apt.clientId === client.id);
      
      // Filtrar por período
      let filteredAppointments = clientAppointments;
      if (filterPeriod !== 'all') {
        const now = new Date();
        const periodStart = new Date();
        
        switch (filterPeriod) {
          case 'month':
            periodStart.setMonth(now.getMonth() - 1);
            break;
          case 'quarter':
            periodStart.setMonth(now.getMonth() - 3);
            break;
          case 'year':
            periodStart.setFullYear(now.getFullYear() - 1);
            break;
        }
        
        filteredAppointments = clientAppointments.filter(apt => {
          const aptDate = apt.date?.toDate ? apt.date.toDate() : new Date(apt.date);
          return aptDate >= periodStart;
        });
      }

      const completedAppointments = filteredAppointments.filter(apt => 
        apt.status === 'completed'
      );
      
      const totalSpent = completedAppointments.reduce((sum, apt) => 
        sum + (apt.totalPrice || 0), 0
      );
      
      const lastAppointment = clientAppointments
        .sort((a, b) => {
          const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
          const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
          return dateB - dateA;
        })[0];

      const avgSpent = completedAppointments.length > 0 
        ? totalSpent / completedAppointments.length 
        : 0;

      // Servicios favoritos
      const serviceCount = {};
      completedAppointments.forEach(apt => {
        if (apt.serviceId) {
          serviceCount[apt.serviceId] = (serviceCount[apt.serviceId] || 0) + 1;
        }
      });
      
      const favoriteServiceId = Object.keys(serviceCount).reduce((a, b) => 
        serviceCount[a] > serviceCount[b] ? a : b, null
      );
      
      const favoriteService = favoriteServiceId 
        ? services.find(s => s.id === favoriteServiceId)
        : null;

      return {
        ...client,
        appointmentCount: completedAppointments.length,
        totalSpent,
        avgSpent,
        lastVisit: lastAppointment?.date,
        favoriteService: favoriteService?.name || 'Ninguno',
        daysSinceLastVisit: lastAppointment 
          ? Math.floor((new Date() - (lastAppointment.date?.toDate ? lastAppointment.date.toDate() : new Date(lastAppointment.date))) / (1000 * 60 * 60 * 24))
          : null
      };
    });
  }, [clients, appointments, services, filterPeriod]);

  // Filtrar y ordenar clientes
  const filteredAndSortedClients = useMemo(() => {
    let filtered = clientsWithStats;

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(client => 
        (client.name && client.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.phone && client.phone.includes(searchTerm))
      );
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'appointmentCount':
          return b.appointmentCount - a.appointmentCount;
        case 'totalSpent':
          return b.totalSpent - a.totalSpent;
        case 'lastVisit':
          if (!a.lastVisit && !b.lastVisit) return 0;
          if (!a.lastVisit) return 1;
          if (!b.lastVisit) return -1;
          const dateA = a.lastVisit?.toDate ? a.lastVisit.toDate() : new Date(a.lastVisit);
          const dateB = b.lastVisit?.toDate ? b.lastVisit.toDate() : new Date(b.lastVisit);
          return dateB - dateA;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [clientsWithStats, searchTerm, sortBy]);

  // Estadísticas generales
  const generalStats = useMemo(() => {
    const totalClients = clients.length;
    const totalAppointments = appointments.filter(apt => apt.status === 'completed').length;
    const totalRevenue = appointments
      .filter(apt => apt.status === 'completed')
      .reduce((sum, apt) => sum + (apt.totalPrice || 0), 0);
    
    const avgRevenuePerClient = totalClients > 0 ? totalRevenue / totalClients : 0;
    const avgAppointmentsPerClient = totalClients > 0 ? totalAppointments / totalClients : 0;
    
    const vipClients = clients.filter(client => client.isVip).length;
    const activeClients = clientsWithStats.filter(client => 
      client.daysSinceLastVisit !== null && client.daysSinceLastVisit <= 30
    ).length;

    return {
      totalClients,
      totalAppointments,
      totalRevenue,
      avgRevenuePerClient,
      avgAppointmentsPerClient,
      vipClients,
      activeClients
    };
  }, [clients, appointments, clientsWithStats]);

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Formatear fecha
  const formatDate = (date) => {
    if (!date) return 'Nunca';
    const d = date?.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <LoadingSpinner 
        type="barbershop" 
        message="Cargando analytics de clientes..." 
        fullScreen={true}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics de Clientes</h1>
          <p className="text-zinc-400">
            Análisis detallado del comportamiento y métricas de clientes
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="secondary">
            <BarChart3 className="w-4 h-4 mr-2" />
            Reportes
          </Button>
        </div>
      </div>

      {/* General Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Clientes</p>
              <p className="text-2xl font-bold">{generalStats.totalClients}</p>
            </div>
            <Users className="w-8 h-8 text-blue-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Ingresos Totales</p>
              <p className="text-2xl font-bold">{formatCurrency(generalStats.totalRevenue)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Clientes VIP</p>
              <p className="text-2xl font-bold">{generalStats.vipClients}</p>
            </div>
            <Star className="w-8 h-8 text-purple-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-amber-600 to-amber-700 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm">Clientes Activos</p>
              <p className="text-2xl font-bold">{generalStats.activeClients}</p>
            </div>
            <UserCheck className="w-8 h-8 text-amber-200" />
          </div>
        </Card>
      </div>

      {/* Average Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-zinc-800/80 border-zinc-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Promedio por Cliente</h3>
              <p className="text-zinc-400 text-sm">Métricas de rendimiento</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-zinc-400">Ingresos promedio:</span>
              <span className="text-white font-semibold">
                {formatCurrency(generalStats.avgRevenuePerClient)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Citas promedio:</span>
              <span className="text-white font-semibold">
                {generalStats.avgAppointmentsPerClient.toFixed(1)}
              </span>
            </div>
          </div>
        </Card>

        <Card className="bg-zinc-800/80 border-zinc-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-red-600 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Fidelidad</h3>
              <p className="text-zinc-400 text-sm">Retención de clientes</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-zinc-400">Tasa de retención:</span>
              <span className="text-green-400 font-semibold">
                {((generalStats.activeClients / generalStats.totalClients) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Clientes VIP:</span>
              <span className="text-amber-400 font-semibold">
                {((generalStats.vipClients / generalStats.totalClients) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-800/80 border-zinc-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
          />
          
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:ring-amber-500"
          >
            <option value="all">Todo el tiempo</option>
            <option value="month">Último mes</option>
            <option value="quarter">Últimos 3 meses</option>
            <option value="year">Último año</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:ring-amber-500"
          >
            <option value="appointmentCount">Más citas</option>
            <option value="totalSpent">Mayor gasto</option>
            <option value="lastVisit">Última visita</option>
            <option value="name">Nombre A-Z</option>
          </select>
          
          <Button variant="secondary">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>
      </Card>

      {/* Clients List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAndSortedClients.map((client) => (
          <Card
            key={client.id}
            className="bg-zinc-800/80 border-zinc-700 hover:border-zinc-600 transition-colors cursor-pointer"
            onClick={() => setSelectedClient(client)}
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {client.name ? client.name.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{client.name || 'Cliente sin nombre'}</h3>
                    <div className="flex items-center gap-2">
                      {client.isVip && (
                        <div className="flex items-center gap-1 text-xs text-amber-400">
                          <Star className="w-3 h-3 fill-current" />
                          <span>VIP</span>
                        </div>
                      )}
                      {client.daysSinceLastVisit !== null && client.daysSinceLastVisit <= 7 && (
                        <div className="text-xs text-green-400">Reciente</div>
                      )}
                    </div>
                  </div>
                </div>
                
                <Button size="sm" variant="ghost">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 text-sm">
                {client.email && (
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Phone className="w-4 h-4" />
                    <span>{client.phone}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-700">
                <div className="text-center">
                  <p className="text-lg font-bold text-white">{client.appointmentCount}</p>
                  <p className="text-xs text-zinc-400">Citas</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-400">
                    {formatCurrency(client.totalSpent)}
                  </p>
                  <p className="text-xs text-zinc-400">Total gastado</p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Última visita:</span>
                  <span className="text-zinc-400">{formatDate(client.lastVisit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Servicio favorito:</span>
                  <span className="text-zinc-400 truncate ml-2">{client.favoriteService}</span>
                </div>
                {client.avgSpent > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Promedio por cita:</span>
                    <span className="text-zinc-400">{formatCurrency(client.avgSpent)}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredAndSortedClients.length === 0 && !loading && (
        <Card className="bg-zinc-800/50 text-center py-12">
          <Users className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-400 mb-2">
            No se encontraron clientes
          </h3>
          <p className="text-zinc-500">
            {searchTerm 
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Los clientes aparecerán aquí cuando se registren'
            }
          </p>
        </Card>
      )}

      {/* Client Detail Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl bg-zinc-800 border-zinc-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {selectedClient.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{selectedClient.name}</h2>
                  <div className="flex items-center gap-2">
                    {selectedClient.isVip && (
                      <div className="flex items-center gap-1 text-xs text-amber-400">
                        <Star className="w-3 h-3 fill-current" />
                        <span>Cliente VIP</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedClient(null)}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-6">
              {/* Contact & Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-white">Información de Contacto</h3>
                  {selectedClient.email && (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Mail className="w-4 h-4" />
                      <span>{selectedClient.email}</span>
                    </div>
                  )}
                  {selectedClient.phone && (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Phone className="w-4 h-4" />
                      <span>{selectedClient.phone}</span>
                    </div>
                  )}
                  {selectedClient.createdAt && (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Calendar className="w-4 h-4" />
                      <span>Cliente desde {formatDate(selectedClient.createdAt)}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-white">Estadísticas</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Total de citas:</span>
                      <span className="text-white font-semibold">{selectedClient.appointmentCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Total gastado:</span>
                      <span className="text-green-400 font-semibold">
                        {formatCurrency(selectedClient.totalSpent)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Promedio por cita:</span>
                      <span className="text-white font-semibold">
                        {formatCurrency(selectedClient.avgSpent)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Última visita:</span>
                      <span className="text-white font-semibold">
                        {formatDate(selectedClient.lastVisit)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Favorite Service */}
              <div>
                <h3 className="font-semibold text-white mb-3">Servicio Favorito</h3>
                <div className="bg-zinc-700/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <span className="text-white font-semibold">{selectedClient.favoriteService}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-zinc-700">
                <Button className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  Nueva Cita
                </Button>
                <Button variant="secondary" className="flex-1">
                  <Phone className="w-4 h-4 mr-2" />
                  Contactar
                </Button>
              </div>
            </div>
          </Card>
        </div>
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
  );
};

export default ClientsAnalytics;
