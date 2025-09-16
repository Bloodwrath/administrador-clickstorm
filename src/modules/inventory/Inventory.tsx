import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip, 
  IconButton, 
  InputAdornment
} from '@mui/material';
import { 
  Add as AddIcon, 
  Save as SaveIcon, 
  Image as ImageIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon
} from '@mui/icons-material';

// Context
import { useSnackbar } from '../../context/SnackbarContext';

// Services
import { listenProducts, deleteProduct, getProductById } from '../../services/products';

// Components
import DataTable from '../../components/shared/DataTable';

// Types
import { Producto } from '../../types/inventory';

// Lista de productos con acciones
const ProductList: React.FC<{ lowStockOnly?: boolean }> = ({ lowStockOnly }) => {
  const navigate = useNavigate();
  const { showMessage } = useSnackbar();
  const [rows, setRows] = useState<Producto[]>([]);
  const [search, setSearch] = useState('');
  
  // Función para manejar la eliminación de productos
  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        await deleteProduct(id);
        showMessage('Producto eliminado correctamente', 'success');
      } catch (error) {
        console.error('Error al eliminar el producto:', error);
        showMessage('No se pudo eliminar el producto', 'error');
      }
    }
  };
  const [filterSupplier, setFilterSupplier] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  useEffect(() => {
    const unsub = listenProducts((items) => {
      // Convert Product[] to Producto[] by mapping fields between types
      const productos: Producto[] = items.map(item => {
        // If it's already a Producto, just use it directly
        if ('codigoBarras' in item) {
          return item as unknown as Producto;
        }
        
        // Otherwise, map from Product to Producto
        const product = item as any; // Using any to avoid TypeScript errors for now
        const now = new Date();
        
        // Helper function to safely get a date from Firestore timestamp or Date
        const getSafeDate = (date: any) => {
          if (!date) return now;
          return date.toDate ? date.toDate() : new Date(date);
        };
        
        // Create a safe Producto object with all required fields
        const producto: Producto = {
          id: product.id || '',
          codigoBarras: product.codigoBarras || product.codigo || '',
          nombre: product.nombre || 'Sin nombre',
          descripcion: product.descripcion || '',
          categoriaId: product.categoriaId || product.categoria || '',
          proveedorId: product.proveedorId || product.proveedor || '',
          material: product.material || '',
          costoProduccion: product.costoProduccion || 0,
          hasImage: product.imagenes && product.imagenes.length > 0,
          dimensiones: product.dimensiones || { ancho: 0, alto: 0, unidad: 'cm' },
          precios: (product.precios || [
            { 
              cantidadMinima: 1, 
              precio: product.precioMenudeo || 0, 
              tipo: 'menudeo',
              moneda: 'MXN'
            },
            { 
              cantidadMinima: product.cantidadMayoreo || 2, 
              precio: product.precioMayoreo || 0, 
              tipo: 'mayoreo',
              moneda: 'MXN'
            }
          ]).map((p: any) => ({
            cantidadMinima: p.cantidadMinima || 1,
            precio: p.precio || 0,
            tipo: p.tipo === 'mayoreo' ? 'mayoreo' : 'menudeo',
            moneda: p.moneda || 'MXN'
          })),
          moneda: product.moneda || 'MXN',
          costo: product.costo || 0,
          stock: product.stock || 0,
          stockMinimo: product.stockMinimo || 0,
          stockMaximo: product.stockMaximo || 100,
          tipo: (product.tipo === 'venta' || product.tipo === 'paquete' || product.tipo === 'produccion') 
            ? product.tipo 
            : 'venta',
          imagenes: (Array.isArray(product.imagenes) 
            ? product.imagenes.length > 0 && typeof product.imagenes[0] === 'string'
              ? (product.imagenes as string[]).map((img, index) => ({
                  id: `img-${index}`,
                  nombre: `product-${product.id}-${index}`,
                  tipo: 'image/jpeg',
                  datos: img,
                  orden: index,
                  esPrincipal: index === 0
                }))
              : product.imagenes.map((img: any, index: number) => ({
                  id: img.id || `img-${index}`,
                  nombre: img.nombre || `product-${product.id}-${index}`,
                  tipo: img.tipo || 'image/jpeg',
                  datos: img.datos || img,
                  orden: img.orden !== undefined ? img.orden : index,
                  esPrincipal: img.esPrincipal || index === 0
                }))
            : []) as any[], // Temporarily using any[] to avoid type issues
          activo: product.activo !== false,
          fechaCreacion: getSafeDate(product.fechaCreacion),
          fechaActualizacion: getSafeDate(product.fechaActualizacion || now),
          creadoPor: product.creadoPor || 'system',
          historialPrecios: (product.historialPrecios || []).map((hp: any) => ({
            fecha: getSafeDate(hp.fecha),
            precio: hp.precio || 0,
            moneda: hp.moneda || 'MXN',
            motivo: hp.motivo || ''
          })),
          etiquetas: Array.isArray(product.etiquetas) ? product.etiquetas : [],
          itemsPaquete: Array.isArray(product.itemsPaquete) ? product.itemsPaquete : []
        };
        
        return producto;
      });
      
      setRows(productos);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    let filteredProducts = [...rows];
    
    // Apply low stock filter if enabled
    if (lowStockOnly) {
      filteredProducts = filteredProducts.filter((product: Producto) => {
        const stock = product.stock ?? 0;
        const stockMinimo = product.stockMinimo ?? 0;
        return stock <= stockMinimo;
      });
    }
    
    // Apply supplier filter if specified
    if (filterSupplier) {
      filteredProducts = filteredProducts.filter(
        (product: Producto) => product.proveedorId === filterSupplier
      );
    }
    
    // Apply category filter if specified
    if (filterCategory) {
      filteredProducts = filteredProducts.filter(
        (product: Producto) => 
          product.categoriaId === filterCategory || 
          product.categoria === filterCategory
      );
    }
    
    // Apply search term filter if specified
    if (searchTerm) {
      filteredProducts = filteredProducts.filter((product: Producto) => {
        const searchFields = [
          product.nombre || '',
          product.codigoBarras || '',
          product.sku || '',
          product.categoriaId || '',
          product.categoria || '',
          product.proveedorId || '',
          product.proveedor || ''
        ];
        
        return searchFields.some(field => 
          field.toLowerCase().includes(searchTerm)
        );
      });
    }
    
    return filteredProducts;
  }, [rows, search, lowStockOnly, filterSupplier, filterCategory]);

  const columns: GridColDef[] = [
    {
      field: 'imagen',
      headerName: 'Imagen',
      width: 200,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Producto>) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="text"
              disabled={!params.row.hasImage}
              onClick={async () => {
                try {
                  const bytes = (await getLargeText('productos_files', params.row.id!, true)) as Uint8Array | null;
                  if (!bytes) { showMessage('Sin imagen', 'info'); return; }
                  const blob = new Blob([bytes], { type: 'image/*' });
                  const url = URL.createObjectURL(blob);
                  setPreviewSrc(url);
                  setPreviewOpen(true);
                } catch (e) {
                  console.error(e);
                  showMessage('No se pudo cargar la imagen', 'error');
                }
              }}
            >
              Ver
            </Button>
            <Button
              size="small"
              variant="text"
              disabled={!params.row.hasImage}
              onClick={async () => {
                try {
                  const bytes = (await getLargeText('productos_files', params.row.id!, true)) as Uint8Array | null;
                  if (!bytes) { showMessage('Sin imagen', 'info'); return; }
                  const blob = new Blob([bytes], { type: 'image/*' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${params.row.nombre || 'producto'}.jpg`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                } catch (e) {
                  console.error(e);
                  showMessage('No se pudo descargar la imagen', 'error');
                }
              }}
            >
              Descargar
            </Button>
          </Box>
        </Box>
      ),
    },
    { 
      field: 'nombre', 
      headerName: 'Nombre', 
      flex: 2, 
      minWidth: 200,
      renderCell: (params: GridRenderCellParams<Producto>) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {params.row.hasImage && <ImageIcon fontSize="small" color="action" titleAccess="Con imagen" />}
            <span>{params.row.nombre}</span>
          </Box>
          <Typography variant="caption" color="textSecondary">
            {params.row.sku}
          </Typography>
        </Box>
      )
    },
    { 
      field: 'categoria', 
      headerName: 'Categoría', 
      flex: 1, 
      minWidth: 150 
    },
    { 
      field: 'proveedor', 
      headerName: 'Proveedor', 
      flex: 1, 
      minWidth: 150 
    },
    {
      field: 'precio',
      headerName: 'Precio',
      type: 'number',
      width: 130,
      valueGetter: (params) => {
        const precios = params.row.precios || [];
        const precioMenudeo = precios.find((p: any) => p.tipo === 'menudeo');
        return precioMenudeo?.precio || 0;
      },
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight="medium">
          ${params.value?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Typography>
      ),
    },
    {
      field: 'stock',
      headerName: 'Stock',
      type: 'number',
      width: 110,
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            bgcolor: params.value <= params.row.stockMinimo ? 'error.light' : 'transparent',
            borderRadius: 1,
            px: 1,
          }}
        >
          <Typography
            variant="body2"
            color={params.value <= params.row.stockMinimo ? 'error.contrastText' : 'inherit'}
            fontWeight={params.value <= params.row.stockMinimo ? 'bold' : 'normal'}
          >
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 120,
      sortable: false,
      filterable: false,
      hideable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Editar">
            <IconButton
              size="small"
              onClick={() => navigate(`/inventory/edit/${params.row.id}`)}
              color="primary"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton
              size="small"
              onClick={() => handleDelete(params.row.id)}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          >
            <MenuItem value=""><em>Todas</em></MenuItem>
            {Array.from(new Set(rows.map(r => r.categoria).filter(Boolean) as string[])).map((c) => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          size="small"
          variant="outlined"
          startIcon={<SaveIcon />}
          onClick={() => {
            // Exportar CSV de los elementos filtrados
            const headers = ['Nombre', 'Código de barras', 'SKU', 'Categoría', 'Proveedor', 'Precio menudeo', 'Precio mayoreo', 'Stock', 'Stock mínimo', 'Stock máximo', 'Activo'];
            const lines = [headers.join(',')];
            
            filtered.forEach((product: Producto) => {
              const menudeoPrice = product.precios?.find(p => p.tipo === 'menudeo')?.precio ?? 0;
              const mayoreoPrice = product.precios?.find(p => p.tipo === 'mayoreo')?.precio ?? 0;
              
              const row = [
                product.nombre ?? '',
                product.codigoBarras ?? '',
                product.sku ?? '',
                product.categoria ?? product.categoriaId ?? '',
                product.proveedor ?? product.proveedorId ?? '',
                menudeoPrice.toString(),
                mayoreoPrice.toString(),
                String(product.stock ?? 0),
                String(product.stockMinimo ?? 0),
                String(product.stockMaximo ?? 0),
                product.activo ? 'Sí' : 'No',
              ];
              
              // Escape commas with quotes
              lines.push(row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
            });
            
            const csv = lines.join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `inventario_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
        >
          Exportar CSV
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<SaveIcon />}
          onClick={() => {
            // Export as Excel (XLS) using HTML table (Excel compatible)
            const headers = ['Nombre', 'Código de barras', 'SKU', 'Categoría', 'Proveedor', 'Precio menudeo', 'Precio mayoreo', 'Stock', 'Stock mínimo', 'Stock máximo', 'Activo'];
            
            const rowsHtml = filtered.map((product: Producto) => {
              const menudeoPrice = product.precios?.find(p => p.tipo === 'menudeo')?.precio ?? 0;
              const mayoreoPrice = product.precios?.find(p => p.tipo === 'mayoreo')?.precio ?? 0;
              
              return (
                `<tr>` +
                `<td>${(product.nombre ?? '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;')}</td>` +
                `<td>${product.codigoBarras ?? ''}</td>` +
                `<td>${product.sku ?? ''}</td>` +
                `<td>${product.categoria ?? product.categoriaId ?? ''}</td>` +
                `<td>${product.proveedor ?? product.proveedorId ?? ''}</td>` +
                `<td>${menudeoPrice}</td>` +
                `<td>${mayoreoPrice}</td>` +
                `<td>${product.stock ?? 0}</td>` +
                `<td>${product.stockMinimo ?? 0}</td>` +
                `<td>${product.stockMaximo ?? 0}</td>` +
                `<td>${product.activo ? 'Sí' : 'No'}</td>` +
                `</tr>`
              );
            }).join('');
            
            const html = `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="UTF-8">
                  <style>
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                  </style>
                </head>
                <body>
                  <table>
                    <thead>
                      <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                  </table>
                </body>
              </html>`;
            
            const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'inventario.xls';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
        >
          Exportar Excel
        </Button>
      </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};


// Product form (create/edit)
const ProductFormWrapper = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { showMessage } = useSnackbar();
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [initialData, setInitialData] = useState<Partial<ProductoFormData>>({});
  const [, setOpen] = useState(true);
  
  // Define the Firestore product type with all possible fields
  type FirestoreProduct = Partial<Producto> & {
    id?: string;
    codigo?: string;
    precioMenudeo?: number;
    cantidadMayoreo?: number;
    precioMayoreo?: number;
    fechaCreacion?: any; // Firestore Timestamp or Date
    fechaActualizacion?: any; // Firestore Timestamp or Date
    imagenes?: any[]; // Array of image data
  };

  const handleClose = () => {
    setOpen(false);
    navigate('/inventario');
  };

  // Load product data if in edit mode
  useEffect(() => {
    const loadProduct = async () => {
      if (!isEdit || !id) return;
      
      setIsLoading(true);
      try {
        const product = await getProductById(id) as FirestoreProduct;
        if (!product) return;

        // Create a basic product data object with required fields
        const productData: any = {
          ...product,
          codigoBarras: product.codigo || product.codigoBarras || '',
          etiquetas: Array.isArray(product.etiquetas) ? product.etiquetas.join(', ') : '',
          stock: Number(product.stock) || 0,
          stockMinimo: Number(product.stockMinimo) || 0,
          stockMaximo: Number(product.stockMaximo) || 0,
          costo: Number(product.costo) || 0,
          costoProduccion: Number(product.costoProduccion) || 0,
          moneda: product.moneda || 'MXN',
          activo: product.activo !== undefined ? Boolean(product.activo) : true
        };

        // Set initial data
        setInitialData(productData as ProductoFormData);
      } catch (error) {
        console.error('Error loading product:', error);
        showMessage('Error al cargar el producto', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [id, isEdit, showMessage]);

  // Add a new product to Firestore
  const addProduct = async (productData: Partial<Producto>): Promise<Partial<Producto> & { id: string }> => {
    if (!currentUser) throw new Error('No user logged in');
    
    const now = new Date().toISOString();
    
    // Ensure all required fields are present with defaults
    // Create base product with all required fields
    const baseProduct = {
      // Default values for required fields
      codigoBarras: '',
      nombre: '',
      descripcion: '',
      categoriaId: '',
      categoria: '',
      proveedorId: '',
      proveedor: '',
      tipo: 'venta', // Default to 'venta' as it's a valid TipoProducto value
      etiquetas: [],
      ubicacion: '',
      dimensiones: { 
        ancho: 0, 
        alto: 0, 
        profundidad: 0, 
        unidad: 'cm' as const 
      },
      material: '',
      stock: 0,
      stockMinimo: 0,
      stockMaximo: 0,
      precios: [],
      moneda: 'MXN',
      costo: 0,
      costoProduccion: 0,
      historialPrecios: (productData.historialPrecios || []).map(ph => {
        let fecha: Date;
        if (!ph.fecha) {
          fecha = new Date();
        } else if (ph.fecha instanceof Date) {
          fecha = ph.fecha;
        } else if (typeof ph.fecha === 'object' && 'toDate' in ph.fecha) {
          // Handle Firebase Timestamp
          fecha = (ph.fecha as any).toDate();
        } else if (typeof ph.fecha === 'string' || typeof ph.fecha === 'number') {
          fecha = new Date(ph.fecha);
        } else {
          fecha = new Date();
        }
        return {
          ...ph,
          fecha
        };
      }),
      itemsPaquete: [],
      imagenes: [],
      activo: true,
      creadoPor: currentUser.uid,
      fechaActualizacion: now,
      notas: '',
    };
    
    // Ensure tipo is a valid TipoProducto value
    const validTipo = ['venta', 'produccion', 'paquete'].includes(productData.tipo as string) 
      ? productData.tipo as 'venta' | 'produccion' | 'paquete'
      : 'venta';

    // Merge with productData, ensuring our defaults take precedence
    const newProduct = {
      ...productData,
      ...baseProduct,
      // Ensure tipo is valid
      tipo: validTipo,
      // Ensure required fields are set
      creadoPor: currentUser.uid,
      fechaCreacion: productData.fechaCreacion || now,
      fechaActualizacion: now,
      activo: productData.activo !== undefined ? productData.activo : true,
      // Ensure arrays are properly initialized
      etiquetas: productData.etiquetas || [],
      precios: productData.precios || [],
      itemsPaquete: productData.itemsPaquete || [],
      imagenes: productData.imagenes || [],
      historialPrecios: (productData.historialPrecios || []).map(ph => {
        let fecha: Date;
        if (!ph.fecha) {
          fecha = new Date();
        } else if (ph.fecha instanceof Date) {
          fecha = ph.fecha;
        } else if (typeof ph.fecha === 'object' && 'toDate' in ph.fecha) {
          // Handle Firebase Timestamp
          fecha = (ph.fecha as any).toDate();
        } else if (typeof ph.fecha === 'string' || typeof ph.fecha === 'number') {
          fecha = new Date(ph.fecha);
        } else {
          fecha = new Date();
        }
        return {
          ...ph,
          fecha
        };
      })
    };
    
    const docRef = await addDoc(collection(db, 'productos'), newProduct);
    return { id: docRef.id, ...newProduct };
  };

  const handleSubmitForm = async (formData: any) => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      
      // Convert etiquetas from string to string[] if needed
      const etiquetas = formData.etiquetas 
        ? typeof formData.etiquetas === 'string' 
          ? formData.etiquetas.split(',').map((e: string) => e.trim()).filter(Boolean)
          : Array.isArray(formData.etiquetas) 
            ? formData.etiquetas
            : []
        : [];

      // Get current date for timestamps
      const now = new Date().toISOString();
      
      // Prepare product data for Firestore (Product type)
      // Price information is processed when needed
      
      // Create base product data with all required fields
      const baseProductData = {
        // Identificación básica
        codigoBarras: formData.codigoBarras || '',
        sku: formData.sku || '',
        nombre: formData.nombre || '',
        descripcion: formData.descripcion || '',
        
        // Categorización
        categoriaId: formData.categoriaId || '',
        categoria: formData.categoria || '',
        proveedorId: formData.proveedorId || '',
        proveedor: formData.proveedor || '',
        tipo: formData.tipo || 'producto',
        etiquetas: etiquetas,
        ubicacion: formData.ubicacion || '',
        
        // Especificaciones
        dimensiones: formData.dimensiones || { ancho: 0, alto: 0, profundidad: 0, unidad: 'cm' },
        material: formData.material || '',
        
        // Inventario
        stock: formData.stock || 0,
        stockMinimo: formData.stockMinimo || 0,
        stockMaximo: formData.stockMaximo || 0,
        
        // Precios y costos
        precios: formData.precios || [],
        moneda: formData.moneda || 'MXN',
        costo: formData.costo || 0,
        costoProduccion: formData.costoProduccion || 0,
        historialPrecios: formData.historialPrecios || [],
        
        // Solo para paquetes
        itemsPaquete: formData.itemsPaquete || [],
        
        // Imágenes
        imagenes: formData.imagenes?.map((img: string | ImagenProducto | File) => 
          typeof img === 'string' ? img : 
          'datos' in img ? (img as ImagenProducto).datos : 
          ''
        ).filter(Boolean) || [],
        
        // Estado
        activo: formData.activo !== undefined ? formData.activo : true,
        
        // Auditoría
        creadoPor: currentUser.uid,
        fechaActualizacion: now,
        
        // Notas adicionales
        notas: formData.notas || ''
      };
      
      // Only include fechaCreacion for new products
      const productData = isEdit 
        ? { ...baseProductData }
        : { 
            ...baseProductData, 
            fechaCreacion: now,
            // Initialize historialPrecios with current prices for new products
            historialPrecios: [
              ...(baseProductData.historialPrecios || []),
              ...baseProductData.precios.map((p: PrecioCantidad) => ({
                fecha: now,
                precio: p.precio,
                moneda: baseProductData.moneda,
                motivo: 'Precio inicial'
              }))
            ]
          };

      if (isEdit && id) {
        // Update existing product
        await updateProduct(id, productData);
        showMessage('Producto actualizado correctamente', 'success');
      } else {
        // Create new product
        const newProduct = await addProduct(productData);
        showMessage('Producto creado correctamente', 'success');
        navigate(`/inventario/editar/${newProduct.id}`);
      }
      
      handleClose();
    } catch (error) {
      console.error('Error saving product:', error);
      showMessage('Error al guardar el producto', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && isEdit) {
    return <div>Cargando producto...</div>;
  }

  return (
    <ProductForm 
      onSubmit={handleSubmitForm} 
      isEdit={isEdit} 
      productId={id}
      initialData={initialData}
    />
  );
};

const Categories = () => (
  <Box>
    <Typography variant="h5" gutterBottom>Categorías</Typography>
    <Typography>Próximamente</Typography>
  </Box>
);

const LowStock: React.FC = () => (
  <Box>
    <Typography variant="h5" gutterBottom>Artículos con Bajo Stock</Typography>
    <ProductList lowStockOnly />
  </Box>
);

// Gestión de proveedores
const SupplierList: React.FC = () => {
  const navigate = useNavigate();
  const { showMessage } = useSnackbar();
  // Use the ApiSupplier type from the services
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    const unsub = listenSuppliers((suppliers) => {
      // Ensure we have valid supplier data before updating state
      const validSuppliers = suppliers.filter((s): s is Supplier => Boolean(s?.id));
      setSuppliers(validSuppliers);
    });
    return () => unsub();
  }, [setSuppliers]);
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Proveedores</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={() => {
            const headers = ['Nombre','Contacto','Teléfono','Email','Dirección','Activo'];
            const lines = [headers.join(',')];
            suppliers.forEach((s) => {
              const row = [
                s.nombre ?? '', s.contacto ?? '', s.telefono ?? '', s.email ?? '', s.direccion ?? '', s.activo ? 'Sí' : 'No'
              ];
              lines.push(row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
            });
            const csv = lines.join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'proveedores.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}>Exportar CSV</Button>
          <Button variant="contained" onClick={() => navigate('/inventory/suppliers/add')}>Agregar Proveedor</Button>
        </Box>
      </Box>
      {suppliers.map((s) => (
        <Box key={s.id} sx={{ display: 'flex', gap: 2, alignItems: 'center', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ flex: 1 }}>
            <Typography fontWeight={600}>{s.nombre}</Typography>
            <Typography variant="body2" color="text.secondary">{s.email} · {s.telefono}</Typography>
          </Box>
          <Button size="small" variant="outlined" onClick={() => navigate(`/inventory/suppliers/edit/${s.id}`)}>Editar</Button>
          <Button size="small" color="error" variant="outlined" onClick={async () => {
            if (!window.confirm('¿Eliminar este proveedor?')) return;
            try { await deleteSupplier(s.id!); showMessage('Proveedor eliminado', 'success'); } catch (e) { showMessage('No se pudo eliminar', 'error'); }
          }}>Eliminar</Button>
        </Box>
      ))}
    </Box>
  );
};

const SupplierForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showMessage } = useSnackbar();
  const isEdit = Boolean(id);
  const { register, handleSubmit, setValue, formState: { isSubmitting } } = useForm<Supplier>({
    defaultValues: { nombre: '', contacto: '', telefono: '', email: '', direccion: '', activo: true },
  });

  useEffect(() => {
    if (!isEdit) return;
    
    const loadSupplier = async () => {
      try {
        const supplier = await getSupplierById(id!);
        if (supplier) {
          Object.entries(supplier).forEach(([key, value]) => {
            setValue(key as keyof Supplier, value as any);
          });
        }
      } catch (error) {
        console.error('Error loading supplier:', error);
        showMessage('Error al cargar el proveedor', 'error');
      }
    };
    
    loadSupplier();
  }, [id, isEdit, setValue, showMessage]);

  const onSubmit = async (data: Supplier) => {
    try {
      if (isEdit) {
        await updateSupplier(id!, data);
        showMessage('Proveedor actualizado', 'success');
      } else {
        await addSupplier(data);
        showMessage('Proveedor creado', 'success');
      }
      navigate('/inventory/suppliers');
    } catch (e) {
      console.error(e);
      showMessage('No se pudo guardar el proveedor', 'error');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
      <TextField label="Nombre" required {...register('nombre')} />
      <TextField label="Contacto" {...register('contacto')} />
      <TextField label="Teléfono" {...register('telefono')} />
      <TextField label="Email" type="email" {...register('email')} />
      <TextField label="Dirección" sx={{ gridColumn: { md: '1 / span 2' } }} {...register('direccion')} />
      <FormControlLabel control={<Checkbox defaultChecked {...register('activo')} />} label="Activo" />
      <Box sx={{ gridColumn: { md: '1 / span 2' }, display: 'flex', gap: 2 }}>
        <Button type="submit" variant="contained" disabled={isSubmitting}>{isEdit ? 'Guardar Cambios' : 'Crear Proveedor'}</Button>
        <Button variant="outlined" onClick={() => navigate('/inventory/suppliers')}>Cancelar</Button>
      </Box>
    </Box>
  );
};

const Inventory: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gestión de Inventario</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('add')}
        >
          Agregar Producto
        </Button>
      </Box>
      <Routes>
        <Route index element={<ProductList />} />
        <Route path="add" element={<ProductFormWrapper />} />
        <Route path="edit/:id" element={<ProductFormWrapper />} />
        <Route path="suppliers" element={<SupplierList />} />
        <Route path="suppliers/add" element={<SupplierForm />} />
        <Route path="suppliers/edit/:id" element={<SupplierForm />} />
        <Route path="categories" element={<Categories />} />
        <Route path="low-stock" element={<LowStock />} />
        <Route path="*" element={<Navigate to="/inventory" replace />} />
      </Routes>
    </Container>
  );
};

export default Inventory;
