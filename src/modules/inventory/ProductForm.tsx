import { 
  Box, 
  Button, 
  TextField, 
  FormControl,
  IconButton,
  Checkbox,
  InputLabel, 
  Select, 
  MenuItem, 
  Typography, 
  CircularProgress,
  FormControlLabel,
  Grid,
  InputAdornment
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { 
  Add as AddIcon, 
  Save as SaveIcon
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';

// Import types from services
import { 
  Product, 
  ItemPaquete as ServiceItemPaquete,
  type Precio
} from '../../services/products';

// Define interfaces
interface Supplier {
  id: string;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  activo: boolean;
}

export type ItemPaquete = ServiceItemPaquete & {
  tipo: 'venta' | 'produccion';
};

export type TipoProducto = 'venta' | 'materia_prima' | 'paquete';

export type Producto = {
  id?: string;
  codigoBarras?: string;
  nombre: string;
  descripcion: string;
  categoriaId: string;
  proveedorId: string;
  material: string;
  costoProduccion: number;
  dimensiones: {
    ancho: number;
    alto: number;
    profundidad?: number;
    unidad: 'cm' | 'pulgadas' | 'mm';
  };
  precios: Array<{
    cantidadMinima: number;
    precio: number;
    tipo: 'mayoreo' | 'menudeo';
    moneda?: string;
  }>;
  moneda: string;
  costo: number;
  stock: number;
  stockMinimo: number;
  stockMaximo: number;
  tipo: 'venta' | 'produccion' | 'paquete';
  itemsPaquete?: Array<{
    productoId: string;
    cantidad: number;
    tipo: 'venta' | 'produccion';
  }>;
  imagenes: Array<{
    id: string;
    nombre: string;
    tipo: string;
    datos: string;
    orden: number;
    esPrincipal: boolean;
  }>;
  activo: boolean;
  fechaCreacion: Date | any;
  fechaActualizacion: Date | any;
  creadoPor: string;
  historialPrecios: Array<{
    fecha: Date;
    precio: number;
    moneda: string;
    motivo?: string;
  }>;
  etiquetas: string[];
  // Campos adicionales para compatibilidad
  precioMenudeo?: number;
  precioMayoreo?: number;
  cantidadMayoreo?: number;
  sku?: string;
  supplierName?: string;
  hasImage?: boolean;
};

export interface ProductFormProps {
  onSubmit: (data: Producto) => Promise<void>;
  isEdit: boolean;
  productId?: string;
  initialData?: Partial<Producto>;
}

const ProductForm: React.FC<ProductFormProps> = ({ onSubmit, isEdit, productId, initialData = {} }) => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  const { 
    register, 
    handleSubmit, 
    setValue, 
    watch, 
    formState: { errors }
  } = useForm<Producto>({
    defaultValues: {
      ...initialData,
      minStock: initialData.minStock ?? initialData.stockMinimo ?? 0,
      precio: initialData.precio ?? 0,
      precioMenudeo: initialData.precioMenudeo ?? initialData.precio ?? 0,
      precioMayoreo: initialData.precioMayoreo ?? initialData.precio ?? 0,
      cantidadMayoreo: initialData.cantidadMayoreo ?? 5,
      costo: initialData.costo ?? 0,
      stock: initialData.stock ?? 0,
      activo: initialData.activo ?? true,
      tipo: initialData.tipo ?? 'venta',
      itemsPaquete: initialData.itemsPaquete || [],
    },
  });

  const tipoProducto = watch('tipo');
  const precioMenudeo = watch('precioMenudeo');
  const precioMayoreo = watch('precioMayoreo');
  const cantidadMayoreo = watch('cantidadMayoreo');
  const itemsPaquete = watch('itemsPaquete') || [];
  
  const [suppliers] = useState<Supplier[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Load suppliers on mount
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        // TODO: Replace with actual API call
        // const supplierList = await listSuppliers();
        // setSuppliers(supplierList);
      } catch (error) {
        console.error('Error loading suppliers:', error);
        enqueueSnackbar('Error al cargar los proveedores', { variant: 'error' });
      }
    };
    
    loadSuppliers();
  }, [enqueueSnackbar]);

  // Load suppliers and product data
  useEffect(() => {
    const loadData = async () => {
      try {
        // TODO: Replace with actual API call
        // const suppliersData = await listSuppliers();
        // setSuppliers(suppliersData);
        
        if (isEdit && productId) {
          // TODO: Replace with actual API call
          // const productData = await getProductById(productId);
          // Object.entries(productData).forEach(([key, value]) => {
          //   setValue(key as keyof Producto, value);
          // });
        }
      } catch (error) {
        console.error('Error loading data:', error);
        enqueueSnackbar('Error al cargar los datos', { variant: 'error' });
      }
    };

    loadData();
  }, [productId, isEdit, setValue, enqueueSnackbar]);

  useEffect(() => {
    if (initialData) {
      if (initialData.precio) setValue('precio', initialData.precio);
      if (initialData.precioMenudeo) setValue('precioMenudeo', initialData.precioMenudeo);
      if (initialData.precioMayoreo) setValue('precioMayoreo', initialData.precioMayoreo);
      if (initialData.cantidadMayoreo) setValue('cantidadMayoreo', initialData.cantidadMayoreo);
      if (initialData.costo) setValue('costo', initialData.costo);
      if (initialData.stock) setValue('stock', initialData.stock);
      if (initialData.minStock !== undefined) setValue('minStock', initialData.minStock);
      if (initialData.stockMinimo !== undefined) setValue('minStock', initialData.stockMinimo);
      if (initialData.activo !== undefined) setValue('activo', initialData.activo);
      if (initialData.tipo) setValue('tipo', initialData.tipo);
    }
  }, [initialData, setValue]);

  const handleAddPrecio = () => {
    const newPrecios = [...watch('precios')];
    const nextMinQty = newPrecios.length > 0 
      ? Math.max(...newPrecios.map(p => p.cantidadMinima)) + 1 
      : 1;
    
    const newPrecio: Precio = {
      cantidadMinima: nextMinQty,
      precio: 0,
      tipo: 'menudeo'
    };
    
    setValue('precios', [...watch('precios'), newPrecio]);
  };

  const handleRemovePrecio = (index: number) => {
    const newPrecios = [...watch('precios')];
    newPrecios.splice(index, 1);
    setValue('precios', newPrecios);
  };

  const handleAddItemPaquete = () => {
    const newItem: ItemPaquete = {
      productoId: '',
      cantidad: 1,
      tipo: 'venta'
    };
    setValue('itemsPaquete', [...itemsPaquete, newItem]);
  };

  const handleRemoveItemPaquete = (index: number) => {
    const newItems = [...itemsPaquete];
    newItems.splice(index, 1);
    setValue('itemsPaquete', newItems);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Create preview URL
    const fileReader = new FileReader();
    fileReader.onload = () => {
      setPreviewUrl(fileReader.result as string);
    };
    fileReader.readAsDataURL(file);
  };

  const validateForm = async (data: Producto) => {
    // Basic validation
    if (!data.nombre || !data.nombre.trim()) {
      enqueueSnackbar('El nombre del producto es requerido', { variant: 'error' });
      return false;
    }

    // Validate prices
    if (!data.precios || data.precios.length === 0) {
      enqueueSnackbar('Debe agregar al menos un precio', { variant: 'error' });
      return false;
    }

    // Validate package items if product type is package
    if (data.tipo === 'paquete' && (!data.itemsPaquete || data.itemsPaquete.length === 0)) {
      enqueueSnackbar('Debe agregar al menos un producto al paquete', { variant: 'error' });
      return false;
    }

    return true;
  };

  const onSubmitForm = async (data: Producto) => {
    try {
      setIsLoading(true);
      
      // Validate form before submission
      const isValid = await validateForm(data);
      if (!isValid) {
        setIsLoading(false);
        return;
      }

      // Prepare product data
      const productData: Producto = {
        ...data,
        stockMinimo: data.minStock,
        precio: data.precioMenudeo, // Keep for backward compatibility
        precioMenudeo: data.precioMenudeo || 0,
        precioMayoreo: data.precioMayoreo || 0,
        cantidadMayoreo: data.cantidadMayoreo || 5,
        costo: data.costo || 0,
        stock: data.stock || 0,
        activo: data.activo ?? true,
        tipo: data.tipo || 'venta',
      };

      // If it's a package, ensure it has items
      if (productData.tipo === 'paquete' && (!productData.itemsPaquete || productData.itemsPaquete.length === 0)) {
        enqueueSnackbar('Un paquete debe contener al menos un producto', { variant: 'error' });
        return;
      }

      await onSubmit(productData);
      
      // Navigate back to inventory list
      navigate('/inventory');
    } catch (error) {
      console.error('Error saving product:', error);
      enqueueSnackbar('Error al guardar el producto', { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmitForm)} sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Nombre del producto"
            variant="outlined"
            margin="normal"
            {...register('nombre', { required: 'El nombre es requerido' })}
            error={!!errors.nombre}
            helperText={errors.nombre?.message}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="tipo-producto-label">Tipo de Producto</InputLabel>
            <Select
              labelId="tipo-producto-label"
              id="tipo"
              label="Tipo de Producto"
              {...register('tipo', { required: 'El tipo de producto es requerido' })}
              error={!!errors.tipo}
            >
              <MenuItem value="venta">Producto de Venta</MenuItem>
              <MenuItem value="materia_prima">Materia Prima</MenuItem>
              <MenuItem value="paquete">Paquete</MenuItem>
            </Select>
            {errors.tipo && (
              <Typography color="error" variant="caption">
                {errors.tipo.message}
              </Typography>
            )}
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Precio de Menudeo"
            type="number"
            variant="outlined"
            margin="normal"
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
              inputProps: { min: 0, step: '0.01' },
            }}
            {...register('precioMenudeo', { 
              required: 'El precio de menudeo es requerido',
              min: { value: 0, message: 'El precio debe ser mayor o igual a 0' },
              validate: (value) => {
                if (tipoProducto === 'paquete') return true;
                const precioMayoreo = watch('precioMayoreo');
                return !precioMayoreo || Number(value) >= Number(precioMayoreo) || 
                  'El precio de menudeo debe ser mayor o igual al precio de mayoreo';
              }
            })}
            error={!!errors.precioMenudeo}
            helperText={errors.precioMenudeo?.message}
            disabled={tipoProducto === 'paquete'}
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Precio de Mayoreo"
            type="number"
            variant="outlined"
            margin="normal"
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
              inputProps: { min: 0, step: '0.01' },
            }}
            {...register('precioMayoreo', { 
              required: 'El precio de mayoreo es requerido',
              min: { value: 0, message: 'El precio debe ser mayor o igual a 0' },
              validate: (value) => {
                if (tipoProducto === 'paquete') return true;
                const precioMenudeo = watch('precioMenudeo');
                return !precioMenudeo || Number(value) <= Number(precioMenudeo) || 
                  'El precio de mayoreo debe ser menor o igual al precio de menudeo';
              }
            })}
            error={!!errors.precioMayoreo}
            helperText={errors.precioMayoreo?.message}
            disabled={tipoProducto === 'paquete'}
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Cantidad para Mayoreo"
            type="number"
            variant="outlined"
            margin="normal"
            InputProps={{
              inputProps: { min: 1, step: 1 },
            }}
            {...register('cantidadMayoreo', { 
              required: 'La cantidad para mayoreo es requerida',
              min: { value: 1, message: 'La cantidad debe ser al menos 1' }
            })}
            error={!!errors.cantidadMayoreo}
            helperText={errors.cantidadMayoreo?.message}
            disabled={tipoProducto === 'paquete'}
          />
        </Grid>
        
        {/* Sección de imágenes */}
        <Box sx={{ gridColumn: { md: '1 / span 2' } }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Imágenes del producto (opcional)</Typography>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
          {previewUrl && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>Vista previa:</Typography>
              <img
                src={previewUrl}
                alt="Vista previa"
                style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }}
              />
            </Box>
          )}
        </Box>
        
        <FormControlLabel 
          control={<Checkbox defaultChecked {...register('activo')} />} 
          label="Producto activo" 
          sx={{ gridColumn: { md: '1 / span 2' } }}
        />
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/inventory')}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          variant="contained" 
          disabled={isSubmitting || isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {isEdit ? 'Guardar Cambios' : 'Crear Producto'}
        </Button>
      </Box>
    </Box>
  );
};

export default ProductForm;
