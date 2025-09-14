import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order } from '../types/order';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const generateOrderPdf = (order: Order) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  const lineHeight = 7;
  let yPos = 20;

  // Add company header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Mi Empresa', pageWidth / 2, yPos, { align: 'center' });
  yPos += lineHeight;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Dirección de la empresa, Ciudad, Estado', pageWidth / 2, yPos, { align: 'center' });
  yPos += lineHeight;
  doc.text('Teléfono: (123) 456-7890 | Email: contacto@miempresa.com', pageWidth / 2, yPos, { align: 'center' });
  yPos += lineHeight * 2;

  // Add order title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Orden #${order.orderNumber}`, margin, yPos);
  yPos += lineHeight;

  // Add order details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${new Date(order.createdAt instanceof Date ? order.createdAt : order.createdAt.toDate()).toLocaleDateString('es-MX')}`, margin, yPos);
  yPos += lineHeight;
  doc.text(`Estado: ${getStatusText(order.status)}`, margin, yPos);
  yPos += lineHeight * 2;

  // Add customer information
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', margin, yPos);
  yPos += lineHeight;
  
  doc.setFont('helvetica', 'normal');
  doc.text(order.customerName, margin, yPos);
  yPos += lineHeight;
  doc.text(`Teléfono: ${order.customerPhone}`, margin, yPos);
  yPos += lineHeight;
  if (order.customerEmail) {
    doc.text(`Email: ${order.customerEmail}`, margin, yPos);
    yPos += lineHeight;
  }
  if (order.customerAddress) {
    doc.text(`Dirección: ${order.customerAddress}`, margin, yPos);
    yPos += lineHeight;
  }
  yPos += lineHeight;

  // Add order items table
  const headers = [['Producto', 'Cantidad', 'Precio', 'Total']];
  const data = order.items.map(item => [
    item.name,
    item.quantity.toString(),
    formatCurrency(item.price),
    formatCurrency(item.total)
  ]);

  autoTable(doc, {
    startY: yPos,
    head: headers,
    body: data,
    margin: { left: margin, right: margin },
    headStyles: { 
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold'
    },
    didDrawPage: (data: any) => {
      yPos = data.cursor.y + 10;
    }
  });

  // Add totals
  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Subtotal:', pageWidth - margin - 40, yPos);
  doc.text(formatCurrency(order.subtotal), pageWidth - margin, yPos, { align: 'right' });
  yPos += lineHeight;
  
  doc.text('Envío:', pageWidth - margin - 40, yPos);
  doc.text(formatCurrency(order.shipping), pageWidth - margin, yPos, { align: 'right' });
  yPos += lineHeight;
  
  doc.text('Descuento:', pageWidth - margin - 40, yPos);
  doc.text(`-${formatCurrency(order.discount)}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += lineHeight;
  
  doc.text('IVA (16%):', pageWidth - margin - 40, yPos);
  doc.text(formatCurrency(order.tax), pageWidth - margin, yPos, { align: 'right' });
  yPos += lineHeight;
  
  doc.setFontSize(12);
  doc.text('TOTAL:', pageWidth - margin - 40, yPos);
  doc.text(formatCurrency(order.total), pageWidth - margin, yPos, { align: 'right' });
  yPos += lineHeight * 2;

  // Add payment information
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Método de pago:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(getPaymentMethodText(order.paymentMethod), margin + 40, yPos);
  yPos += lineHeight;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Estado del pago:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(getPaymentStatusText(order.paymentStatus), margin + 40, yPos);
  yPos += lineHeight * 2;

  // Add notes if available
  if (order.notes) {
    doc.setFont('helvetica', 'bold');
    doc.text('Notas:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(order.notes, pageWidth - margin * 2);
    doc.text(splitNotes, margin, yPos + lineHeight);
    yPos += lineHeight * (splitNotes.length + 1);
  }

  // Add footer
  doc.setFontSize(8);
  doc.text('Gracias por su compra!', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

  return doc;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(amount);
};

const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'Pendiente',
    'processing': 'En proceso',
    'completed': 'Completado',
    'shipped': 'Enviado',
    'cancelled': 'Cancelado',
    'refunded': 'Reembolsado'
  };
  return statusMap[status] || status;
};

const getPaymentMethodText = (method: string): string => {
  const methodMap: Record<string, string> = {
    'efectivo': 'Efectivo',
    'tarjeta': 'Tarjeta de crédito/débito',
    'transferencia': 'Transferencia bancaria',
    'otro': 'Otro método'
  };
  return methodMap[method] || method;
};

const getPaymentStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'Pendiente',
    'partial': 'Pago parcial',
    'paid': 'Pagado',
    'refunded': 'Reembolsado'
  };
  return statusMap[status] || status;
};
