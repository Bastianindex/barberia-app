// frontend/src/firebase/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; // Necesario para Firebase Authentication
import { getFirestore } from 'firebase/firestore'; // Necesario para Cloud Firestore

// Configuración de Firebase usando variables de entorno
// Las credenciales están en el archivo .env (no se sube al repositorio)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Inicializa Firebase con tu configuración
const app = initializeApp(firebaseConfig);

// Exporta las instancias de los servicios de Firebase que vamos a usar
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app; // Exporta la instancia de la aplicación Firebase
