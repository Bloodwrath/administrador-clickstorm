import { 
  Box, 
  Button, 
  TextField, 
  FormControl,
  InputLabel, 
  Select, 
  MenuItem, 
  Typography, 
  CircularProgress,
  FormControlLabel,
  Grid,
  InputAdornment,
  Checkbox
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

// Import types
import { Producto, TipoProducto, PrecioCantidad, ImagenProducto, PaqueteItem, Dimensiones } from '../../types/inventory';

// Define local types
export type ItemPaquete = PaqueteItem;

interface Supplier {
  id: string;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  activo: boolean;
}

// Form data type that extends Producto with form-specific fields
export interface ProductoFormData extends Omit<Producto, 'fechaCreacion' | 'fechaActualizacion' | 'historialPrecios' | 'etiquetas' | 'imagenes'> {
  imagenes: (ImagenProducto | File)[];
  nuevaImagen?: File;
  // Store etiquetas as a comma-separated string in the form
  etiquetas: string;
  // Add other form-specific fields that might not be in the Producto type
  precios: PrecioCantidad[];
  dimensiones: Dimensiones;
  // Additional fields for form compatibility
  precioMenudeo?: number;
  precioMayoreo?: number;
  cantidadMayoreo?: number;
  minStock?: number;
  precio?: number;
  sku?: string;
  supplierName?: string;
  hasImage?: boolean;
}

// Default values for new product
const defaultValues: ProductoFormData = {
  nombre: '',
  codigoBarras: '',
  descripcion: '',
  categoriaId: '',
  categoria: '',
  proveedorId: '',
  proveedor: '',
  tipo: 'venta',
  material: '',
  stock: 0,
  stockMinimo: 0,
  stockMaximo: 0,
  costo: 0,
  costoProduccion: 0,
  moneda: 'MXN',
  precios: [
    { cantidadMinima: 1, precio: 0, tipo: 'menudeo' },
    { cantidadMinima: 10, precio: 0, tipo: 'mayoreo' }
  ],
  imagenes: [],
  etiquetas: '',
  activo: true,
  creadoPor: '',
  dimensiones: { ancho: 0, alto: 0, unidad: 'cm' },
  itemsPaquete: []
};

export interface ProductFormProps {
  onSubmit: (data: ProductoFormData) => Promise<void>;
  isEdit: boolean;
  productId?: string;
  initialData?: Partial<ProductoFormData>;
}

const ProductForm: React.FC<ProductFormProps> = ({ onSubmit, isEdit, productId, initialData = {} }) => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    throw new Error('No user is currently logged in');
  }
  
  const { 
    register, 
    handleSubmit, 
    setValue, 
    watch, 
    formState: { errors, isSubmitting }
  } = useForm<ProductoFormData>({
    defaultValues: {
      ...defaultValues,
      ...initialData,
      stockMinimo: initialData.stockMinimo ?? initialData.minStock ?? 0,
      precios: initialData.precios ?? [
        { 
          cantidadMinima: 1, 
          precio: initialData.precioMenudeo ?? initialData.precio ?? 0, 
          tipo: 'menudeo' 
        },
        { 
          cantidadMinima: initialData.cantidadMayoreo ?? 10, 
          precio: initialData.precioMayoreo ?? initialData.precio ?? 0, 
          tipo: 'mayoreo' 
        }
      ],
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
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const isFormSubmitting = isSubmitting || isLoading;
  
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
  }, [enqueueSnackbar, setSuppliers]);

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
          // // Map product data to form data
          // const formData: Partial<ProductoFormData> = {
          //   ...productData,
          //   etiquetas: productData.etiquetas?.join(', ') || '',
          //   precioMenudeo: productData.precios?.find(p => p.tipo === 'menudeo')?.precio,
          //   precioMayoreo: productData.precios?.find(p => p.tipo === 'mayoreo')?.precio,
          //   cantidadMayoreo: productData.precios?.find(p => p.tipo === 'mayoreo')?.cantidadMinima,
          //   minStock: productData.stockMinimo,
          //   precio: productData.precios?.[0]?.precio
          // };
          // Object.entries(formData).forEach(([key, value]) => {
          //   if (value !== undefined) {
          //     setValue(key as keyof ProductoFormData, value);
          // }
          // });
        }
      } catch (error) {
        console.error('Error loading data:', error);
        enqueueSnackbar('Error al cargar los datos', { variant: 'error' });
      }
    };

    loadData();
  }, [productId, isEdit, setValue, enqueueSnackbar]);

  // Update form values when initialData changes
  useEffect(() => {
    if (initialData) {
      const updates: Partial<ProductoFormData> = {};
      
      // Map legacy fields to new structure
      if (initialData.precio !== undefined) updates.precio = initialData.precio;
      if (initialData.precioMenudeo !== undefined) updates.precioMenudeo = initialData.precioMenudeo;
      if (initialData.precioMayoreo !== undefined) updates.precioMayoreo = initialData.precioMayoreo;
      if (initialData.cantidadMayoreo !== undefined) updates.cantidadMayoreo = initialData.cantidadMayoreo;
      if (initialData.costo !== undefined) updates.costo = initialData.costo;
      if (initialData.stock !== undefined) updates.stock = initialData.stock;
      if (initialData.minStock !== undefined) updates.stockMinimo = initialData.minStock;
      if (initialData.stockMinimo !== undefined) updates.stockMinimo = initialData.stockMinimo;
      if (initialData.activo !== undefined) updates.activo = initialData.activo;
      if (initialData.tipo) updates.tipo = initialData.tipo;
      
      // Update all fields at once to avoid multiple re-renders
      Object.entries(updates).forEach(([key, value]) => {
        setValue(key as keyof ProductoFormData, value);
      });
      
      // Update prices if needed
      if (initialData.precioMenudeo !== undefined || initialData.precioMayoreo !== undefined) {
        setValue('precios', [
          { 
            cantidadMinima: 1, 
            precio: initialData.precioMenudeo ?? initialData.precio ?? 0, 
            tipo: 'menudeo' as const 
          },
          { 
            cantidadMinima: initialData.cantidadMayoreo ?? 10, 
            precio: initialData.precioMayoreo ?? initialData.precio ?? 0, 
            tipo: 'mayoreo' as const 
          }
        ]);
      }
    }
  }, [initialData, setValue]);

  const handleAddPrecio = () => {
    const currentPrecios = watch('precios') || [];
    const newPrecios = [...currentPrecios];
    const nextMinQty = newPrecios.length > 0 
      ? Math.max(...newPrecios.map(p => p.cantidadMinima)) + 1 
      : 1;
    
    const newPrecio: PrecioCantidad = {
      cantidadMinima: nextMinQty,
      precio: 0,
      tipo: 'menudeo'
    };
    
    setValue('precios', [...watch('precios'), newPrecio]);
  };

  const handleRemovePrecio = (index: number) => {
    const currentPrecios = watch('precios') || [];
    const newPrecios = [...currentPrecios];
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

  const validateForm = async (data: ProductoFormData): Promise<boolean> => {
    // Validate required fields
    if (!data.nombre || !data.codigoBarras || !data.categoriaId) {
      enqueueSnackbar('Por favor complete todos los campos requeridos', { variant: 'error' });
      return false;
    }

    // Validate stock values
    if (data.stock < 0 || (data.stockMinimo ?? 0) < 0 || (data.stockMaximo ?? 0) < 0) {
      enqueueSnackbar('Los valores de stock no pueden ser negativos', { variant: 'error' });
      return false;
    }

    // Validate stock min/max
    if ((data.stockMinimo ?? 0) > (data.stockMaximo ?? 0)) {
      enqueueSnackbar('El stock mínimo no puede ser mayor al stock máximo', { variant: 'error' });
      return false;
    }

    // Validate prices
    if (data.precios && data.precios.length > 0) {
      for (const precio of data.precios) {
        if (precio.precio <= 0) {
          enqueueSnackbar('Los precios deben ser mayores a 0', { variant: 'error' });
          return false;
        }
      }
    } else {
      enqueueSnackbar('Debe definir al menos un precio', { variant: 'error' });
      return false;
    }

    // Validate package items if product type is package
    if (data.tipo === 'paquete' && (!data.itemsPaquete || data.itemsPaquete.length === 0)) {
      enqueueSnackbar('Debe agregar al menos un producto al paquete', { variant: 'error' });
      return false;
    }

    return true;
  };

  const onSubmitForm = async (formData: ProductoFormData) => {
    try {
      setIsLoading(true);
      
      // Get current date for timestamps
      const now = new Date();
      
      // Process form data before submission
      const { 
        stock = 0, 
        stockMinimo = 0, 
        stockMaximo = 0, 
        costo = 0, 
        costoProduccion = 0, 
        activo = true,
        precios = [],
        etiquetas = '',
        imagenes = [],
        ...restFormData 
      } = formData;
      
      // Process prices
      const processedPrecios = (precios || [])
        .filter(p => p && p.precio > 0)
        .map(p => ({
          cantidadMinima: p.cantidadMinima,
          precio: p.precio,
          tipo: p.tipo
        }));
      
      // Process price history
      const historialPrecios = [
        ...((initialData as any).historialPrecios || []),
        ...(precios && precios.length > 0 ? [{
          fecha: now,
          precio: precios[0].precio,
          moneda: (formData as any).moneda || 'MXN',
          motivo: 'Precio inicial'
        }] : [])
      ];
      
      // Process tags
      const processedEtiquetas = etiquetas 
        ? etiquetas.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];
      
      // Process images
      const processedImagenes = imagenes
        .filter((img): img is ImagenProducto => !(img instanceof File))
        .map(img => ({
          id: img.id,
          nombre: img.nombre,
          tipo: img.tipo,
          datos: img.datos,
          orden: img.orden,
          esPrincipal: img.esPrincipal
        }));
      
      // Create the final submission data
      const submitData: Producto = {
        // Spread remaining form data
        ...restFormData,
        
        // Set required fields with defaults
        stock,
        stockMinimo,
        stockMaximo,
        costo,
        costoProduccion,
        activo: activo ?? true,
        
        // Set processed arrays
        precios: processedPrecios,
        historialPrecios,
        etiquetas: processedEtiquetas,
        imagenes: processedImagenes,
        
        // Set audit fields
        creadoPor: isEdit ? ((initialData as any).creadoPor || currentUser.uid) : currentUser.uid,
        fechaCreacion: isEdit ? ((initialData as any).fechaCreacion || now) : now,
        fechaActualizacion: now,
        
        // Ensure dimensiones is properly set
        dimensiones: formData.dimensiones || {
          ancho: 0,
          alto: 0,
          profundidad: 0,
          unidad: 'cm'
        },
        
        // Ensure itemsPaquete is set
        itemsPaquete: formData.itemsPaquete || []
      };

      // Create a new object with only the fields that ProductoFormData expects
      const formDataForSubmit: ProductoFormData = {
        // Basic fields
        nombre: submitData.nombre,
        descripcion: submitData.descripcion || '',
        categoriaId: submitData.categoriaId,
        proveedorId: submitData.proveedorId,
        tipo: submitData.tipo,
        ubicacion: submitData.ubicacion || '',
        material: submitData.material || '',
        moneda: submitData.moneda || 'MXN',
        notas: submitData.notas || '',
        
        // Convert arrays and special fields
        etiquetas: processedEtiquetas.join(', '),
        precios: submitData.precios,
        dimensiones: submitData.dimensiones,
        itemsPaquete: submitData.itemsPaquete || [],
        
        // Stock and pricing
        stock: submitData.stock,
        stockMinimo: submitData.stockMinimo,
        stockMaximo: submitData.stockMaximo,
        costo: submitData.costo,
        costoProduccion: submitData.costoProduccion,
        
        // Images
        imagenes: submitData.imagenes,
        
        // Barcode and SKU
        codigoBarras: submitData.codigoBarras || '',
        sku: submitData.sku || '',
        
        // Status
        activo: submitData.activo,
        
        // Audit fields
        creadoPor: submitData.creadoPor,
        
        // Image status
        hasImage: submitData.imagenes && submitData.imagenes.length > 0,
        
        // Optional pricing fields
        precioMenudeo: submitData.precios.find(p => p.tipo === 'menudeo')?.precio,
        precioMayoreo: submitData.precios.find(p => p.tipo === 'mayoreo')?.precio,
        cantidadMayoreo: submitData.precios.find(p => p.tipo === 'mayoreo')?.cantidadMinima,
        minStock: submitData.stockMinimo,
        precio: submitData.precios[0]?.precio,
        supplierName: submitData.proveedorId // This should be mapped from supplierId to name if needed
      };
      
      await onSubmit(formDataForSubmit);
      enqueueSnackbar(`Producto ${isEdit ? 'actualizado' : 'creado'} correctamente`, { 
        variant: 'success' 
      });
      navigate('/inventario');
    } catch (error) {
      console.error('Error saving product:', error);
      enqueueSnackbar('Error al guardar el producto', { 
        variant: 'error' 
      });
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
          disabled={isFormSubmitting}
          startIcon={isFormSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {isEdit ? 'Guardar Cambios' : 'Crear Producto'}
        </Button>
      </Box>
    </Box>
  );
};

export default ProductForm;
