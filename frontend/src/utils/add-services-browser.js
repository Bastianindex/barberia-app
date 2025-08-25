// Simple script to add basic services to Firebase
// Run this from the browser console on the barbershop app

const addBasicServices = async () => {
  console.log('🚀 Adding basic services to Firebase...');
  
  const services = [
    {
      name: 'Corte Clásico',
      price: 15000,
      duration: 30,
      description: 'Corte tradicional de cabello con estilo clásico',
      category: 'cortes',
      isActive: true
    },
    {
      name: 'Corte + Barba',
      price: 25000,
      duration: 45,
      description: 'Corte de cabello completo con arreglo de barba',
      category: 'combos',
      isActive: true
    },
    {
      name: 'Afeitado Tradicional',
      price: 18000,
      duration: 30,
      description: 'Afeitado clásico con navaja y toalla caliente',
      category: 'afeitado',
      isActive: true
    },
    {
      name: 'Corte Premium',
      price: 35000,
      duration: 60,
      description: 'Corte premium con lavado, masaje y styling',
      category: 'premium',
      isActive: true
    }
  ];

  // This code should be run in the browser console
  // where Firebase is already initialized
  try {
    const { collection, addDoc } = await import('firebase/firestore');
    const { db } = window; // Assuming db is available globally
    
    for (const service of services) {
      const docRef = await addDoc(collection(db, 'services'), service);
      console.log(`✅ Service added: ${service.name} with ID: ${docRef.id}`);
    }
    
    console.log('🎉 All services added successfully!');
  } catch (error) {
    console.error('❌ Error adding services:', error);
  }
};

// To use: Copy this function and run addBasicServices() in browser console
console.log('📋 Copy the addBasicServices function and run it in the browser console');
