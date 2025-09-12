// Configuración global de Jest para mocks
import '@testing-library/jest-dom';

// Mock de window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock de las APIs de Firebase
jest.mock('firebase/app', () => ({
  ...jest.requireActual('firebase/app'),
  initializeApp: jest.fn(),
  getApp: jest.fn(),
  getApps: jest.fn(() => []),
}));

jest.mock('firebase/auth', () => ({
  ...jest.requireActual('firebase/auth'),
  getAuth: jest.fn(),
  connectAuthEmulator: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  getFirestore: jest.fn(),
  connectFirestoreEmulator: jest.fn(),
  enableIndexedDbPersistence: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  ...jest.requireActual('firebase/storage'),
  getStorage: jest.fn(),
  connectStorageEmulator: jest.fn(),
}));

jest.mock('firebase/functions', () => ({
  ...jest.requireActual('firebase/functions'),
  getFunctions: jest.fn(),
  connectFunctionsEmulator: jest.fn(),
}));
