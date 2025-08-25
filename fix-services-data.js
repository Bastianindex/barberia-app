// Script para verificar y corregir servicios sin duration
// Ejecutar en la consola del navegador

const fixServicesData = async () => {
  try {
    console.log('🔧 Verificando y corrigiendo servicios...');
    
    const { collection, getDocs, updateDoc, doc, getFirestore } = window.firebase.firestore;
    const db = getFirestore();

    // Obtener todos los servicios
    const servicesSnapshot = await getDocs(collection(db, 'services'));
    const services = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`📋 Encontrados ${services.length} servicios`);
    
    for (const service of services) {
      const updates = {};
      let needsUpdate = false;
      
      // Agregar duration si no existe
      if (!service.duration) {
        updates.duration = 30; // Default 30 minutos
        needsUpdate = true;
        console.log(`⏱️  Agregando duration a servicio: ${service.name}`);
      }
      
      // Agregar precio si no existe
      if (!service.price) {
        updates.price = 15000; // Precio default
        needsUpdate = true;
        console.log(`💰 Agregando precio a servicio: ${service.name}`);
      }
      
      // Agregar campos faltantes
      if (!service.isActive) {
        updates.isActive = true;
        needsUpdate = true;
      }
      
      if (!service.description) {
        updates.description = `Servicio de ${service.name}`;
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
        console.log(`✅ Servicio ${service.name} actualizado`);
      }
    }
    
    console.log('🎉 ¡Corrección de servicios completada!');
    console.log('🔄 Recarga la página para ver los cambios');
    
  } catch (error) {
    console.error('❌ Error corrigiendo servicios:', error);
  }
};

// Ejecutar
fixServicesData();
