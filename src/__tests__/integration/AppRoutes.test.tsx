import { render, screen, waitFor } from '../../test-utils';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import App from '../../App';
import { AuthProvider } from '../../context/AuthContext';

// Mock de los componentes que se renderizan en las rutas
jest.mock('../../modules/Dashboard', () => () => <div>Dashboard</div>);
jest.mock('../../modules/accounting/Accounting', () => () => <div>Accounting</div>);
jest.mock('../../modules/inventory/Inventory', () => () => <div>Inventory</div>);
jest.mock('../../modules/orders/Orders', () => () => <div>Orders</div>);

// Mock del contexto de autenticación
const mockAuthContext = {
  currentUser: { uid: 'test-user' },
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
  signup: jest.fn(),
  resetPassword: jest.fn(),
  updatePassword: jest.fn(),
  updateEmail: jest.fn(),
};

describe('App Routing', () => {
  const renderWithRouter = (initialRoute = '/') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthProvider value={mockAuthContext}>
          <Routes>
            <Route path="/*" element={<App />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
  };

  it('debe redirigir a /login cuando el usuario no está autenticado', () => {
    renderWithRouter('/');
    // Verificar que se muestra el componente de login
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('debe renderizar el Dashboard en la ruta raíz cuando el usuario está autenticado', async () => {
    // Sobrescribir el mock para simular que el usuario está autenticado
    mockAuthContext.currentUser = { uid: 'test-user' };
    
    renderWithRouter('/');
    
    // Verificar que se muestra el dashboard
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('debe renderizar la página 404 para rutas desconocidas', () => {
    mockAuthContext.currentUser = { uid: 'test-user' };
    
    renderWithRouter('/ruta-inexistente');
    
    // Verificar que se muestra la página 404
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText(/page not found/i)).toBeInTheDocument();
  });

  it('debe renderizar el módulo de contabilidad en /accounting', async () => {
    mockAuthContext.currentUser = { uid: 'test-user' };
    
    renderWithRouter('/accounting');
    
    await waitFor(() => {
      expect(screen.getByText('Accounting')).toBeInTheDocument();
    });
  });

  it('debe renderizar el módulo de inventario en /inventory', async () => {
    mockAuthContext.currentUser = { uid: 'test-user' };
    
    renderWithRouter('/inventory');
    
    await waitFor(() => {
      expect(screen.getByText('Inventory')).toBeInTheDocument();
    });
  });

  it('debe renderizar el módulo de pedidos en /orders', async () => {
    mockAuthContext.currentUser = { uid: 'test-user' };
    
    renderWithRouter('/orders');
    
    await waitFor(() => {
      expect(screen.getByText('Orders')).toBeInTheDocument();
    });
  });
});
