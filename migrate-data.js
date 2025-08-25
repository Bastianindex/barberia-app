// Script para migrar datos existentes y mejorar la estructura
// Ejecutar en la consola del navegador después de cargar la aplicación

const migrateAndImproveData = async () => {
  try {
    console.log('🚀 Iniciando migración y mejora de datos...');
    
    // Importar Firebase (debe estar disponible en el navegador)
    const { collection, getDocs, doc, updateDoc, addDoc, query, where, getFirestore } = window.firebase.firestore;
    const db = getFirestore();

    // 1. MIGRAR CLIENTES - Agregar campos faltantes
    console.log('📝 Migrando estructura de clientes...');
    const clientsSnapshot = await getDocs(collection(db, 'clients'));
    const clients = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    for (const client of clients) {
      const updates = {};
      let needsUpdate = false;
      
      // Agregar campos nuevos si no existen
      if (!client.totalAppointments) {
        updates.totalAppointments = 0;
        needsUpdate = true;
      }
      if (!client.completedAppointments) {
        updates.completedAppointments = 0;
        needsUpdate = true;
      }
      if (!client.cancelledAppointments) {
        updates.cancelledAppointments = 0;
        needsUpdate = true;
      }
      if (!client.totalSpent) {
        updates.totalSpent = 0;
        needsUpdate = true;
      }
      if (!client.status) {
        updates.status = 'active';
        needsUpdate = true;
      }
      if (!client.loyaltyLevel) {
        updates.loyaltyLevel = 'regular';
        needsUpdate = true;
      }
      if (!client.notifications) {
        updates.notifications = {
          email: !!client.email,
          sms: true,
          whatsapp: true
        };
        needsUpdate = true;
      }
      if (!client.firstVisit) {
        updates.firstVisit = client.createdAt || client.registeredAt || new Date().toISOString();
        needsUpdate = true;
      }
      if (!client.updatedAt) {
        updates.updatedAt = new Date().toISOString();
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await updateDoc(doc(db, 'clients', client.id), updates);
        console.log(`✅ Cliente ${client.name} migrado`);
      }
    }

    // 2. MIGRAR CITAS - Agregar relaciones por ID y campos faltantes
    console.log('📅 Migrando estructura de citas...');
    const appointmentsSnapshot = await getDocs(collection(db, 'appointments'));
    const appointments = appointmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    for (const appointment of appointments) {
      const updates = {};
      let needsUpdate = false;
      
      // Agregar clientId si no existe
      if (!appointment.clientId && appointment.clientPhone) {
        const clientQuery = query(
          collection(db, 'clients'),
          where('phone', '==', appointment.clientPhone)
        );
        const clientSnapshot = await getDocs(clientQuery);
        
        if (!clientSnapshot.empty) {
          updates.clientId = clientSnapshot.docs[0].id;
          needsUpdate = true;
        }
      }
      
      // Normalizar status
      if (appointment.status === 'Pendiente') {
        updates.status = 'pending';
        needsUpdate = true;
      }
      if (appointment.status === 'Completado') {
        updates.status = 'completed';
        needsUpdate = true;
      }
      if (appointment.status === 'Cancelado') {
        updates.status = 'cancelled';
        needsUpdate = true;
      }
      
      // Agregar campos faltantes
      if (!appointment.totalAmount && appointment.servicePrice) {
        updates.totalAmount = appointment.servicePrice;
        needsUpdate = true;
      }
      if (!appointment.paymentStatus) {
        updates.paymentStatus = 'pending';
        needsUpdate = true;
      }
      if (!appointment.notes) {
        updates.notes = '';
        needsUpdate = true;
      }
      if (!appointment.updatedAt) {
        updates.updatedAt = new Date().toISOString();
        needsUpdate = true;
      }
      
      // Normalizar nombres de servicios
      if (appointment.service && !appointment.serviceName) {
        updates.serviceName = appointment.service;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await updateDoc(doc(db, 'appointments', appointment.id), updates);
        console.log(`✅ Cita ${appointment.id} migrada`);
      }
    }

    // 3. MIGRAR SERVICIOS - Agregar estadísticas
    console.log('🔧 Migrando estructura de servicios...');
    const servicesSnapshot = await getDocs(collection(db, 'services'));
    const services = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    for (const service of services) {
      const updates = {};
      let needsUpdate = false;
      
      // Agregar campos de estadísticas si no existen
      if (!service.timesBooked) {
        // Calcular cuántas veces se ha reservado este servicio
        const serviceAppointments = appointments.filter(apt => 
          apt.serviceName === service.name || apt.service === service.name
        );
        updates.timesBooked = serviceAppointments.length;
        needsUpdate = true;
      }
      
      if (!service.completedBookings) {
        const completedCount = appointments.filter(apt => 
          (apt.serviceName === service.name || apt.service === service.name) && 
          apt.status === 'completed'
        ).length;
        updates.completedBookings = completedCount;
        needsUpdate = true;
      }
      
      if (!service.revenue) {
        const totalRevenue = appointments
          .filter(apt => 
            (apt.serviceName === service.name || apt.service === service.name) && 
            apt.status === 'completed'
          )
          .reduce((sum, apt) => sum + (apt.servicePrice || service.price || 0), 0);
        updates.revenue = totalRevenue;
        needsUpdate = true;
      }
      
      if (!service.category) {
        updates.category = 'general';
        needsUpdate = true;
      }
      
      if (!service.updatedAt) {
        updates.updatedAt = new Date().toISOString();
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await updateDoc(doc(db, 'services', service.id), updates);
        console.log(`✅ Servicio ${service.name} migrado`);
      }
    }

    // 4. RECALCULAR ESTADÍSTICAS DE CLIENTES
    console.log('📊 Recalculando estadísticas de clientes...');
    const updatedClientsSnapshot = await getDocs(collection(db, 'clients'));
    const updatedClients = updatedClientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    for (const client of updatedClients) {
      // Obtener todas las citas del cliente
      const clientAppointments = appointments.filter(apt => 
        apt.clientId === client.id || 
        apt.clientPhone === client.phone || 
        apt.clientName === client.name
      );
      
      if (clientAppointments.length > 0) {
        const completedAppointments = clientAppointments.filter(apt => apt.status === 'completed');
        const cancelledAppointments = clientAppointments.filter(apt => apt.status === 'cancelled');
        
        const totalSpent = completedAppointments.reduce((sum, apt) => 
          sum + (apt.servicePrice || apt.totalAmount || 0), 0
        );
        
        // Determinar nivel de lealtad
        let loyaltyLevel = 'regular';
        if (totalSpent >= 200000) loyaltyLevel = 'VIP';
        else if (completedAppointments.length >= 5) loyaltyLevel = 'frequent';
        
        // Servicio favorito
        const serviceUsage = {};
        completedAppointments.forEach(apt => {
          const serviceName = apt.serviceName || apt.service || 'Desconocido';
          serviceUsage[serviceName] = (serviceUsage[serviceName] || 0) + 1;
        });
        const favoriteService = Object.keys(serviceUsage).reduce((a, b) => 
          serviceUsage[a] > serviceUsage[b] ? a : b, Object.keys(serviceUsage)[0]) || null;
        
        // Fechas
        const dates = clientAppointments.map(apt => new Date(apt.date).getTime()).sort();
        const lastVisit = dates.length > 0 ? new Date(Math.max(...dates)).toISOString() : null;
        
        const statsUpdate = {
          totalAppointments: clientAppointments.length,
          completedAppointments: completedAppointments.length,
          cancelledAppointments: cancelledAppointments.length,
          totalSpent,
          loyaltyLevel,
          favoriteService,
          lastVisit,
          updatedAt: new Date().toISOString()
        };
        
        await updateDoc(doc(db, 'clients', client.id), statsUpdate);
        console.log(`📈 Estadísticas actualizadas para ${client.name}`);
      }
    }

    console.log('🎉 ¡Migración completada exitosamente!');
    console.log('📋 Resumen:');
    console.log(`   - ${clients.length} clientes procesados`);
    console.log(`   - ${appointments.length} citas procesadas`);
    console.log(`   - ${services.length} servicios procesados`);
    console.log('🔄 Recarga la página para ver los cambios en el análisis de clientes');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  }
};

// Ejecutar la migración
migrateAndImproveData();
