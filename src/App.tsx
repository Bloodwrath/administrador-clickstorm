import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline, useTheme, CircularProgress } from '@mui/material';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import { NotFound, TestConnection } from './components';
import Dashboard from './modules/Dashboard';
import Accounting from './modules/accounting';
import Inventory from './modules/inventory';
import Orders from './modules/orders';
import Suppliers from './modules/suppliers';
import { Login, SignUp } from './modules/auth';

const App: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const theme = useTheme();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: theme.palette.background.default,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Routes>
        <Route
          path="/login"
          element={!currentUser ? <Login /> : <Navigate to="/" replace />}
        />
        <Route
          path="/signup"
          element={!currentUser ? <SignUp /> : <Navigate to="/" replace />}
        />
        <Route
          path="/"
          element={currentUser ? <Layout /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Dashboard />} />
          <Route path="accounting/*" element={<Accounting />} />
          <Route path="inventory/*" element={<Inventory />} />
          <Route path="suppliers/*" element={<Suppliers />} />
          <Route path="orders/*" element={<Orders />} />
          <Route path="test-connection" element={<TestConnection />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Box>
  );
};

export default App;
