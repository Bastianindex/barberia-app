// frontend/src/pages/BusinessSettings.js
import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Save, 
  Calendar, 
  Shield, 
  Settings as SettingsIcon,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useNotification } from '../hooks/useNotification';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/LoadingSpinner';
import Notification from '../components/Notification';

const BusinessSettings = () => {
  const { notification, showSuccess, showError, hideNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    workingHours: {
      start: 9,
      end: 19
    },
    bookingConfig: {
      slotInterval: 30, // minutos
      maxDaysAhead: 14,
      allowSameDayBooking: true
    },
    businessInfo: {
      name: 'Olimu Barbershop',
      phone: '',
      address: ''
    }
  });

  // Cargar configuración desde Firestore
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsRef = doc(db, 'settings', 'business');
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists()) {
          setSettings(settingsSnap.data());
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        showError('No se pudo cargar la configuración');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [showError]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsRef = doc(db, 'settings', 'business');
      await setDoc(settingsRef, {
        ...settings,
        updatedAt: new Date().toISOString()
      });
      showSuccess('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving settings:', error);
      showError('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner type="barbershop" message="Cargando configuración..." />;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-amber-500" />
            Configuración del Negocio
          </h1>
          <p className="text-zinc-400">Gestiona tus horarios y reglas de reserva</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/20"
        >
          {saving ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Guardando...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Guardar Cambios
            </div>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Horarios de Trabajo */}
        <Card className="bg-zinc-800/80 border-zinc-700 h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
            <h2 className="text-xl font-semibold text-white">Horario de Atención</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Hora de Apertura</label>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={settings.workingHours.start}
                  onChange={(e) => setSettings({
                    ...settings,
                    workingHours: { ...settings.workingHours, start: parseInt(e.target.value) }
                  })}
                  placeholder="Ej: 9"
                  className="bg-zinc-700/50"
                />
                <div className="flex items-center text-zinc-500 text-sm italic">
                  Format 24h (9 = 9:00 AM)
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Hora de Cierre</label>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={settings.workingHours.end}
                  onChange={(e) => setSettings({
                    ...settings,
                    workingHours: { ...settings.workingHours, end: parseInt(e.target.value) }
                  })}
                  placeholder="Ej: 19"
                  className="bg-zinc-700/50"
                />
                <div className="flex items-center text-zinc-500 text-sm italic">
                  Format 24h (19 = 7:00 PM)
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-xs text-zinc-400">
                Estos horarios definen el rango de citas que los clientes pueden ver. 
                Los cambios se aplican instantáneamente a las nuevas búsquedas.
              </p>
            </div>
          </div>
        </Card>

        {/* Configuración de Reservas */}
        <Card className="bg-zinc-800/80 border-zinc-700 h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-500" />
            </div>
            <h2 className="text-xl font-semibold text-white">Reglas de Reserva</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Intervalo entre Citas (min)</label>
              <select 
                value={settings.bookingConfig.slotInterval}
                onChange={(e) => setSettings({
                  ...settings,
                  bookingConfig: { ...settings.bookingConfig, slotInterval: parseInt(e.target.value) }
                })}
                className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>1 hora</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Días de anticipación máxima</label>
              <Input
                type="number"
                value={settings.bookingConfig.maxDaysAhead}
                onChange={(e) => setSettings({
                  ...settings,
                  bookingConfig: { ...settings.bookingConfig, maxDaysAhead: parseInt(e.target.value) }
                })}
                className="bg-zinc-700/50"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-700/30 rounded-lg border border-zinc-600">
              <div>
                <p className="text-sm font-medium text-white">Permitir reservas el mismo día</p>
                <p className="text-xs text-zinc-500">Los clientes pueden agendar para hoy</p>
              </div>
              <input 
                type="checkbox"
                checked={settings.bookingConfig.allowSameDayBooking}
                onChange={(e) => setSettings({
                  ...settings,
                  bookingConfig: { ...settings.bookingConfig, allowSameDayBooking: e.target.checked }
                })}
                className="w-5 h-5 accent-amber-500"
              />
            </div>
          </div>
        </Card>

        {/* Información Pública */}
        <Card className="bg-zinc-800/80 border-zinc-700 md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Shield className="w-6 h-6 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold text-white">Información del Negocio</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Nombre de la Barbería"
              value={settings.businessInfo.name}
              onChange={(e) => setSettings({
                ...settings,
                businessInfo: { ...settings.businessInfo, name: e.target.value }
              })}
              className="bg-zinc-700/50"
            />
            <Input
              label="Teléfono de Contacto"
              value={settings.businessInfo.phone}
              onChange={(e) => setSettings({
                ...settings,
                businessInfo: { ...settings.businessInfo, phone: e.target.value }
              })}
              className="bg-zinc-700/50"
            />
          </div>
        </Card>
      </div>

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

export default BusinessSettings;
