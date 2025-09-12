import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Typography, Button, Container } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

// Placeholder components for different inventory sections
const ProductList = () => (
  <Box>
    <Typography variant="h4" gutterBottom>Products</Typography>
    <Typography>List of all products will be displayed here.</Typography>
  </Box>
);

const AddProduct = () => (
  <Box>
    <Typography variant="h4" gutterBottom>Add New Product</Typography>
    <Typography>Form to add a new product will be displayed here.</Typography>
  </Box>
);

const Categories = () => (
  <Box>
    <Typography variant="h4" gutterBottom>Categories</Typography>
    <Typography>Product categories will be managed here.</Typography>
  </Box>
);

const LowStock = () => (
  <Box>
    <Typography variant="h4" gutterBottom>Low Stock Items</Typography>
    <Typography>Products with low stock levels will be listed here.</Typography>
  </Box>
);

const Inventory: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Inventory Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => window.location.href = '/inventory/add'}
        >
          Add Product
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
