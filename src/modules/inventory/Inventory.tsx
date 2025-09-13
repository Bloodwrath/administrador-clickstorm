import React, { useEffect, useMemo, useState, useContext } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  InputAdornment, 
  IconButton, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TablePagination, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  SelectChangeEvent,
  Grid,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  CircularProgress,
  LinearProgress,
  Divider,
  Chip,
  Avatar,
  Tooltip,
  Badge,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { AuthContext } from '../../context/AuthContext';
// Import services and types
import { 
  Product as ProductServiceType, 
  listenProducts, 
  deleteProduct, 
  createProduct, 
  updateProduct, 
  getProductById
} from '../../services/products';

import { 
  Supplier,
  listenSuppliers, 
  addSupplier, 
  updateSupplier, 
  deleteSupplier, 
  getSupplierById 
} from '../../services/suppliers';

type SupplierType = Supplier;

import { getLargeText } from '../../services/textStorage';
import { useSnackbar } from '../../context/SnackbarContext';

import { Producto, ImagenProducto, PrecioCantidad } from '../../types/inventory';
import type { Product as ProductType } from '../../types/product';

// Lista de productos con acciones
const ProductList: React.FC<{ lowStockOnly?: boolean }> = ({ lowStockOnly }) => {
  const navigate = useNavigate();
  const { showMessage } = useSnackbar();
  const [rows, setRows] = useState<Producto[]>([]);
  const [search, setSearch] = useState('');
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
            : []) as ImagenProducto[],
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
      field: 'supplierName', 
      headerName: 'Proveedor', 
      flex: 1,
      minWidth: 150,
      valueFormatter: (params) => params.value || 'N/A'
    },
    { 
      field: 'categoria', 
      headerName: 'Categoría', 
      flex: 1,
      minWidth: 120,
      valueFormatter: (params) => params.value || 'N/A'
    },
    { 
      field: 'precioMenudeo', 
      headerName: 'P. Menudeo', 
      width: 120, 
      valueFormatter: (v) => `$${(v.value || 0).toFixed(2)}`,
      headerAlign: 'right',
      align: 'right'
    },
    { 
      field: 'precioMayoreo', 
      headerName: 'P. Mayoreo', 
      width: 120, 
      valueFormatter: (v) => `$${(v.value || 0).toFixed(2)}`,
      headerAlign: 'right',
      align: 'right'
    },
    { 
      field: 'costo', 
      headerName: 'Costo', 
      width: 110, 
      valueFormatter: (v) => `$${(v.value || 0).toFixed(2)}`,
      headerAlign: 'right',
      align: 'right'
    },
    { 
      field: 'stock', 
      headerName: 'Stock', 
      width: 100,
      headerAlign: 'right',
      align: 'right'
    },
    { 
      field: 'minStock', 
      headerName: 'Stock Mín', 
      width: 100,
      headerAlign: 'right',
      align: 'right'
    },
    {
      field: 'activo',
      headerName: 'Activo',
      width: 80,
      align: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            bgcolor: params.row.activo ? 'success.main' : 'error.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 12,
            fontWeight: 'bold'
          }}
          title={params.row.activo ? 'Activo' : 'Inactivo'}
        >
          {params.row.activo ? 'S' : 'N'}
        </Box>
      ),
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 180,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Producto>) => (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'nowrap' }}>
          <Button 
            size="small" 
            variant="outlined" 
            onClick={() => navigate(`/inventory/edit/${params.row.id}`)}
            sx={{ minWidth: 80 }}
          >
            Editar
          </Button>
          <Button
            size="small"
            color="error"
            onClick={async () => {
              if (!params.row.id) return;
              if (!window.confirm('¿Eliminar este producto?')) return;
              try {
                await deleteProduct(params.row.id);
                showMessage('Producto eliminado', 'success');
              } catch (e) {
                console.error(e);
                showMessage('No se pudo eliminar', 'error');
              }
            }}
            sx={{ minWidth: 90 }}
          >
            Eliminar
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5">Productos</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Buscar por nombre, SKU o categoría"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 250 }}
          />
          {/* Filtro por Proveedor */}
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="filter-supplier-label">Proveedor</InputLabel>
            <Select
              labelId="filter-supplier-label"
              label="Proveedor"
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value as string)}
            >
              <MenuItem value=""><em>Todos</em></MenuItem>
              {(
                Array.from(
                  new Map(
                    rows
                      .filter((r) => (r as any).supplierId)
                      .map((r) => [
                        (r as any).supplierId,
                        { id: (r as any).supplierId, name: (r as any).supplierName },
                      ])
                  ).values()
                ) as any[]
              ).map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* Filtro por Categoría */}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="filter-category-label">Categoría</InputLabel>
            <Select
              labelId="filter-category-label"
              label="Categoría"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as string)}
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
              const headers = ['Nombre','SKU','Categoría','Proveedor','Precio','Costo','Stock','Stock mínimo','Activo'];
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
      </Box>
      <div style={{ width: '100%' }}>
        <DataGrid autoHeight rows={filtered} columns={columns} getRowId={(r) => r.id!} pageSizeOptions={[5, 10, 25]} />
      </div>
      <Dialog open={previewOpen} onClose={() => { if (previewSrc) URL.revokeObjectURL(previewSrc); setPreviewOpen(false); setPreviewSrc(null); }} maxWidth="lg">
        <DialogTitle>Vista previa</DialogTitle>
        <DialogContent>
          {previewSrc && (
            <img
              src={previewSrc}
              alt="Producto"
              style={{ maxWidth: '90vw', maxHeight: '80vh', display: 'block' }}
              onClick={() => window.open(previewSrc!, '_blank')}
            />
          )}
        </DialogContent>
        <DialogActions>
          {previewSrc && (
            <a href={previewSrc} download="imagen-producto" style={{ textDecoration: 'none' }}>
              <Button>Descargar</Button>
            </a>
          )}
          <Button onClick={() => { if (previewSrc) URL.revokeObjectURL(previewSrc); setPreviewOpen(false); setPreviewSrc(null); }}>Cerrar</Button>
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
  const { currentUser } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [initialData, setInitialData] = useState<Partial<Producto>>({});
  const [open, setOpen] = useState(true);
  
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
        const product = await getProductById(id);
        if (product) {
          // Map Firestore Product to Producto type
          const productData: Partial<Producto> = {
            ...product,
            codigoBarras: product.codigo || product.codigoBarras,
            // Handle prices array
            precios: product.precios || [
              { cantidadMinima: 1, precio: product.precioMenudeo || 0, tipo: 'menudeo' },
              { cantidadMinima: product.cantidadMayoreo || 10, precio: product.precioMayoreo || 0, tipo: 'mayoreo' }
            ],
            // Convert Firestore timestamps to Date objects
            fechaCreacion: product.fechaCreacion?.toDate ? product.fechaCreacion.toDate() : new Date(),
            fechaActualizacion: product.fechaActualizacion?.toDate ? product.fechaActualizacion.toDate() : new Date(),
            // Map images if they exist
            imagenes: Array.isArray(product.imagenes) 
              ? product.imagenes.map((img: any, index: number) => ({
                  id: `img-${index}`,
                  nombre: `product-${product.id}-${index}`,
                  tipo: 'image/jpeg',
                  datos: img,
                  orden: index,
                  esPrincipal: index === 0
                }))
              : [],
            // Set default values for required fields
            stock: product.stock || 0,
            stockMinimo: product.stockMinimo || 0,
            stockMaximo: product.stockMaximo || 0,
            costo: product.costo || 0,
            costoProduccion: product.costoProduccion || 0,
            moneda: product.moneda || 'MXN',
            activo: product.activo !== undefined ? product.activo : true,
            // Map prices if they exist
            precios: product.precios || [
              {
                cantidadMinima: 1,
                precio: product.precioMenudeo || 0,
                tipo: 'menudeo'
              },
              {
                cantidadMinima: product.cantidadMayoreo || 2,
                precio: product.precioMayoreo || 0,
                tipo: 'mayoreo'
              }
            ],
            // Map images if they exist
            imagenes: Array.isArray(product.imagenes) ? product.imagenes.map((img: any, index: number) => ({
              id: `img-${index}`,
              nombre: `product-${product.id}-${index}`,
              tipo: 'image/jpeg',
              datos: img,
              orden: index,
              esPrincipal: index === 0
            })) : []
          };
          
          setInitialData(productData);
        }
      } catch (error) {
        console.error('Error loading product:', error);
        showMessage('Error al cargar el producto', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [id, isEdit, showMessage]);

  const handleSubmitForm = async (data: Producto) => {
    try {
      setIsLoading(true);
      
      // Find retail and wholesale prices
      const menudeoPrice = data.precios?.find(p => p.tipo === 'menudeo');
      const mayoreoPrice = data.precios?.find(p => p.tipo === 'mayoreo');
      
      // Convert Producto to Firestore document
      const productData: any = {
        // Basic info
        nombre: data.nombre || 'Producto sin nombre',
        descripcion: data.descripcion || '',
        categoriaId: data.categoriaId || '',
        proveedorId: data.proveedorId || '',
        
        // Pricing
        precios: data.precios || [],
        precioMenudeo: menudeoPrice?.precio || 0,
        precioMayoreo: mayoreoPrice?.precio || 0,
        cantidadMayoreo: mayoreoPrice?.cantidadMinima || 2,
        
        fechaActualizacion: new Date(),
        // Ensure required fields
        stock: formData.stock || 0,
        stockMinimo: formData.stockMinimo || 0,
        stockMaximo: formData.stockMaximo || 0,
        costo: formData.costo || 0,
        costoProduccion: formData.costoProduccion || 0,
        moneda: formData.moneda || 'MXN',
        // Handle images
        imagenes: formData.imagenes?.map(img => 
          typeof img === 'string' ? img : img.datos
        )
      };

      if (isEdit && id) {
        // Update existing product
        await updateProduct(id, productData);
        showMessage('Producto actualizado correctamente', 'success');
      } else {
        // Create new product
        await addProduct({
          ...productData,
          fechaCreacion: new Date(),
          creadoPor: currentUser?.uid || '',
          activo: true,
          historialPrecios: [{
            fecha: new Date(),
            precio: productData.precios?.[0]?.precio || 0,
            moneda: productData.moneda || 'MXN',
            motivo: 'Precio inicial'
          }]
        });
        await addProduct(newProduct);
        showMessage('Producto creado correctamente', 'success');
      }
      
      onClose();
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
  const [suppliers, setSuppliers] = useState<ApiSupplier[]>([]);

  useEffect(() => {
    const unsub = listenSuppliers((suppliers) => {
      // Ensure we have valid supplier data before updating state
      const validSuppliers = suppliers.filter((s): s is ApiSupplier => Boolean(s?.id));
      setSuppliers(validSuppliers);
    });
    return () => unsub();
  }, []);
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
    getSupplierById(id!).then((s) => {
      if (s) Object.entries(s).forEach(([k, v]) => setValue(k as any, v as any));
    });
  }, [id, isEdit, setValue]);

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
