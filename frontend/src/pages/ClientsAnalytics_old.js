// frontend/src/pages/ClientsAnalytics.js
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Star,
  Phone,
  Mail,
  DollarSign,
  UserCheck,
  BarChart3,
  Search
} from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const ClientsAnalytics = () => {
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all'); // all, month, quarter, year
  const [sortBy, setSortBy] = useState('appointmentCount'); // appointmentCount, totalSpent, lastVisit

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Obtener clientes
      const clientsSnapshot = await getDocs(collection(db, 'clients'));
      const clientsData = clientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Obtener citas
      const appointmentsSnapshot = await getDocs(collection(db, 'appointments'));
      const appointmentsData = appointmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Obtener servicios
      const servicesSnapshot = await getDocs(collection(db, 'services'));
      const servicesData = servicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setClients(clientsData);
      setAppointments(appointmentsData);
      setServices(servicesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Procesar datos de clientes con estadísticas
  const processedClients = clients.map(client => {
    // Buscar citas del cliente usando múltiples criterios para mayor compatibilidad
    const clientAppointments = appointments.filter(apt => 
      apt.clientId === client.id || // Relación por ID (nueva estructura)
      apt.clientPhone === client.phone || // Relación por teléfono (estructura antigua)
      apt.clientName === client.name // Relación por nombre (fallback)
    );

    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    let filteredAppointments = clientAppointments;
    if (filterPeriod === 'month') {
      filteredAppointments = clientAppointments.filter(apt => new Date(apt.date) >= oneMonthAgo);
    } else if (filterPeriod === 'quarter') {
      filteredAppointments = clientAppointments.filter(apt => new Date(apt.date) >= threeMonthsAgo);
    } else if (filterPeriod === 'year') {
      filteredAppointments = clientAppointments.filter(apt => new Date(apt.date) >= oneYearAgo);
    }

    const completedAppointments = filteredAppointments.filter(apt => apt.status === 'completed');
    const totalSpent = completedAppointments.reduce((sum, apt) => {
      // Buscar servicio por ID primero, luego por nombre
      const service = services.find(s => 
        s.id === apt.serviceId || s.name === apt.serviceName || s.name === apt.service
      );
      // Usar precio almacenado en la cita (histórico) o precio actual del servicio
      return sum + (apt.servicePrice || apt.totalAmount || service?.price || 0);
    }, 0);

    const lastVisit = clientAppointments.length > 0 
      ? Math.max(...clientAppointments.map(apt => new Date(apt.date).getTime()))
      : null;

    const firstVisit = clientAppointments.length > 0 
      ? Math.min(...clientAppointments.map(apt => new Date(apt.date).getTime()))
      : new Date(client.createdAt || client.registeredAt || client.firstVisit).getTime();

    const daysSinceFirstVisit = Math.floor((now.getTime() - firstVisit) / (1000 * 60 * 60 * 24));
    const daysSinceLastVisit = lastVisit ? Math.floor((now.getTime() - lastVisit) / (1000 * 60 * 60 * 24)) : null;

    // Calcular frecuencia de visitas
    const avgDaysBetweenVisits = clientAppointments.length > 1 
      ? daysSinceFirstVisit / (clientAppointments.length - 1)
      : null;

    // Servicios más utilizados
    const serviceUsage = {};
    completedAppointments.forEach(apt => {
      // Usar nombre del servicio de la cita o buscar por ID
      const serviceName = apt.serviceName || apt.service || 
        services.find(s => s.id === apt.serviceId)?.name || 'Servicio desconocido';
      serviceUsage[serviceName] = (serviceUsage[serviceName] || 0) + 1;
    });
    const favoriteService = Object.keys(serviceUsage).reduce((a, b) => 
      serviceUsage[a] > serviceUsage[b] ? a : b, Object.keys(serviceUsage)[0]);

    return {
      ...client,
      appointmentCount: filteredAppointments.length,
      completedAppointments: completedAppointments.length,
      totalSpent,
      lastVisit: lastVisit ? new Date(lastVisit) : null,
      firstVisit: new Date(firstVisit),
      daysSinceFirstVisit,
      daysSinceLastVisit,
      avgDaysBetweenVisits,
      favoriteService: favoriteService || 'N/A',
      isFrequent: completedAppointments.length >= 5,
      isVIP: totalSpent >= 200000, // VIP si ha gastado más de $200,000
      isRecent: daysSinceLastVisit !== null && daysSinceLastVisit <= 30,
      loyalty: completedAppointments.length >= 10 ? 'Alto' : 
               completedAppointments.length >= 5 ? 'Medio' : 'Bajo'
    };
  });

  // Filtrar y ordenar clientes
  const filteredClients = processedClients
    .filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'appointmentCount':
          return b.appointmentCount - a.appointmentCount;
        case 'totalSpent':
          return b.totalSpent - a.totalSpent;
        case 'lastVisit':
          if (!a.lastVisit && !b.lastVisit) return 0;
          if (!a.lastVisit) return 1;
          if (!b.lastVisit) return -1;
          return b.lastVisit.getTime() - a.lastVisit.getTime();
        default:
          return 0;
      }
    });

  // Estadísticas generales
  const totalClients = clients.length;
  const activeClients = processedClients.filter(c => c.isRecent).length;
  const vipClients = processedClients.filter(c => c.isVIP).length;
  const avgAppointments = totalClients > 0 
    ? (processedClients.reduce((sum, c) => sum + c.appointmentCount, 0) / totalClients).toFixed(1)
    : 0;
  const totalRevenue = processedClients.reduce((sum, c) => sum + c.totalSpent, 0);

  if (loading) {
    return (
      <div className="bg-zinc-800 p-8 rounded-2xl shadow-xl border border-zinc-700">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-800 p-6 rounded-2xl shadow-xl border border-zinc-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-amber-400" />
            <h2 className="text-3xl font-bold text-white">Análisis de Clientes</h2>
          </div>
          <div className="flex gap-4">
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="bg-zinc-700 text-white px-4 py-2 rounded-lg border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Todo el tiempo</option>
              <option value="month">Último mes</option>
              <option value="quarter">Últimos 3 meses</option>
              <option value="year">Último año</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-zinc-700 text-white px-4 py-2 rounded-lg border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="appointmentCount">Por citas</option>
              <option value="totalSpent">Por gasto total</option>
              <option value="lastVisit">Por última visita</option>
            </select>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-400" />
            <div>
              <p className="text-zinc-400 text-sm">Total Clientes</p>
              <p className="text-2xl font-bold text-white">{totalClients}</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700">
          <div className="flex items-center gap-3">
            <UserCheck className="w-6 h-6 text-green-400" />
            <div>
              <p className="text-zinc-400 text-sm">Clientes Activos</p>
              <p className="text-2xl font-bold text-white">{activeClients}</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700">
          <div className="flex items-center gap-3">
            <Star className="w-6 h-6 text-amber-400" />
            <div>
              <p className="text-zinc-400 text-sm">Clientes VIP</p>
              <p className="text-2xl font-bold text-white">{vipClients}</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-purple-400" />
            <div>
              <p className="text-zinc-400 text-sm">Promedio Citas</p>
              <p className="text-2xl font-bold text-white">{avgAppointments}</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-green-500" />
            <div>
              <p className="text-zinc-400 text-sm">Revenue Total</p>
              <p className="text-2xl font-bold text-white">${totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="bg-zinc-800 rounded-2xl shadow-xl border border-zinc-700 overflow-hidden">
        <div className="p-6 border-b border-zinc-700">
          <h3 className="text-xl font-bold text-white">Detalle de Clientes ({filteredClients.length})</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Cliente</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Contacto</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Estadísticas</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Historial</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Valor</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-zinc-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                        <span className="text-black font-bold text-sm">
                          {client.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{client.name}</p>
                        <div className="flex gap-2 mt-1">
                          {client.isVIP && (
                            <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                              VIP
                            </span>
                          )}
                          {client.isFrequent && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                              Frecuente
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-zinc-300">
                        <Phone className="w-4 h-4" />
                        {client.phone}
                      </div>
                      {client.email && (
                        <div className="flex items-center gap-2 text-sm text-zinc-300">
                          <Mail className="w-4 h-4" />
                          {client.email}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="space-y-1 text-sm">
                      <div className="text-white">{client.appointmentCount} citas</div>
                      <div className="text-zinc-400">{client.completedAppointments} completadas</div>
                      <div className="text-zinc-400">
                        Lealtad: <span className={`font-medium ${
                          client.loyalty === 'Alto' ? 'text-green-400' :
                          client.loyalty === 'Medio' ? 'text-yellow-400' : 'text-red-400'
                        }`}>{client.loyalty}</span>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="space-y-1 text-sm">
                      <div className="text-white">
                        Cliente desde: {Math.floor(client.daysSinceFirstVisit / 30)} meses
                      </div>
                      {client.lastVisit && (
                        <div className="text-zinc-400">
                          Última visita: {client.daysSinceLastVisit} días
                        </div>
                      )}
                      <div className="text-zinc-400">Servicio favorito: {client.favoriteService}</div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-lg font-bold text-green-400">
                      ${client.totalSpent.toLocaleString()}
                    </div>
                    {client.avgDaysBetweenVisits && (
                      <div className="text-sm text-zinc-400">
                        Frecuencia: cada {Math.round(client.avgDaysBetweenVisits)} días
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        client.isRecent 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {client.isRecent ? 'Activo' : 'Inactivo'}
                      </span>
                      
                      {client.daysSinceLastVisit !== null && client.daysSinceLastVisit > 60 && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                          Reactivar
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredClients.length === 0 && (
          <div className="text-center py-12 text-zinc-400">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No se encontraron clientes que coincidan con la búsqueda</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientsAnalytics;
