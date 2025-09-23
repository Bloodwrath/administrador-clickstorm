import React from 'react';
import { Box, Typography, Grid, Paper, useTheme } from '@mui/material';
import { 
  ShoppingCart as ShoppingCartIcon, 
  AttachMoney as AttachMoneyIcon, 
  People as PeopleIcon, 
  Inventory as InventoryIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const stats = [
    { 
      title: 'Ventas del Mes', 
      value: '$24,780', 
      change: '+12%', 
      icon: <AttachMoneyIcon fontSize="large" />,
      color: theme.palette.primary.main,
      path: '/accounting'
    },
    { 
      title: 'Productos en Inventario', 
      value: '1,245', 
      change: '+5%', 
      icon: <InventoryIcon fontSize="large" />,
      color: theme.palette.success.main,
      path: '/inventory'
    },
    { 
      title: 'Pedidos Pendientes', 
      value: '24', 
      change: '-3%', 
      icon: <ShoppingCartIcon fontSize="large" />,
      color: theme.palette.warning.main,
      path: '/orders'
    },
    { 
      title: 'Proveedores', 
      value: '15', 
      change: '+2', 
      icon: <PeopleIcon fontSize="large" />,
      color: theme.palette.info.main,
      path: '/suppliers'
    },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Panel de Control
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 2, 
                display: 'flex', 
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: theme.shadows[6]
                }
              }}
              onClick={() => navigate(stat.path)}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" variant="subtitle2">
                    {stat.title}
                  </Typography>
                  <Typography variant="h5" component="div">
                    {stat.value}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ color: stat.change.startsWith('+') ? 'success.main' : 'error.main' }}
                  >
                    {stat.change} este mes
                  </Typography>
                </Box>
                <Box 
                  sx={{ 
                    p: 1, 
                    borderRadius: '50%', 
                    bgcolor: `${stat.color}15`, // Añade transparencia al color
                    color: stat.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 50,
                    height: 50
                  }}
                >
                  {stat.icon}
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Resumen de Ventas
            </Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="textSecondary">
                Gráfico de ventas se mostrará aquí
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Productos con Bajo Stock
            </Typography>
            <Box sx={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="textSecondary">
                Lista de productos con bajo stock se mostrará aquí
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
