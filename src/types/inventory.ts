/**
 * Tipos de datos para el módulo de inventario
 */

export interface Dimensiones {
  ancho: number;
  alto: number;
  profundidad?: number;
  unidad: 'cm' | 'pulgadas' | 'mm';
}

export interface PrecioHistorico {
  fecha: Date;
  precio: number;
  moneda: string;
  motivo?: string;
}

export interface ImagenProducto {
  id: string;
  nombre: string;
  tipo: string;
  datos: string; // Base64
  orden: number;
  esPrincipal: boolean;
}

export type TipoProducto = 'venta' | 'produccion' | 'paquete';

export interface PrecioCantidad {
  cantidadMinima: number;
  precio: number;
  tipo: 'mayoreo' | 'menudeo';
}

export interface PaqueteItem {
  productoId: string;
  cantidad: number;
  tipo: 'venta' | 'produccion';
}

export interface Producto {
  id?: string; // ID generado por Firestore
  codigoBarras?: string;
  nombre: string;
  descripcion: string;
  categoriaId: string;
  proveedorId: string;
  dimensiones: Dimensiones;
  material: string;
  
  // Precios dinámicos basados en cantidad
  precios: PrecioCantidad[];
  moneda: string;
  
  // Costos
  costo: number;
  costoProduccion?: number;
  
  // Inventario
  stock: number;
  stockMinimo: number;
  stockMaximo: number;
  
  // Tipo de producto
  tipo: TipoProducto;
  
  // Solo para paquetes
  itemsPaquete?: PaqueteItem[];
  
  // Imágenes y estado
  imagenes: ImagenProducto[];
  activo: boolean;
  
  // Auditoría
  fechaCreacion: Date;
  fechaActualizacion: Date;
  creadoPor: string; // ID del usuario
  
  // Historial
  historialPrecios: PrecioHistorico[];
  etiquetas: string[];
  ubicacion?: string;
  notas?: string;
}

export interface Categoria {
  id?: string;
  nombre: string;
  descripcion?: string;
  padreId?: string; // Para categorías anidadas
  icono?: string;
  activa: boolean;
  fechaCreacion: Date;
}

export interface Proveedor {
  id?: string;
  nombre: string;
  contacto: string;
  telefono: string;
  email: string;
  direccion: string;
  rfc?: string;
  activo: boolean;
  productosSuministrados: string[]; // IDs de productos
  fechaCreacion: Date;
  fechaActualizacion: Date;
  notas?: string;
}

export interface MovimientoInventario {
  id?: string;
  productoId: string;
  tipo: 'entrada' | 'salida' | 'ajuste' | 'devolucion';
  cantidad: number;
  cantidadAnterior: number;
  cantidadNueva: number;
  motivo: string;
  fecha: Date;
  usuarioId: string;
  proveedorId?: string; // Para entradas
  ordenCompraId?: string;
  notas?: string;
}

export interface AlertaInventario {
  id?: string;
  tipo: 'stock_minimo' | 'stock_agotado' | 'caducidad' | 'movimiento';
  productoId: string;
  mensaje: string;
  fecha: Date;
  leida: boolean;
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  accionRealizada?: string;
  fechaLectura?: Date;
  usuarioLecturaId?: string;
}

// Interfaz para las categorías de sublimación
interface CategoriaSublimacion {
  nombre: string;
  icono: string;
  descripcion?: string;
}

// Categorías sugeridas para tienda de sublimación
export const CATEGORIAS_SUBLIMACION: CategoriaSublimacion[] = [
  { nombre: 'Tazas', icono: 'mug', descripcion: 'Tazas personalizables para bebidas calientes' },
  { nombre: 'Playeras', icono: 'shirt', descripcion: 'Playeras de algodón para sublimación' },
  { nombre: 'Gorras', icono: 'hat-cowboy', descripcion: 'Gorras planas para personalizar' },
  { nombre: 'Llaveros', icono: 'key', descripcion: 'Llaveros personalizados' },
  { nombre: 'Termos', icono: 'flask', descripcion: 'Termos para bebidas calientes y frías' },
  { nombre: 'Rompecabezas', icono: 'puzzle-piece', descripcion: 'Rompecabezas personalizados' },
  { nombre: 'Mouse Pads', icono: 'computer-mouse', descripcion: 'Mouse pads personalizados' },
  { nombre: 'Tazones', icono: 'bowl-food', descripcion: 'Tazones para sopa o cereal' },
  { nombre: 'Platos', icono: 'plate-wheat', descripcion: 'Platos personalizados' },
  { nombre: 'Coasters', icono: 'circle', descripcion: 'Individuales para vasos' },
  { nombre: 'Almohadas', icono: 'couch', descripcion: 'Almohadas decorativas' },
  { nombre: 'Mochilas', icono: 'bag-shopping', descripcion: 'Mochilas escolares' },
  { nombre: 'Loncheras', icono: 'utensils', descripcion: 'Loncheras térmicas' },
  { nombre: 'Bolsas', icono: 'bag-shopping', descripcion: 'Bolsas de tela' },
  { nombre: 'Pulseras', icono: 'diamond', descripcion: 'Pulseras personalizadas' },
  { nombre: 'Tazones para Mascotas', icono: 'bowl-food', descripcion: 'Tazones para comida de mascotas' },
  { nombre: 'Cojines', icono: 'couch', descripcion: 'Cojines decorativos' },
  { nombre: 'Mantas', icono: 'blanket', descripcion: 'Mantas personalizadas' },
  { nombre: 'Mugs', icono: 'mug-hot', descripcion: 'Tazas de cerámica' },
  { nombre: 'Tazones de Postre', icono: 'bowl-food', descripcion: 'Tazones pequeños para postres' },
  { nombre: 'Platos de Postre', icono: 'plate-wheat', descripcion: 'Platos pequeños para postres' },
  { nombre: 'Tazas de Café', icono: 'mug-hot', descripcion: 'Tazas especiales para café' },
  { nombre: 'Tazas de Té', icono: 'mug-hot', descripcion: 'Tazas especiales para té' },
  { nombre: 'Tazas de Vino', icono: 'wine-glass', descripcion: 'Copas de vino personalizadas' },
  { nombre: 'Vasos', icono: 'glass-water', descripcion: 'Vasos de vidrio o plástico' },
  { nombre: 'Botellas', icono: 'bottle-water', descripcion: 'Botellas deportivas' },
  { nombre: 'Termos para Café', icono: 'mug-hot', descripcion: 'Termos específicos para café' },
  { nombre: 'Termos para Agua', icono: 'bottle-water', descripcion: 'Termos para agua' },
  { nombre: 'Termos para Alimentos', icono: 'bowl-food', descripcion: 'Termos para comida' },
  { nombre: 'Termos para Bebidas', icono: 'glass-water', descripcion: 'Termos para bebidas en general' },
  { nombre: 'Termos para Vino', icono: 'wine-glass', descripcion: 'Termos para mantener vino' },
  { nombre: 'Termos para Cerveza', icono: 'beer-mug-empty', descripcion: 'Termos para cerveza' },
  { nombre: 'Termos para Licor', icono: 'whiskey-glass', descripcion: 'Termos para licores' },
  { nombre: 'Termos para Bebidas Calientes', icono: 'mug-hot', descripcion: 'Termos para mantener bebidas calientes' },
  { nombre: 'Termos para Bebidas Frías', icono: 'snowflake', descripcion: 'Termos para mantener bebidas frías' }
];

// Niveles de alerta
export const NIVELES_ALERTA = [
  { id: 'baja', nombre: 'Baja', color: '#4CAF50' },
  { id: 'media', nombre: 'Media', color: '#FFC107' },
  { id: 'alta', nombre: 'Alta', color: '#FF9800' },
  { id: 'critica', nombre: 'Crítica', color: '#F44336' },
];
