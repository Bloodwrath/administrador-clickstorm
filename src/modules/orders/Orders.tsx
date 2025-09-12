import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Typography, Button, Container } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

// Placeholder components for different order sections
const OrderList = () => (
  <Box>
    <Typography variant="h4" gutterBottom>Orders</Typography>
    <Typography>List of all orders will be displayed here.</Typography>
  </Box>
);

const NewOrder = () => (
  <Box>
    <Typography variant="h4" gutterBottom>New Order</Typography>
    <Typography>Form to create a new order will be displayed here.</Typography>
  </Box>
);

const OrderDetails = () => (
  <Box>
    <Typography variant="h4" gutterBottom>Order Details</Typography>
    <Typography>Detailed view of a specific order will be displayed here.</Typography>
  </Box>
);

const SalesReports = () => (
  <Box>
    <Typography variant="h4" gutterBottom>Sales Reports</Typography>
    <Typography>Sales reports and analytics will be displayed here.</Typography>
  </Box>
);

const Orders: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Order Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => window.location.href = '/orders/new'}
        >
          New Order
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
