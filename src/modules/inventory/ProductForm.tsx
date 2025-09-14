import { 
  Box, 
  Button, 
  TextField, 
  FormControl,
  InputLabel, 
  Select, 
  MenuItem, 
  Typography, 
  Grid,
  InputAdornment,
  Divider
} from '@mui/material';
import { Save as SaveIcon, CameraAlt as CameraIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

// Import types
import { Producto, PrecioCantidad, Dimensiones } from '../../types/inventory';

// Form data type that extends Producto with form-specific fields
export interface ProductoFormData extends Omit<Producto, 'historialPrecios' | 'etiquetas' | 'imagenes' | 'precios' | 'dimensiones'> {
  imagenes: any[];  // Simplified for now
  etiquetas: string;
  precios: PrecioCantidad[];
  dimensiones: Dimensiones;
  precioMenudeo?: number;
  precioMayoreo?: number;
  cantidadMinimaMayoreo?: number;
  minStock?: number;
  precio?: number;
  sku?: string;
  costoUnitario?: number;
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
  etiquetas: '',
  dimensiones: {
    ancho: 0,
    alto: 0,
    unidad: 'cm'
  },
  material: '',
  stock: 0,
  stockMinimo: 0,
  stockMaximo: 0,
  precios: [
    { cantidadMinima: 1, precio: 0, tipo: 'menudeo' },
    { cantidadMinima: 10, precio: 0, tipo: 'mayoreo' }
  ],
  moneda: 'MXN',
  costo: 0,
  costoProduccion: 0,
  costoUnitario: 0,
  imagenes: [],
  activo: true,
  creadoPor: '',
  fechaCreacion: new Date(),
  fechaActualizacion: new Date(),
  precioMenudeo: 0,
  precioMayoreo: 0,
  cantidadMinimaMayoreo: 10,
  itemsPaquete: []
};

export interface ProductFormProps {
  onSubmit: (data: ProductoFormData) => Promise<void>;
  isEdit: boolean;
  productId?: string;
  initialData?: Partial<ProductoFormData>;
}

const ProductForm: React.FC<ProductFormProps> = ({ 
  onSubmit, 
  isEdit, 
  initialData = {} 
}) => {
  // Hooks
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const { 
    register, 
    handleSubmit, 
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ProductoFormData>({
    defaultValues: {
      ...defaultValues,
      ...initialData,
      stockMinimo: initialData.stockMinimo ?? initialData.minStock ?? 0,
      precioMenudeo: initialData.precioMenudeo ?? initialData.precios?.[0]?.precio ?? 0,
      precioMayoreo: initialData.precioMayoreo ?? initialData.precios?.[1]?.precio ?? 0,
      cantidadMinimaMayoreo: initialData.cantidadMinimaMayoreo ?? initialData.precios?.[1]?.cantidadMinima ?? 10,
      costoUnitario: initialData.costoUnitario ?? 0,
      precios: initialData.precios ?? [
        { 
          cantidadMinima: 1, 
          precio: initialData.precioMenudeo ?? 0, 
          tipo: 'menudeo' 
        },
        { 
          cantidadMinima: initialData.cantidadMinimaMayoreo ?? 10, 
          precio: initialData.precioMayoreo ?? 0, 
          tipo: 'mayoreo' 
        }
      ]
    }
  });

  // Watch for changes in form fields
  const watchCosto = watch('costo');
  const watchStock = watch('stock');
  const watchPrecioMenudeo = watch('precioMenudeo');
  const watchPrecioMayoreo = watch('precioMayoreo');
  const watchCantidadMinimaMayoreo = watch('cantidadMinimaMayoreo');
  const watchPrecios = watch('precios');
  const watchImagenes = watch('imagenes');

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.match('image.*')) {
      enqueueSnackbar('Por favor, selecciona un archivo de imagen válido', { variant: 'error' });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      enqueueSnackbar('La imagen no debe superar los 5MB', { variant: 'error' });
      return;
    }

    setIsUploading(true);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setPreviewImage(imageUrl);
      
      // Add to form
      const newImage = {
        id: Date.now().toString(),
        nombre: file.name,
        tipo: file.type,
        datos: imageUrl.split(',')[1], // Remove data:image/...;base64,
        orden: watchImagenes?.length || 0,
        esPrincipal: watchImagenes?.length === 0 // First image is principal
      };
      
      setValue('imagenes', [...(watchImagenes || []), newImage], { shouldValidate: true });
      setIsUploading(false);
    };
    
    reader.readAsDataURL(file);
  };
  
  // Remove image
  const handleRemoveImage = () => {
    setPreviewImage(null);
    setValue('imagenes', [], { shouldValidate: true });
  };

  // Calculate costo unitario when costo or stock changes
  useEffect(() => {
    const costo = typeof watchCosto === 'string' ? parseFloat(watchCosto) || 0 : watchCosto || 0;
    const stock = typeof watchStock === 'string' ? parseFloat(watchStock) || 1 : watchStock || 1; // Default to 1 to avoid division by zero
    const costoUnitario = stock > 0 ? (costo / stock) : 0;
    
    // Only update if the calculated value is different to avoid infinite loops
    const currentCostoUnitario = parseFloat(String(watch('costoUnitario') || '0'));
    if (Math.abs(costoUnitario - currentCostoUnitario) > 0.001) {
      setValue('costoUnitario', parseFloat(costoUnitario.toFixed(4)), { shouldValidate: true });
    }
  }, [watchCosto, watchStock, setValue, watch]);

  // Update precios array when prices or quantities change
  useEffect(() => {
    const newPrecioMenudeo = typeof watchPrecioMenudeo === 'string' ? parseFloat(watchPrecioMenudeo) : watchPrecioMenudeo || 0;
    const newPrecioMayoreo = typeof watchPrecioMayoreo === 'string' ? parseFloat(watchPrecioMayoreo) : watchPrecioMayoreo || 0;
    const newCantidadMinima = typeof watchCantidadMinimaMayoreo === 'string' ? parseInt(watchCantidadMinimaMayoreo, 10) : watchCantidadMinimaMayoreo || 10;
    
    // Only update if values have actually changed
    const currentPrecios = watchPrecios || [];
    const currentMenudeo = currentPrecios.find(p => p.tipo === 'menudeo');
    const currentMayoreo = currentPrecios.find(p => p.tipo === 'mayoreo');
    
    const menudeoChanged = !currentMenudeo || 
      Math.abs(currentMenudeo.precio - newPrecioMenudeo) > 0.001;
      
    const mayoreoChanged = !currentMayoreo || 
      currentMayoreo.cantidadMinima !== newCantidadMinima ||
      Math.abs(currentMayoreo.precio - newPrecioMayoreo) > 0.001;
    
    if (menudeoChanged || mayoreoChanged) {
      const precios = [
        {
          cantidadMinima: 1,
          precio: newPrecioMenudeo,
          tipo: 'menudeo' as const
        },
        {
          cantidadMinima: newCantidadMinima,
          precio: newPrecioMayoreo,
          tipo: 'mayoreo' as const
        }
      ];
      setValue('precios', precios, { shouldValidate: true });
    }
  }, [watchPrecioMenudeo, watchPrecioMayoreo, watchCantidadMinimaMayoreo, watchPrecios, setValue, watch]);

  const isFormSubmitting = isSubmitting || isLoading;

  const onSubmitForm = async (formData: ProductoFormData) => {
    if (!currentUser) {
      enqueueSnackbar('No se encontró el usuario actual', { variant: 'error' });
      return;
    }

    // Ensure all required fields are present
    const productData: ProductoFormData = {
      ...formData,
      // Ensure precios array is properly formatted
      precios: [
        {
          cantidadMinima: 1,
          precio: parseFloat(formData.precioMenudeo?.toString() || '0'),
          tipo: 'menudeo' as const
        },
        {
          cantidadMinima: parseInt(formData.cantidadMinimaMayoreo?.toString() || '10'),
          precio: parseFloat(formData.precioMayoreo?.toString() || '0'),
          tipo: 'mayoreo' as const
        }
      ],
      // Ensure costoUnitario is calculated
      costoUnitario: formData.costoUnitario || 
        (formData.stock > 0 ? formData.costo / formData.stock : 0),
      // Add createdBy/updatedBy info
      creadoPor: currentUser.uid,
      fechaActualizacion: new Date().toISOString()
    };

    setIsLoading(true);
    
    try {
      await onSubmit(productData);
      enqueueSnackbar(
        isEdit ? 'Producto actualizado correctamente' : 'Producto creado correctamente',
        { variant: 'success' }
      );
      navigate('/inventario');
    } catch (error) {
      console.error('Error saving product:', error);
      enqueueSnackbar(`Error al guardar el producto: ${error instanceof Error ? error.message : 'Error desconocido'}`, { 
        variant: 'error',
        autoHideDuration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Set initial preview if editing and has image
  useEffect(() => {
    const imagenes = initialData?.imagenes;
    if (imagenes && Array.isArray(imagenes) && imagenes.length > 0) {
      const mainImage = imagenes.find(img => img?.esPrincipal) || imagenes[0];
      if (mainImage?.datos && mainImage?.tipo) {
        setPreviewImage(`data:${mainImage.tipo};base64,${mainImage.datos}`);
      }
    }
  }, [initialData]);

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmitForm)} sx={{ mt: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {isEdit ? 'Editar Producto' : 'Nuevo Producto'}
        </Typography>
        
        <Box>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="product-image-upload"
            type="file"
            onChange={handleImageUpload}
            disabled={isUploading}
          />
          <label htmlFor="product-image-upload">
            <Button
              variant="contained"
              color="primary"
              component="span"
              startIcon={<CameraIcon />}
              disabled={isUploading}
              sx={{
                bgcolor: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.dark',
                  transform: 'translateY(-2px)',
                  boxShadow: 3,
                },
                transition: 'all 0.2s',
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 'bold',
                px: 3,
                py: 1,
              }}
            >
              {isUploading ? 'Subiendo...' : 'Subir Imagen'}
            </Button>
          </label>
        </Box>
      </Box>
      
      {/* Vista previa de la imagen */}
      {previewImage && (
        <Box mb={3} textAlign="center">
          <Box 
            component="img"
            src={previewImage}
            alt="Vista previa"
            sx={{
              maxWidth: '100%',
              maxHeight: '300px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              boxShadow: 1,
            }}
          />
          <Box mt={1}>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleRemoveImage}
              sx={{ mt: 1 }}
            >
              Eliminar Imagen
            </Button>
          </Box>
        </Box>
      )}
      
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

        <Grid item xs={12} md={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Descripción"
            variant="outlined"
            margin="normal"
            {...register('descripcion')}
            error={!!errors.descripcion}
            helperText={errors.descripcion?.message}
          />
        </Grid>

        {/* Sección de Precios */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Precios de Venta</Typography>
          <Divider sx={{ mb: 2 }} />
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
              min: { value: 0.01, message: 'El precio debe ser mayor a 0' }
            })}
            error={!!errors.precioMenudeo}
            helperText={errors.precioMenudeo?.message}
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
              min: { value: 0.01, message: 'El precio debe ser mayor a 0' }
            })}
            error={!!errors.precioMayoreo}
            helperText={errors.precioMayoreo?.message}
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Cantidad Mínima para Mayoreo"
            type="number"
            variant="outlined"
            margin="normal"
            inputProps={{ min: 2, step: '1' }}
            {...register('cantidadMinimaMayoreo', { 
              required: 'La cantidad mínima es requerida',
              min: { value: 2, message: 'La cantidad debe ser al menos 2' }
            })}
            error={!!errors.cantidadMinimaMayoreo}
            helperText={errors.cantidadMinimaMayoreo?.message}
          />
        </Grid>

        {/* Sección de Inventario */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Inventario</Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Cantidad en Stock"
            type="number"
            variant="outlined"
            margin="normal"
            inputProps={{ min: 0, step: '1' }}
            {...register('stock', { 
              required: 'La cantidad es requerida',
              min: { value: 0, message: 'La cantidad no puede ser negativa' },
              valueAsNumber: true
            })}
            error={!!errors.stock}
            helperText={errors.stock?.message}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Stock Mínimo"
            type="number"
            variant="outlined"
            margin="normal"
            inputProps={{ min: 0, step: '1' }}
            {...register('stockMinimo', { 
              required: 'El stock mínimo es requerido',
              min: { value: 0, message: 'El stock mínimo no puede ser negativo' },
              valueAsNumber: true
            })}
            error={!!errors.stockMinimo}
            helperText={errors.stockMinimo?.message}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Stock Máximo"
            type="number"
            variant="outlined"
            margin="normal"
            inputProps={{ min: 1, step: '1' }}
            {...register('stockMaximo', { 
              required: 'El stock máximo es requerido',
              min: { 
                value: 1, 
                message: 'El stock máximo debe ser mayor a 0' 
              },
              validate: (value) => 
                value >= watch('stockMinimo') || 
                'El stock máximo debe ser mayor o igual al stock mínimo',
              valueAsNumber: true
            })}
            error={!!errors.stockMaximo}
            helperText={errors.stockMaximo?.message}
          />
        </Grid>

        {/* Sección de Costos */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Costos</Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Costo Total"
            type="number"
            variant="outlined"
            margin="normal"
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
              inputProps: { min: 0, step: '0.01' },
            }}
            {...register('costo', { 
              required: 'El costo es requerido',
              min: { value: 0, message: 'El costo no puede ser negativo' },
              valueAsNumber: true
            })}
            error={!!errors.costo}
            helperText={errors.costo?.message}
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            variant="outlined"
            margin="normal"
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
              inputProps: { min: 0, step: '0.01' },
            }}
            {...register('costo', { 
              required: 'El costo es requerido',
              min: { value: 0, message: 'El costo debe ser mayor o igual a 0' }
            })}
            error={!!errors.costo}
            helperText={errors.costo?.message}
          />
        </Grid>

        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-end" mt={2} gap={2}>
            <Button
              variant="outlined"
              onClick={() => navigate('/inventario')}
              disabled={isFormSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              disabled={isFormSubmitting}
            >
              {isFormSubmitting ? 'Guardando...' : 'Guardar Producto'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProductForm;
