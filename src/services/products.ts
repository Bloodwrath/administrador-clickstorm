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

export type Precio = {
  cantidadMinima: number;
  precio: number;
  tipo: 'menudeo' | 'mayoreo';
};

export type ItemPaquete = {
  productoId: string;
  cantidad: number;
  tipo: 'venta' | 'produccion';
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
  costoUnitario?: number;
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
  // New fields
  precioMenudeo?: number;
  precioMayoreo?: number;
  cantidadMinimaMayoreo?: number;
};

const COL = 'productos';

// Alias para compatibilidad
export const createProduct = addProduct;

export async function addProduct(data: Product): Promise<string> {
  // Calculate unit cost if not provided
  const costoUnitario = data.costoUnitario || (data.stock > 0 ? data.costo / data.stock : 0);
  
  // Ensure precios array is properly formatted
  const precios = data.precios?.length > 0 
    ? data.precios 
    : [
        { cantidadMinima: 1, precio: data.precioMenudeo || 0, tipo: 'menudeo' },
        { 
          cantidadMinima: data.cantidadMinimaMayoreo || 10, 
          precio: data.precioMayoreo || 0, 
          tipo: 'mayoreo' 
        }
      ];

  const productData = {
    ...data,
    precios,
    costoUnitario: parseFloat(costoUnitario.toFixed(4)),
    fechaCreacion: serverTimestamp(),
    fechaActualizacion: serverTimestamp(),
    // Ensure these fields are included
    precioMenudeo: data.precioMenudeo || (data.precios?.find(p => p.tipo === 'menudeo')?.precio || 0),
    precioMayoreo: data.precioMayoreo || (data.precios?.find(p => p.tipo === 'mayoreo')?.precio || 0),
    cantidadMinimaMayoreo: data.cantidadMinimaMayoreo || (data.precios?.find(p => p.tipo === 'mayoreo')?.cantidadMinima || 10),
  };

  const ref = await addDoc(collection(db, COL), productData);
  return ref.id;
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  const updateData: any = { ...data };
  
  // Recalculate unit cost if either costo or stock is being updated
  if (data.costo !== undefined || data.stock !== undefined) {
    const currentDoc = await getDoc(doc(db, COL, id));
    const currentData = currentDoc.data() as Product;
    
    const newCosto = data.costo !== undefined ? data.costo : currentData.costo;
    const newStock = data.stock !== undefined ? data.stock : currentData.stock;
    
    updateData.costoUnitario = newStock > 0 ? parseFloat((newCosto / newStock).toFixed(4)) : 0;
  }
  
  // Ensure precios array is properly updated if any price fields change
  if (data.precioMenudeo !== undefined || data.precioMayoreo !== undefined || data.cantidadMinimaMayoreo !== undefined) {
    updateData.precios = [
      {
        cantidadMinima: 1,
        precio: data.precioMenudeo !== undefined ? data.precioMenudeo : (data.precios?.[0]?.precio || 0),
        tipo: 'menudeo' as const
      },
      {
        cantidadMinima: data.cantidadMinimaMayoreo || (data.precios?.[1]?.cantidadMinima || 10),
        precio: data.precioMayoreo !== undefined ? data.precioMayoreo : (data.precios?.[1]?.precio || 0),
        tipo: 'mayoreo' as const
      }
    ];
  }
  
  await updateDoc(doc(db, COL, id), {
    ...updateData,
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
