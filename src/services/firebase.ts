import { initializeApp, FirebaseApp, getApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator, Functions } from 'firebase/functions';

// Configuración de Firebase
// Reemplaza estos valores con los de tu proyecto de Firebase
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'your-app.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'your-project-id',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'your-app.appspot.com',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456',
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || 'G-ABCDEF1234',
};

// Inicializar Firebase
let app: FirebaseApp;

try {
  app = getApp();
} catch (e) {
  app = initializeApp(firebaseConfig);
}

// Inicializar servicios
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export const functions = getFunctions(app);

// Configuración para desarrollo local
const EMULATORS_STARTED = 'EMULATORS_STARTED';

// Inicializar emuladores en desarrollo
if (process.env.NODE_ENV === 'development' && !(window as any)[EMULATORS_STARTED]) {
  (window as any)[EMULATORS_STARTED] = true;
  
  // Si estás usando los emuladores de Firebase, descomenta las siguientes líneas
  // y asegúrate de que los emuladores estén en ejecución
  /*
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  */
}

// Habilitar persistencia fuera de línea para Firestore
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn(
        'La persistencia fuera de línea falló. Múltiples pestañas abiertas pueden causar este error.'
      );
    } else if (err.code === 'unimplemented') {
      console.warn('Tu navegador no soporta la persistencia fuera de línea.');
    }
  });
}

// Exportar la instancia de la aplicación
export { app };
export default app;
