import { useState, useCallback } from 'react';
import { Order, OrderItem, initialOrderState } from '../types/order';
import { Product } from '../types/product';

export const useOrderForm = (initialOrder = initialOrderState) => {
  const [order, setOrder] = useState(initialOrder);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isWholesale, setIsWholesale] = useState(false);

  // Update order field
  const updateField = useCallback((field: string, value: any) => {
    setOrder(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Add or update item in order
  const addOrUpdateItem = useCallback((product: Product, quantity: number, isWholesale: boolean) => {
    const price = isWholesale ? product.precioMayoreo : product.precioMenudeo;
    const total = quantity * price;
    
    const newItem: OrderItem = {
      productId: product.id,
      name: product.nombre,
      quantity,
      price,
      total,
      stock: product.stock,
      isWholesale
    };

    setOrder(prev => {
      // Check if product already exists in order with same wholesale status
      const existingItemIndex = prev.items.findIndex(
        item => item.productId === product.id && item.isWholesale === isWholesale
      );

      let newItems;
      if (existingItemIndex >= 0) {
        // Update existing item
        newItems = [...prev.items];
        const existingItem = newItems[existingItemIndex];
        newItems[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + quantity,
          total: existingItem.total + total
        };
      } else {
        // Add new item
        newItems = [...prev.items, newItem];
      }

      // Calculate new totals
      const subtotal = newItems.reduce((sum, item) => sum + item.total, 0);
      const tax = subtotal * 0.16; // 16% IVA
      
      return {
        ...prev,
        items: newItems,
        subtotal,
        tax,
        total: subtotal + tax + prev.shipping - prev.discount
      };
    });
  }, []);

  // Remove item from order
  const removeItem = useCallback((index: number) => {
    setOrder(prev => {
      const newItems = [...prev.items];
      newItems.splice(index, 1);
      
      const subtotal = newItems.reduce((sum, item) => sum + item.total, 0);
      const tax = subtotal * 0.16; // 16% IVA
      
      return {
        ...prev,
        items: newItems,
        subtotal,
        tax,
        total: subtotal + tax + prev.shipping - prev.discount
      };
    });
  }, []);

  // Update item quantity
  const updateItemQuantity = useCallback((index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setOrder(prev => {
      const newItems = [...prev.items];
      const item = { ...newItems[index] };
      
      // Check stock if available
      if (item.stock > 0 && newQuantity > item.stock) {
        // Handle stock validation in the UI component
        return prev;
      }
      
      item.quantity = newQuantity;
      item.total = item.price * newQuantity;
      newItems[index] = item;
      
      const subtotal = newItems.reduce((sum, item) => sum + item.total, 0);
      const tax = subtotal * 0.16; // 16% IVA
      
      return {
        ...prev,
        items: newItems,
        subtotal,
        tax,
        total: subtotal + tax + prev.shipping - prev.discount
      };
    });
  }, []);

  // Update shipping cost
  const updateShipping = useCallback((shipping: number) => {
    setOrder(prev => ({
      ...prev,
      shipping,
      total: prev.subtotal + prev.tax + shipping - prev.discount
    }));
  }, []);

  // Update discount
  const updateDiscount = useCallback((discount: number) => {
    setOrder(prev => ({
      ...prev,
      discount,
      total: prev.subtotal + prev.tax + prev.shipping - discount
    }));
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setOrder(initialOrderState);
    setSelectedProduct(null);
    setQuantity(1);
    setIsWholesale(false);
  }, []);

  return {
    order,
    selectedProduct,
    quantity,
    isWholesale,
    setSelectedProduct,
    setQuantity,
    setIsWholesale,
    updateField,
    addOrUpdateItem,
    removeItem,
    updateItemQuantity,
    updateShipping,
    updateDiscount,
    resetForm
  };
};
