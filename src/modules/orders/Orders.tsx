import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, Button, Container, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, InputAdornment } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, PictureAsPdf as PdfIcon } from '@mui/icons-material';
import { collection, addDoc, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

declare global {
  interface Window {
    jsPDF: typeof jsPDF;
  }
}

// Types
type OrderItem = {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
};

type Order = {
  id?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
};

// Components
const OrderList = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'orders'));
        const ordersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        } as Order));
        setOrders(ordersData);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Lista de Pedidos</Typography>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.id?.substring(0, 8)}...</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>${order.total.toFixed(2)}</TableCell>
                <TableCell>
                  <Typography color={
                    order.status === 'completed' ? 'success.main' : 
                    order.status === 'cancelled' ? 'error.main' : 'warning.main'
                  }>
                    {order.status}
                  </Typography>
                </TableCell>
                <TableCell>{order.createdAt?.toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => navigate(`/orders/${order.id}`)}>Ver</Button>
                  <IconButton onClick={() => generatePdf(order)}>
                    <PdfIcon color="error" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const NewOrder = () => {
  const [order, setOrder] = useState<Omit<Order, 'id' | 'createdAt' | 'updatedAt'>>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    status: 'pending'
  });
  
  const [currentProduct, setCurrentProduct] = useState<Omit<OrderItem, 'total'>>({
    productId: '',
    name: '',
    quantity: 1,
    price: 0
  });

  const navigate = useNavigate();

  const addItem = () => {
    if (!currentProduct.name || currentProduct.quantity <= 0 || currentProduct.price < 0) return;
    
    const newItem = {
      ...currentProduct,
      total: currentProduct.quantity * currentProduct.price
    };

    const newItems = [...order.items, newItem];
    const subtotal = newItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.16; // 16% IVA
    
    setOrder({
      ...order,
      items: newItems,
      subtotal,
      tax,
      total: subtotal + tax
    });

    // Reset current product
    setCurrentProduct({
      productId: '',
      name: '',
      quantity: 1,
      price: 0
    });
  };

  const removeItem = (index: number) => {
    const newItems = [...order.items];
    newItems.splice(index, 1);
    const subtotal = newItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.16;
    
    setOrder({
      ...order,
      items: newItems,
      subtotal,
      tax,
      total: subtotal + tax
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (order.items.length === 0) {
      alert('Agrega al menos un producto al pedido');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        ...order,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      // Generate and download PDF
      const pdfDoc = generatePdf({ ...order, id: docRef.id });
      
      // Redirect to order list
      navigate('/orders');
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error al crear el pedido');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h4" gutterBottom>Nuevo Pedido</Typography>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>Datos del Cliente</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
          <TextField
            required
            label="Nombre del Cliente"
            value={order.customerName}
            onChange={(e) => setOrder({...order, customerName: e.target.value})}
          />
          <TextField
            required
            type="email"
            label="Correo Electrónico"
            value={order.customerEmail}
            onChange={(e) => setOrder({...order, customerEmail: e.target.value})}
          />
          <TextField
            required
            label="Teléfono"
            value={order.customerPhone}
            onChange={(e) => setOrder({...order, customerPhone: e.target.value})}
          />
        </Box>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>Productos</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 2, mb: 2, alignItems: 'flex-end' }}>
          <TextField
            label="Producto"
            value={currentProduct.name}
            onChange={(e) => setCurrentProduct({...currentProduct, name: e.target.value})}
          />
          <TextField
            type="number"
            label="Cantidad"
            value={currentProduct.quantity}
            onChange={(e) => setCurrentProduct({...currentProduct, quantity: parseInt(e.target.value) || 0})}
            inputProps={{ min: 1 }}
          />
          <TextField
            type="number"
            label="Precio"
            value={currentProduct.price}
            onChange={(e) => setCurrentProduct({...currentProduct, price: parseFloat(e.target.value) || 0})}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
          />
          <Button variant="contained" onClick={addItem}>
            Agregar
          </Button>
        </Box>

        {order.items.length > 0 && (
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell align="right">Cantidad</TableCell>
                  <TableCell align="right">Precio Unitario</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {order.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell align="right">${item.price.toFixed(2)}</TableCell>
                    <TableCell align="right">${item.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => removeItem(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h6">Resumen del Pedido</Typography>
          <Typography>Subtotal: ${order.subtotal.toFixed(2)}</Typography>
          <Typography>IVA (16%): ${order.tax.toFixed(2)}</Typography>
          <Typography variant="h6">Total: ${order.total.toFixed(2)}</Typography>
        </Box>
        <Button type="submit" variant="contained" color="primary" size="large">
          Guardar Pedido
        </Button>
      </Box>
    </Box>
  );
};

const OrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      
      try {
        const docRef = doc(db, 'orders', orderId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setOrder({
            id: docSnap.id,
            ...docSnap.data(),
            createdAt: docSnap.data().createdAt?.toDate(),
            updatedAt: docSnap.data().updatedAt?.toDate()
          } as Order);
        } else {
          console.log('No such order!');
          navigate('/orders');
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        navigate('/orders');
      }
    };

    fetchOrder();
  }, [orderId, navigate]);

  if (!order) return <div>Cargando...</div>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Detalle del Pedido #{order.id?.substring(0, 8)}</Typography>
        <Button 
          variant="contained" 
          startIcon={<PdfIcon />}
          onClick={() => order && generatePdf(order)}
        >
          Descargar PDF
        </Button>
      </Box>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6">Información del Cliente</Typography>
        <Typography>Nombre: {order.customerName}</Typography>
        <Typography>Correo: {order.customerEmail}</Typography>
        <Typography>Teléfono: {order.customerPhone}</Typography>
        <Typography>Estado: {order.status}</Typography>
        <Typography>Fecha: {order.createdAt?.toLocaleString()}</Typography>
      </Box>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Producto</TableCell>
              <TableCell align="right">Cantidad</TableCell>
              <TableCell align="right">Precio Unitario</TableCell>
              <TableCell align="right">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {order.items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.name}</TableCell>
                <TableCell align="right">{item.quantity}</TableCell>
                <TableCell align="right">${item.price.toFixed(2)}</TableCell>
                <TableCell align="right">${item.total.toFixed(2)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3} align="right">Subtotal:</TableCell>
              <TableCell align="right">${order.subtotal.toFixed(2)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={3} align="right">IVA (16%):</TableCell>
              <TableCell align="right">${order.tax.toFixed(2)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={3} align="right"><strong>Total:</strong></TableCell>
              <TableCell align="right"><strong>${order.total.toFixed(2)}</strong></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const SalesReports = () => (
  <Box>
    <Typography variant="h4" gutterBottom>Reportes de Ventas</Typography>
    <Typography>Aquí se mostrarán los reportes y analítica de ventas.</Typography>
  </Box>
);

// Helper function to generate PDF
const generatePdf = (order: Order) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text('Comprobante de Pedido', 14, 22);
  doc.setFontSize(12);
  
  // Add order info
  doc.text(`Orden #${order.id?.substring(0, 8)}`, 14, 32);
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 40);
  doc.text(`Cliente: ${order.customerName}`, 14, 48);
  doc.text(`Correo: ${order.customerEmail}`, 14, 56);
  doc.text(`Teléfono: ${order.customerPhone}`, 14, 64);
  
  // Add table
  const headers = [['Producto', 'Cantidad', 'Precio', 'Total']];
  const data = order.items.map(item => [
    item.name,
    item.quantity.toString(),
    `$${item.price.toFixed(2)}`,
    `$${(item.quantity * item.price).toFixed(2)}`
  ]);
  
  // @ts-ignore - jsPDF types don't include autoTable
  doc.autoTable({
    startY: 80,
    head: headers,
    body: data,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 30, halign: 'right' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' }
    }
  });
  
  // Add totals
  // @ts-ignore - jsPDF types don't include lastAutoTable
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.text(`Subtotal: $${order.subtotal.toFixed(2)}`, 14, finalY);
  doc.text(`IVA (16%): $${order.tax.toFixed(2)}`, 14, finalY + 8);
  doc.setFontSize(14);
  doc.text(`Total: $${order.total.toFixed(2)}`, 14, finalY + 20);
  
  // Save the PDF
  doc.save(`pedido-${order.id?.substring(0, 8)}.pdf`);
  
  return doc;
};

const Orders: React.FC = () => {
  const navigate = useNavigate();
  
  // Initialize PDF libraries
  useEffect(() => {
    const initializePDF = async () => {
      try {
        if (!window.jsPDF) {
          const { jsPDF } = await import('jspdf');
          await import('jspdf-autotable');
          window.jsPDF = jsPDF;
        }
      } catch (error) {
        console.error('Error initializing PDF libraries:', error);
      }
    };

    initializePDF();
  }, []);

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
