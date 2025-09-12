import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

// Placeholder components for different accounting sections
const PurchaseList = () => (
  <Box>
    <Typography variant="h4" gutterBottom>Compras</Typography>
    <Typography>Aquí se mostrará la lista de todas las compras.</Typography>
  </Box>
);

const NewPurchase = () => (
  <Box>
    <Typography variant="h4" gutterBottom>Nueva Compra</Typography>
    <Typography>Aquí se mostrará el formulario para agregar una nueva compra.</Typography>
  </Box>
);

const CreditCards = () => (
  <Box>
    <Typography variant="h4" gutterBottom>Tarjetas de Crédito</Typography>
    <Typography>Aquí podrás administrar tus tarjetas de crédito.</Typography>
  </Box>
);

const Reports = () => (
  <Box>
    <Typography variant="h4" gutterBottom>Reportes</Typography>
    <Typography>Aquí se mostrarán los reportes de contabilidad.</Typography>
  </Box>
);

const Accounting: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Contabilidad</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('new-purchase')}
        >
          Nueva Compra
        </Button>
      </Box>
      
      <Routes>
        <Route index element={<PurchaseList />} />
        <Route path="new-purchase" element={<NewPurchase />} />
        <Route path="credit-cards" element={<CreditCards />} />
        <Route path="reports" element={<Reports />} />
        <Route path="*" element={<Navigate to="/accounting" replace />} />
      </Routes>
    </Container>
  );
};

export default Accounting;
