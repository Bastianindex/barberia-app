// Script para limpiar datos ficticios y agregar servicios reales
// Para ejecutar en la consola del navegador (F12)

const cleanAndSetupDatabase = async () => {
  console.log('🧹 Iniciando limpieza de base de datos...');
  
  try {
    // Obtener referencias a las colecciones
    const appointmentsRef = window.db ? 
      window.firebase.collection(window.db, 'appointments') : 
      firebase.firestore().collection('appointments');
    
    const clientsRef = window.db ? 
      window.firebase.collection(window.db, 'clients') : 
      firebase.firestore().collection('clients');
    
    const servicesRef = window.db ? 
      window.firebase.collection(window.db, 'services') : 
      firebase.firestore().collection('services');

    // 1. Limpiar appointments
    console.log('🗑️ Eliminando citas ficticias...');
    const appointmentsSnapshot = await window.firebase.getDocs(appointmentsRef);
    const appointmentDeletes = appointmentsSnapshot.docs.map(doc => 
      window.firebase.deleteDoc(doc.ref)
    );
    await Promise.all(appointmentDeletes);
    console.log(`✅ ${appointmentsSnapshot.size} citas eliminadas`);

    // 2. Limpiar clients
    console.log('🗑️ Eliminando clientes ficticios...');
    const clientsSnapshot = await window.firebase.getDocs(clientsRef);
    const clientDeletes = clientsSnapshot.docs.map(doc => 
      window.firebase.deleteDoc(doc.ref)
    );
    await Promise.all(clientDeletes);
    console.log(`✅ ${clientsSnapshot.size} clientes eliminados`);

    // 3. Limpiar servicios existentes
    console.log('🗑️ Eliminando servicios existentes...');
    const servicesSnapshot = await window.firebase.getDocs(servicesRef);
    const serviceDeletes = servicesSnapshot.docs.map(doc => 
      window.firebase.deleteDoc(doc.ref)
    );
    await Promise.all(serviceDeletes);
    console.log(`✅ ${servicesSnapshot.size} servicios eliminados`);

    // 4. Agregar servicios reales de barbería
    console.log('✨ Agregando servicios reales...');
    const realServices = [
      {
        name: 'Corte Clásico',
        description: 'Corte tradicional de cabello masculino con tijera y máquina',
        price: 15000,
        durationMinutes: 30,
        category: 'cortes',
        isActive: true
      },
      {
        name: 'Corte + Barba',
        description: 'Corte de cabello completo más arreglo y perfilado de barba',
        price: 25000,
        durationMinutes: 45,
        category: 'combos',
        isActive: true
      },
      {
        name: 'Afeitado Tradicional',
        description: 'Afeitado clásico con navaja, toalla caliente y aftershave',
        price: 18000,
        durationMinutes: 30,
        category: 'afeitado',
        isActive: true
      },
      {
        name: 'Corte Premium',
        description: 'Corte premium con lavado, masaje capilar y styling',
        price: 35000,
        durationMinutes: 60,
        category: 'premium',
        isActive: true
      },
      {
        name: 'Corte Degradado',
        description: 'Corte moderno con degradado y acabados perfectos',
        price: 20000,
        durationMinutes: 35,
        category: 'cortes',
        isActive: true
      },
      {
        name: 'Barba Completa',
        description: 'Arreglo completo de barba con perfilado y cuidado',
        price: 15000,
        durationMinutes: 25,
        category: 'afeitado',
        isActive: true
      },
      {
        name: 'Corte + Barba + Cejas',
        description: 'Servicio completo: corte, barba y arreglo de cejas',
        price: 30000,
        durationMinutes: 50,
        category: 'combos',
        isActive: true
      },
      {
        name: 'Tratamiento Capilar',
        description: 'Tratamiento hidratante y fortalecedor para el cabello',
        price: 25000,
        durationMinutes: 40,
        category: 'tratamientos',
        isActive: true
      }
    ];

    // Agregar cada servicio
    for (const service of realServices) {
      await window.firebase.addDoc(servicesRef, service);
      console.log(`✅ Servicio agregado: ${service.name}`);
    }

    console.log('🎉 ¡Base de datos limpia y configurada!');
    console.log(`📊 Servicios agregados: ${realServices.length}`);
    console.log('💡 Ahora puedes comenzar a registrar clientes reales desde la aplicación');

  } catch (error) {
    console.error('❌ Error:', error);
  }
};

// Instrucciones para ejecutar
console.log('📋 Para limpiar la base de datos y agregar servicios reales:');
console.log('1. Abre la aplicación en el navegador');
console.log('2. Abre las herramientas de desarrollador (F12)');
console.log('3. Ve a la pestaña Console');
console.log('4. Ejecuta: cleanAndSetupDatabase()');

// Exportar la función para uso
window.cleanAndSetupDatabase = cleanAndSetupDatabase;
