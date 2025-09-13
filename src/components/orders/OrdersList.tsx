import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TablePagination, 
  TableSortLabel, 
  TextField, 
  InputAdornment, 
  IconButton, 
  Tooltip, 
  Chip, 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel, 
  Button,
  useTheme,
  alpha,
  CircularProgress
} from '@mui/material';
import { 
  Search as SearchIcon, 
  FilterList as FilterIcon, 
  Add as AddIcon,
  Refresh as RefreshIcon,
  PictureAsPdf as PdfIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { Order, OrderStatus, formatCurrency } from '../../../types/order';

type OrderBy = 'createdAt' | 'total' | 'customerName' | 'status';
type OrderDirection = 'asc' | 'desc';

interface OrdersListProps {
  statusFilter?: OrderStatus | 'all';
  showHeader?: boolean;
  limit?: number;
  showActions?: boolean;
  onOrderSelect?: (orderId: string) => void;
}

const statusColors = {
  pending: 'warning',
  processing: 'info',
  completed: 'success',
  shipped: 'primary',
  cancelled: 'error',
  refunded: 'default'
} as const;

const OrdersList: React.FC<OrdersListProps> = ({
  statusFilter = 'all',
  showHeader = true,
  limit = 10,
  showActions = true,
  onOrderSelect
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  // State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(limit);
  const [orderBy, setOrderBy] = useState<OrderBy>('createdAt');
  const [orderDirection, setOrderDirection] = useState<OrderDirection>('desc');
  const [statusFilterState, setStatusFilterState] = useState<OrderStatus | 'all'>(statusFilter);
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });
  
  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      let q = query(collection(db, 'orders'));
      
      // Apply filters
      const filters = [];
      
      if (statusFilterState !== 'all') {
        filters.push(where('status', '==', statusFilterState));
      }
      
      if (dateRange.start) {
        filters.push(where('createdAt', '>=', Timestamp.fromDate(dateRange.start)));
      }
      
      if (dateRange.end) {
        // Set end of day
        const endOfDay = new Date(dateRange.end);
        endOfDay.setHours(23, 59, 59, 999);
        filters.push(where('createdAt', '<=', Timestamp.fromDate(endOfDay)));
      }
      
      // Apply search term
      if (searchTerm) {
        // This is a simplified search - in a real app, you might want to use a more robust search solution
        // like Algolia or Elasticsearch for better performance
        q = query(q, where('customerName', '>=', searchTerm));
        q = query(q, where('customerName', '<=', searchTerm + '\uf8ff'));
      }
      
      // Apply sorting
      q = query(q, orderBy(orderBy, orderDirection));
      
      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      } as Order));
      
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Handle error (e.g., show error message)
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilterState, dateRange, orderBy, orderDirection]);
  
  // Initial fetch and when dependencies change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  
  // Handle sort
  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && orderDirection === 'asc';
    setOrderDirection(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  
  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle row click
  const handleRowClick = (orderId: string) => {
    if (onOrderSelect) {
      onOrderSelect(orderId);
    } else {
      navigate(`/orders/${orderId}`);
    }
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (event: any) => {
    setStatusFilterState(event.target.value);
    setPage(0);
  };
  
  // Handle date range change
  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(prev => ({
      ...prev,
      start: event.target.value ? new Date(event.target.value) : null
    }));
    setPage(0);
  };
  
  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(prev => ({
      ...prev,
      end: event.target.value ? new Date(event.target.value) : null
    }));
    setPage(0);
  };
  
  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilterState('all');
    setDateRange({ start: null, end: null });
    setPage(0);
  };
  
  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Pagination
  const paginatedOrders = orders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      {/* Header */}
      {showHeader && (
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            Pedidos
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/orders/new')}
          >
            Nuevo Pedido
          </Button>
        </Box>
      )}
      
      {/* Filters */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Buscar pedidos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={statusFilterState}
                onChange={handleStatusFilterChange}
                label="Estado"
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="pending">Pendiente</MenuItem>
                <MenuItem value="processing">En Proceso</MenuItem>
                <MenuItem value="shipped">Enviado</MenuItem>
                <MenuItem value="completed">Completado</MenuItem>
                <MenuItem value="cancelled">Cancelado</MenuItem>
                <MenuItem value="refunded">Reembolsado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              type="date"
              label="Desde"
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={dateRange.start ? dateRange.start.toISOString().split('T')[0] : ''}
              onChange={handleStartDateChange}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              type="date"
              label="Hasta"
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={dateRange.end ? dateRange.end.toISOString().split('T')[0] : ''}
              onChange={handleEndDateChange}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={resetFilters}
            >
              Limpiar Filtros
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Orders Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
          <Table stickyHeader aria-label="orders table" size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'orderNumber'}
                    direction={orderBy === 'orderNumber' ? orderDirection : 'desc'}
                    onClick={() => handleRequestSort('orderNumber')}
                  >
                    Número
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'customerName'}
                    direction={orderBy === 'customerName' ? orderDirection : 'asc'}
                    onClick={() => handleRequestSort('customerName')}
                  >
                    Cliente
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'total'}
                    direction={orderBy === 'total' ? orderDirection : 'desc'}
                    onClick={() => handleRequestSort('total')}
                  >
                    Total
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'status'}
                    direction={orderBy === 'status' ? orderDirection : 'asc'}
                    onClick={() => handleRequestSort('status')}
                  >
                    Estado
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'createdAt'}
                    direction={orderBy === 'createdAt' ? orderDirection : 'desc'}
                    onClick={() => handleRequestSort('createdAt')}
                  >
                    Fecha
                  </TableSortLabel>
                </TableCell>
                {showActions && <TableCell align="right">Acciones</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showActions ? 6 : 5} align="center" sx={{ py: 4 }}>
                    <Box display="flex" flexDirection="column" alignItems="center">
                      <FilterListIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                      <Typography color="text.secondary">
                        No se encontraron pedidos
                      </Typography>
                      <Button 
                        variant="text" 
                        color="primary"
                        onClick={resetFilters}
                        sx={{ mt: 1 }}
                      >
                        Limpiar filtros
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((order) => (
                  <TableRow 
                    hover 
                    key={order.id}
                    onClick={() => handleRowClick(order.id!)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.04)
                      },
                      '&.Mui-selected': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.08)
                      },
                      '&.Mui-selected:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.12)
                      }
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        #{order.orderNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{order.customerName}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {order.customerEmail || order.customerPhone}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(order.total)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        color={statusColors[order.status] as any}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          textTransform: 'capitalize',
                          minWidth: 100,
                          fontWeight: 500
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(order.createdAt)}
                      </Typography>
                    </TableCell>
                    {showActions && (
                      <TableCell align="right">
                        <Box display="flex" justifyContent="flex-end">
                          <Tooltip title="Ver detalles">
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowClick(order.id!);
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton 
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/orders/${order.id}/edit`);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Descargar PDF">
                            <IconButton 
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle PDF download
                              }}
                            >
                              <PdfIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={orders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
      </Paper>
      
      {/* Summary Stats */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              Total Pedidos
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {orders.length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              Ingresos Totales
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="primary">
              {formatCurrency(orders.reduce((sum, order) => sum + order.total, 0))}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              Pendientes
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="warning.main">
              {orders.filter(o => o.status === 'pending').length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              Completados
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {orders.filter(o => o.status === 'completed').length}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OrdersList;
