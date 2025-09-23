import React from 'react';
import { Box, Typography, Button, TextField, InputAdornment, IconButton, Tooltip } from '@mui/material';
import DataTable from '../../components/shared/DataTable';
import { GridColDef } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { Add as AddIcon, Search as SearchIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

const Suppliers: React.FC = () => {
  const navigate = useNavigate();
  
  // Datos de ejemplo - en una aplicación real, estos vendrían de una API
  const suppliers = [
    { id: 1, nombre: 'Proveedor 1', contacto: 'Juan Pérez', telefono: '123-456-7890', email: 'juan@proveedor1.com', direccion: 'Calle Falsa 123' },
    { id: 2, nombre: 'Proveedor 2', contacto: 'María García', telefono: '987-654-3210', email: 'maria@proveedor2.com', direccion: 'Avenida Siempre Viva 456' },
  ];

  // Columnas de la tabla
  const columns: GridColDef[] = [
    { 
      field: 'nombre', 
      headerName: 'Nombre', 
      flex: 1, 
      minWidth: 200 
    },
    { 
      field: 'contacto', 
      headerName: 'Contacto', 
      flex: 1, 
      minWidth: 150 
    },
    { 
      field: 'telefono', 
      headerName: 'Teléfono', 
      flex: 1, 
      minWidth: 150 
    },
    { 
      field: 'email', 
      headerName: 'Correo Electrónico', 
      flex: 1, 
      minWidth: 200 
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Editar">
            <IconButton
              size="small"
              color="primary"
              onClick={() => navigate(`/suppliers/edit/${params.row.id}`)}
              sx={{
                '&:hover': { backgroundColor: 'primary.light', color: 'primary.contrastText' },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton
              size="small"
              color="error"
              onClick={() => {
                if (window.confirm(`¿Estás seguro de que deseas eliminar al proveedor "${params.row.nombre}"?`)) {
                  // Lógica para eliminar el proveedor
                  console.log('Eliminar proveedor:', params.row.id);
                }
              }}
              sx={{
                '&:hover': { backgroundColor: 'error.light', color: 'error.contrastText' },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h1">
          Proveedores
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/suppliers/new')}
        >
          Nuevo Proveedor
        </Button>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <TextField
          size="small"
          placeholder="Buscar proveedores..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box sx={{ height: 'calc(100vh - 200px)', width: '100%' }}>
        <DataTable
          rows={suppliers}
          columns={columns}
          loading={false}
          title=""
          height="100%"
          withToolbar={true}
        />
      </Box>
    </Box>
  );
};

export default Suppliers;
