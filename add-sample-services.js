// Script para agregar servicios de ejemplo a Firebase
// Ejecutar en la consola del navegador en tu aplicación

const addSampleServices = async () => {
  const services = [
    {
      id: '1',
      name: 'Corte Clásico',
      description: 'Corte tradicional con tijeras y máquina',
      price: 15000,
      duration: 30,
      isActive: true
    },
    {
      id: '2', 
      name: 'Corte + Barba',
      description: 'Corte completo más arreglo de barba',
      price: 25000,
      duration: 45,
      isActive: true
    },
    {
      id: '3',
      name: 'Afeitado Tradicional', 
      description: 'Afeitado clásico con navaja y espuma caliente',
      price: 18000,
      duration: 30,
      isActive: true
    },
    {
      id: '4',
      name: 'Corte Premium',
      description: 'Corte premium con lavado y peinado',
      price: 35000,
      duration: 60,
      isActive: true
    },
    {
      id: '5',
      name: 'Tratamiento Capilar',
      description: 'Tratamiento para el cuidado del cabello', 
      price: 40000,
      duration: 45,
      isActive: true
    }
  ];

  // Importar Firebase
  const { collection, addDoc, getFirestore } = window.firebase.firestore;
  const db = getFirestore();

  try {
    for (const service of services) {
      const docRef = await addDoc(collection(db, 'services'), service);
      console.log('Servicio agregado con ID:', docRef.id);
    }
    console.log('Todos los servicios han sido agregados exitosamente!');
  } catch (error) {
    console.error('Error agregando servicios:', error);
  }
};

// Llamar la función
addSampleServices();
