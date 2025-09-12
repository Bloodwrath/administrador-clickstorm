import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

// Placeholder components for different order sections
const OrderList = () => (
  <Box>
    <Typography variant="h4" gutterBottom>Pedidos</Typography>
    <Typography>Aquí se mostrará la lista de todos los pedidos.</Typography>
  </Box>
);

const NewOrder = () => (
  <Box>
    <Typography variant="h4" gutterBottom>Nuevo Pedido</Typography>
    <Typography>Aquí se mostrará el formulario para crear un nuevo pedido.</Typography>
  </Box>
);

const OrderDetails = () => (
  <Box>
    <Typography variant="h4" gutterBottom>Detalle de Pedido</Typography>
    <Typography>Aquí se mostrará el detalle de un pedido específico.</Typography>
  </Box>
);

const SalesReports = () => (
  <Box>
    <Typography variant="h4" gutterBottom>Reportes de Ventas</Typography>
    <Typography>Aquí se mostrarán los reportes y analítica de ventas.</Typography>
  </Box>
);

const Orders: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gestión de Pedidos</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('new')}
        >
          Nuevo Pedido
        </Button>
      </Box>
      
      <Routes>
        <Route index element={<OrderList />} />
        <Route path="new" element={<NewOrder />} />
        <Route path=":orderId" element={<OrderDetails />} />
        <Route path="reports" element={<SalesReports />} />
        <Route path="*" element={<Navigate to="/orders" replace />} />
      </Routes>
    </Container>
  );
};

export default Orders;
