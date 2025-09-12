import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Typography, Button, Container } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

// Placeholder components for different accounting sections
const PurchaseList = () => (
  <Box>
    <Typography variant="h4" gutterBottom>Purchases</Typography>
    <Typography>List of all purchases will be displayed here.</Typography>
  </Box>
);

const NewPurchase = () => (
  <Box>
    <Typography variant="h4" gutterBottom>New Purchase</Typography>
    <Typography>Form to add a new purchase will be displayed here.</Typography>
  </Box>
);

const CreditCards = () => (
  <Box>
    <Typography variant="h4" gutterBottom>Credit Cards</Typography>
    <Typography>Credit card management will be displayed here.</Typography>
  </Box>
);

const Reports = () => (
  <Box>
    <Typography variant="h4" gutterBottom>Reports</Typography>
    <Typography>Accounting reports will be displayed here.</Typography>
  </Box>
);

const Accounting: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Accounting</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => window.location.href = '/accounting/new-purchase'}
        >
          New Purchase
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
