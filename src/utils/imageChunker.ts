/**
 * Utilidad para manejar la división y reconstrucción de imágenes en chunks
 * para almacenamiento en Firestore que tiene límites de tamaño por documento.
 */

export interface ImageChunk {
  chunkNumber: number;
  totalChunks: number;
  data: string;
  imageId: string;
  mimeType: string;
}

/**
 * Divide una imagen en base64 en chunks más pequeños
 * @param base64Data Cadena base64 de la imagen (sin el prefijo data:image/...;base64,)
 * @param chunkSize Tamaño máximo de cada chunk en bytes (por defecto 1MB)
 * @param mimeType Tipo MIME de la imagen (ej: 'image/jpeg')
 * @returns Array de objetos ImageChunk
 */
export const splitImageIntoChunks = (
  base64Data: string,
  mimeType: string,
  chunkSize: number = 1024 * 1024 // 1MB por defecto
): ImageChunk[] => {
  const chunks: ImageChunk[] = [];
  const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Calcular el tamaño de cada caracter en bytes (1 para ASCII, 2 para UTF-16)
  const charSize = 2; // Para asegurarnos, asumimos el peor caso
  
  // Calcular cuántos caracteres caben en cada chunk
  const chunkLength = Math.floor(chunkSize / charSize);
  const totalChunks = Math.ceil(base64Data.length / chunkLength);
  
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkLength;
    const end = Math.min(start + chunkLength, base64Data.length);
    
    chunks.push({
      chunkNumber: i,
      totalChunks,
      data: base64Data.substring(start, end),
      imageId,
      mimeType
    });
  }
  
  return chunks;
};

/**
 * Reconstruye una imagen a partir de sus chunks
 * @param chunks Array de ImageChunk ordenados por chunkNumber
 * @returns Objeto con la imagen en base64 y su tipo MIME
 */
export const reconstructImageFromChunks = (chunks: ImageChunk[]): { data: string; mimeType: string } => {
  if (chunks.length === 0) {
    throw new Error('No chunks provided for reconstruction');
  }
  
  // Ordenar los chunks por chunkNumber
  const sortedChunks = [...chunks].sort((a, b) => a.chunkNumber - b.chunkNumber);
  
  // Verificar que todos los chunks estén presentes
  const totalChunks = sortedChunks[0].totalChunks;
  if (sortedChunks.length !== totalChunks) {
    throw new Error(`Missing chunks. Expected ${totalChunks}, got ${sortedChunks.length}`);
  }
  
  // Reconstruir la cadena base64
  const base64Data = sortedChunks.map(chunk => chunk.data).join('');
  
  return {
    data: base64Data,
    mimeType: sortedChunks[0].mimeType
  };
};

/**
 * Convierte un File a base64
 * @param file Archivo a convertir
 * @returns Promesa que resuelve al objeto { base64, mimeType }
 */
export const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (!event.target?.result) {
        reject(new Error('Failed to read file'));
        return;
      }
      
      // El resultado es una cadena con el formato data:image/...;base64,...
      const dataUrl = event.target.result as string;
      const base64Data = dataUrl.split(',')[1]; // Eliminar el prefijo
      
      resolve({
        base64: base64Data,
        mimeType: file.type
      });
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Procesa un archivo de imagen y lo divide en chunks
 * @param file Archivo de imagen
 * @param chunkSize Tamaño máximo de cada chunk en bytes
 * @returns Promesa que resuelve a los chunks de la imagen
 */
export const processImageFile = async (
  file: File,
  chunkSize: number = 1024 * 1024 // 1MB por defecto
): Promise<{ chunks: ImageChunk[]; mimeType: string }> => {
  try {
    const { base64, mimeType } = await fileToBase64(file);
    const chunks = splitImageIntoChunks(base64, mimeType, chunkSize);
    return { chunks, mimeType };
  } catch (error) {
    console.error('Error processing image file:', error);
    throw error;
  }
};
