import React, { useEffect, useState } from 'react';
import { auth } from '../services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';

const TestConnection: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar autenticación
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const testFirestore = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Intentar leer las categorías
      const querySnapshot = await getDocs(collection(db, 'categorias'));
      const categoriesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCategories(categoriesData);
      setLoading(false);
    } catch (err) {
      console.error('Error al conectar con Firestore:', err);
      setError('Error al conectar con Firestore. Verifica la consola para más detalles.');
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Prueba de Conexión con Firebase</h2>
      
      <div style={styles.section}>
        <h3>Estado de Autenticación</h3>
        {user ? (
          <p>✅ Usuario autenticado: <strong>{user.email}</strong></p>
        ) : (
          <p>🔴 No hay usuario autenticado</p>
        )}
      </div>

      <div style={styles.section}>
        <h3>Prueba de Firestore</h3>
        <button 
          onClick={testFirestore} 
          disabled={loading}
          style={styles.button}
        >
          {loading ? 'Probando...' : 'Probar Conexión a Firestore'}
        </button>

        {error && <p style={styles.error}>{error}</p>}
        
        {categories.length > 0 && (
          <div style={styles.results}>
            <h4>Categorías encontradas ({categories.length}):</h4>
            <ul>
              {categories.map(cat => (
                <li key={cat.id}>
                  <strong>{cat.nombre}</strong>: {cat.descripcion || 'Sin descripción'}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  section: {
    marginBottom: '30px',
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9'
  },
  button: {
    padding: '10px 15px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    margin: '10px 0'
  },
  error: {
    color: '#f44336',
    backgroundColor: '#ffebee',
    padding: '10px',
    borderRadius: '4px',
    borderLeft: '4px solid #f44336'
  },
  results: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#e8f5e9',
    borderLeft: '4px solid #4CAF50',
    borderRadius: '4px'
  }
} as const;

export default TestConnection;
