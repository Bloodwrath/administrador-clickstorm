import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

interface AccountingEntry {
  tipo: 'ingreso' | 'gasto';
  categoria: string;
  monto: number;
  descripcion: string;
  fecha: string | Date;
  referencia: string;
  estado: 'pendiente' | 'completado' | 'cancelado';
  creadoPor: string;
  fechaCreacion?: any;
  notas?: string;
}

export const addAccountingEntry = async (entry: Omit<AccountingEntry, 'fechaCreacion'>) => {
  try {
    const docRef = await addDoc(collection(db, 'contabilidad'), {
      ...entry,
      fechaCreacion: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error al agregar entrada contable:', error);
    throw error;
  }
};

// Add more accounting-related functions as needed
