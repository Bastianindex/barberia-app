import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  ChevronLeft, 
  LogOut, 
  Edit2, 
  CheckCircle2, 
  Clock3,
  Scissors
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';
import { getAppointmentsByClient, updateDocument } from '../services/firestoreService';
import { COLLECTIONS } from '../constants';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/LoadingSpinner';

const ClientProfile = () => {
  const navigate = useNavigate();
  const { userData, logout, userId } = useAuth();
  const { showSuccess, showError } = useNotification();
  
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    name: '',
    phone: ''
  });

  useEffect(() => {
    if (userData) {
      setEditValues({
        name: userData.name || '',
        phone: userData.phone || ''
      });
      loadAppointments();
    }
  }, [userData]);

  const loadAppointments = async () => {
    if (!userId) return;
    try {
      const result = await getAppointmentsByClient(userId);
      if (result.success) {
        setAppointments(result.data);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await updateDocument(COLLECTIONS.CLIENTS, userId, {
        name: editValues.name,
        phone: editValues.phone
      });
      
      if (result.success) {
        showSuccess('Perfil actualizado correctamente');
        setIsEditing(false);
      } else {
        showError('No se pudo actualizar el perfil');
      }
    } catch (error) {
      showError('Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading && appointments.length === 0) {
    return <LoadingSpinner fullScreen type="barbershop" message="Cargando tu perfil..." />;
  }

  const pendingAppointments = appointments.filter(apt => apt.status === 'confirmed' || apt.status === 'pending');
  const pastAppointments = appointments.filter(apt => apt.status === 'completed');

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/select-service')}
            className="text-zinc-400 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Volver a Servicios
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Cerrar Sesión
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="glass-card text-center p-8">
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 bg-gradient-to-br from-brand-amber-400 to-brand-amber-600 rounded-full flex items-center justify-center shadow-glow">
                  <User className="w-12 h-12 text-zinc-950" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">{userData?.name}</h2>
              <p className="text-brand-amber-500 text-sm font-semibold uppercase tracking-widest">Cliente Olimu</p>
            </Card>

            <Card className="glass-card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Mis Datos</h3>
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-brand-amber-500 hover:text-brand-amber-400 transition-colors"
                >
                  {isEditing ? 'Cancelar' : <Edit2 className="w-4 h-4" />}
                </button>
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <Input 
                    label="Nombre"
                    value={editValues.name}
                    onChange={(e) => setEditValues({...editValues, name: e.target.value})}
                    icon={User}
                  />
                  <Input 
                    label="Teléfono"
                    value={editValues.phone}
                    onChange={(e) => setEditValues({...editValues, phone: e.target.value})}
                    icon={Phone}
                  />
                  <Button type="submit" fullWidth loading={loading}>
                    Guardar Cambios
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-zinc-400">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm truncate">{userData?.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-400">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{userData?.phone || 'No registrado'}</span>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Appointments */}
          <div className="lg:col-span-2 space-y-8">
            {/* Pending Appointments */}
            <section>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Clock3 className="w-5 h-5 text-brand-amber-500" />
                Citas Pendientes
              </h3>
              <div className="space-y-4">
                {pendingAppointments.length > 0 ? (
                  pendingAppointments.map(apt => (
                    <Card key={apt.id} className="bg-zinc-900 border-zinc-800 border-l-4 border-l-brand-amber-500">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center">
                            <Scissors className="w-6 h-6 text-brand-amber-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white">{apt.serviceName}</h4>
                            <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {apt.appointmentDate}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {apt.appointmentTime}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right hidden md:block">
                            <p className="text-lg font-bold text-white">${apt.servicePrice?.toLocaleString()}</p>
                            <span className="text-[10px] uppercase tracking-wider text-brand-amber-500 font-bold">Confirmada</span>
                          </div>
                          <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-red-400">
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <p className="text-zinc-500 text-center py-8 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
                    No tienes citas pendientes actualmente.
                  </p>
                )}
              </div>
            </section>

            {/* Visit History */}
            <section>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Historial de Visitas
              </h3>
              <div className="space-y-3">
                {pastAppointments.length > 0 ? (
                  pastAppointments.map(apt => (
                    <div key={apt.id} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{apt.serviceName}</p>
                          <p className="text-[10px] text-zinc-500">{apt.appointmentDate} • {apt.appointmentTime}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-zinc-300">${apt.servicePrice?.toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-500 text-sm">Aún no tienes visitas registradas.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;
