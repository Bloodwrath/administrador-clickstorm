import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { listenProducts, deleteProduct } from '../../services/products';

// Components
import DataTable from '../../components/shared/DataTable';

// Types
import { Producto } from '../../types/inventory';

// Lista de productos con acciones
const ProductList: React.FC<{ lowStockOnly?: boolean }> = ({ lowStockOnly = false }) => {
  const navigate = useNavigate();
  const { showMessage } = useSnackbar();
  const [rows, setRows] = useState<Producto[]>([]);
  const [search, setSearch] = useState('');
  const [filterSupplier, setFilterSupplier] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  
  // Cargar productos
  useEffect(() => {
    const unsubscribe = listenProducts((products) => {
      setRows(products);
    });
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

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

  // Filtrar productos
  const filtered = useMemo(() => {
    return rows.filter(product => {
      const matchesSearch = !search || 
        product.nombre?.toLowerCase().includes(search.toLowerCase()) ||
        product.sku?.toLowerCase().includes(search.toLowerCase()) ||
        product.categoria?.toLowerCase().includes(search.toLowerCase());
      
      const matchesCategory = !filterCategory || product.categoria === filterCategory;
      const matchesSupplier = !filterSupplier || product.proveedor === filterSupplier;
      const matchesLowStock = !lowStockOnly || (product.stock || 0) <= (product.stockMinimo || 0);
      
      return matchesSearch && matchesCategory && matchesSupplier && matchesLowStock;
    });
  }, [rows, search, filterCategory, filterSupplier, lowStockOnly]);

  // Columnas de la tabla
  const columns = [
    { 
      field: 'nombre', 
      headerName: 'Nombre', 
      flex: 2, 
      minWidth: 200,
      renderCell: (params: any) => (
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
      valueGetter: (params: any) => {
        const precios = params.row.precios || [];
        const precioMenudeo = precios.find((p: any) => p.tipo === 'menudeo');
        return precioMenudeo?.precio || 0;
      },
      renderCell: (params: any) => (
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
      renderCell: (params: any) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            bgcolor: (params.value || 0) <= (params.row.stockMinimo || 0) ? 'error.light' : 'transparent',
            borderRadius: 1,
            px: 1,
          }}
        >
          <Typography
            variant="body2"
            color={(params.value || 0) <= (params.row.stockMinimo || 0) ? 'error.contrastText' : 'inherit'}
            fontWeight={(params.value || 0) <= (params.row.stockMinimo || 0) ? 'bold' : 'normal'}
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
      renderCell: (params: any) => (
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
        </Box>
      ),
    },
  ];

  // Funciones de exportación
  const handleExportCSV = () => {
    const headers = ['Nombre', 'Código de barras', 'SKU', 'Categoría', 'Proveedor', 'Precio menudeo', 'Precio mayoreo', 'Stock', 'Stock mínimo', 'Stock máximo', 'Activo'];
    const lines = [
      headers.join(','),
      ...filtered.map((product: any) => {
        const menudeoPrice = product.precios?.find((p: any) => p.tipo === 'menudeo')?.precio ?? 0;
        const mayoreoPrice = product.precios?.find((p: any) => p.tipo === 'mayoreo')?.precio ?? 0;
        
        return [
          `"${(product.nombre ?? '').replace(/"/g, '""')}"`,
          `"${product.codigoBarras ?? ''}"`,
          `"${product.sku ?? ''}"`,
          `"${product.categoria ?? ''}"`,
          `"${product.proveedor ?? ''}"`,
          menudeoPrice,
          mayoreoPrice,
          product.stock ?? 0,
          product.stockMinimo ?? 0,
          product.stockMaximo ?? 0,
          product.activo ? 'Sí' : 'No'
        ].join(',');
      })
    ];
    
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
  };

  const handleExportExcel = () => {
    const headers = ['Nombre', 'Código de barras', 'SKU', 'Categoría', 'Proveedor', 'Precio menudeo', 'Precio mayoreo', 'Stock', 'Stock mínimo', 'Stock máximo', 'Activo'];
    
    const rowsHtml = filtered.map((product: any) => {
      const menudeoPrice = product.precios?.find((p: any) => p.tipo === 'menudeo')?.precio ?? 0;
      const mayoreoPrice = product.precios?.find((p: any) => p.tipo === 'mayoreo')?.precio ?? 0;
      
      return (
        `<tr>` +
        `<td>${(product.nombre ?? '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;')}</td>` +
        `<td>${product.codigoBarras ?? ''}</td>` +
        `<td>${product.sku ?? ''}</td>` +
        `<td>${product.categoria ?? ''}</td>` +
        `<td>${product.proveedor ?? ''}</td>` +
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
    a.download = `inventario_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Categoría</InputLabel>
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as string)}
              label="Categoría"
            >
              <MenuItem value="">Todas</MenuItem>
              {Array.from(new Set(rows.map((r) => r.categoria).filter(Boolean))).map((cat) => (
                <MenuItem key={cat} value={cat as string}>
                  {cat as string}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Proveedor</InputLabel>
            <Select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value as string)}
              label="Proveedor"
            >
              <MenuItem value="">Todos</MenuItem>
              {Array.from(new Set(rows.map((r) => r.proveedor).filter(Boolean))).map((prov) => (
                <MenuItem key={prov} value={prov as string}>
                  {prov as string}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/inventory/new')}
            sx={{ ml: 1 }}
          >
            Nuevo Producto
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={handleExportCSV}
          >
            Exportar CSV
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={handleExportExcel}
          >
            Exportar Excel
          </Button>
        </Box>
      </Box>
      
      <DataTable
        rows={filtered}
        columns={columns}
        loading={rows.length === 0}
        title="Lista de Productos"
        height="70vh"
        withToolbar={true}
      />
      
      <Dialog 
        open={previewOpen} 
        onClose={() => {
          if (previewSrc) URL.revokeObjectURL(previewSrc);
          setPreviewOpen(false);
          setPreviewSrc(null);
        }} 
        maxWidth="lg"
      >
        <DialogTitle>Vista previa de imagen</DialogTitle>
        <DialogContent>
          {previewSrc && (
            <img 
              src={previewSrc} 
              alt="Vista previa" 
              style={{ maxWidth: '100%', maxHeight: '70vh' }} 
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              if (previewSrc) URL.revokeObjectURL(previewSrc);
              setPreviewOpen(false);
              setPreviewSrc(null);
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductList;
