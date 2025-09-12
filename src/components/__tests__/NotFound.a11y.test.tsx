import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import NotFound from '../NotFound';

const theme = createTheme();

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </ThemeProvider>
  );
};

describe('NotFound - Accessibility', () => {
  it('should be accessible', async () => {
    const { container } = renderWithProviders(<NotFound />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper heading structure', () => {
    renderWithProviders(<NotFound />);
    
    // Verificar que hay un h1 con el texto 404
    const h1 = screen.getByRole('heading', { level: 1, name: '404' });
    expect(h1).toBeInTheDocument();
    
    // Verificar que hay un h2 con el mensaje de error
    const h2 = screen.getByRole('heading', { 
      level: 2, 
      name: /oops! page not found/i 
    });
    expect(h2).toBeInTheDocument();
  });

  it('should have a properly labeled button', () => {
    renderWithProviders(<NotFound />);
    
    const button = screen.getByRole('button', { 
      name: /go to homepage/i 
    });
    expect(button).toBeInTheDocument();
  });

  it('should display a helpful error message', () => {
    renderWithProviders(<NotFound />);
    
    const errorMessage = screen.getByText(
      /the page you are looking for might have been removed, had its name changed, or is temporarily unavailable/i
    );
    expect(errorMessage).toBeInTheDocument();
  });
});
