import React, { useEffect, useMemo, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogActions, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Checkbox, 
  FormControlLabel,
  TextField
} from '@mui/material';
import { Add as AddIcon, Image as ImageIcon, Save as SaveIcon } from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useForm } from 'react-hook-form';

// Import components
import ProductForm from './ProductForm';

// Import services and types
import { 
  Product, 
  listenProducts, 
  deleteProduct, 
  createProduct, 
  updateProduct, 
  getProductById
} from '../../services/products';

import { 
  Supplier as ApiSupplier, 
  listenSuppliers, 
  addSupplier, 
  updateSupplier, 
  deleteSupplier, 
  getSupplierById 
} from '../../services/suppliers';

import { getLargeText } from '../../services/textStorage';
import { useSnackbar } from '../../context/SnackbarContext';

import { Producto, ImagenProducto, PrecioCantidad } from '../../types/inventory';
import type { Product } from '../../types/product';

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
    const t = search.trim().toLowerCase();
    let items = rows;
    if (lowStockOnly) {
      items = items.filter((p) => {
        const stock = p.stock ?? 0;
        const minStock = p.minStock ?? 0;
        return stock <= minStock;
      });
    }
    if (filterSupplier) {
      items = items.filter((p) => (p as any).supplierId === filterSupplier);
    }
    if (filterCategory) {
      items = items.filter((p) => ((p as any).categoria || '') === filterCategory);
    }
    if (!t) return items;
    return items.filter(
      (p) =>
        (p.nombre || '').toLowerCase().includes(t) ||
        (p.sku || '').toLowerCase().includes(t) ||
        ((p as any).categoria || '').toLowerCase().includes(t) ||
        (((p as any).supplierName || '') as string).toLowerCase().includes(t)
    );
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
              const lines = [headers.join(',')];
              filtered.forEach((p) => {
                const row = [
                  p.nombre ?? '',
                  p.sku ?? '',
                  p.categoria ?? '',
                  ((p as any).supplierName ?? ''),
                  String(p.precio ?? ''),
                  String(p.costo ?? ''),
                  String(p.stock ?? ''),
                  String(p.minStock ?? ''),
                  p.activo ? 'Sí' : 'No',
                ];
                // Escapar comas con comillas
                lines.push(row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
              });
              const csv = lines.join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'inventario.csv';
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
              // Exportar como Excel (XLS) usando tabla HTML (compatible con Excel)
              const headers = ['Nombre','SKU','Categoría','Proveedor','Precio','Costo','Stock','Stock mínimo','Activo'];
              const rowsHtml = filtered.map((p) => (
                `<tr>`+
                `<td>${(p.nombre??'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;')}</td>`+
                `<td>${(p.sku??'')}</td>`+
                `<td>${(p.categoria??'')}</td>`+
                `<td>${(((p as any).supplierName??''))}</td>`+
                `<td>${p.precio??''}</td>`+
                `<td>${p.costo??''}</td>`+
                `<td>${p.stock??''}</td>`+
                `<td>${p.minStock??''}</td>`+
                `<td>${p.activo?'Sí':'No'}</td>`+
                `</tr>`
              )).join('');
              const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><table border="1"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`;
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


// Formulario de producto (crear/editar)
const ProductFormWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showMessage } = useSnackbar();
  const isEdit = Boolean(id);
  const [isLoading, setIsLoading] = useState(false);
  const [initialData, setInitialData] = useState<Partial<Producto>>({});

  // Load product data if in edit mode
  useEffect(() => {
    const loadProduct = async () => {
      if (!isEdit || !id) return;
      
      setIsLoading(true);
      try {
        const product = await getProductById(id);
        if (product) {
          setInitialData({
            ...product,
            // Ensure dates are properly parsed
            fechaCreacion: product.fechaCreacion?.toDate ? product.fechaCreacion.toDate() : new Date(),
            fechaActualizacion: product.fechaActualizacion?.toDate ? product.fechaActualizacion.toDate() : new Date(),
          });
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
      const precioMenudeo = data.precios?.find(p => p.tipo === 'menudeo')?.precio || 0;
      const precioMayoreo = data.precios?.find(p => p.tipo === 'mayoreo')?.precio || 0;
      const cantidadMayoreo = data.precios?.find(p => p.tipo === 'mayoreo')?.cantidadMinima || 2;
      
      // Convert Producto to Product for Firestore
      const productData: Product = {
        id: data.id || '',
        codigo: data.codigoBarras || '',
        nombre: data.nombre || 'Producto sin nombre',
        descripcion: data.descripcion || '',
        categoria: data.categoriaId || '',
        proveedor: data.proveedorId || '',
        precioMenudeo,
        precioMayoreo,
        cantidadMayoreo,
        stock: data.stock || 0,
        stockMinimo: data.stockMinimo || 0,
        fechaActualizacion: new Date(),
        activo: data.activo !== false,
        imagenes: data.imagenes?.map(img => img.datos) || []
      };
      
      if (isEdit && id) {
        await updateProduct(id, productData);
        showMessage('Producto actualizado correctamente', 'success');
      } else {
        delete productData.id; // Remove ID for new products
        await createProduct(productData);
        showMessage('Producto creado exitosamente', 'success');
        navigate('/inventario');
      }
      
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
