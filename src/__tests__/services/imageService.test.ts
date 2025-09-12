import {
  fileToBase64,
  splitBase64IntoChunks,
  joinChunksToBase64,
  compressImage,
  prepareImageForFirebase,
  reconstructImageFromChunks,
} from '../../../src/services/imageService';

// Mock para FileReader
global.FileReader = class {
  result: string | ArrayBuffer | null = null;
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  
  readAsDataURL() {
    this.result = 'data:image/jpeg;base64,testbase64string';
    if (this.onload) {
      this.onload(new ProgressEvent('load'));
    }
  }
} as any;

// Mock para createImageBitmap
(global as any).createImageBitmap = async (blob: Blob) => {
  return {
    width: 100,
    height: 100,
  };
};

// Mock para document.createElement
document.createElement = jest.fn(() => {
  return {
    getContext: () => ({
      drawImage: jest.fn(),
      getImageData: jest.fn(),
      putImageData: jest.fn(),
    }),
    toBlob: (callback: (blob: Blob | null) => void) => {
      callback(new Blob(['test'], { type: 'image/jpeg' }));
    },
    width: 0,
    height: 0,
  };
}) as any;

describe('Image Service', () => {
  describe('fileToBase64', () => {
    it('debe convertir un archivo a base64', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await fileToBase64(file);
      expect(result).toBe('data:image/jpeg;base64,testbase64string');
    });

    it('debe rechazar si hay un error al leer el archivo', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockFileReader = new FileReader();
      
      // Sobrescribir el FileReader para simular un error
      const originalFileReader = window.FileReader;
      (window as any).FileReader = class {
        readAsDataURL() {
          if (this.onerror) {
            this.onerror(new ProgressEvent('error'));
          }
        }
      };
      
      await expect(fileToBase64(file)).rejects.toBeDefined();
      
      // Restaurar el FileReader original
      (window as any).FileReader = originalFileReader;
    });
  });

  describe('splitBase64IntoChunks y joinChunksToBase64', () => {
    it('debe dividir y unir correctamente una cadena base64', () => {
      const testString = 'a'.repeat(2000000); // 2MB de datos de prueba
      const chunks = splitBase64IntoChunks(testString);
      
      // Verificar que se creó más de un chunk
      expect(chunks.length).toBeGreaterThan(1);
      
      // Verificar que la unión de los chunks es igual a la cadena original
      const joined = joinChunksToBase64(chunks);
      expect(joined).toBe(testString);
    });
  });

  describe('compressImage', () => {
    it('debe comprimir una imagen correctamente', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const compressedFile = await compressImage(file, 800, 600, 0.7);
      
      expect(compressedFile).toBeInstanceOf(File);
      expect(compressedFile.name).toBe('test.jpg');
      expect(compressedFile.type).toBe('image/jpeg');
    });
  });

  describe('prepareImageForFirebase', () => {
    it('debe preparar una imagen para Firebase correctamente', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await prepareImageForFirebase(file, {
        maxWidth: 800,
        maxHeight: 600,
        quality: 0.7,
      });
      
      expect(result).toHaveProperty('chunks');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata.name).toBe('test.jpg');
      expect(result.metadata.type).toBe('image/jpeg');
      expect(result.metadata.chunksCount).toBeGreaterThan(0);
    });
  });

  describe('reconstructImageFromChunks', () => {
    it('debe reconstruir una imagen a partir de chunks', async () => {
      const testChunks = ['data:image/jpeg;base64,', 'test', 'base64', 'string'];
      const metadata = { type: 'image/jpeg' };
      
      const result = await reconstructImageFromChunks(testChunks, metadata);
      
      expect(result).toContain('data:image/jpeg;base64,');
      expect(result).toContain('testbase64string');
    });
  });
});
