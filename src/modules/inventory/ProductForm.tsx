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
  Paper, 
  Grid,
  Divider,
  FormControlLabel,
  Switch,
  SelectChangeEvent,
  InputAdornment,
  FormHelperText,
  CircularProgress
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon, 
  Save as SaveIcon
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';

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

interface Precio {
  cantidadMinima: number;
  precio: number;
  tipo: 'mayoreo' | 'menudeo';
}

interface ItemPaquete {
  productoId: string;
  cantidad: number;
  tipo: 'venta' | 'produccion';
}

export interface Producto {
  id?: string;
  nombre: string;
  codigoBarras?: string;
  descripcion: string;
  categoriaId: string;
  proveedorId: string;
  material?: string;
  precios: Precio[];
  moneda: string;
  costo: number;
  costoProduccion: number;
  stock: number;
  stockMinimo: number;
  stockMaximo: number;
  tipo: 'venta' | 'produccion' | 'paquete';
  itemsPaquete?: ItemPaquete[];
  imagenes: string[];
  activo: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  creadoPor: string;
  historialPrecios: any[];
  etiquetas: string[];
}

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
    formState: { isSubmitting, errors },
    trigger,
    clearErrors
  } = useForm<Producto>({
    defaultValues: {
      nombre: '',
      codigoBarras: '',
      descripcion: '',
      categoriaId: '',
      proveedorId: '',
      material: '',
      precios: [{ cantidadMinima: 1, precio: 0, tipo: 'menudeo' }],
      moneda: 'MXN',
      costo: 0,
      costoProduccion: 0,
      stock: 0,
      stockMinimo: 0,
      stockMaximo: 0,
      tipo: 'venta',
      itemsPaquete: [],
      imagenes: [],
      activo: true,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date(),
      creadoPor: '',
      historialPrecios: [],
      etiquetas: [],
      ...initialData,
    },
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Watch form values
  const productType = watch('tipo');
  const precios = watch('precios') || [];
  const itemsPaquete = watch('itemsPaquete') || [];
  
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
  }, []);

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

  const handleAddPrecio = () => {
    const newPrecios = [...precios];
    const nextMinQty = newPrecios.length > 0 
      ? Math.max(...newPrecios.map(p => p.cantidadMinima)) + 1 
      : 1;
    
    const newPrecio: Precio = {
      cantidadMinima: nextMinQty,
      precio: 0,
      tipo: 'menudeo'
    };
    
    setValue('precios', [...precios, newPrecio]);
  };

  const handleRemovePrecio = (index: number) => {
    const newPrecios = [...precios];
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

    setImageFile(file);
    
    // Create preview URL
    const fileReader = new FileReader();
    fileReader.onload = () => {
      setPreviewUrl(fileReader.result as string);
    };
    fileReader.readAsDataURL(file);
  };

  const validateForm = async (data: Producto) => {
    // Basic validation
    if (!data.nombre.trim()) {
      enqueueSnackbar('El nombre del producto es requerido', { variant: 'error' });
      return false;
    }

    // Validate prices
    if (data.precios.length === 0) {
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

  const handleSubmitForm = async (data: Producto) => {
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
        // Ensure required arrays are initialized
        precios: data.precios || [],
        itemsPaquete: data.itemsPaquete || [],
        imagenes: data.imagenes || [],
        etiquetas: data.etiquetas || [],
        historialPrecios: data.historialPrecios || [],
        // Set timestamps
        fechaActualizacion: new Date(),
        // Set default values if creating new product
        ...(!isEdit && {
          fechaCreacion: new Date(),
          activo: true,
          creadoPor: 'currentUserId', // TODO: Replace with actual user ID
        }),
      };

      // Call the parent onSubmit handler
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
    <Box component="form" onSubmit={handleSubmit(handleSubmitForm)} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        <TextField label="Nombre" required {...register('nombre')} />
        <TextField label="Código de barras" {...register('codigoBarras')} />
        
        <FormControl>
          <InputLabel id="tipo-producto-label">Tipo de Producto</InputLabel>
          <Select
            labelId="tipo-producto-label"
            label="Tipo de Producto"
            {...register('tipo')}
          >
            <MenuItem value="venta">Producto para Venta</MenuItem>
            <MenuItem value="produccion">Materia Prima/Insumo</MenuItem>
            <MenuItem value="paquete">Paquete/Promoción</MenuItem>
          </Select>
        </FormControl>
        
        <TextField label="Categoría" {...register('categoriaId')} />
        
        <FormControl>
          <InputLabel id="proveedor-label">Proveedor</InputLabel>
          <Select
            labelId="proveedor-label"
            label="Proveedor"
            {...register('proveedorId')}
          >
            <MenuItem value="">
              <em>Sin proveedor</em>
            </MenuItem>
            {suppliers.map((supplier) => (
              <MenuItem key={supplier.id} value={supplier.id}>
                {supplier.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <TextField label="Material" {...register('material')} />
        
        {/* Sección de precios */}
        <Box sx={{ gridColumn: { md: '1 / span 2' }, border: '1px solid #ddd', p: 2, borderRadius: 1 }}>
          <Typography variant="subtitle1" gutterBottom>Precios</Typography>
          {precios.map((precio, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              <TextField
                label="Cantidad mínima"
                type="number"
                value={precio.cantidadMinima}
                onChange={(e) => {
                  const newPrecios = [...precios];
                  newPrecios[index].cantidadMinima = parseInt(e.target.value) || 0;
                  setValue('precios', newPrecios);
                }}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Precio"
                type="number"
                inputProps={{ step: '0.01' }}
                value={precio.precio}
                onChange={(e) => {
                  const newPrecios = [...precios];
                  newPrecios[index].precio = parseFloat(e.target.value) || 0;
                  setValue('precios', newPrecios);
                }}
                sx={{ flex: 1 }}
              />
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={precio.tipo}
                  label="Tipo"
                  onChange={(e) => {
                    const newPrecios = [...precios];
                    newPrecios[index].tipo = e.target.value as 'mayoreo' | 'menudeo';
                    setValue('precios', newPrecios);
                  }}
                >
                  <MenuItem value="menudeo">Menudeo</MenuItem>
                  <MenuItem value="mayoreo">Mayoreo</MenuItem>
                </Select>
              </FormControl>
              <IconButton
                color="error"
                onClick={() => handleRemovePrecio(index)}
                disabled={precios.length <= 1}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Button
            variant="outlined"
            onClick={handleAddPrecio}
            startIcon={<AddIcon />}
          >
            Agregar Precio
          </Button>
        </Box>
        
        <TextField 
          label="Costo" 
          type="number" 
          inputProps={{ step: '0.01' }} 
          {...register('costo', { valueAsNumber: true })} 
        />
        
        <TextField 
          label="Costo de Producción" 
          type="number" 
          inputProps={{ step: '0.01' }} 
          {...register('costoProduccion', { valueAsNumber: true })} 
        />
        
        <TextField 
          label="Stock" 
          type="number" 
          {...register('stock', { valueAsNumber: true })} 
        />
        
        <TextField 
          label="Stock mínimo" 
          type="number" 
          {...register('stockMinimo', { valueAsNumber: true })} 
        />
        
        <TextField 
          label="Stock máximo" 
          type="number" 
          {...register('stockMaximo', { valueAsNumber: true })} 
        />
        
        <TextField 
          label="Descripción" 
          multiline 
          minRows={3} 
          sx={{ gridColumn: { md: '1 / span 2' } }} 
          {...register('descripcion')} 
        />
        
        {/* Sección de items del paquete (solo para tipo paquete) */}
        {productType === 'paquete' && (
          <Box sx={{ gridColumn: { md: '1 / span 2' }, border: '1px solid #ddd', p: 2, borderRadius: 1, mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Productos en el Paquete</Typography>
            {itemsPaquete.map((item, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                <FormControl sx={{ flex: 2 }}>
                  <InputLabel>Producto</InputLabel>
                  <Select
                    value={item.productoId}
                    label="Producto"
                    onChange={(e) => {
                      const newItems = [...itemsPaquete];
                      newItems[index].productoId = e.target.value;
                      setValue('itemsPaquete', newItems);
                    }}
                  >
                    {/* TODO: Cargar lista de productos disponibles */}
                    <MenuItem value="">Seleccionar producto</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField
                  label="Cantidad"
                  type="number"
                  value={item.cantidad}
                  onChange={(e) => {
                    const newItems = [...itemsPaquete];
                    newItems[index].cantidad = parseInt(e.target.value) || 0;
                    setValue('itemsPaquete', newItems);
                  }}
                  sx={{ flex: 1 }}
                />
                
                <FormControl sx={{ minWidth: 140 }}>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={item.tipo}
                    label="Tipo"
                    onChange={(e) => {
                      const newItems = [...itemsPaquete];
                      newItems[index].tipo = e.target.value as 'venta' | 'produccion';
                      setValue('itemsPaquete', newItems);
                    }}
                  >
                    <MenuItem value="venta">Para Venta</MenuItem>
                    <MenuItem value="produccion">Para Producción</MenuItem>
                  </Select>
                </FormControl>
                
                <IconButton
                  color="error"
                  onClick={() => handleRemoveItemPaquete(index)}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            
            <Button
              variant="outlined"
              onClick={handleAddItemPaquete}
              startIcon={<AddIcon />}
            >
              Agregar Producto al Paquete
            </Button>
          </Box>
        )}
        
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
      </Box>
      
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
