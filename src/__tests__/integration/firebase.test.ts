import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Configuración de prueba
const testConfig = {
  apiKey: 'test-api-key',
  authDomain: 'test.firebaseapp.com',
  projectId: 'test-project',
  storageBucket: 'test.appspot.com',
  messagingSenderId: '1234567890',
  appId: '1:1234567890:web:test',
};

describe('Firebase Integration', () => {
  let app;

  beforeAll(() => {
    // Configurar variables de entorno para pruebas
    process.env.REACT_APP_FIREBASE_API_KEY = testConfig.apiKey;
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN = testConfig.authDomain;
    process.env.REACT_APP_FIREBASE_PROJECT_ID = testConfig.projectId;
    process.env.REACT_APP_FIREBASE_STORAGE_BUCKET = testConfig.storageBucket;
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID = testConfig.messagingSenderId;
    process.env.REACT_APP_FIREBASE_APP_ID = testConfig.appId;

    // Importar el módulo de Firebase después de configurar las variables de entorno
    jest.resetModules();
    app = require('../../services/firebase');
  });

  it('debe inicializar la aplicación Firebase correctamente', () => {
    expect(initializeApp).toHaveBeenCalledWith(testConfig);
  });

  it('debe inicializar el servicio de autenticación', () => {
    expect(getAuth).toHaveBeenCalled();
  });

  it('debe inicializar Firestore', () => {
    expect(getFirestore).toHaveBeenCalled();
  });

  it('debe inicializar Storage', () => {
    expect(getStorage).toHaveBeenCalled();
  });

  it('debe inicializar Functions', () => {
    expect(getFunctions).toHaveBeenCalled();
  });
});
