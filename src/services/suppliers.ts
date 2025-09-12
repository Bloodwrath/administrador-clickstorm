import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, onSnapshot, query, orderBy, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export type Supplier = {
  id?: string;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  activo: boolean;
  createdAt?: any;
  updatedAt?: any;
};

const COL = 'proveedores';

export async function addSupplier(data: Supplier): Promise<string> {
  const ref = await addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

export async function updateSupplier(id: string, data: Partial<Supplier>): Promise<void> {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteSupplier(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Supplier) };
}

export function listenSuppliers(cb: (items: Supplier[]) => void) {
  const q = query(collection(db, COL), orderBy('nombre', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Supplier) }));
    cb(items);
  });
}

export async function listSuppliers(): Promise<Supplier[]> {
  const snap = await getDocs(collection(db, COL));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Supplier) }));
}
