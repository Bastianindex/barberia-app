// Propuesta para mejorar las relaciones entre colecciones

// 1. ESTRUCTURA MEJORADA DE APPOINTMENTS
const betterAppointmentStructure = {
  // Información del cliente (por referencia y datos desnormalizados)
  clientId: "cliente_doc_id", // ID del documento en la colección clients
  clientPhone: "+57 300 123 4567", // Para búsquedas rápidas
  clientName: "Carlos Mendoza", // Para visualización
  clientEmail: "carlos@email.com", // Para notificaciones
  
  // Información del servicio (por referencia y datos desnormalizados)
  serviceId: "servicio_doc_id", // ID del documento en la colección services
  serviceName: "Corte Premium", // Para visualización
  servicePrice: 35000, // Precio en el momento de la cita (histórico)
  serviceDuration: 60, // Duración en minutos
  
  // Información de la cita
  date: "2024-12-25",
  time: "14:00",
  status: "pending", // pending, confirmed, completed, cancelled
  
  // Metadatos
  createdAt: "2024-12-20T10:00:00Z",
  updatedAt: "2024-12-20T10:00:00Z",
  
  // Información adicional
  notes: "Cliente prefiere corte corto",
  totalAmount: 35000, // Puede incluir descuentos/promociones
  paymentStatus: "pending" // pending, paid, refunded
};

// 2. ESTRUCTURA MEJORADA DE CLIENTS
const betterClientStructure = {
  // Información personal
  name: "Carlos Mendoza",
  phone: "+57 300 123 4567", // Campo único para identificación
  email: "carlos@email.com",
  
  // Estadísticas calculadas (se actualizan con triggers o funciones)
  totalAppointments: 12,
  completedAppointments: 10,
  cancelledAppointments: 1,
  totalSpent: 420000,
  lastVisit: "2024-12-15T14:00:00Z",
  firstVisit: "2024-01-15T10:00:00Z",
  favoriteService: "Corte Premium",
  averageDaysBetweenVisits: 25,
  
  // Preferencias del cliente
  preferredBarber: "Juan Pérez",
  preferredTimeSlot: "afternoon", // morning, afternoon, evening
  notifications: {
    email: true,
    sms: false,
    whatsapp: true
  },
  
  // Estado del cliente
  status: "active", // active, inactive, blocked
  loyaltyLevel: "VIP", // regular, frequent, VIP
  
  // Metadatos
  createdAt: "2024-01-15T09:00:00Z",
  updatedAt: "2024-12-20T10:00:00Z"
};

// 3. ESTRUCTURA MEJORADA DE SERVICES
const betterServiceStructure = {
  // Información básica
  name: "Corte Premium",
  description: "Corte premium con lavado y peinado profesional",
  category: "cortes", // cortes, barba, tratamientos, combos
  
  // Precios y duración
  price: 35000,
  duration: 60, // en minutos
  
  // Configuración
  isActive: true,
  requiresBooking: true,
  maxAdvanceBookingDays: 30,
  
  // Estadísticas
  timesBooked: 45,
  averageRating: 4.8,
  revenue: 1575000,
  
  // Recursos necesarios
  requiredTools: ["máquina", "tijeras", "secador"],
  skillLevel: "intermedio", // básico, intermedio, avanzado
  
  // Metadatos
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-12-20T10:00:00Z"
};

// 4. FUNCIONES PARA MANTENER CONSISTENCIA

// Función para crear una cita con relaciones consistentes
const createAppointment = async (clientData, serviceData, appointmentDetails) => {
  const appointment = {
    // Cliente - referencia + datos desnormalizados
    clientId: clientData.id,
    clientPhone: clientData.phone,
    clientName: clientData.name,
    clientEmail: clientData.email,
    
    // Servicio - referencia + datos desnormalizados
    serviceId: serviceData.id,
    serviceName: serviceData.name,
    servicePrice: serviceData.price, // Precio histórico
    serviceDuration: serviceData.duration,
    
    // Detalles de la cita
    ...appointmentDetails,
    
    // Metadatos
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Crear la cita
  const appointmentRef = await addDoc(collection(db, 'appointments'), appointment);
  
  // Actualizar estadísticas del cliente (opcional - puede ser con Cloud Functions)
  await updateClientStats(clientData.id);
  
  // Actualizar estadísticas del servicio
  await updateServiceStats(serviceData.id);
  
  return appointmentRef;
};

// Función para buscar citas relacionadas con un cliente
const getClientAppointments = async (clientId) => {
  const q = query(
    collection(db, 'appointments'),
    where('clientId', '==', clientId),
    orderBy('date', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Función para buscar citas de un servicio específico
const getServiceAppointments = async (serviceId) => {
  const q = query(
    collection(db, 'appointments'),
    where('serviceId', '==', serviceId),
    orderBy('date', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// 5. ÍNDICES RECOMENDADOS PARA FIRESTORE
/*
Crear estos índices en Firebase Console > Firestore > Indexes:

appointments:
- clientId (Ascending), date (Descending)
- serviceId (Ascending), date (Descending)  
- clientPhone (Ascending), status (Ascending)
- date (Ascending), time (Ascending)
- status (Ascending), date (Ascending)

clients:
- phone (Ascending) - único
- email (Ascending) - único
- status (Ascending), lastVisit (Descending)

services:
- category (Ascending), isActive (Ascending)
- isActive (Ascending), timesBooked (Descending)
*/
