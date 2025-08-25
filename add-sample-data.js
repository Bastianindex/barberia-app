// Script para agregar datos de ejemplo (clientes y citas) a Firebase
// Ejecutar este código en la consola del navegador de tu aplicación

const addSampleData = async () => {
  try {
    // Importar Firebase (debe estar disponible en la ventana del navegador)
    const { collection, addDoc, getFirestore } = window.firebase.firestore;
    const db = getFirestore();

    // Servicios de ejemplo (asegúrate de que existan primero)
    const services = [
      { name: 'Corte Clásico', price: 15000 },
      { name: 'Corte + Barba', price: 25000 },
      { name: 'Afeitado Tradicional', price: 18000 },
      { name: 'Corte Premium', price: 35000 },
      { name: 'Tratamiento Capilar', price: 40000 }
    ];

    // Clientes de ejemplo
    const clients = [
      {
        name: 'Carlos Mendoza',
        phone: '+57 300 123 4567',
        email: 'carlos.mendoza@email.com',
        createdAt: new Date('2024-01-15').toISOString()
      },
      {
        name: 'Luis Rodriguez',
        phone: '+57 301 234 5678',
        email: 'luis.rodriguez@email.com',
        createdAt: new Date('2024-02-10').toISOString()
      },
      {
        name: 'Miguel Angel',
        phone: '+57 302 345 6789',
        email: 'miguel.angel@email.com',
        createdAt: new Date('2024-03-05').toISOString()
      },
      {
        name: 'Diego Suarez',
        phone: '+57 303 456 7890',
        email: 'diego.suarez@email.com',
        createdAt: new Date('2024-06-20').toISOString()
      },
      {
        name: 'Andrés Torres',
        phone: '+57 304 567 8901',
        email: 'andres.torres@email.com',
        createdAt: new Date('2024-11-01').toISOString()
      }
    ];

    console.log('Agregando clientes de ejemplo...');

    // Agregar clientes
    for (const client of clients) {
      await addDoc(collection(db, 'clients'), {
        ...client,
        updatedAt: new Date().toISOString()
      });
    }

    console.log('Clientes agregados. Agregando citas de ejemplo...');

    // Generar citas de ejemplo para los clientes
    const appointments = [];
    
    // Carlos Mendoza - Cliente VIP frecuente
    const carlosAppointments = [
      { date: '2024-01-20', service: 'Corte Premium', status: 'completed' },
      { date: '2024-02-15', service: 'Corte + Barba', status: 'completed' },
      { date: '2024-03-10', service: 'Tratamiento Capilar', status: 'completed' },
      { date: '2024-04-05', service: 'Corte Premium', status: 'completed' },
      { date: '2024-05-01', service: 'Corte + Barba', status: 'completed' },
      { date: '2024-06-12', service: 'Afeitado Tradicional', status: 'completed' },
      { date: '2024-07-20', service: 'Corte Premium', status: 'completed' },
      { date: '2024-08-15', service: 'Tratamiento Capilar', status: 'completed' },
      { date: '2024-09-10', service: 'Corte + Barba', status: 'completed' },
      { date: '2024-10-05', service: 'Corte Premium', status: 'completed' },
      { date: '2024-11-01', service: 'Corte + Barba', status: 'completed' },
      { date: '2024-12-15', service: 'Corte Premium', status: 'pending' }
    ];

    carlosAppointments.forEach(apt => {
      appointments.push({
        clientName: 'Carlos Mendoza',
        clientPhone: '+57 300 123 4567',
        ...apt,
        time: '10:00',
        createdAt: new Date().toISOString()
      });
    });

    // Luis Rodriguez - Cliente frecuente
    const luisAppointments = [
      { date: '2024-02-15', service: 'Corte Clásico', status: 'completed' },
      { date: '2024-03-20', service: 'Corte + Barba', status: 'completed' },
      { date: '2024-05-10', service: 'Corte Clásico', status: 'completed' },
      { date: '2024-07-05', service: 'Afeitado Tradicional', status: 'completed' },
      { date: '2024-09-15', service: 'Corte + Barba', status: 'completed' },
      { date: '2024-11-20', service: 'Corte Clásico', status: 'completed' },
      { date: '2024-12-20', service: 'Corte + Barba', status: 'pending' }
    ];

    luisAppointments.forEach(apt => {
      appointments.push({
        clientName: 'Luis Rodriguez',
        clientPhone: '+57 301 234 5678',
        ...apt,
        time: '14:00',
        createdAt: new Date().toISOString()
      });
    });

    // Miguel Angel - Cliente regular
    const miguelAppointments = [
      { date: '2024-03-10', service: 'Corte Clásico', status: 'completed' },
      { date: '2024-05-20', service: 'Corte Clásico', status: 'completed' },
      { date: '2024-08-15', service: 'Corte + Barba', status: 'completed' },
      { date: '2024-11-10', service: 'Corte Clásico', status: 'completed' }
    ];

    miguelAppointments.forEach(apt => {
      appointments.push({
        clientName: 'Miguel Angel',
        clientPhone: '+57 302 345 6789',
        ...apt,
        time: '16:00',
        createdAt: new Date().toISOString()
      });
    });

    // Diego Suarez - Cliente nuevo activo
    const diegoAppointments = [
      { date: '2024-06-25', service: 'Corte Premium', status: 'completed' },
      { date: '2024-08-10', service: 'Corte + Barba', status: 'completed' },
      { date: '2024-10-15', service: 'Tratamiento Capilar', status: 'completed' },
      { date: '2024-12-10', service: 'Corte Premium', status: 'pending' }
    ];

    diegoAppointments.forEach(apt => {
      appointments.push({
        clientName: 'Diego Suarez',
        clientPhone: '+57 303 456 7890',
        ...apt,
        time: '11:00',
        createdAt: new Date().toISOString()
      });
    });

    // Andrés Torres - Cliente muy nuevo
    const andresAppointments = [
      { date: '2024-11-05', service: 'Corte Clásico', status: 'completed' },
      { date: '2024-12-05', service: 'Corte + Barba', status: 'pending' }
    ];

    andresAppointments.forEach(apt => {
      appointments.push({
        clientName: 'Andrés Torres',
        clientPhone: '+57 304 567 8901',
        ...apt,
        time: '15:00',
        createdAt: new Date().toISOString()
      });
    });

    // Agregar todas las citas
    for (const appointment of appointments) {
      await addDoc(collection(db, 'appointments'), appointment);
    }

    console.log(`✅ Datos de ejemplo agregados exitosamente!`);
    console.log(`📊 ${clients.length} clientes y ${appointments.length} citas agregadas`);
    console.log('🔄 Recarga la página para ver los datos en el análisis de clientes');

  } catch (error) {
    console.error('❌ Error agregando datos de ejemplo:', error);
  }
};

// Ejecutar la función
addSampleData();
