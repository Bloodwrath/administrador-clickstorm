import React from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, Button, Container } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useEffect, useMemo, useState } from 'react';
import { Product, listenProducts, deleteProduct } from '../../services/products';
import { saveLargeText } from '../../services/textStorage';
import { useSnackbar } from '../../context/SnackbarContext';
import { useForm } from 'react-hook-form';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

// Lista de productos con acciones
const ProductList: React.FC<{ lowStockOnly?: boolean }> = ({ lowStockOnly }) => {
  const navigate = useNavigate();
  const { showMessage } = useSnackbar();
  const [rows, setRows] = useState<Product[]>([]);
  const [search, setSearch] = useState('');

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
    if (!t) return items;
    return items.filter(
      (p) =>
        (p.nombre || '').toLowerCase().includes(t) ||
        (p.sku || '').toLowerCase().includes(t) ||
        (p.categoria || '').toLowerCase().includes(t)
    );
  }, [rows, search, lowStockOnly]);

  const columns: GridColDef[] = [
    { field: 'nombre', headerName: 'Nombre', flex: 1, minWidth: 160 },
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
      renderCell: (params: GridRenderCellParams<Product>) => (
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Productos</Typography>
        <TextField
          size="small"
          placeholder="Buscar por nombre, SKU o categoría"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Box>
      <div style={{ width: '100%' }}>
        <DataGrid autoHeight rows={filtered} columns={columns} getRowId={(r) => r.id!} pageSizeOptions={[5, 10, 25]} />
      </div>
    </Box>
  );
};

// Formulario de producto (crear/editar)
const ProductForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showMessage } = useSnackbar();
  const isEdit = Boolean(id);
  const { register, handleSubmit, setValue, formState: { isSubmitting } } = useForm<Product>({
    defaultValues: {
      nombre: '', sku: '', categoria: '', precio: 0, costo: 0, stock: 0, minStock: 0, descripcion: '', activo: true,
    },
  });

  useEffect(() => {
    if (!isEdit) return;
    import('../../services/products').then(async ({ getProductById }) => {
      const p = await getProductById(id!);
      if (p) {
        Object.entries(p).forEach(([k, v]) => setValue(k as any, v as any));
      }
    });
  }, [id, isEdit, setValue]);

  const [imageFile, setImageFile] = useState<File | null>(null);

  const onSubmit = async (data: Product) => {
    try {
      if (isEdit) {
        const { updateProduct } = await import('../../services/products');
        await updateProduct(id!, data);
        // Si se adjuntó nueva imagen, guardarla y marcar flag
        if (imageFile) {
          const buf = await imageFile.arrayBuffer();
          await saveLargeText('productos_files', id!, new Uint8Array(buf), { encode: 'base64' });
          await updateProduct(id!, { hasImage: true });
        }
        showMessage('Producto actualizado', 'success');
      } else {
        const { addProduct, updateProduct } = await import('../../services/products');
        // Crear primero para obtener el id
        const newId = await addProduct({ ...data, hasImage: false });
        if (imageFile) {
          const buf = await imageFile.arrayBuffer();
          await saveLargeText('productos_files', newId, new Uint8Array(buf), { encode: 'base64' });
          await updateProduct(newId, { hasImage: true });
        }
        showMessage('Producto creado', 'success');
      }
      navigate('/inventory');
    } catch (e) {
      console.error(e);
      showMessage('No se pudo guardar el producto', 'error');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
      <TextField label="Nombre" required {...register('nombre')} />
      <TextField label="SKU" {...register('sku')} />
      <TextField label="Categoría" {...register('categoria')} />
      <TextField label="Precio" type="number" inputProps={{ step: '0.01' }} {...register('precio', { valueAsNumber: true })} />
      <TextField label="Costo" type="number" inputProps={{ step: '0.01' }} {...register('costo', { valueAsNumber: true })} />
      <TextField label="Stock" type="number" {...register('stock', { valueAsNumber: true })} />
      <TextField label="Stock mínimo" type="number" {...register('minStock', { valueAsNumber: true })} />
      <TextField label="Descripción" multiline minRows={3} sx={{ gridColumn: { md: '1 / span 2' } }} {...register('descripcion')} />
      <Box sx={{ gridColumn: { md: '1 / span 2' } }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Imagen principal (opcional)</Typography>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        />
      </Box>
      <FormControlLabel control={<Checkbox defaultChecked {...register('activo')} />} label="Activo" />
      <Box sx={{ gridColumn: { md: '1 / span 2' }, display: 'flex', gap: 2 }}>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isEdit ? 'Guardar Cambios' : 'Crear Producto'}
        </Button>
        <Button variant="outlined" onClick={() => navigate('/inventory')}>Cancelar</Button>
      </Box>
    </Box>
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
        <Route path="add" element={<ProductForm />} />
        <Route path="edit/:id" element={<ProductForm />} />
        <Route path="categories" element={<Categories />} />
        <Route path="low-stock" element={<LowStock />} />
        <Route path="*" element={<Navigate to="/inventory" replace />} />
      </Routes>
    </Container>
  );
};

export default Inventory;
