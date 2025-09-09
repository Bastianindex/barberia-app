/**
 * Script para verificar que TODAS las funcionalidades estén conectadas a Firebase
 */

import { 
  getAllClients, 
  getAllAppointments, 
  getActiveServices, 
  getBusinessAnalytics,
  createAppointment,
  updateDocument,
  deleteDocument
} from '../services/firestoreService';

/**
 * Verificar conectividad completa de la aplicación
 */
export const testFullConnectivity = async () => {
  console.log('🚀 INICIANDO VERIFICACIÓN COMPLETA DE CONECTIVIDAD...\n');
  
  const results = {
    clients: { status: 'pending', count: 0, error: null },
    appointments: { status: 'pending', count: 0, error: null },
    services: { status: 'pending', count: 0, error: null },
    analytics: { status: 'pending', data: null, error: null }
  };

  try {
    // 1. Verificar clientes
    console.log('📋 Verificando clientes...');
    const clientsResult = await getAllClients();
    if (clientsResult.success) {
      results.clients.status = 'success';
      results.clients.count = clientsResult.data.length;
      console.log(`✅ Clientes: ${clientsResult.data.length} registros`);
    } else {
      results.clients.status = 'error';
      results.clients.error = clientsResult.error;
      console.log(`❌ Error en clientes:`, clientsResult.error);
    }

    // 2. Verificar citas
    console.log('📅 Verificando citas...');
    const appointmentsResult = await getAllAppointments();
    if (appointmentsResult.success) {
      results.appointments.status = 'success';
      results.appointments.count = appointmentsResult.data.length;
      console.log(`✅ Citas: ${appointmentsResult.data.length} registros`);
    } else {
      results.appointments.status = 'error';
      results.appointments.error = appointmentsResult.error;
      console.log(`❌ Error en citas:`, appointmentsResult.error);
    }

    // 3. Verificar servicios
    console.log('✂️ Verificando servicios...');
    const servicesResult = await getActiveServices();
    if (servicesResult.success) {
      results.services.status = 'success';
      results.services.count = servicesResult.data.length;
      console.log(`✅ Servicios: ${servicesResult.data.length} activos`);
    } else {
      results.services.status = 'error';
      results.services.error = servicesResult.error;
      console.log(`❌ Error en servicios:`, servicesResult.error);
    }

    // 4. Verificar analytics
    console.log('📊 Verificando analytics...');
    const analyticsResult = await getBusinessAnalytics();
    if (analyticsResult.success) {
      results.analytics.status = 'success';
      results.analytics.data = analyticsResult.data;
      console.log(`✅ Analytics: configurado correctamente`);
    } else {
      results.analytics.status = 'error';
      results.analytics.error = analyticsResult.error;
      console.log(`❌ Error en analytics:`, analyticsResult.error);
    }

  } catch (error) {
    console.error('❌ Error general en verificación:', error);
  }

  // Resumen
  console.log('\n📊 RESUMEN DE CONECTIVIDAD:');
  console.log('============================');
  Object.entries(results).forEach(([key, result]) => {
    const status = result.status === 'success' ? '✅' : '❌';
    const info = result.count !== undefined ? `(${result.count} registros)` : '';
    console.log(`${status} ${key.toUpperCase()}: ${result.status} ${info}`);
  });

  const allConnected = Object.values(results).every(r => r.status === 'success');
  console.log(`\n🎯 ESTADO GENERAL: ${allConnected ? '✅ TOTALMENTE CONECTADO' : '⚠️ REVISAR ERRORES'}`);
  
  return results;
};

/**
 * Función para ejecutar desde la consola del navegador
 */
window.testConnectivity = testFullConnectivity;

export default testFullConnectivity;
