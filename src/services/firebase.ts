import { initializeApp, FirebaseApp, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Configuración de Firebase
// Reemplaza estos valores con los de tu proyecto de Firebase
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyB0zm1B8qsOhR9V5dVW3rMNNYjQQY7OOwc',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'bussness-administrator.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'bussness-administrator',
  // Nota: no usamos Firebase Storage en este proyecto (plan gratuito)
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '302765878955',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:302765878955:web:97a537dda954460ddb51ee',
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || 'G-BNZVVEXXJZ',
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
