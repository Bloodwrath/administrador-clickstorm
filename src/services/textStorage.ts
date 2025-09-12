import { collection, doc, getDocs, orderBy, query, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

// Firestore tiene un límite de ~1 MiB por documento.
// Usamos un tamaño de chunk conservador para el campo de texto, dejando margen para metadatos.
const DEFAULT_CHUNK_SIZE = 900_000; // caracteres aprox. (cada char ~1 byte en UTF-8 simple)

// Utilidades de codificación Base64 para binarios/strings
export function toBase64(input: string | Uint8Array): string {
  if (typeof input === 'string') {
    // Codificar string a base64
    if (typeof window !== 'undefined' && window.btoa) {
      return window.btoa(unescape(encodeURIComponent(input)));
    }
    return Buffer.from(input, 'utf-8').toString('base64');
  } else {
    // Uint8Array a base64
    if (typeof window !== 'undefined' && window.btoa) {
      let binary = '';
      input.forEach((b) => (binary += String.fromCharCode(b)));
      return window.btoa(binary);
    }
    return Buffer.from(input).toString('base64');
  }
}

export function fromBase64(b64: string, asBinary = false): string | Uint8Array {
  if (asBinary) {
    if (typeof window !== 'undefined' && window.atob) {
      const binary = window.atob(b64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
      return bytes;
    }
    return Uint8Array.from(Buffer.from(b64, 'base64'));
  } else {
    if (typeof window !== 'undefined' && window.atob) {
      return decodeURIComponent(escape(window.atob(b64)));
    }
    return Buffer.from(b64, 'base64').toString('utf-8');
  }
}

/**
 * Guarda texto (o binario codificado a base64) en Firestore,
 * dividiéndolo en chunks dentro de una subcolección `chunks`.
 * Estructura:
 *   collection/{docId}
 *     - metadata: { totalChunks, createdAt, updatedAt, encoding }
 *   collection/{docId}/chunks/{index}
 *     - { index, data }
 */
export async function saveLargeText(
  collectionName: string,
  docId: string,
  content: string | Uint8Array,
  options?: { encode?: 'none' | 'base64'; chunkSize?: number }
): Promise<void> {
  const encode = options?.encode ?? 'base64';
  const chunkSize = options?.chunkSize ?? DEFAULT_CHUNK_SIZE;

  const text = encode === 'base64' ? toBase64(content) : (content as string);
  const totalChunks = Math.ceil(text.length / chunkSize) || 1;

  const metaRef = doc(db, collectionName, docId);
  const chunksCol = collection(db, collectionName, docId, 'chunks');

  // Eliminar chunks anteriores y escribir nuevos de forma atómica
  const batch = writeBatch(db);

  // Primero, borrar los chunks existentes
  const existing = await getDocs(query(chunksCol));
  existing.forEach((d) => batch.delete(d.ref));

  // Escribir metadata
  batch.set(metaRef, {
    totalChunks,
    encoding: encode,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  // Escribir nuevos chunks
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = start + chunkSize;
    const chunkData = text.slice(start, end);
    const chunkRef = doc(chunksCol, String(i));
    batch.set(chunkRef, { index: i, data: chunkData });
  }

  await batch.commit();
}

/**
 * Recupera y concatena los chunks en orden para reconstruir el contenido.
 * Si encoding = base64 y asBinary = true, devuelve Uint8Array; si no, string.
 */
export async function getLargeText(
  collectionName: string,
  docId: string,
  asBinary = false
): Promise<string | Uint8Array | null> {
  const chunksCol = collection(db, collectionName, docId, 'chunks');

  // Obtener metadata (opcional). Si no existe, intentar reconstruir igual.
  // No usamos getDoc aquí para simplificar; la presencia de chunks es suficiente.

  const q = query(chunksCol, orderBy('index', 'asc'));
  const snap = await getDocs(q);
  if (snap.empty) return null;

  let all = '';
  snap.forEach((d) => {
    const { data } = d.data() as { index: number; data: string };
    all += data;
  });

  // Detectar encoding: intentamos inferir a base64 si parece válido (opcional).
  // Para exactitud, podrías leer metaRef y usar el campo `encoding`.
  // Aquí asumimos base64 sólo si cumple patrón típico.
  const looksBase64 = /^[A-Za-z0-9+/=\n\r]+$/.test(all) && all.length % 4 === 0;
  const useBinary = asBinary && looksBase64;

  return useBinary ? (fromBase64(all, true) as Uint8Array) : all;
}

/**
 * Elimina el documento y todos sus chunks.
 */
export async function deleteLargeText(collectionName: string, docId: string): Promise<void> {
  const metaRef = doc(db, collectionName, docId);
  const chunksCol = collection(db, collectionName, docId, 'chunks');

  const batch = writeBatch(db);
  const snap = await getDocs(chunksCol);
  snap.forEach((d) => batch.delete(d.ref));
  batch.delete(metaRef);
  await batch.commit();
}
