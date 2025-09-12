// Este archivo contiene utilidades para pruebas de accesibilidad
// Para usarlo, instala las dependencias necesarias:
// npm install --save-dev jest-axe @testing-library/react @testing-library/jest-dom

import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';
import { ReactElement } from 'react';

expect.extend(toHaveNoViolations);

export const checkA11y = async (ui: ReactElement) => {
  const { container } = render(ui);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
};

// Ejemplo de uso en un test:
/*
import { checkA11y } from './a11yTestUtils';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should be accessible', async () => {
    await checkA11y(<MyComponent />);
  });
});
*/
