import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';

// Configuración global para las pruebas
configure({ testIdAttribute: 'data-testid' });

// Extender expect para incluir las aserciones de accesibilidad
expect.extend(toHaveNoViolations);

// Mocks globales
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

// Mock para console.error
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    // Ignorar errores específicos de advertencia de accesibilidad
    if (args[0] && typeof args[0] === 'string' && args[0].includes('Accessibility')) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
