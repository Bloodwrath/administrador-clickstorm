import { db } from '../services/firebase';
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { CATEGORIAS_SUBLIMACION } from '../types/inventory';
import { Timestamp } from 'firebase/firestore';

export const inicializarCategorias = async () => {
  console.log('Iniciando inicialización de categorías...');
  
  try {
    const categoriasRef = collection(db, 'categorias');
    const q = query(categoriasRef);
    const querySnapshot = await getDocs(q);
    
    // Si ya hay categorías, no hacer nada
    if (!querySnapshot.empty) {
      console.log('Las categorías ya están inicializadas.');
      return;
    }
    
    console.log('Agregando categorías por defecto...');
    
    // Agregar cada categoría a Firestore
    const batchWrites = [];
    const now = Timestamp.now();
    
    for (const categoria of CATEGORIAS_SUBLIMACION) {
      const categoriaRef = doc(categoriasRef);
      batchWrites.push(
        setDoc(categoriaRef, {
          nombre: categoria.nombre,
          descripcion: categoria.descripcion || '',
          activa: true,
          fechaCreacion: now,
          fechaActualizacion: now,
        })
      );
      console.log(`Categoría agregada: ${categoria.nombre}`);
    }
    
    await Promise.all(batchWrites);
    console.log('Todas las categorías se han inicializado correctamente.');
    
  } catch (error) {
    console.error('Error al inicializar las categorías:', error);
    throw error;
  }
};

// Ejecutar la inicialización si se llama directamente
if (require.main === module) {
  (async () => {
    try {
      await inicializarCategorias();
      process.exit(0);
    } catch (error) {
      console.error('Error en la inicialización:', error);
      process.exit(1);
    }
  })();
}
