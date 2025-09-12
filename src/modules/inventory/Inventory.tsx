import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

// Placeholder components for different inventory sections
const ProductList = () => (
  <Box>
    <Typography variant="h4" gutterBottom>Productos</Typography>
    <Typography>Aquí se mostrará la lista de todos los productos.</Typography>
  </Box>
);

const AddProduct = () => (
  <Box>
    <Typography variant="h4" gutterBottom>Agregar Nuevo Producto</Typography>
    <Typography>Aquí se mostrará el formulario para agregar un nuevo producto.</Typography>
  </Box>
);

const Categories = () => (
  <Box>
    <Typography variant="h4" gutterBottom>Categorías</Typography>
    <Typography>Aquí podrás administrar las categorías de productos.</Typography>
  </Box>
);

const LowStock = () => (
  <Box>
    <Typography variant="h4" gutterBottom>Artículos con Bajo Stock</Typography>
    <Typography>Aquí se listarán los productos con bajo nivel de stock.</Typography>
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
        <Route path="add" element={<AddProduct />} />
        <Route path="categories" element={<Categories />} />
        <Route path="low-stock" element={<LowStock />} />
        <Route path="*" element={<Navigate to="/inventory" replace />} />
      </Routes>
    </Container>
  );
};

export default Inventory;
