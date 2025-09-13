import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Divider, 
  TextField, 
  InputAdornment, 
  IconButton, 
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import { 
  Save as SaveIcon, 
  ArrowBack as BackIcon, 
  Add as AddIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Notes as NotesIcon
} from '@mui/icons-material';
import { collection, addDoc, Timestamp, writeBatch, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Order, OrderItem, initialOrderState, generateOrderNumber } from '../../types/order';
import { Product } from '../../types/product';
import ProductSearch from './ProductSearch';
import OrderItemsList from './OrderItemsList';
import OrderSummary from './OrderSummary';
import { generateOrderPdf } from '../../utils/pdfGenerator';

export interface NewOrderFormProps {
  initialOrder?: Partial<Order>;
  onSuccess?: (orderId: string) => void;
  onCancel?: () => void;
  submitLabel?: string;
  showBackButton?: boolean;
}

const NewOrderForm: React.FC<NewOrderFormProps> = ({
  initialOrder = {},
  onSuccess,
  onCancel,
  submitLabel = 'Guardar Pedido',
  showBackButton = true
}) => {
  const navigate = useNavigate();
  const [order, setOrder] = useState<Partial<Order>>({
    ...initialOrderState,
    ...initialOrder,
    orderNumber: initialOrder.orderNumber || generateOrderNumber(),
  });
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // Update order field
  const updateOrder = useCallback((updates: Partial<Order>) => {
    setOrder(prev => {
      const updated = { ...prev, ...updates };
      
      // Recalculate totals if relevant fields change
      if (
        'items' in updates || 
        'discount' in updates || 
        'shipping' in updates ||
        'subtotal' in updates ||
        'tax' in updates
      ) {
        const subtotal = 'items' in updates 
          ? updates.items?.reduce((sum, item) => sum + item.total, 0) || 0
          : updated.items?.reduce((sum, item) => sum + item.total, 0) || 0;
          
        const tax = subtotal * 0.16; // 16% IVA
        const discount = 'discount' in updates ? (updates.discount || 0) : (updated.discount || 0);
        const shipping = 'shipping' in updates ? (updates.shipping || 0) : (updated.shipping || 0);
        const total = subtotal + tax + shipping - discount;
        
        return { ...updated, subtotal, tax, total };
      }
      
      return updated;
    });
  }, []);

  // Handle product selection from search
  const handleSelectProduct = useCallback((product: Product) => {
    setSelectedProduct(product);
    
    const existingItemIndex = order.items?.findIndex(item => 
      item.productId === product.id
    ) ?? -1;
    
    if (existingItemIndex >= 0) {
      // If product exists, update its quantity and check for wholesale
      const newItems = [...(order.items || [])];
      const existingItem = { ...newItems[existingItemIndex] };
      const newQuantity = existingItem.quantity + 1;
      const isWholesale = newQuantity >= product.cantidadMayoreo;
      const price = isWholesale ? product.precioMayoreo : product.precioMenudeo;
      
      newItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        price,
        total: newQuantity * price,
        isWholesale
      };
      
      updateOrder({ items: newItems });
    } else {
      // Add new product to order
      const isWholesale = 1 >= product.cantidadMayoreo; // Check if single item meets wholesale minimum
      const price = isWholesale ? product.precioMayoreo : product.precioMenudeo;
      
      const newItem: OrderItem = {
        productId: product.id,
        name: product.nombre,
        quantity: 1,
        price,
        total: price,
        stock: product.stock,
        isWholesale,
        category: product.categoria
      };
      
      updateOrder({ 
        items: [...(order.items || []), newItem] 
      });
    }
  }, [order.items, updateOrder]);

  // Handle quantity update for an item
  const handleUpdateQuantity = useCallback(async (index: number, quantity: number) => {
    if (!order.items || quantity < 1) return;
    
    const newItems = [...order.items];
    const item = { ...newItems[index] };
    
    try {
      // Get the latest product data to check wholesale pricing
      const productDoc = await getDoc(doc(db, 'products', item.productId));
      if (!productDoc.exists()) {
        throw new Error('Producto no encontrado');
      }
      
      const product = { id: productDoc.id, ...productDoc.data() } as Product;
      
      // Check stock if available
      if (product.stock > 0 && quantity > product.stock) {
        setSnackbar({
          open: true,
          message: `Solo hay ${product.stock} unidades disponibles`,
          severity: 'warning'
        });
        return;
      }
      
      // Determine if we should use wholesale price
      const isWholesale = quantity >= product.cantidadMayoreo;
      const price = isWholesale ? product.precioMayoreo : product.precioMenudeo;
      
      // Update item with new quantity and price
      newItems[index] = {
        ...item,
        quantity,
        price,
        total: price * quantity,
        isWholesale
      };
      
      updateOrder({ items: newItems });
      
      // Show message when switching to wholesale
      if (isWholesale && !item.isWholesale) {
        setSnackbar({
          open: true,
          message: `¡Precio de mayoreo aplicado (${product.cantidadMayoreo}+ unidades)`,
          severity: 'info'
        });
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      setSnackbar({
        open: true,
        message: 'Error al actualizar la cantidad. Intente nuevamente.',
        severity: 'error'
      });
    }
  }, [order.items, updateOrder]);

  // Handle item removal
  const handleRemoveItem = useCallback((index: number) => {
    if (!order.items) return;
    
    const newItems = [...order.items];
    newItems.splice(index, 1);
    updateOrder({ items: newItems });
  }, [order.items, updateOrder]);

  // Handle form submission from form element
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitOrder();
  };
  
  // Handle order submission (can be called directly or from form)
  const submitOrder = async () => {
    // Validate required fields
    if (!order.customerName || !order.customerPhone) {
      setSnackbar({
        open: true,
        message: 'El nombre y teléfono del cliente son obligatorios',
        severity: 'warning'
      });
      return;
    }
    
    if (!order.items || order.items.length === 0) {
      setSnackbar({
        open: true,
        message: 'Agrega al menos un producto al pedido',
        severity: 'warning'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const batch = writeBatch(db);
      const ordersRef = collection(db, 'orders');
      const now = Timestamp.now();
      
      // Create order data
      const orderData: Omit<Order, 'id'> = {
        ...initialOrderState,
        ...order,
        orderNumber: order.orderNumber || generateOrderNumber(),
        createdAt: order.createdAt || now,
        updatedAt: now,
        createdBy: 'currentUserId', // TODO: Replace with actual user ID from auth context
        updatedBy: 'currentUserId', // TODO: Replace with actual user ID from auth context
      };
      
      // Add order to batch
      const orderRef = doc(ordersRef);
      batch.set(orderRef, orderData);
      
      // Update stock for each product
      for (const item of orderData.items) {
        const productRef = doc(db, 'productos', item.productId);
        const productDoc = await getDoc(productRef);
        
        if (productDoc.exists()) {
          const currentStock = productDoc.data().stock || 0;
          const newStock = currentStock - item.quantity;
          
          if (newStock < 0) {
            throw new Error(`Stock insuficiente para el producto: ${item.name}`);
          }
          
          batch.update(productRef, { 
            stock: newStock,
            fechaActualizacion: now
          });
        }
      }
      
      // Commit all changes
      await batch.commit();
      
      // Generate PDF
      const pdfDoc = generateOrderPdf({
        ...orderData,
        id: orderRef.id
      });
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Pedido guardado exitosamente',
        severity: 'success'
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(orderRef.id);
      } else {
        // Default behavior: navigate to order details
        navigate(`/orders/${orderRef.id}`);
      }
      
      // Download PDF
      pdfDoc.save(`pedido-${orderData.orderNumber}.pdf`);
      
    } catch (error) {
      console.error('Error saving order:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Error al guardar el pedido',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/orders');
    }
  };

  // Handle snackbar close
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {showBackButton && (
            <Tooltip title="Volver">
              <IconButton onClick={handleCancel} sx={{ mr: 1 }}>
                <BackIcon />
              </IconButton>
            </Tooltip>
          )}
          <Typography variant="h4" component="h1">
            {initialOrder.id ? 'Editar Pedido' : 'Nuevo Pedido'}
          </Typography>
        </Box>
        
        {order.orderNumber && (
          <Typography variant="subtitle1" color="text.secondary">
            #{order.orderNumber}
          </Typography>
        )}
      </Box>
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Customer Information */}
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ mr: 1 }} />
                  Información del Cliente
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label="Nombre del Cliente"
                      value={order.customerName || ''}
                      onChange={(e) => updateOrder({ customerName: e.target.value })}
                      variant="outlined"
                      margin="normal"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="email"
                      label="Correo Electrónico"
                      value={order.customerEmail || ''}
                      onChange={(e) => updateOrder({ customerEmail: e.target.value })}
                      variant="outlined"
                      margin="normal"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      type="tel"
                      label="Teléfono"
                      value={order.customerPhone || ''}
                      onChange={(e) => updateOrder({ customerPhone: e.target.value })}
                      variant="outlined"
                      margin="normal"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Dirección de Envío"
                      value={order.customerAddress || ''}
                      onChange={(e) => updateOrder({ customerAddress: e.target.value })}
                      variant="outlined"
                      margin="normal"
                      multiline
                      rows={2}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start" sx={{ alignItems: 'flex-start', mt: 1 }}>
                            <HomeIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Notas del Cliente"
                      value={order.customerNotes || ''}
                      onChange={(e) => updateOrder({ customerNotes: e.target.value })}
                      variant="outlined"
                      margin="normal"
                      multiline
                      rows={2}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start" sx={{ alignItems: 'flex-start', mt: 1 }}>
                            <NotesIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                      placeholder="Notas adicionales del cliente"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            {/* Product Search and List */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Productos
                  </Typography>
                  <ProductSearch 
                    onSelectProduct={handleSelectProduct} 
                    disabled={loading}
                  />
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                <OrderItemsList
                  items={order.items || []}
                  onRemoveItem={handleRemoveItem}
                  onUpdateQuantity={handleUpdateQuantity}
                  showActions={true}
                />
              </CardContent>
            </Card>
          </Grid>
          
          {/* Order Summary */}
          <Grid item xs={12} md={4}>
            <OrderSummary
              order={order}
              onUpdateOrder={updateOrder}
              onSubmit={submitOrder}
              submitLabel={submitLabel}
              submitDisabled={loading || !order.items?.length}
              showSubmitButton={true}
            />
          </Grid>
        </Grid>
      </form>
      
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
      
      {/* Loading overlay */}
      {loading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1300
          }}
        >
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="subtitle1">Guardando pedido...</Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default NewOrderForm;
