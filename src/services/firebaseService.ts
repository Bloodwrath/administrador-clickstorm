import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  writeBatch,
  DocumentData,
  QueryDocumentSnapshot,
  DocumentSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
// Storage is imported but not used in this file
import { app } from './firebase';
import { 
  Producto, 
  FirebaseDate, 
  Categoria, 
  Proveedor, 
  AlertaInventario, 
  CATEGORIAS_SUBLIMACION 
} from '../types/inventory';
import { prepareImageForFirebase, reconstructImageFromChunks } from './imageService';

// Inicializar servicios de Firebase
const auth = getAuth(app);
const db = getFirestore(app);

// Referencias a colecciones
const PRODUCTOS_COLLECTION = 'productos';
const PROVEEDORES_COLLECTION = 'proveedores';
const CATEGORIAS_COLLECTION = 'categorias';
const IMAGENES_COLLECTION = 'imagenes';
const CHUNKS_COLLECTION = 'chunks';
const ALERTAS_COLLECTION = 'alertas';

// Tipos de datos para Firestore
interface FirebaseProducto extends Omit<Producto, 'fechaCreacion' | 'fechaActualizacion' | 'historialPrecios'> {
  fechaCreacion: Timestamp | Date;
  fechaActualizacion: Timestamp | Date;
  historialPrecios: Array<{
    fecha: Timestamp | Date;
    precio: number;
    moneda: string;
    motivo?: string;
  }>;
}

// Helper para convertir Timestamp a Date
const convertTimestamps = (data: any): any => {
  if (!data) return data;
  
  if (data instanceof Timestamp) {
    return data.toDate();
  }
  
  if (Array.isArray(data)) {
    return data.map(convertTimestamps);
  }
  
  if (typeof data === 'object') {
    const result: Record<string, any> = {};
    for (const key in data) {
      result[key] = convertTimestamps(data[key]);
    }
    return result;
  }
  
  return data;
};

// Convertir de Firebase a tipos de la aplicación
const productoFromFirebase = (doc: DocumentSnapshot<DocumentData>): Producto => {
  const data = doc.data() as FirebaseProducto;
  const convertedData = convertTimestamps(data);
  
  return {
    ...convertedData,
    id: doc.id,
    fechaCreacion: convertedData.fechaCreacion || new Date(),
    fechaActualizacion: convertedData.fechaActualizacion || new Date(),
    historialPrecios: convertedData.historialPrecios?.map((item: { fecha?: FirebaseDate }) => ({
      ...item,
      fecha: item.fecha || new Date(),
    })) || [],
  };
};

// Servicio de Autenticación
export const authService = {
  // Iniciar sesión
  login: async (email: string, password: string): Promise<User> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      throw error;
    }
  },

  // Cerrar sesión
  logout: async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  },

  // Registrar nuevo usuario
  register: async (email: string, password: string, displayName: string): Promise<User> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      return userCredential.user;
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      throw error;
    }
  },

  // Restablecer contraseña
  resetPassword: async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error al enviar correo de restablecimiento:', error);
      throw error;
    }
  },

  // Actualizar perfil
  updateProfile: async (displayName: string, photoURL?: string): Promise<void> => {
    if (!auth.currentUser) throw new Error('No hay usuario autenticado');
    try {
      await updateProfile(auth.currentUser, { displayName, photoURL });
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      throw error;
    }
  },

  // Actualizar email
  updateEmail: async (newEmail: string, password: string): Promise<void> => {
    if (!auth.currentUser) throw new Error('No hay usuario autenticado');
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email || '', password);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updateEmail(auth.currentUser, newEmail);
    } catch (error) {
      console.error('Error al actualizar email:', error);
      throw error;
    }
  },

  // Actualizar contraseña
  updatePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!auth.currentUser) throw new Error('No hay usuario autenticado');
    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email || '',
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
    } catch (error) {
      console.error('Error al actualizar contraseña:', error);
      throw error;
    }
  },

  // Escuchar cambios en la autenticación
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },

  // Obtener usuario actual
  getCurrentUser: (): User | null => {
    return auth.currentUser;
  },
};

// Servicio de Productos
export const productoService = {
  // Crear un nuevo producto
  crearProducto: async (producto: Omit<Producto, 'id' | 'fechaCreacion' | 'fechaActualizacion'>) => {
    try {
      const docRef = doc(collection(db, PRODUCTOS_COLLECTION));
      const nuevoProducto = {
        ...producto,
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp(),
        historialPrecios: (producto.historialPrecios || []).map(p => ({
          ...p,
          fecha: p.fecha || new Date(),
        })),
      };

      await setDoc(docRef, nuevoProducto);
      return { id: docRef.id, ...nuevoProducto };
    } catch (error) {
      console.error('Error al crear producto:', error);
      throw error;
    }
  },

  // Actualizar un producto
  actualizarProducto: async (id: string, actualizacion: Partial<Producto>) => {
    try {
      const docRef = doc(db, PRODUCTOS_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('El producto no existe');
      }

      // Si hay cambios en los precios, registrar en el historial
      const datosActuales = docSnap.data() as FirebaseProducto;
      const datosActualizados = actualizacion as FirebaseProducto;
      let datosParaActualizar = { ...actualizacion };

      if (datosActualizados.precios && datosActualizados.precios.length > 0) {
        const precioActual = datosActuales.precios[0]?.precio;
        const nuevoPrecio = datosActualizados.precios[0]?.precio;

        if (precioActual !== nuevoPrecio) {
          // Agregar al historial de precios
          datosParaActualizar = {
            ...datosParaActualizar,
            historialPrecios: [
              ...(datosActuales.historialPrecios || []),
              {
                fecha: serverTimestamp() as Timestamp,
                precio: datosActualizados.precios[0].precio,
                moneda: datosActualizados.precios[0].tipo === 'mayoreo' ? 'MXN' : 'MXN',
                motivo: 'Actualización de precio',
              },
            ],
          };
        }
      }

      // Eliminar propiedades que no deberían actualizarse directamente
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _, fechaCreacion, ...datosFinales } = datosParaActualizar;
      
      // Asegurarse de que los datos son compatibles con Firestore
      const updateData: Record<string, any> = { ...datosFinales };
      
      // Actualizar la fecha de actualización
      updateData.fechaActualizacion = serverTimestamp();
      
      // Realizar la actualización
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      throw error;
    }
  },

  // Eliminar un producto
  eliminarProducto: async (id: string) => {
    try {
      await deleteDoc(doc(db, PRODUCTOS_COLLECTION, id));
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      throw error;
    }
  },

  // Obtener un producto por ID
  obtenerProducto: async (id: string): Promise<Producto | null> => {
    try {
      const docRef = doc(db, PRODUCTOS_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return productoFromFirebase(docSnap);
      }
      return null;
    } catch (error) {
      console.error('Error al obtener producto:', error);
      throw error;
    }
  },

  // Listar productos con paginación
  listarProductos: async (opciones: {
    limite?: number;
    ultimoDoc?: QueryDocumentSnapshot<DocumentData>;
    filtros?: Record<string, any>;
    ordenarPor?: string;
    direccion?: 'asc' | 'desc';
  }): Promise<{ productos: Producto[]; ultimoDoc: QueryDocumentSnapshot<DocumentData> | null }> => {
    try {
      const { limite = 10, ultimoDoc, filtros = {}, ordenarPor = 'nombre', direccion = 'asc' } = opciones;
      
      let q = query(
        collection(db, PRODUCTOS_COLLECTION),
        orderBy(ordenarPor, direccion),
        limit(limite)
      );

      // Aplicar filtros
      Object.entries(filtros).forEach(([campo, valor]) => {
        if (valor !== undefined && valor !== '') {
          q = query(q, where(campo, '==', valor));
        }
      });

      // Continuar desde el último documento
      if (ultimoDoc) {
        q = query(q, startAfter(ultimoDoc));
      }

      const querySnapshot = await getDocs(q);
      const productos = querySnapshot.docs.map(doc => productoFromFirebase(doc));
      
      return {
        productos,
        ultimoDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
      };
    } catch (error) {
      console.error('Error al listar productos:', error);
      throw error;
    }
  },

  // Buscar productos por término
  buscarProductos: async (termino: string, limite: number = 10): Promise<Producto[]> => {
    try {
      // Implementación de búsqueda básica (puede mejorarse con un índice de búsqueda)
      const q = query(
        collection(db, PRODUCTOS_COLLECTION),
        where('nombre', '>=', termino),
        where('nombre', '<=', termino + '\uf8ff'),
        limit(limite)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => productoFromFirebase(doc));
    } catch (error) {
      console.error('Error al buscar productos:', error);
      throw error;
    }
  },
};

// Servicio de Categorías
export const categoriaService = {
  // Obtener todas las categorías
  obtenerCategorias: async (): Promise<Categoria[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, CATEGORIAS_COLLECTION));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Categoria[];
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      throw error;
    }
  },

  // Inicializar categorías por defecto
  inicializarCategoriasPorDefecto: async (): Promise<void> => {
    try {
      console.log('Iniciando inicialización de categorías...');
      const categoriasRef = collection(db, CATEGORIAS_COLLECTION);
      
      // Verificar si ya hay categorías
      const q = query(categoriasRef, limit(1));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        console.log('Las categorías ya están inicializadas.');
        return;
      }
      
      console.log('Agregando categorías por defecto...');
      const batch = writeBatch(db);
      const now = Timestamp.now();
      
      // Agregar cada categoría al lote
      for (const categoria of CATEGORIAS_SUBLIMACION) {
        const categoriaRef = doc(categoriasRef);
        batch.set(categoriaRef, {
          nombre: categoria.nombre,
          descripcion: categoria.descripcion || '',
          activa: true,
          fechaCreacion: now,
          fechaActualizacion: now,
        });
        console.log(`Categoría agregada: ${categoria.nombre}`);
      }
      
      // Ejecutar el lote de escrituras
      await batch.commit();
      console.log('Todas las categorías se han inicializado correctamente.');
    } catch (error) {
      console.error('Error al inicializar categorías por defecto:', error);
      throw error;
    }
  },
};

// Servicio de Proveedores
export const proveedorService = {
  // Crear un nuevo proveedor
  crearProveedor: async (proveedor: Omit<Proveedor, 'id' | 'fechaCreacion' | 'fechaActualizacion'>) => {
    try {
      const docRef = doc(collection(db, PROVEEDORES_COLLECTION));
      const nuevoProveedor = {
        ...proveedor,
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp(),
        activo: true,
        productosSuministrados: [],
      };

      await setDoc(docRef, nuevoProveedor);
      return { id: docRef.id, ...nuevoProveedor };
    } catch (error) {
      console.error('Error al crear proveedor:', error);
      throw error;
    }
  },

  // Obtener todos los proveedores
  obtenerProveedores: async (): Promise<Proveedor[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, PROVEEDORES_COLLECTION));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Proveedor[];
    } catch (error) {
      console.error('Error al obtener proveedores:', error);
      throw error;
    }
  },
};

// Servicio de Imágenes
export const imagenService = {
  // Subir imagen y guardar en Firestore
  subirImagen: async (file: File, productoId: string): Promise<string> => {
    try {
      // Preparar la imagen (comprimir y convertir a base64)
      const { chunks, metadata } = await prepareImageForFirebase(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8,
      });

      // Subir cada chunk a Firestore
      const batch = writeBatch(db);
      const imagenId = doc(collection(db, IMAGENES_COLLECTION)).id;
      
      // Guardar metadatos de la imagen
      const imagenDocRef = doc(db, IMAGENES_COLLECTION, imagenId);
      batch.set(imagenDocRef, {
        ...metadata,
        productoId,
        fechaSubida: serverTimestamp(),
        chunksCount: chunks.length,
      });

      // Guardar cada chunk
      chunks.forEach((chunk, index) => {
        const chunkRef = doc(collection(db, `${IMAGENES_COLLECTION}/${imagenId}/${CHUNKS_COLLECTION}`), `${index}`);
        batch.set(chunkRef, { data: chunk, orden: index });
      });

      await batch.commit();
      return imagenId;
    } catch (error) {
      console.error('Error al subir imagen:', error);
      throw error;
    }
  },

  // Obtener URL de una imagen
  obtenerUrlImagen: async (imagenId: string): Promise<string> => {
    try {
      // Obtener metadatos de la imagen
      const imagenDoc = await getDoc(doc(db, IMAGENES_COLLECTION, imagenId));
      if (!imagenDoc.exists()) {
        throw new Error('Imagen no encontrada');
      }

      // Obtener todos los chunks
      const chunksSnapshot = await getDocs(
        collection(db, `${IMAGENES_COLLECTION}/${imagenId}/${CHUNKS_COLLECTION}`)
      );
      
      // Ordenar chunks por índice
      const chunks = chunksSnapshot.docs
        .sort((a, b) => a.data().orden - b.data().orden)
        .map(doc => doc.data().data);

      // Reconstruir la imagen
      return await reconstructImageFromChunks(chunks, {
        type: imagenDoc.data().type,
      });
    } catch (error) {
      console.error('Error al obtener URL de imagen:', error);
      throw error;
    }
  },

  // Eliminar una imagen
  eliminarImagen: async (imagenId: string): Promise<void> => {
    try {
      // Eliminar la referencia a la imagen
      await deleteDoc(doc(db, IMAGENES_COLLECTION, imagenId));
      
      // Eliminar los chunks (esto se puede hacer con una Cloud Function)
      // Por ahora, solo eliminamos la referencia principal
    } catch (error) {
      console.error('Error al eliminar imagen:', error);
      throw error;
    }
  },
};

// Servicio de Alertas
export const alertaService = {
  // Obtener alertas no leídas
  obtenerAlertasNoLeidas: async (usuarioId: string): Promise<AlertaInventario[]> => {
    try {
      const q = query(
        collection(db, ALERTAS_COLLECTION),
        where('usuarioId', '==', usuarioId),
        where('leida', '==', false),
        orderBy('fecha', 'desc'),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fecha: doc.data().fecha?.toDate(),
        fechaLectura: doc.data().fechaLectura?.toDate(),
      })) as AlertaInventario[];
    } catch (error) {
      console.error('Error al obtener alertas:', error);
      throw error;
    }
  },

  // Marcar alerta como leída
  marcarComoLeida: async (alertaId: string, usuarioId: string): Promise<void> => {
    try {
      const alertaRef = doc(db, ALERTAS_COLLECTION, alertaId);
      await updateDoc(alertaRef, {
        leida: true,
        fechaLectura: serverTimestamp(),
        usuarioLecturaId: usuarioId,
      });
    } catch (error) {
      console.error('Error al marcar alerta como leída:', error);
      throw error;
    }
  },

  // Crear una nueva alerta
  crearAlerta: async (alerta: Omit<AlertaInventario, 'id' | 'fecha' | 'leida'>): Promise<void> => {
    try {
      const docRef = doc(collection(db, ALERTAS_COLLECTION));
      await setDoc(docRef, {
        ...alerta,
        fecha: serverTimestamp(),
        leida: false,
      });
    } catch (error) {
      console.error('Error al crear alerta:', error);
      throw error;
    }
  },
};

// Inicializar la aplicación
export const inicializarAplicacion = async (): Promise<void> => {
  try {
    // Inicializar categorías por defecto si no existen
    await categoriaService.inicializarCategoriasPorDefecto();
    
    // Aquí puedes agregar más inicializaciones necesarias
    
    console.log('Aplicación inicializada correctamente');
  } catch (error) {
    console.error('Error al inicializar la aplicación:', error);
    throw error;
  }
};
