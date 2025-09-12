import { format, parseISO, isBefore, addMonths, isAfter, isToday, isThisMonth, isThisYear } from 'date-fns';

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatDate = (date: Date | string, formatStr = 'MMM dd, yyyy'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
};

export const formatDateTime = (date: Date | string): string => {
  return formatDate(date, 'MMM dd, yyyy hh:mm a');
};

export const isOverdue = (dueDate: Date | string): boolean => {
  const today = new Date();
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  return isBefore(due, today) && !isToday(due);
};

export const calculateDueDate = (purchaseDate: Date | string, monthsDeferred: number): Date => {
  const date = typeof purchaseDate === 'string' ? new Date(purchaseDate) : purchaseDate;
  return addMonths(date, monthsDeferred);
};

export const getDaysUntilDue = (dueDate: Date | string): number => {
  const today = new Date();
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const filterByDateRange = <T extends { date: string | Date }>(
  items: T[], 
  startDate?: Date, 
  endDate?: Date
): T[] => {
  if (!startDate && !endDate) return items;
  
  return items.filter(item => {
    const itemDate = typeof item.date === 'string' ? new Date(item.date) : item.date;
    
    if (startDate && isBefore(itemDate, startDate)) return false;
    if (endDate && isAfter(itemDate, endDate)) return false;
    
    return true;
  });
};

export const groupByDate = <T extends { date: string | Date }>(
  items: T[], 
  groupBy: 'day' | 'month' | 'year' = 'day'
): Record<string, T[]> => {
  return items.reduce((acc, item) => {
    const date = typeof item.date === 'string' ? new Date(item.date) : item.date;
    let key: string;
    
    switch (groupBy) {
      case 'day':
        key = format(date, 'yyyy-MM-dd');
        break;
      case 'month':
        key = format(date, 'yyyy-MM');
        break;
      case 'year':
        key = format(date, 'yyyy');
        break;
      default:
        key = format(date, 'yyyy-MM-dd');
    }
    
    if (!acc[key]) {
      acc[key] = [];
    }
    
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>);
};

export const getRelativeDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(dateObj)) return 'Today';
  if (isThisMonth(dateObj)) return format(dateObj, 'MMM d');
  if (isThisYear(dateObj)) return format(dateObj, 'MMM d');
  
  return format(dateObj, 'MMM d, yyyy');
};

export const generateId = (prefix = 'item'): string => {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const debounce = <F extends (...args: any[]) => any>(
  func: F,
  wait: number
): ((...args: Parameters<F>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<F>): void {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
