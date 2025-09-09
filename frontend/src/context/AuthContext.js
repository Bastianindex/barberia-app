/**
 * Context de autenticación refactorizado
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChange, signInUser, signOutUser, registerUser } from '../services/authService';
import { saveUserData, findUserInCollections, getUserData } from '../services/firestoreService';
import { COLLECTIONS, USER_ROLES } from '../constants';
import { db } from '../firebase/firebaseConfig';

// Crear el contexto
const AuthContext = createContext(null);

/**
 * Hook para usar el contexto de autenticación
 * @returns {Object} Context de autenticación
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

/**
 * Proveedor del contexto de autenticación
 */
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Inicializar listener de autenticación
  useEffect(() => {
    console.log('🔄 Iniciando AuthContext...');
    
    // Timeout de seguridad para evitar loading infinito
    const loadingTimeout = setTimeout(() => {
      console.log('⚠️ Timeout de autenticación - forzando fin de loading');
      setLoading(false);
    }, 10000); // 10 segundos
    
    const unsubscribe = onAuthStateChange(async (user) => {
      try {
        console.log('🔄 AuthContext: Estado de autenticación actualizado:', user?.email || 'Sin usuario');
        clearTimeout(loadingTimeout); // Cancelar timeout si la auth responde
        
        setCurrentUser(user);
        
        if (user) {
          // Buscar datos del usuario en Firestore
          try {
            console.log('🔍 Buscando usuario en Firestore:', user.uid);
            
            // Primero buscar en admins por ID
            const adminResult = await getUserData(user.uid, 'admins');
            if (adminResult.success) {
              console.log('✅ Admin encontrado:', adminResult.data);
              setUserData(adminResult.data);
              setUserRole('admin');
              setLoading(false);
              return;
            }
            
            // Si no es admin, buscar en clients por ID
            const clientResult = await getUserData(user.uid, 'clients');
            if (clientResult.success) {
              console.log('✅ Cliente encontrado:', clientResult.data);
              setUserData(clientResult.data);
              setUserRole('client');
              setLoading(false);
              return;
            }
            
            // Si no se encuentra en ninguna colección
            console.warn('❌ Usuario no encontrado en Firestore:', user.uid);
            setUserData(null);
            setUserRole(null);
          } catch (error) {
            console.error('❌ Error obteniendo datos del usuario:', error);
            setUserData(null);
            setUserRole(null);
          }
        } else {
          setUserData(null);
          setUserRole(null);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('❌ Error en onAuthStateChange:', error);
        clearTimeout(loadingTimeout);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, []);

  /**
   * Inicia sesión
   */
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      const result = await signInUser(email, password);
      
      if (result.success) {
        // Los datos del usuario se actualizarán automáticamente por onAuthStateChange
        return { success: true };
      }
      
      return result;
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, error: 'Error inesperado al iniciar sesión' };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cierra sesión
   */
  const logout = useCallback(async () => {
    try {
      const result = await signOutUser();
      if (result.success) {
        setCurrentUser(null);
        setUserData(null);
        setUserRole(null);
      }
      return result;
    } catch (error) {
      console.error('Error en logout:', error);
      return { success: false, error: 'Error al cerrar sesión' };
    }
  }, []);

  /**
   * Registra un cliente
   */
  const registerClient = useCallback(async (clientData) => {
    try {
      setLoading(true);
      
      // Registrar en Firebase Auth
      const authResult = await registerUser(
        clientData.email, 
        clientData.password, 
        clientData.name
      );
      
      if (!authResult.success) {
        return authResult;
      }

      // Guardar datos en Firestore
      const firestoreData = {
        name: clientData.name,
        phone: clientData.phone,
        email: clientData.email,
        role: USER_ROLES.CLIENT,
        emailVerified: false,
        isActive: true
      };

      const saveResult = await saveUserData(
        authResult.user.uid, 
        firestoreData, 
        COLLECTIONS.CLIENTS
      );

      if (!saveResult.success) {
        return saveResult;
      }

      return {
        success: true,
        message: 'Cliente registrado exitosamente',
        user: authResult.user
      };
    } catch (error) {
      console.error('Error en registerClient:', error);
      return { success: false, error: 'Error inesperado al registrar cliente' };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Registra un administrador
   */
  const registerAdmin = useCallback(async (adminData, adminCode) => {
    try {
      setLoading(true);
      
      // Validar código de admin (puedes cambiar esto)
      if (adminCode !== 'OLIMU_ADMIN_2024') {
        return { success: false, error: 'Código de administrador inválido' };
      }

      // Registrar en Firebase Auth
      const authResult = await registerUser(
        adminData.email, 
        adminData.password, 
        adminData.name
      );
      
      if (!authResult.success) {
        return authResult;
      }

      // Guardar datos en Firestore
      const firestoreData = {
        name: adminData.name,
        email: adminData.email,
        role: USER_ROLES.ADMIN,
        emailVerified: false,
        isActive: true,
        permissions: ['dashboard', 'appointments', 'clients', 'services']
      };

      const saveResult = await saveUserData(
        authResult.user.uid, 
        firestoreData, 
        COLLECTIONS.ADMINS
      );

      if (!saveResult.success) {
        return saveResult;
      }

      return {
        success: true,
        message: 'Administrador registrado exitosamente',
        user: authResult.user
      };
    } catch (error) {
      console.error('Error en registerAdmin:', error);
      return { success: false, error: 'Error inesperado al registrar administrador' };
    } finally {
      setLoading(false);
    }
  }, []);

  // Valores del contexto
  const value = {
    // Estado
    currentUser,
    userData,
    userRole,
    loading,
    
    // Firebase instances
    db,
    isAuthReady: !loading,
    
    // Computed values
    isAuthenticated: !!currentUser,
    isClient: userRole === USER_ROLES.CLIENT,
    isAdmin: userRole === USER_ROLES.ADMIN,
    userId: currentUser?.uid || null,
    
    // Funciones
    login,
    logout,
    registerClient,
    registerAdmin
  };

  // Debug: Exponer db y herramientas globalmente para debugging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' || window.location.hostname.includes('web.app')) {
      window.db = db;
      
      // Importar herramientas de conectividad
      import('../utils/connectivityTest.js').then((module) => {
        window.testConnectivity = module.default;
        console.log('🛠️ Firebase Debug Tools disponibles en la consola');
        console.log('🔧 Ejecuta: window.testConnectivity() para verificar conectividad completa');
      }).catch((error) => {
        console.log('⚠️ Herramientas de debug no disponibles:', error);
      });
    }
  }, []);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
