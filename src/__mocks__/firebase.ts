// Mock de Firebase para pruebas
const mockInitializeApp = jest.fn();
const mockGetApp = jest.fn();
const mockGetAuth = jest.fn();
const mockGetFirestore = jest.fn();
const mockGetStorage = jest.fn();
const mockGetFunctions = jest.fn();

// Simular los módulos de Firebase
const firebase = {
  initializeApp: mockInitializeApp,
  getApp: mockGetApp,
  getAuth: mockGetAuth,
  getFirestore: mockGetFirestore,
  getStorage: mockGetStorage,
  getFunctions: mockGetFunctions,
  apps: [],
  // Agregar más métodos según sea necesario
};

// Configurar valores por defecto para los mocks
mockGetAuth.mockReturnValue({
  currentUser: {
    uid: 'test-user-123',
    email: 'test@example.com',
    // Agregar más propiedades según sea necesario
  },
  // Agregar más métodos de autenticación según sea necesario
});

mockGetFirestore.mockReturnValue({
  collection: jest.fn().mockReturnThis(),
  doc: jest.fn().mockReturnThis(),
  get: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  onSnapshot: jest.fn(),
  // Agregar más métodos de Firestore según sea necesario
});

mockGetStorage.mockReturnValue({
  ref: jest.fn().mockReturnThis(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn(),
  // Agregar más métodos de Storage según sea necesario
});

// Exportar el mock
export {
  mockInitializeApp,
  mockGetApp,
  mockGetAuth,
  mockGetFirestore,
  mockGetStorage,
  mockGetFunctions,
};

export default firebase;
