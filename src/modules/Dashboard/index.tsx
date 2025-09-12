import React from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  useTheme,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  AccountBalance as AccountingIcon,
  Inventory as InventoryIcon,
  ShoppingCart as OrdersIcon,
  Warning as WarningIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Inventory2 as LowStockIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock data for the dashboard
const salesData = [
  { name: 'Jan', sales: 4000 },
  { name: 'Feb', sales: 3000 },
  { name: 'Mar', sales: 5000 },
  { name: 'Apr', sales: 2780 },
  { name: 'May', sales: 1890 },
  { name: 'Jun', sales: 2390 },
];

const lowStockItems = [
  { id: 1, name: 'Product A', current: 5, min: 10 },
  { id: 2, name: 'Product B', current: 2, min: 5 },
  { id: 3, name: 'Product C', current: 8, min: 15 },
];

const recentOrders = [
  { id: 1, customer: 'John Doe', amount: 120, status: 'Delivered' },
  { id: 2, customer: 'Jane Smith', amount: 85, status: 'Processing' },
  { id: 3, customer: 'Bob Johnson', amount: 210, status: 'Pending' },
];

const stats = [
  { title: 'Total Sales', value: '$12,345', change: '+12%', isPositive: true, icon: <MoneyIcon fontSize="large" color="primary" /> },
  { title: 'Orders', value: '156', change: '+5%', isPositive: true, icon: <OrdersIcon fontSize="large" color="secondary" /> },
  { title: 'Inventory Items', value: '1,234', change: '-2%', isPositive: false, icon: <InventoryIcon fontSize="large" color="action" /> },
  { title: 'Revenue', value: '$45,678', change: '+8%', isPositive: true, icon: <TrendingUpIcon fontSize="large" color="success" /> },
];

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const StatCard = ({ title, value, change, isPositive, icon }: any) => (
    <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.02)' } }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h5">{value}</Typography>
            <Typography 
              variant="caption" 
              color={isPositive ? 'success.main' : 'error.main'}
              sx={{ display: 'flex', alignItems: 'center', mt: 1 }}
            >
              {isPositive ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
              {change}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: 'transparent' }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography color="textSecondary" paragraph>
        Welcome back! Here's what's happening with your business today.
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Sales Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Sales Overview
            </Typography>
            <Box sx={{ height: 300, mt: 3 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill={theme.palette.primary.main} name="Sales ($)" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Low Stock Items */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <WarningIcon color="warning" sx={{ mr: 1 }} />
              Low Stock Items
            </Typography>
            <List>
              {lowStockItems.map((item) => (
                <React.Fragment key={item.id}>
                  <ListItem>
                    <ListItemIcon>
                      <LowStockIcon color="action" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.name} 
                      secondary={`${item.current} in stock (min: ${item.min})`} 
                    />
                    <Box width={100} ml={2}>
                      <LinearProgress 
                        variant="determinate" 
                        value={(item.current / item.min) * 100} 
                        color="warning"
                      />
                    </Box>
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Recent Orders */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Orders
            </Typography>
            <List>
              {recentOrders.map((order) => (
                <React.Fragment key={order.id}>
                  <ListItem button onClick={() => navigate(`/orders/${order.id}`)}>
                    <ListItemText 
                      primary={order.customer} 
                      secondary={`Order #${order.id} • ${order.amount}`} 
                    />
                    <Typography 
                      variant="caption" 
                      color={order.status === 'Delivered' ? 'success.main' : 'text.secondary'}
                      sx={{
                        p: 0.5,
                        borderRadius: 1,
                        bgcolor: order.status === 'Delivered' ? 'success.light' : 'action.hover',
                      }}
                    >
                      {order.status}
                    </Typography>
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    textAlign: 'center',
                    border: '1px solid',
                    borderColor: 'divider',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => navigate('/accounting/new-purchase')}
                >
                  <AccountingIcon color="primary" fontSize="large" />
                  <Typography>New Purchase</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    textAlign: 'center',
                    border: '1px solid',
                    borderColor: 'divider',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => navigate('/inventory/add')}
                >
                  <InventoryIcon color="primary" fontSize="large" />
                  <Typography>Add Inventory</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    textAlign: 'center',
                    border: '1px solid',
                    borderColor: 'divider',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => navigate('/orders/new')}
                >
                  <OrdersIcon color="primary" fontSize="large" />
                  <Typography>New Order</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    textAlign: 'center',
                    border: '1px solid',
                    borderColor: 'divider',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => navigate('/accounting/reports')}
                >
                  <MoneyIcon color="primary" fontSize="large" />
                  <Typography>View Reports</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
