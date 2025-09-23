import {
  Box,
  Button,
  TextField,
  FormControl,
  Checkbox,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Grid,
  InputAdornment,
  Divider,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Save as SaveIcon,
  CameraAlt as CameraIcon,
  QrCode as QrCodeIcon,
  LocationOn as LocationOnIcon
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { addAccountingEntry } from '../../services/accounting';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { proveedorService } from '../../services/firebaseService';

// Import types and constants
import {
  Producto,
  PrecioCantidad,
  Dimensiones,
  CATEGORIAS_SUBLIMACION
} from '../../types/inventory';

// Form data type that extends Producto with form-specific fields
export interface ProductoFormData extends Omit<Producto, 'historialPrecios' | 'etiquetas' | 'imagenes' | 'precios' | 'dimensiones' | 'dimensionesSublimacion'> {
  imagenes: any[];  // Simplified for now
  etiquetas: string;
  precios: PrecioCantidad[];
  dimensiones: Dimensiones;
  dimensionesSublimacion?: {
    ancho: string | number;
    alto: string | number;
    forma?: 'rectangular' | 'circular' | 'ovalada' | 'personalizada';
    unidad: 'cm' | 'pulgadas' | 'mm';
    notas?: string;
  };
  precioMenudeo?: number;
  precioMayoreo?: number;
  cantidadMinimaMayoreo?: number;
  minStock?: number;
  precio?: number;
  sku?: string;
  costoTotal?: number; // Changed from costoUnitario to costoTotal
  registrarComoCompra: boolean; // New field to track if should register as purchase
  costoUnitarioCalculado?: number; // Read-only calculated field
  codigoBarras?: string; // Campo para el código de barras
  subcategoria?: string; // Campo para la subcategoría
  ubicacion?: string; // Ubicación física en el almacén
  esPersonalizable?: boolean; // Si el producto es personalizable (tiene área de sublimación)
}

// Default values for new product
const defaultValues: ProductoFormData = {
  // Basic info
  nombre: '',
  codigoBarras: '',
  descripcion: '',

  // Categories
  categoriaId: '',
  categoria: '',
  subcategoria: '',

  // Provider
  proveedorId: '',
  registrarComoCompra: true, // Default to true for new products
  proveedor: '',

  // Product type and classification
  tipo: 'venta',
  etiquetas: '',
  ubicacion: '',

  // Prices
  precios: [
    { cantidadMinima: 1, precio: 0, tipo: 'menudeo' },
    { cantidadMinima: 10, precio: 0, tipo: 'mayoreo' }
  ],
  precioMenudeo: 0,
  precioMayoreo: 0,
  cantidadMinimaMayoreo: 10,

  // Product dimensions
  dimensiones: {
    ancho: 0,
    alto: 0,
    profundidad: 0,
    unidad: 'cm' as const
  },

  // Sublimation area (optional)
  dimensionesSublimacion: {
    ancho: 0,
    alto: 0,
    forma: 'rectangular',
    unidad: 'cm' as const,
    notas: ''
  },
  esPersonalizable: false,

  // Material and inventory
  material: '',
  stock: 0,
  stockMinimo: 0,
  stockMaximo: 0,

  // Financial
  moneda: 'MXN',
  costo: 0,
  costoProduccion: 0,
  costoTotal: 0,
  costoUnitarioCalculado: 0,

  // Images and status
  imagenes: [],
  activo: true,

  // Audit
  creadoPor: '',
  fechaCreacion: new Date(),
  fechaActualizacion: new Date(),
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
  const [proveedores, setProveedores] = useState<Array<{ id: string, nombre: string }>>([]);
  const [isLoadingProveedores, setIsLoadingProveedores] = useState(true);

  // Cargar proveedores al montar el componente
  useEffect(() => {
    const cargarProveedores = async () => {
      try {
        setIsLoadingProveedores(true);
        const proveedoresData = await proveedorService.obtenerProveedores();
        setProveedores(proveedoresData.map(p => ({
          id: p.id || '',
          nombre: p.nombre || 'Proveedor sin nombre'
        })));
      } catch (error) {
        console.error('Error al cargar proveedores:', error);
        enqueueSnackbar('Error al cargar la lista de proveedores', { variant: 'error' });
      } finally {
        setIsLoadingProveedores(false);
      }
    };

    cargarProveedores();
  }, [enqueueSnackbar]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ProductoFormData>({
    defaultValues: isEdit ? {
      ...defaultValues,
      ...initialData,
      precios: initialData.precios ?? [
        {
          cantidadMinima: 1,
          precio: initialData.precioMenudeo ?? 0,
          tipo: 'menudeo' as const
        },
        {
          cantidadMinima: initialData.cantidadMinimaMayoreo ?? 10,
          precio: initialData.precioMayoreo ?? 0,
          tipo: 'mayoreo' as const
        }
      ]
    } : defaultValues
  });

  // Watch for changes in form fields
  const watchCostoTotal = watch('costoTotal');
  const watchStock = watch('stock');

  // Calculate unit cost whenever total cost or stock changes
  useEffect(() => {
    const costoTotal = typeof watchCostoTotal === 'number' ? watchCostoTotal : parseFloat(watchCostoTotal || '0');
    const stock = typeof watchStock === 'number' ? watchStock : parseFloat(watchStock || '1');
    const costoUnitario = stock > 0 ? costoTotal / stock : 0;

    setValue('costoUnitarioCalculado', parseFloat(costoUnitario.toFixed(2)), { shouldValidate: true });
    setValue('costo', costoTotal, { shouldValidate: true }); // For backward compatibility
  }, [watchCostoTotal, watchStock, setValue]);

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

    // Get current images
    const currentImages = watch('imagenes') || [];

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
        orden: currentImages.length,
        esPrincipal: currentImages.length === 0 // First image is principal
      };

      setValue('imagenes', [...currentImages, newImage], { shouldValidate: true });
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  // Remove image
  const handleRemoveImage = () => {
    setPreviewImage(null);
    setValue('imagenes', [], { shouldValidate: true });
  };


  // Watch for price and quantity changes
  const watchPrecioMenudeo = watch('precioMenudeo');
  const watchPrecioMayoreo = watch('precioMayoreo');
  const watchCantidadMinimaMayoreo = watch('cantidadMinimaMayoreo');
  const watchPrecios = watch('precios');

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

  // Watch tipo de producto
  const watchTipo = watch('tipo');

  const onSubmitForm = async (formData: ProductoFormData) => {
    if (!currentUser) {
      enqueueSnackbar('No se encontró el usuario actual', { variant: 'error' });
      return;
    }

    setIsLoading(true);

    try {
      // Calculate unit cost based on total cost and quantity
      const costoTotal = parseFloat(formData.costoTotal?.toString() || '0');
      const cantidad = formData.stock || 0;
      const costoUnitario = cantidad > 0 ? costoTotal / cantidad : 0;

      // Handle category - if 'otro' is selected, use the custom category name
      const categoriaId = formData.categoriaId === 'otro'
        ? (formData.categoria || 'Otra Categoría')
        : formData.categoriaId;

      // Prepare dimensions data
      const dimensiones: Dimensiones = {
        ancho: parseFloat(formData.dimensiones?.ancho?.toString() || '0'),
        alto: parseFloat(formData.dimensiones?.alto?.toString() || '0'),
        profundidad: parseFloat(formData.dimensiones?.profundidad?.toString() || '0'),
        unidad: formData.dimensiones?.unidad || 'cm'
      };

      // Prepare sublimation dimensions if product is customizable
      let dimensionesSublimacion = undefined;
      if (formData.esPersonalizable && formData.dimensionesSublimacion) {
        dimensionesSublimacion = {
          ancho: parseFloat(formData.dimensionesSublimacion.ancho?.toString() || '0'),
          alto: parseFloat(formData.dimensionesSublimacion.alto?.toString() || '0'),
          forma: formData.dimensionesSublimacion.forma || 'rectangular',
          unidad: formData.dimensionesSublimacion.unidad || 'cm',
          notas: formData.dimensionesSublimacion.notas
        };
      }

      // Prepare product data
      const productData: ProductoFormData = {
        ...formData,
        // Handle category
        categoriaId,
        categoria: categoriaId, // For backward compatibility
        // Handle prices based on product type
        precios: formData.tipo === 'materia_prima' ? [] : [
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
        // Set calculated unit cost and total cost
        costoUnitarioCalculado: parseFloat(costoUnitario.toFixed(2)),
        costo: costoTotal, // Backward compatibility
        // Add dimensions
        dimensiones,
        ...(dimensionesSublimacion && { dimensionesSublimacion }),
        // Add createdBy/updatedBy info
        creadoPor: currentUser.uid,
        fechaCreacion: isEdit ? formData.fechaCreacion : new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        // Ensure these fields are included
        stockMinimo: formData.stockMinimo || 0,
        stockMaximo: formData.stockMaximo || 0,
        activo: true,
        // Handle optional fields
        codigoBarras: formData.codigoBarras || undefined,
        subcategoria: formData.subcategoria || undefined,
        ubicacion: formData.ubicacion || undefined,
        esPersonalizable: formData.esPersonalizable || false
      };

      // If registering as purchase, create accounting entry
      if (formData.registrarComoCompra && !isEdit && costoTotal > 0) {
        try {
          // Add accounting entry for the purchase
          await addAccountingEntry({
            tipo: 'gasto',
            categoria: 'compras',
            monto: costoTotal,
            descripcion: `Compra de ${cantidad} unidades de ${formData.nombre}`,
            fecha: new Date().toISOString(),
            referencia: `producto_${Date.now()}`,
            estado: 'completado',
            creadoPor: currentUser.uid
          });
        } catch (error) {
          console.error('Error al registrar la compra en contabilidad:', error);
          enqueueSnackbar('Producto guardado, pero hubo un error al registrar la compra en contabilidad', { variant: 'warning' });
        }
      }

      // Submit the product data
      await onSubmit(productData);
      enqueueSnackbar(
        isEdit ? 'Producto actualizado correctamente' : 'Producto creado correctamente',
        { variant: 'success' }
      );
      navigate('/inventario');
    } catch (error) {
      console.error('Error al guardar el producto:', error);
      enqueueSnackbar(
        `Error al ${isEdit ? 'actualizar' : 'crear'} el producto: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        { variant: 'error' }
      );
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
  }, [initialData, enqueueSnackbar]);

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
            <InputLabel id="categoria-label">Categoría *</InputLabel>
            <Select
              labelId="categoria-label"
              id="categoria"
              label="Categoría *"
              {...register('categoriaId', { required: 'La categoría es requerida' })}
              error={!!errors.categoriaId}
              defaultValue=""
            >
              <MenuItem value="" disabled>
                <em>Seleccione una categoría</em>
              </MenuItem>
              {CATEGORIAS_SUBLIMACION.map((categoria) => (
                <MenuItem key={categoria.nombre} value={categoria.nombre}>
                  {categoria.nombre}
                </MenuItem>
              ))}
              <MenuItem value="otro">
                <em>Otra categoría...</em>
              </MenuItem>
            </Select>
            {errors.categoriaId && (
              <Typography color="error" variant="caption">
                {errors.categoriaId.message}
              </Typography>
            )}
          </FormControl>

          {watch('categoriaId') === 'otro' && (
            <TextField
              fullWidth
              label="Nueva categoría"
              variant="outlined"
              margin="normal"
              {...register('categoria')}
              helperText="Ingrese el nombre de la nueva categoría"
            />
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Subcategoría (opcional)"
            variant="outlined"
            margin="normal"
            {...register('subcategoria')}
            helperText="Ejemplo: 'Tazas de Cerámica', 'Playeras de Algodón', etc."
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Código de barras (opcional)"
            variant="outlined"
            margin="normal"
            {...register('codigoBarras')}
            helperText="Este campo es para uso futuro con lector de códigos de barras/QR. No es obligatorio."
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Escanea el código de barras con un lector o ingrésalo manualmente">
                    <IconButton edge="end">
                      <QrCodeIcon />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
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

        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="proveedor-label">Proveedor (opcional)</InputLabel>
            <Select
              labelId="proveedor-label"
              id="proveedorId"
              label="Proveedor (opcional)"
              {...register('proveedorId')}
              disabled={isLoadingProveedores}
              defaultValue=""
            >
              <MenuItem value="">
                <em>Seleccione un proveedor</em>
              </MenuItem>
              {proveedores.map((proveedor) => (
                <MenuItem key={proveedor.id} value={proveedor.id}>
                  {proveedor.nombre}
                </MenuItem>
              ))}
            </Select>
            <Typography variant="caption" color="textSecondary">
              Seleccione un proveedor existente o deje en blanco si no aplica
            </Typography>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
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

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Ubicación en almacén (opcional)"
            variant="outlined"
            margin="normal"
            {...register('ubicacion')}
            helperText="Ejemplo: Estante A, Nivel 2, Posición 5"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Ejemplo: Estante A, Nivel 2, Posición 5">
                    <IconButton edge="end">
                      <LocationOnIcon />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Sección de Dimensiones del Producto */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Dimensiones del Producto</Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>

        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="Ancho"
            type="number"
            variant="outlined"
            margin="normal"
            {...register('dimensiones.ancho', { min: 0, valueAsNumber: true })}
            InputProps={{
              endAdornment: <InputAdornment position="end">cm</InputAdornment>,
              inputProps: { min: 0, step: '0.1' },
            }}
            helperText="Ancho del producto"
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="Alto"
            type="number"
            variant="outlined"
            margin="normal"
            {...register('dimensiones.alto', { min: 0, valueAsNumber: true })}
            InputProps={{
              endAdornment: <InputAdornment position="end">cm</InputAdornment>,
              inputProps: { min: 0, step: '0.1' },
            }}
            helperText="Alto del producto"
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="Profundidad"
            type="number"
            variant="outlined"
            margin="normal"
            {...register('dimensiones.profundidad', { min: 0, valueAsNumber: true })}
            InputProps={{
              endAdornment: <InputAdornment position="end">cm</InputAdornment>,
              inputProps: { min: 0, step: '0.1' },
            }}
            helperText="Profundidad del producto (opcional)"
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="unidad-dimensiones-label">Unidad</InputLabel>
            <Select
              labelId="unidad-dimensiones-label"
              id="unidad-dimensiones"
              label="Unidad"
              {...register('dimensiones.unidad')}
              defaultValue="cm"
            >
              <MenuItem value="cm">Centímetros (cm)</MenuItem>
              <MenuItem value="pulgadas">Pulgadas (in)</MenuItem>
              <MenuItem value="mm">Milímetros (mm)</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Sección de Dimensiones del Área de Sublimación */}
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={watch('esPersonalizable') || false}
                onChange={(e) => {
                  setValue('esPersonalizable', e.target.checked);
                  // Reset dimensions when unchecking
                  if (!e.target.checked) {
                    setValue('dimensionesSublimacion', {
                      ancho: 0,
                      alto: 0,
                      forma: 'rectangular',
                      unidad: 'cm',
                      notas: ''
                    });
                  }
                }}
              />
            }
            label="Este producto es personalizable (tiene área de sublimación)"
          />
        </Grid>

        {(watch('esPersonalizable') as boolean) && (
          <>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Área de Sublimación</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Ancho del área"
                type="number"
                variant="outlined"
                margin="normal"
                {...register('dimensionesSublimacion.ancho', { min: 0, valueAsNumber: true })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">cm</InputAdornment>,
                  inputProps: { min: 0, step: '0.1' },
                }}
                helperText="Ancho del área imprimible"
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Alto del área"
                type="number"
                variant="outlined"
                margin="normal"
                {...register('dimensionesSublimacion.alto', { min: 0, valueAsNumber: true })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">cm</InputAdornment>,
                  inputProps: { min: 0, step: '0.1' },
                }}
                helperText="Alto del área imprimible"
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="forma-sublimacion-label">Forma del área</InputLabel>
                <Select
                  labelId="forma-sublimacion-label"
                  id="forma-sublimacion"
                  label="Forma del área"
                  {...register('dimensionesSublimacion.forma')}
                  defaultValue="rectangular"
                >
                  <MenuItem value="rectangular">Rectangular</MenuItem>
                  <MenuItem value="circular">Circular</MenuItem>
                  <MenuItem value="ovalada">Ovalada</MenuItem>
                  <MenuItem value="personalizada">Personalizada</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="unidad-sublimacion-label">Unidad</InputLabel>
                <Select
                  labelId="unidad-sublimacion-label"
                  id="unidad-sublimacion"
                  label="Unidad"
                  {...register('dimensionesSublimacion.unidad')}
                  defaultValue="cm"
                >
                  <MenuItem value="cm">Centímetros (cm)</MenuItem>
                  <MenuItem value="pulgadas">Pulgadas (in)</MenuItem>
                  <MenuItem value="mm">Milímetros (mm)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notas sobre el área de sublimación (opcional)"
                variant="outlined"
                margin="normal"
                multiline
                rows={2}
                {...register('dimensionesSublimacion.notas')}
                helperText="Ejemplo: 'El diseño no debe acercarse a menos de 0.5cm de los bordes'"
              />
            </Grid>
          </>
        )}

        {/* Sección de Precios */}
        <Grid item xs={12}>
          <Box>
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Precios de Venta</Typography>
            {watchTipo === 'materia_prima' ? (
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                Las materias primas no tienen precios de venta ya que solo se utilizan para la producción.
              </Typography>
            ) : (
              <>
                <Grid container spacing={2}>
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
                </Grid>
              </>
            )}
            <Divider sx={{ mb: 2 }} />
          </Box>
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

        {/* Cost Section */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Costos</Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>

        <Grid container spacing={2}>
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
              {...register('costoTotal', {
                required: 'El costo total es requerido',
                min: { value: 0, message: 'El costo no puede ser negativo' },
                valueAsNumber: true
              })}
              error={!!errors.costoTotal}
              helperText={errors.costoTotal?.message}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Costo Unitario"
              type="number"
              variant="outlined"
              margin="normal"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                readOnly: true,
                inputProps: { min: 0, step: '0.01' },
              }}
              value={watch('costoUnitarioCalculado')?.toFixed(2) || '0.00'}
              helperText="Calculado automáticamente"
            />
          </Grid>

          {!isEdit && (
            <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    {...register('registrarComoCompra')}
                    defaultChecked={true}
                    color="primary"
                  />
                }
                label="Registrar como compra en contabilidad"
                sx={{ mt: 2 }}
              />
            </Grid>
          )}
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
