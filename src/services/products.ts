import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp, 
  getDocs, 
  where, 
  limit 
} from 'firebase/firestore';
import { db } from './firebase';

// Tipos

type Precio = {
  cantidadMinima: number;
  precio: number;
  tipo: 'menudeo' | 'mayoreo';
};

type ItemPaquete = {
  productoId: string;
  cantidad: number;
  tipo: string;
};

export type Product = {
  id?: string;
  nombre: string;
  codigoBarras?: string;
  descripcion?: string;
  categoriaId?: string;
  proveedorId?: string;
  material?: string;
  precios: Precio[];
  moneda: string;
  costo: number;
  costoProduccion?: number;
  stock: number;
  stockMinimo: number;
  stockMaximo: number;
  tipo: 'venta' | 'produccion' | 'paquete';
  itemsPaquete?: ItemPaquete[];
  imagenes: string[];
  activo: boolean;
  fechaCreacion?: any;
  fechaActualizacion?: any;
  creadoPor?: string;
  historialPrecios?: any[];
  etiquetas?: string[];
};

const COL = 'productos';

// Alias para compatibilidad
export const createProduct = addProduct;

export async function addProduct(data: Product): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    fechaCreacion: serverTimestamp(),
    fechaActualizacion: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    ...data,
    fechaActualizacion: serverTimestamp(),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

export async function getProductById(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return { 
    id: snap.id, 
    ...(snap.data() as Omit<Product, 'id'>) 
  };
}

// Obtener productos por tipo
export async function getProductsByType(tipo: 'venta' | 'produccion' | 'paquete'): Promise<Product[]> {
  const q = query(
    collection(db, COL),
    where('tipo', '==', tipo),
    where('activo', '==', true)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Product));
}

// Obtener productos bajos en inventario
export async function getLowStockProducts(minStock: number = 10): Promise<Product[]> {
  const q = query(
    collection(db, COL),
    where('stock', '<=', minStock),
    where('activo', '==', true)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Product));
}

export function listenProducts(
  cb: (items: Product[]) => void, 
  opts?: { 
    orderByField?: string;
    where?: [string, any, any];
    limit?: number;
  }
) {
  let q = query(collection(db, COL));
  
  if (opts?.orderByField) {
    q = query(q, orderBy(opts.orderByField));
  }
  
  if (opts?.where) {
    q = query(q, where(...opts.where));
  }
  
  if (opts?.limit) {
    q = query(q, limit(opts.limit));
  }
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Product) }));
    cb(items);
  });
}

export async function searchProducts(term: string): Promise<Product[]> {
  const q = query(
    collection(db, COL),
    orderBy('nombre'),
    where('nombre', '>=', term),
    where('nombre', '<=', term + '\uf8ff')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Product));
}
