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
  InputAdornment
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

// Import types
import { Producto, PrecioCantidad, PaqueteItem, Dimensiones } from '../../types/inventory';

// Define local types
type ItemPaquete = PaqueteItem;

// Form data type that extends Producto with form-specific fields
export interface ProductoFormData extends Omit<Producto, 'fechaCreacion' | 'fechaActualizacion' | 'historialPrecios' | 'etiquetas' | 'imagenes'> {
  imagenes: any[];  // Simplified for now
  etiquetas: string;
  precios: PrecioCantidad[];
  dimensiones: Dimensiones;
  precioMenudeo?: number;
  precioMayoreo?: number;
  cantidadMayoreo?: number;
  minStock?: number;
  precio?: number;
  sku?: string;
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

const ProductForm: React.FC<ProductFormProps> = ({ 
  onSubmit, 
  isEdit, 
  productId, 
  initialData = {} 
}) => {
  // Hooks
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting },
    watch
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
  const isFormSubmitting = isSubmitting || isLoading;

  const onSubmitForm = async (formData: ProductoFormData) => {
    if (!currentUser) {
      enqueueSnackbar('No se encontró el usuario actual', { variant: 'error' });
      return;
    }

    setIsLoading(true);
    
    try {
      await onSubmit(formData);
      enqueueSnackbar(
        isEdit ? 'Producto actualizado correctamente' : 'Producto creado correctamente',
        { variant: 'success' }
      );
      navigate('/inventario');
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

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Precio"
            type="number"
            variant="outlined"
            margin="normal"
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
              inputProps: { min: 0, step: '0.01' },
            }}
            {...register('precio', { 
              required: 'El precio es requerido',
              min: { value: 0, message: 'El precio debe ser mayor o igual a 0' }
            })}
            error={!!errors.precio}
            helperText={errors.precio?.message}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Stock"
            type="number"
            variant="outlined"
            margin="normal"
            InputProps={{
              inputProps: { min: 0, step: '1' },
            }}
            {...register('stock', { 
              required: 'El stock es requerido',
              min: { value: 0, message: 'El stock no puede ser negativo' }
            })}
            error={!!errors.stock}
            helperText={errors.stock?.message}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Costo"
            type="number"
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
