import { 
  collection, 
  addDoc, 
  deleteDoc,
  doc, 
  getDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp, 
  getDocs, 
  where, 
  limit,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { ImageChunk, processImageFile, reconstructImageFromChunks } from '../utils/imageChunker';

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
  // Referencia a los chunks de la imagen principal
  imageRefs?: Array<{
    id: string;
    chunkCount: number;
    mimeType: string;
    uploadedAt: Date;
  }>;
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
const IMAGE_CHUNKS_COL = 'image_chunks';

/**
 * Guarda los chunks de una imagen en Firestore
 * @param chunks Chunks de la imagen
 * @returns Promesa que resuelve a la referencia de la imagen
 */
const saveImageChunks = async (chunks: ImageChunk[]): Promise<{
  id: string;
  chunkCount: number;
  mimeType: string;
}> => {
  if (chunks.length === 0) {
    throw new Error('No chunks provided');
  }

  const batch = writeBatch(db);
  const imageId = chunks[0].imageId;
  
  // Guardar cada chunk
  chunks.forEach(chunk => {
    const chunkRef = doc(collection(db, IMAGE_CHUNKS_COL, imageId, 'chunks'), chunk.chunkNumber.toString());
    batch.set(chunkRef, {
      ...chunk,
      uploadedAt: serverTimestamp()
    });
  });
  
  await batch.commit();
  
  return {
    id: imageId,
    chunkCount: chunks.length,
    mimeType: chunks[0].mimeType
  };
};

/**
 * Obtiene los chunks de una imagen y la reconstruye
 * @param imageId ID de la imagen
 * @returns Promesa que resuelve a la URL de datos de la imagen
 */
export const getImageData = async (imageId: string): Promise<string> => {
  const chunksRef = collection(db, IMAGE_CHUNKS_COL, imageId, 'chunks');
  const querySnapshot = await getDocs(query(chunksRef, orderBy('chunkNumber')));
  
  if (querySnapshot.empty) {
    throw new Error('No se encontraron chunks para esta imagen');
  }
  
  const chunks = querySnapshot.docs.map(doc => ({
    chunkNumber: doc.data().chunkNumber,
    totalChunks: doc.data().totalChunks,
    data: doc.data().data,
    imageId: doc.data().imageId,
    mimeType: doc.data().mimeType
  } as ImageChunk));
  
  const { data, mimeType } = reconstructImageFromChunks(chunks);
  return `data:${mimeType};base64,${data}`;
};

// Alias para compatibilidad
export const createProduct = addProduct;

export interface AddProductData extends Omit<Product, 'id' | 'fechaCreacion' | 'fechaActualizacion' | 'activo' | 'imageRefs'> {
  imageFile?: File;
}

export async function addProduct(data: AddProductData): Promise<string> {
  const { imageFile, ...productData } = data;
  
  // Calculate unit cost if not provided
  const costoUnitario = productData.costoUnitario || 
    (productData.stock > 0 ? productData.costo / productData.stock : 0);
  
  // Ensure precios array is properly formatted
  const precios = productData.precios?.length > 0 
    ? productData.precios 
    : [
        { cantidadMinima: 1, precio: 0, tipo: 'menudeo' as const },
        { cantidadMinima: 10, precio: 0, tipo: 'mayoreo' as const }
      ];

  // Procesar la imagen si está presente
  let imageRefs: Array<{
    id: string;
    chunkCount: number;
    mimeType: string;
    uploadedAt: Date;
  }> = [];
  
  if (imageFile) {
    try {
      // Procesar la imagen en chunks
      const { chunks } = await processImageFile(imageFile);
      
      // Guardar los chunks en Firestore
      const imageInfo = await saveImageChunks(chunks);
      
      // Crear referencia a la imagen
      imageRefs = [{
        id: imageInfo.id,
        chunkCount: imageInfo.chunkCount,
        mimeType: imageInfo.mimeType,
        uploadedAt: new Date()
      }];
    } catch (error) {
      console.error('Error al procesar la imagen:', error);
      throw new Error('Error al procesar la imagen: ' + (error as Error).message);
    }
  }

  const newProduct = {
    ...productData,
    costoUnitario,
    precios,
    imageRefs,
    fechaCreacion: serverTimestamp(),
    fechaActualizacion: serverTimestamp(),
    activo: true
  };

  const docRef = await addDoc(collection(db, COL), newProduct);
  return docRef.id;
}

export interface UpdateProductData extends Partial<Omit<Product, 'id' | 'fechaCreacion' | 'fechaActualizacion' | 'activo' | 'imageRefs'>> {
  imageFile?: File | null;
}

export async function updateProduct(id: string, data: UpdateProductData): Promise<void> {
  const { imageFile, ...updateData } = data;
  const batch = writeBatch(db);
  const productRef = doc(db, COL, id);
  
  // Obtener el producto actual para manejar la imagen existente
  const currentDoc = await getDoc(productRef);
  const currentData = currentDoc.data() as Product | undefined;
  
  if (!currentData) {
    throw new Error('Producto no encontrado');
  }
  
  // Manejar la imagen si se proporciona una nueva
  if (imageFile !== undefined) {
    // Si hay una imagen existente, la eliminaremos después de guardar la nueva
    const existingImageRefs = currentData.imageRefs || [];
    
    if (imageFile) {
      try {
        // Procesar la nueva imagen en chunks
        const { chunks } = await processImageFile(imageFile);
        
        // Guardar los nuevos chunks en Firestore
        const imageInfo = await saveImageChunks(chunks);
        
        // Actualizar las referencias de la imagen
        (updateData as any).imageRefs = [{
          id: imageInfo.id,
          chunkCount: imageInfo.chunkCount,
          mimeType: imageInfo.mimeType,
          uploadedAt: new Date()
        }];
      } catch (error) {
        console.error('Error al procesar la imagen:', error);
        throw new Error('Error al procesar la imagen: ' + (error as Error).message);
      }
    } else {
      // Si imageFile es null, eliminamos la imagen
      (updateData as any).imageRefs = [];
    }
    
    // Programar la eliminación de la imagen anterior después de la actualización exitosa
    await Promise.all(
      existingImageRefs.map(async (imgRef) => {
        // Eliminar los chunks de la imagen anterior
        const chunksRef = collection(db, IMAGE_CHUNKS_COL, imgRef.id, 'chunks');
        const chunksSnapshot = await getDocs(chunksRef);
        chunksSnapshot.forEach((chunkDoc) => {
          batch.delete(chunkDoc.ref);
        });
      })
    );
  }
  
  // Manejar precios si se proporcionan
  if (updateData.precioMenudeo !== undefined || updateData.precioMayoreo !== undefined) {
    updateData.precios = [
      {
        cantidadMinima: 1,
        precio: updateData.precioMenudeo !== undefined 
          ? updateData.precioMenudeo 
          : (currentData.precios?.[0]?.precio || 0),
        tipo: 'menudeo' as const
      },
      {
        cantidadMinima: updateData.cantidadMinimaMayoreo || (currentData.precios?.[1]?.cantidadMinima || 10),
        precio: updateData.precioMayoreo !== undefined 
          ? updateData.precioMayoreo 
          : (currentData.precios?.[1]?.precio || 0),
        tipo: 'mayoreo' as const
      }
    ];
  }
  
  // Recalcular costo unitario si es necesario
  if (updateData.costo !== undefined || updateData.stock !== undefined) {
    const newCosto = updateData.costo !== undefined ? updateData.costo : currentData.costo;
    const newStock = updateData.stock !== undefined ? updateData.stock : currentData.stock;
    updateData.costoUnitario = newStock > 0 ? newCosto / newStock : 0;
  }
  
  // Crear el objeto de actualización con todos los campos necesarios
  const updateObj = {
    ...updateData,
    fechaActualizacion: serverTimestamp()
  };
  
  // Actualizar el documento del producto
  batch.update(productRef, updateObj);
  
  // Ejecutar todas las operaciones en lote
  await batch.commit();
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

export interface ProductWithImage extends Omit<Product, 'imageRefs'> {
  imageUrl?: string;
}

export async function getProductById(id: string): Promise<ProductWithImage | null> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  
  const productData = snap.data() as Omit<Product, 'id'>;
  const result: ProductWithImage = {
    id: snap.id,
    ...productData
  };
  
  // Si hay referencias a imágenes, obtener la primera imagen
  if (productData.imageRefs?.[0]) {
    try {
      result.imageUrl = await getImageData(productData.imageRefs[0].id);
    } catch (error) {
      console.error('Error al cargar la imagen del producto:', error);
      // Si hay un error, simplemente no se agrega la URL de la imagen
    }
  }
  
  return result;
}

// Obtener productos por tipo
export async function getProductsByType(tipo: 'venta' | 'produccion' | 'paquete'): Promise<ProductWithImage[]> {
  const q = query(
    collection(db, COL),
    where('tipo', '==', tipo),
    where('activo', '==', true)
  );
  
  const snapshot = await getDocs(q);
  const products = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Product));
  
  // Obtener las URLs de las imágenes para cada producto
  return Promise.all(products.map(async (product) => {
    const result: ProductWithImage = { ...product };
    
    // Si hay referencias a imágenes, obtener la primera imagen
    if (product.imageRefs?.[0]) {
      try {
        result.imageUrl = await getImageData(product.imageRefs[0].id);
      } catch (error) {
        console.error(`Error al cargar la imagen para el producto ${product.id}:`, error);
        // Si hay un error, simplemente no se agrega la URL de la imagen
      }
    }
    
    return result;
  }));
}

// Obtener productos bajos en inventario
export async function getLowStockProducts(minStock: number = 10): Promise<ProductWithImage[]> {
  const q = query(
    collection(db, COL),
    where('stock', '<=', minStock),
    where('activo', '==', true)
  );
  
  const snapshot = await getDocs(q);
  const products = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Product));
  
  // Obtener las URLs de las imágenes para cada producto
  return Promise.all(products.map(async (product) => {
    const result: ProductWithImage = { ...product };
    
    // Si hay referencias a imágenes, obtener la primera imagen
    if (product.imageRefs?.[0]) {
      try {
        result.imageUrl = await getImageData(product.imageRefs[0].id);
      } catch (error) {
        console.error(`Error al cargar la imagen para el producto ${product.id}:`, error);
        // Si hay un error, simplemente no se agrega la URL de la imagen
      }
    }
    
    return result;
  }));
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
