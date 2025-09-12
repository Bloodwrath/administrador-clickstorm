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
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Save as SaveIcon, Image as ImageIcon } from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useForm } from 'react-hook-form';

// Import components
import ProductForm from './ProductForm';

// Import services and types
import { 
  Product, 
  ItemPaquete, 
  listenProducts, 
  deleteProduct, 
  createProduct, 
  updateProduct, 
  getProductById 
} from '../../services/products';
import { 
  Supplier as ApiSupplier, 
  listSuppliers, 
  listenSuppliers, 
  addSupplier, 
  updateSupplier, 
  deleteSupplier, 
  getSupplierById 
} from '../../services/suppliers';
import { saveLargeText, getLargeText } from '../../services/textStorage';
import { useSnackbar } from '../../context/SnackbarContext';

type Supplier = ApiSupplier & {
  // Extend the API supplier type if needed
};

// Alias para compatibilidad
type Producto = Product & {
  // Campos adicionales específicos del frontend
  sku?: string;
  categoria?: string;
  supplierName?: string;
  minStock?: number; // Alias para stockMinimo
  hasImage?: boolean;
  fechaCreacion?: Date | any;
  fechaActualizacion?: Date | any;
  createdAt?: Date | any; // Alias para fechaCreacion
  updatedAt?: Date | any; // Alias para fechaActualizacion
  creadoPor?: string;
  historialPrecios?: any[];
  etiquetas?: string[];
  // Hacer obligatorios algunos campos opcionales del tipo Product
  descripcion: string;
  categoriaId: string;
  proveedorId: string;
  material: string;
  costoProduccion: number;
};

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
    const unsub = listenProducts((items) => setRows(items));
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    let items = rows;
    if (lowStockOnly) {
      items = items.filter((p) => typeof p.minStock === 'number' && p.stock <= (p.minStock as number));
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
            variant="outlined"
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
      ),
    },
    { field: 'supplierName', headerName: 'Proveedor', width: 180 },
    { 
      field: 'nombre', 
      headerName: 'Nombre', 
      flex: 1, 
      minWidth: 160,
      renderCell: (params: GridRenderCellParams<Producto>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {params.row.hasImage && <ImageIcon fontSize="small" color="action" titleAccess="Con imagen" />}
          <span>{params.row.nombre}</span>
        </Box>
      )
    },
    { field: 'sku', headerName: 'SKU', width: 130 },
    { field: 'categoria', headerName: 'Categoría', width: 160 },
    { field: 'precio', headerName: 'Precio', width: 120, valueFormatter: (v) => `$${v.value ?? 0}` },
    { field: 'costo', headerName: 'Costo', width: 120, valueFormatter: (v) => `$${v.value ?? 0}` },
    { field: 'stock', headerName: 'Stock', width: 110 },
    { field: 'minStock', headerName: 'Stock mínimo', width: 130 },
    {
      field: 'activo',
      headerName: 'Activo',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (params.row.activo ? 'Sí' : 'No'),
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 200,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Producto>) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" variant="outlined" onClick={() => navigate(`/inventory/edit/${params.row.id}`)}>
            Editar
          </Button>
          <Button
            size="small"
            color="error"
            variant="outlined"
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
          >
            Eliminar
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5">Productos</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Buscar por nombre, SKU o categoría"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
      
      if (isEdit && id) {
        await updateProduct(id, data);
        showMessage('Producto actualizado correctamente', 'success');
      } else {
        await createProduct({
          ...data,
          creadoPor: 'currentUserId', // TODO: Replace with actual user ID
          fechaCreacion: new Date(),
          activo: true,
        });
        showMessage('Producto creado correctamente', 'success');
      }
      
      navigate('/inventory');
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
  const handleDeleteSupplier = async (id: string) => {
    if (!id || !window.confirm('¿Eliminar este proveedor?')) return;
    try {
      await deleteSupplier(id);
      showMessage('Proveedor eliminado', 'success');
    } catch (e) {
      console.error('Error deleting supplier:', e);
      showMessage('No se pudo eliminar el proveedor', 'error');
    }
  };
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
