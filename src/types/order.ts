import { Timestamp } from 'firebase/firestore';

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'shipped' | 'cancelled' | 'refunded';

export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';

export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded';

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  stock: number;
  isWholesale: boolean;
}

export interface Order {
  id?: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  customerNotes?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  notes?: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  createdBy?: string;
  updatedBy?: string;
}

export interface OrderFormData extends Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'> {}

export const initialOrderState: OrderFormData = {
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  customerAddress: '',
  customerNotes: '',
  items: [],
  subtotal: 0,
  discount: 0,
  tax: 0,
  shipping: 0,
  total: 0,
  paymentMethod: 'efectivo',
  paymentStatus: 'pending',
  status: 'pending',
  notes: ''
};

export const calculateOrderTotals = (items: OrderItem[], discount = 0, shipping = 0) => {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.16; // 16% IVA
  const total = subtotal + tax + shipping - discount;
  
  return { subtotal, tax, total };
};

export const generateOrderNumber = (): string => {
  const now = new Date();
  const dateStr = format(now, 'yyyyMMdd');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${dateStr}-${randomNum}`;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(amount);
};
