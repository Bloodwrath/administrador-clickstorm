import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  Divider, 
  Chip, 
  IconButton, 
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  PictureAsPdf as PdfIcon,
  Print as PrintIcon,
  ArrowBack as BackIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { doc, getDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { Order, OrderStatus, formatCurrency } from '../../../types/order';
import OrderItemsList from './OrderItemsList';
import OrderSummary from './OrderSummary';
import { generateOrderPdf } from '../../../utils/pdfGenerator';
import NewOrderForm from './NewOrderForm';

const statusColors = {
  pending: 'warning',
  processing: 'info',
  completed: 'success',
  shipped: 'primary',
  cancelled: 'error',
  refunded: 'default'
} as const;

const statusIcons = {
  pending: <RefreshIcon />,
  processing: <CircularProgress size={20} />,
  completed: <CheckCircleIcon />,
  shipped: <ShippingIcon />,
  cancelled: <CancelIcon />,
  refunded: <CancelIcon />
};

const OrderDetailsView: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // Fetch order details
  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    
    setLoading(true);
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (!orderSnap.exists()) {
        throw new Error('Pedido no encontrado');
      }
      
      const orderData = {
        id: orderSnap.id,
        ...orderSnap.data(),
        createdAt: orderSnap.data().createdAt?.toDate(),
        updatedAt: orderSnap.data().updatedAt?.toDate()
      } as Order;
      
      setOrder(orderData);
    } catch (error) {
      console.error('Error fetching order:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Error al cargar el pedido',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Handle status update
  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!orderId || !order) return;
    
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: Timestamp.now()
      });
      
      setOrder(prev => prev ? { ...prev, status: newStatus } : null);
      
      setSnackbar({
        open: true,
        message: 'Estado del pedido actualizado',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      setSnackbar({
        open: true,
        message: 'Error al actualizar el estado del pedido',
        severity: 'error'
      });
    }
  };

  // Handle delete order
  const handleDeleteOrder = async () => {
    if (!orderId) return;
    
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      setDeleteDialogOpen(false);
      
      setSnackbar({
        open: true,
        message: 'Pedido eliminado correctamente',
        severity: 'success'
      });
      
      // Redirect to orders list after a short delay
      setTimeout(() => {
        navigate('/orders');
      }, 1500);
    } catch (error) {
      console.error('Error deleting order:', error);
      setSnackbar({
        open: true,
        message: 'Error al eliminar el pedido',
        severity: 'error'
      });
    }
  };

  // Generate and download PDF
  const handleDownloadPdf = () => {
    if (!order) return;
    
    const pdfDoc = generateOrderPdf(order);
    pdfDoc.save(`pedido-${order.orderNumber}.pdf`);
  };

  // Handle print
  const handlePrint = () => {
    if (!order) return;
    
    const pdfDoc = generateOrderPdf(order);
    const pdfUrl = pdfDoc.output('bloburl');
    window.open(pdfUrl as any, '_blank');
  };

  // Handle order update
  const handleOrderUpdate = (updatedOrder: Order) => {
    setOrder(updatedOrder);
    setEditing(false);
    
    setSnackbar({
      open: true,
      message: 'Pedido actualizado correctamente',
      severity: 'success'
    });
  };

  // Handle snackbar close
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!order) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="textSecondary">
          No se encontró el pedido solicitado
        </Typography>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={() => navigate('/orders')}
          sx={{ mt: 2 }}
        >
          Volver a la lista de pedidos
        </Button>
      </Box>
    );
  }

  if (editing) {
    return (
      <NewOrderForm 
        initialOrder={order}
        onSuccess={() => setEditing(false)}
        onCancel={() => setEditing(false)}
        submitLabel="Actualizar Pedido"
        showBackButton={true}
      />
    );
  }

  return (
    <Box>
      {/* Header with actions */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Volver">
            <IconButton onClick={() => navigate('/orders')} sx={{ mr: 1 }}>
              <BackIcon />
            </IconButton>
          </Tooltip>
          <Box>
            <Typography variant="h4" component="h1">
              Pedido #{order.orderNumber}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              <Chip
                icon={statusIcons[order.status]}
                label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                color={statusColors[order.status] as any}
                size="small"
                variant="outlined"
                sx={{ textTransform: 'capitalize', fontWeight: 500 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                Creado el {order.createdAt.toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Box>
          <Button
            variant="outlined"
            startIcon={<PdfIcon />}
            onClick={handleDownloadPdf}
            sx={{ mr: 1 }}
          >
            PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{ mr: 1 }}
          >
            Imprimir
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => setEditing(true)}
            sx={{ mr: 1 }}
          >
            Editar
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Eliminar
          </Button>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        {/* Order Details */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ mb: 3, p: 3 }}>
            <Grid container spacing={3}>
              {/* Customer Information */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Información del Cliente
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">Nombre</Typography>
                  <Typography>{order.customerName}</Typography>
                </Box>
                
                {order.customerEmail && (
                  <Box mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">Correo Electrónico</Typography>
                    <Typography>{order.customerEmail}</Typography>
                  </Box>
                )}
                
                {order.customerPhone && (
                  <Box mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">Teléfono</Typography>
                    <Typography>{order.customerPhone}</Typography>
                  </Box>
                )}
                
                {order.customerAddress && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Dirección de Envío</Typography>
                    <Typography>{order.customerAddress}</Typography>
                  </Box>
                )}
              </Grid>
              
              {/* Order Information */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Información del Pedido
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">Número de Pedido</Typography>
                  <Typography>#{order.orderNumber}</Typography>
                </Box>
                
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">Fecha de Creación</Typography>
                  <Typography>{order.createdAt.toLocaleString()}</Typography>
                </Box>
                
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">Última Actualización</Typography>
                  <Typography>{order.updatedAt.toLocaleString()}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Estado del Pedido
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {Object.entries(statusColors).map(([status, color]) => (
                      <Chip
                        key={status}
                        icon={statusIcons[status as OrderStatus]}
                        label={status.charAt(0).toUpperCase() + status.slice(1)}
                        color={color as any}
                        variant={order.status === status ? 'filled' : 'outlined'}
                        onClick={() => handleStatusUpdate(status as OrderStatus)}
                        sx={{ 
                          textTransform: 'capitalize',
                          cursor: 'pointer',
                          '&:hover': {
                            opacity: 0.8
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Grid>
            </Grid>
            
            {/* Customer Notes */}
            {order.customerNotes && (
              <Box mt={3}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Notas del Cliente
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'background.default' }}>
                  <Typography>{order.customerNotes}</Typography>
                </Paper>
              </Box>
            )}
            
            {/* Order Notes */}
            {order.notes && (
              <Box mt={3}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Notas Internas
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'background.default' }}>
                  <Typography>{order.notes}</Typography>
                </Paper>
              </Box>
            )}
          </Paper>
          
          {/* Order Items */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Productos
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <OrderItemsList 
              items={order.items} 
              showActions={false}
            />
          </Paper>
        </Grid>
        
        {/* Order Summary and Actions */}
        <Grid item xs={12} md={4}>
          <OrderSummary 
            order={order}
            onUpdateOrder={() => {}}
            showSubmitButton={false}
            showPaymentStatus={true}
            showNotes={false}
          />
          
          {/* Order Actions */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Acciones
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={12}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => setEditing(true)}
                >
                  Editar Pedido
                </Button>
              </Grid>
              
              <Grid item xs={12} sm={6} md={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PdfIcon />}
                  onClick={handleDownloadPdf}
                >
                  Descargar PDF
                </Button>
              </Grid>
              
              <Grid item xs={12} sm={6} md={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={handlePrint}
                >
                  Imprimir
                </Button>
              </Grid>
              
              <Grid item xs={12} sm={6} md={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Eliminar Pedido
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar este pedido? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleDeleteOrder} 
            color="error"
            variant="contained"
            autoFocus
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OrderDetailsView;
