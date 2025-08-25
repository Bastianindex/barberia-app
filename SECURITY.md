# 🔒 Configuración de Seguridad - Firebase

## ⚠️ IMPORTANTE: Configuración de Variables de Entorno

Este proyecto usa Firebase y requiere configuración de variables de entorno para proteger las credenciales.

### 📋 Pasos para configurar:

1. **Copia el archivo de ejemplo:**
   ```bash
   cp frontend/.env.example frontend/.env
   ```

2. **Edita el archivo `.env` con tus credenciales reales de Firebase:**
   ```env
   REACT_APP_FIREBASE_API_KEY=tu_api_key_real
   REACT_APP_FIREBASE_AUTH_DOMAIN=tu_dominio.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=tu_proyecto_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=tu_bucket.firebasestorage.app
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
   REACT_APP_FIREBASE_APP_ID=tu_app_id
   ```

3. **Nunca subas el archivo `.env` al repositorio**
   - El archivo `.env` está incluido en `.gitignore`
   - Solo sube `.env.example` como plantilla

### 🛡️ Buenas Prácticas de Seguridad:

- ✅ Variables de entorno para credenciales
- ✅ Archivo `.env` excluido del control de versiones
- ✅ Reglas de seguridad en Firestore
- ✅ Autenticación requerida para operaciones sensibles

### 🚀 Para producción:

Configura las variables de entorno en tu plataforma de hosting:
- **Vercel:** Variables de entorno en el dashboard
- **Netlify:** Environment variables en site settings
- **Firebase Hosting:** Usar Firebase Functions para backend seguro
