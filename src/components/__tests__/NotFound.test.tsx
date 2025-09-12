import { render, screen, fireEvent } from '../../test-utils';
import { MemoryRouter } from 'react-router-dom';
import NotFound from '../NotFound';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('NotFound Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe renderizar correctamente el mensaje de error 404', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );

    // Verificar que los elementos principales estén presentes
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Oops! Page not found')).toBeInTheDocument();
    expect(
      screen.getByText(
        /The page you are looking for might have been removed, had its name changed, or is temporarily unavailable./i
      )
    ).toBeInTheDocument();
  });

  it('debe tener un botón que redirija a la página de inicio', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );

    const button = screen.getByRole('button', { name: /go to homepage/i });
    expect(button).toBeInTheDocument();
    
    // Simular clic en el botón
    fireEvent.click(button);
    
    // Verificar que se llamó a navigate con la ruta correcta
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
