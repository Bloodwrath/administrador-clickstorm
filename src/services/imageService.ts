/**
 * Servicio para el manejo de imágenes
 * Incluye conversión a base64, compresión y manejo de chunks para Firebase
 */

// Tamaño máximo de chunk para Firestore (1MB menos un margen de seguridad)
const MAX_CHUNK_SIZE = 900 * 1024; // 900KB

/**
 * Convierte un archivo de imagen a base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Divide una cadena base64 en chunks para almacenamiento en Firestore
 */
export const splitBase64IntoChunks = (base64String: string): string[] => {
  const chunks: string[] = [];
  const length = base64String.length;
  const chunkCount = Math.ceil(length / MAX_CHUNK_SIZE);

  for (let i = 0; i < chunkCount; i++) {
    const start = i * MAX_CHUNK_SIZE;
    const end = start + MAX_CHUNK_SIZE;
    chunks.push(base64String.substring(start, end));
  }

  return chunks;
};

/**
 * Reconstruye una cadena base64 a partir de chunks
 */
export const joinChunksToBase64 = (chunks: string[]): string => {
  return chunks.join('');
};

/**
 * Comprime una imagen antes de subirla
 */
export const compressImage = (
  file: File,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('No se pudo obtener el contexto 2D'));
      return;
    }

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calcular nuevas dimensiones manteniendo la relación de aspecto
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      // Redimensionar canvas
      canvas.width = width;
      canvas.height = height;

      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height);

      // Convertir a Blob con calidad ajustable
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Error al comprimir la imagen'));
            return;
          }
          
          // Crear un nuevo archivo con el blob
          const compressedFile = new File(
            [blob],
            file.name,
            { type: 'image/jpeg', lastModified: Date.now() }
          );
          
          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = (error) => {
      reject(new Error('Error al cargar la imagen'));
      console.error('Error al cargar la imagen:', error);
    };

    // Cargar la imagen
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
  });
};

/**
 * Previsualiza una imagen en un elemento img
 */
export const previewImage = (
  file: File,
  elementId: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const imgElement = document.getElementById(elementId) as HTMLImageElement;

    if (!imgElement) {
      reject(new Error(`Elemento con ID ${elementId} no encontrado`));
      return;
    }

    reader.onload = (e) => {
      if (e.target?.result) {
        imgElement.src = e.target.result as string;
        resolve();
      } else {
        reject(new Error('No se pudo cargar la imagen'));
      }
    };

    reader.onerror = (error) => {
      reject(new Error('Error al leer el archivo de imagen'));
      console.error('Error al leer la imagen:', error);
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Función para convertir una imagen a base64 y dividirla en chunks
 */
export const prepareImageForFirebase = async (
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<{ chunks: string[]; metadata: { name: string; type: string; size: number; chunksCount: number } }> => {
  try {
    // Comprimir la imagen
    const compressedFile = await compressImage(
      file,
      options.maxWidth,
      options.maxHeight,
      options.quality
    );

    // Convertir a base64
    const base64 = await fileToBase64(compressedFile);
    
    // Extraer solo la parte de datos de la URL base64
    const base64Data = base64.split(',')[1] || base64;
    
    // Dividir en chunks
    const chunks = splitBase64IntoChunks(base64Data);

    return {
      chunks,
      metadata: {
        name: file.name,
        type: file.type,
        size: file.size,
        chunksCount: chunks.length,
      },
    };
  } catch (error) {
    console.error('Error al preparar la imagen para Firebase:', error);
    throw error;
  }
};

/**
 * Reconstruye una imagen a partir de chunks almacenados en Firestore
 */
export const reconstructImageFromChunks = async (
  chunks: string[],
  metadata: { type: string }
): Promise<string> => {
  try {
    // Unir los chunks
    const base64Data = joinChunksToBase64(chunks);
    
    // Reconstruir la URL base64
    return `data:${metadata.type};base64,${base64Data}`;
  } catch (error) {
    console.error('Error al reconstruir la imagen desde los chunks:', error);
    throw error;
  }
};
