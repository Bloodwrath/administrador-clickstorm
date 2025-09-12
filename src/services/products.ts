import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, onSnapshot, query, orderBy, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export type Product = {
  id?: string;
  nombre: string;
  sku?: string;
  categoria?: string;
  precio: number;
  costo?: number;
  stock: number;
  minStock?: number;
  descripcion?: string;
  activo: boolean;
  createdAt?: any;
  updatedAt?: any;
};

const COL = 'productos';

export async function addProduct(data: Product): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

export async function getProductById(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Product) };
}

export function listenProducts(cb: (items: Product[]) => void, opts?: { orderByField?: string }) {
  const q = query(collection(db, COL), orderBy(opts?.orderByField || 'createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Product) }));
    cb(items);
  });
}

export async function searchProducts(term: string): Promise<Product[]> {
  // Búsqueda simple en cliente (para planes gratuitos). Para grandes volúmenes, usar índices/algolia.
  const snap = await getDocs(collection(db, COL));
  const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Product) }));
  const t = term.trim().toLowerCase();
  if (!t) return items;
  return items.filter((p) =>
    (p.nombre || '').toLowerCase().includes(t) ||
    (p.sku || '').toLowerCase().includes(t) ||
    (p.categoria || '').toLowerCase().includes(t)
  );
}
