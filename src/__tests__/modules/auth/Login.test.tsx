import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../test-utils';
import { MemoryRouter } from 'react-router-dom';
import Login from '../../../modules/auth/Login';
import { useAuth } from '@context/AuthContext';
import { useSnackbar } from '@context/SnackbarContext';

// Mock de los hooks de contexto
jest.mock('@context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@context/SnackbarContext', () => ({
  useSnackbar: jest.fn(),
}));

const mockLogin = jest.fn();
const mockShowMessage = jest.fn();
const mockNavigate = jest.fn();

describe('Login Component', () => {
  beforeEach(() => {
    // Configurar los mocks antes de cada prueba
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
    });

    (useSnackbar as jest.Mock).mockReturnValue({
      showMessage: mockShowMessage,
    });

    // Mock de useNavigate
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    }));

    // Limpiar mocks
    jest.clearAllMocks();
  });

  const renderLogin = () => {
    return render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
  };

  it('debe renderizar el formulario de inicio de sesión', () => {
    renderLogin();
    
    // Verificar que los elementos del formulario estén presentes
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.getByText(/¿no tienes una cuenta?/i)).toBeInTheDocument();
  });

  it('debe mostrar un error cuando se envía el formulario sin correo electrónico ni contraseña', async () => {
    renderLogin();
    
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    fireEvent.click(submitButton);
    
    // Verificar que se muestre el mensaje de error
    await waitFor(() => {
      expect(mockShowMessage).toHaveBeenCalledWith('Please fill in all fields', 'error');
    });
  });

  it('debe llamar a la función de inicio de sesión con los datos correctos', async () => {
    const testEmail = 'test@example.com';
    const testPassword = 'password123';
    
    // Configurar el mock para que la función de inicio de sesión se resuelva correctamente
    mockLogin.mockResolvedValueOnce({});
    
    renderLogin();
    
    // Rellenar el formulario
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: testEmail } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: testPassword } });
    
    // Enviar el formulario
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    
    // Verificar que se llamó a la función de inicio de sesión con los datos correctos
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(testEmail, testPassword);
    });
    
    // Verificar que se mostró el mensaje de éxito
    expect(mockShowMessage).toHaveBeenCalledWith('Successfully logged in', 'success');
    
    // Verificar que se navegó a la página de inicio
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('debe manejar correctamente los errores de autenticación', async () => {
    const testEmail = 'test@example.com';
    const testPassword = 'wrongpassword';
    const errorMessage = 'Incorrect password';
    
    // Configurar el mock para que falle con un error específico
    mockLogin.mockRejectedValueOnce({ code: 'auth/wrong-password', message: errorMessage });
    
    renderLogin();
    
    // Rellenar el formulario
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: testEmail } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: testPassword } });
    
    // Enviar el formulario
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    
    // Verificar que se mostró el mensaje de error correcto
    await waitFor(() => {
      expect(mockShowMessage).toHaveBeenCalledWith(errorMessage, 'error');
    });
  });

  it('debe alternar la visibilidad de la contraseña', () => {
    renderLogin();
    
    // La contraseña debe estar oculta por defecto
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');
    
    // Hacer clic en el botón de mostrar/ocultar contraseña
    const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i });
    fireEvent.click(toggleButton);
    
    // La contraseña debe ser visible
    expect(passwordInput.type).toBe('text');
  });
});
