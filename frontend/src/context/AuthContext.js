// frontend/src/context/AuthContext.js
// frontend/src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
// eslint-disable-next-line no-unused-vars
import { auth as firebaseAuth, db } from '../firebase/firebaseConfig'; // Importamos también db

const AuthContext = createContext();

// Hook personalizado para usar el contexto de autenticación fácilmente
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Almacena el usuario autenticado
  const [loading, setLoading] = useState(true); // Para saber cuándo el contexto está listo

  // Efecto para escuchar cambios en el estado de autenticación de Firebase
  useEffect(() => {
    // onAuthStateChanged es una función de Firebase que te notifica cada vez que el estado de autenticación cambia
    // (ej. el usuario inicia sesión, cierra sesión, el token expira).
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setCurrentUser(user); // Actualiza el estado con el usuario actual de Firebase
      setLoading(false);    // Indica que la autenticación ha terminado de cargar
      console.log("AuthContext: Estado de autenticación de Firebase actualizado. Usuario:", user ? user.email : "Ninguno");
    });

    // La función que retorna useEffect se ejecuta cuando el componente se desmonta.
    // Esto limpia el "listener" de onAuthStateChanged para evitar fugas de memoria.
    return unsubscribe;
  }, []); // Se ejecuta solo una vez al montar el componente

  // Función de login con Firebase
  const login = async (email, password) => {
    try {
      // signInWithEmailAndPassword es la función real de Firebase para iniciar sesión
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      // Si tiene éxito, onAuthStateChanged actualizará currentUser automáticamente
      return { success: true };
    } catch (error) {
      console.error("Error al iniciar sesión:", error.message);
      let errorMessage = "Error desconocido al iniciar sesión.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "Credenciales incorrectas. Si no tienes una cuenta, regístrate.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Correo electrónico no válido.";
      }
      return { success: false, error: errorMessage };
    }
  };

  // Función de logout con Firebase
  const logout = async () => {
    try {
      await signOut(firebaseAuth); // signOut es la función real de Firebase para cerrar sesión
      // onAuthStateChanged actualizará currentUser a null automáticamente
      return { success: true };
    } catch (error) {
      console.error("Error al cerrar sesión:", error.message);
      return { success: false, error: "Error al cerrar sesión." };
    }
  };

  // El valor que se proporciona al contexto y que estará disponible para todos los componentes
  const value = {
    currentUser, // El objeto de usuario de Firebase (o null si no hay sesión)
    login,       // Nuestra función para iniciar sesión
    logout,      // Nuestra función para cerrar sesión
    loading,     // Indica si el estado inicial de autenticación aún se está cargando
    db,          // Instancia de Firestore
    userId: currentUser?.uid || null, // ID del usuario actual
    isAuthReady: !loading // Indica si la autenticación está lista
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children} {/* Renderiza los hijos solo cuando el estado de autenticación inicial ha cargado */}
    </AuthContext.Provider>
  );
};
