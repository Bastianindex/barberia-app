// Script para agregar campos faltantes a los servicios en Firebase
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyB0tNq_SqvKZMhh9n0LL4mH5ydfuCfHXL8",
  authDomain: "barberia-app-f4d67.firebaseapp.com",
  projectId: "barberia-app-f4d67",
  storageBucket: "barberia-app-f4d67.firebasestorage.app",
  messagingSenderId: "826077885880",
  appId: "1:826077885880:web:56e95afd04c44e76e4cabc"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const fixServicesData = async () => {
  console.log('🔧 Iniciando corrección de datos de servicios...');
  
  try {
    const servicesRef = collection(db, 'services');
    const snapshot = await getDocs(servicesRef);
    
    console.log(`📋 Encontrados ${snapshot.size} servicios para revisar`);
    
    for (const serviceDoc of snapshot.docs) {
      const data = serviceDoc.data();
      const updates = {};
      
      // Verificar y agregar campos faltantes
      if (!data.duration) {
        updates.duration = 30; // Duración por defecto de 30 minutos
        console.log(`⏱️ Agregando duración por defecto al servicio: ${data.name || serviceDoc.id}`);
      }
      
      if (!data.description) {
        updates.description = `Servicio profesional de ${data.name || 'barbería'}`;
        console.log(`📝 Agregando descripción por defecto al servicio: ${data.name || serviceDoc.id}`);
      }
      
      if (data.isActive === undefined) {
        updates.isActive = true;
        console.log(`✅ Estableciendo isActive=true para el servicio: ${data.name || serviceDoc.id}`);
      }
      
      if (!data.category) {
        updates.category = 'general';
        console.log(`🏷️ Agregando categoría por defecto al servicio: ${data.name || serviceDoc.id}`);
      }
      
      // Aplicar actualizaciones si hay alguna
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, 'services', serviceDoc.id), updates);
        console.log(`✨ Servicio actualizado: ${data.name || serviceDoc.id}`);
      } else {
        console.log(`✅ Servicio ya está completo: ${data.name || serviceDoc.id}`);
      }
    }
    
    console.log('🎉 ¡Corrección de servicios completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error corrigiendo servicios:', error);
  }
};

fixServicesData();
