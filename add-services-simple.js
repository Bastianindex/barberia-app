// Script simple para agregar servicios de ejemplo a Firebase
// Ejecutar en la consola del navegador de tu aplicación

const addServices = async () => {
  try {
    // Importar Firebase (debe estar disponible en la ventana del navegador)
    const { collection, addDoc, getFirestore } = window.firebase.firestore;
    const db = getFirestore();

    const services = [
      {
        name: 'Corte Clásico',
        description: 'Corte tradicional con tijeras y máquina',
        price: 15000,
        duration: 30,
        isActive: true
      },
      {
        name: 'Corte + Barba',
        description: 'Corte completo más arreglo de barba',
        price: 25000,
        duration: 45,
        isActive: true
      },
      {
        name: 'Afeitado Tradicional',
        description: 'Afeitado clásico con navaja y espuma caliente',
        price: 18000,
        duration: 30,
        isActive: true
      },
      {
        name: 'Corte Premium',
        description: 'Corte premium con lavado y peinado',
        price: 35000,
        duration: 60,
        isActive: true
      },
      {
        name: 'Tratamiento Capilar',
        description: 'Tratamiento para el cuidado del cabello',
        price: 40000,
        duration: 45,
        isActive: true
      }
    ];

    console.log('Agregando servicios...');
    
    for (const service of services) {
      await addDoc(collection(db, 'services'), {
        ...service,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    console.log('✅ Servicios agregados exitosamente!');
    
  } catch (error) {
    console.error('❌ Error agregando servicios:', error);
  }
};

// Ejecutar
addServices();
