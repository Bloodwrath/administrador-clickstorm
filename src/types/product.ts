export interface Product {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  precioMenudeo: number;
  precioMayoreo: number;
  cantidadMayoreo: number;
  stock: number;
  stockMinimo: number;
  costo?: number;
  costoProduccion?: number;
  proveedor?: string;
  ubicacion?: string;
  fechaCreacion?: string | Date;
  fechaActualizacion: string | Date;
  activo: boolean;
  imagenes?: string[];
  notas?: string;
  etiquetas?: string[];
  unidadMedida?: string;
  moneda?: string;
}

export interface ProductFormData extends Omit<Product, 'id' | 'fechaActualizacion' | 'activo'> {
  id?: string;
  activo?: boolean;
  // Add any other form-specific fields here
}

export const initialProductState: ProductFormData = {
  codigo: '',
  nombre: '',
  descripcion: '',
  categoria: '',
  precioMenudeo: 0,
  precioMayoreo: 0,
  cantidadMayoreo: 1,
  stock: 0,
  stockMinimo: 0,
  proveedor: '',
  ubicacion: '',
  notas: '',
  activo: true
};

export const calculateProductPrice = (product: Product, quantity: number): number => {
  if (quantity >= product.cantidadMayoreo) {
    return product.precioMayoreo;
  }
  return product.precioMenudeo;
};

export const isLowStock = (product: Product): boolean => {
  return product.stock <= product.stockMinimo;
};
