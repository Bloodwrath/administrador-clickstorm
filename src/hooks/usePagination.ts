import { useState, useMemo, useCallback } from 'react';

interface UsePaginationProps<T> {
  items: T[];
  initialPage?: number;
  pageSize?: number;
  initialSortConfig?: {
    key: keyof T;
    direction: 'asc' | 'desc';
  };
}

interface PaginationResult<T> {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  currentItems: T[];
  totalItems: number;
  sortConfig: { key: keyof T; direction: 'asc' | 'desc' } | null;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
  requestSort: (key: keyof T) => void;
  getSortIndicator: (key: keyof T) => '↑' | '↓' | '';
}

/**
 * A custom hook for handling pagination and sorting of data
 * @param items - The array of items to paginate
 * @param initialPage - The initial page number (1-based)
 * @param pageSize - The number of items per page
 * @param initialSortConfig - Optional initial sort configuration
 * @returns Pagination controls and state
 * 
 * @example
 * const {
 *   currentPage,
 *   totalPages,
 *   currentItems,
 *   nextPage,
 *   prevPage,
 *   requestSort,
 *   getSortIndicator
 * } = usePagination({
 *   items: products,
 *   initialPage: 1,
 *   pageSize: 10,
 *   initialSortConfig: { key: 'name', direction: 'asc' }
 * });
 */
const usePagination = <T>({
  items,
  initialPage = 1,
  pageSize: initialPageSize = 10,
  initialSortConfig,
}: UsePaginationProps<T>): PaginationResult<T> => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T;
    direction: 'asc' | 'desc';
  } | null>(initialSortConfig || null);

  // Calculate total pages
  const totalPages = Math.ceil(items.length / pageSize);

  // Handle page changes
  const goToPage = useCallback(
    (page: number) => {
      const pageNumber = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(pageNumber);
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  // Handle sorting
  const requestSort = useCallback(
    (key: keyof T) => {
      let direction: 'asc' | 'desc' = 'asc';
      
      if (sortConfig && sortConfig.key === key) {
        direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
      }
      
      setSortConfig({ key, direction });
      setCurrentPage(1); // Reset to first page when sorting changes
    },
    [sortConfig]
  );

  // Get sort indicator for a column
  const getSortIndicator = useCallback(
    (key: keyof T) => {
      if (!sortConfig || sortConfig.key !== key) return '';
      return sortConfig.direction === 'asc' ? '↑' : '↓';
    },
    [sortConfig]
  );

  // Apply sorting and pagination
  const currentItems = useMemo(() => {
    // Create a copy of items to avoid mutating the original array
    let sortedItems = [...items];

    // Apply sorting if sortConfig exists
    if (sortConfig) {
      const { key, direction } = sortConfig;
      
      sortedItems.sort((a, b) => {
        const aValue = a[key];
        const bValue = b[key];
        
        // Handle different types of values
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return direction === 'asc' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        }
        
        if (aValue === bValue) return 0;
        return direction === 'asc' 
          ? aValue < bValue ? -1 : 1 
          : aValue > bValue ? -1 : 1;
      });
    }

    // Apply pagination
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return sortedItems.slice(startIndex, endIndex);
  }, [items, currentPage, pageSize, sortConfig]);

  return {
    currentPage,
    totalPages,
    pageSize,
    currentItems,
    totalItems: items.length,
    sortConfig,
    goToPage,
    nextPage,
    prevPage,
    setPageSize: (size: number) => {
      setPageSize(size);
      setCurrentPage(1); // Reset to first page when page size changes
    },
    requestSort,
    getSortIndicator,
  };
};

export default usePagination;
