import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container } from '@mui/material';

// Components
import OrderList from '../../components/orders/OrdersList';
import NewOrderForm from '../../components/orders/NewOrderForm';
import OrderDetailsView from '../../components/orders/OrderDetailsView';
import SalesReports from '../../components/orders/SalesReports';

// Types
export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded';

// Export types for use in other components
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'shipped' | 'cancelled' | 'refunded';

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  stock?: number;
  isWholesale?: boolean;
  category?: string;
}

export interface Order {
  id?: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  customerNotes?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  notes?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date | any;
  updatedAt: Date | any;
}

// Default order values
export const defaultOrder: Omit<Order, 'orderNumber'> = {
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  items: [],
  subtotal: 0,
  discount: 0,
  shipping: 0,
  tax: 0,
  total: 0,
  status: 'pending',
  paymentStatus: 'pending',
  createdAt: new Date(),
  updatedAt: new Date()
};

// Helper function to generate order number
export const generateOrderNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${year}${month}${day}-${random}`;
};

/**
 * Format a number as Mexican Peso currency
 * @param value - The number to format
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(value);
};

const Orders: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <Routes>
        <Route index element={<OrderList />} />
        <Route path="new" element={<NewOrderForm />} />
        <Route path=":orderId" element={<OrderDetailsView />} />
        <Route path=":orderId/edit" element={<NewOrderForm />} />
        <Route path="reports" element={<SalesReports />} />
        <Route path="*" element={<Navigate to="/orders" replace />} />
      </Routes>
    </Container>
  );
};

export default Orders;
