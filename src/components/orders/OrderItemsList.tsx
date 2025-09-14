import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
  Typography,
  TextField,
  Button,
  TableFooter,
  TablePagination,
  useTheme,
  TablePaginationProps,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { OrderItem } from '../../types/order';

export interface OrderItemsListProps {
  items: OrderItem[];
  onRemoveItem: (index: number) => void;
  onUpdateQuantity: (index: number, quantity: number) => void;
  onAddItem?: () => void;
  showActions?: boolean;
  page?: number;
  rowsPerPage?: number;
  onPageChange?: (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  paginationProps?: Partial<TablePaginationProps>;
}

const OrderItemsList: React.FC<OrderItemsListProps> = ({
  items,
  onRemoveItem,
  onUpdateQuantity,
  onAddItem,
  showActions = true,
  page = 0,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
  paginationProps
}) => {
  const theme = useTheme();
  const hasPagination = onPageChange && onRowsPerPageChange;
  const paginatedItems = hasPagination
    ? items.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : items;

  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity >= 1) {
      onUpdateQuantity(index, newQuantity);
    }
  };

  const handleIncrement = (index: number) => {
    onUpdateQuantity(index, items[index].quantity + 1);
  };

  const handleDecrement = (index: number) => {
    if (items[index].quantity > 1) {
      onUpdateQuantity(index, items[index].quantity - 1);
    }
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.16; // 16% IVA
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  return (
    <TableContainer 
      component={Paper} 
      sx={{ 
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        overflow: 'hidden'
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
            <TableCell>Producto</TableCell>
            <TableCell align="right">Precio</TableCell>
            <TableCell align="center">Cantidad</TableCell>
            <TableCell align="right">Total</TableCell>
            {showActions && <TableCell width={40}></TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showActions ? 5 : 4} align="center" sx={{ py: 4 }}>
                <Box display="flex" flexDirection="column" alignItems="center">
                  <InfoIcon color="action" sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                  <Typography color="textSecondary">
                    No hay productos en el pedido
                  </Typography>
                  {onAddItem && (
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={onAddItem}
                      sx={{ mt: 2 }}
                    >
                      Agregar producto
                    </Button>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            paginatedItems.map((item, index) => (
              <TableRow 
                key={`${item.productId}-${item.isWholesale ? 'w' : 'r'}`}
                hover
                sx={{
                  '&:last-child td, &:last-child th': { border: 0 },
                  '&:hover .quantity-actions': {
                    opacity: 1,
                    visibility: 'visible'
                  }
                }}
              >
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {item.name}
                    </Typography>
                    {item.isWholesale && (
                      <Chip 
                        label="Mayoreo" 
                        size="small" 
                        color="secondary" 
                        variant="outlined"
                        sx={{ mt: 0.5, height: 20, fontSize: '0.65rem' }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    ${item.price.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Box 
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      '&:hover .quantity-actions': {
                        opacity: 1,
                        visibility: 'visible'
                      }
                    }}
                  >
                    <Box 
                      className="quantity-actions"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        position: 'absolute',
                        left: 0,
                        opacity: 0,
                        visibility: 'hidden',
                        transition: 'opacity 0.2s, visibility 0.2s',
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: 1,
                        boxShadow: theme.shadows[1],
                        zIndex: 1
                      }}
                    >
                      <IconButton 
                        size="small" 
                        onClick={() => handleDecrement(index)}
                        disabled={item.quantity <= 1}
                        sx={{ p: 0.5 }}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <TextField
                        value={item.quantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value, 10);
                          if (!isNaN(value)) {
                            handleQuantityChange(index, value);
                          }
                        }}
                        type="number"
                        inputProps={{
                          min: 1,
                          style: { 
                            textAlign: 'center',
                            width: 40,
                            padding: '4px 0',
                            WebkitAppearance: 'none',
                            margin: 0,
                            MozAppearance: 'textfield'
                          }
                        }}
                        variant="standard"
                        sx={{
                          '& .MuiInputBase-root': {
                            '&:before, &:after': {
                              borderBottom: 'none !important'
                            },
                            '&:hover:not(.Mui-disabled):before': {
                              borderBottom: 'none !important'
                            }
                          },
                          '& .MuiInput-input': {
                            textAlign: 'center',
                            '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                              WebkitAppearance: 'none',
                              margin: 0
                            }
                          }
                        }}
                      />
                      <IconButton 
                        size="small" 
                        onClick={() => handleIncrement(index)}
                        sx={{ p: 0.5 }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" sx={{ minWidth: 24 }}>
                      {item.quantity}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="medium">
                    ${item.total.toFixed(2)}
                  </Typography>
                </TableCell>
                {showActions && (
                  <TableCell align="right">
                    <Tooltip title="Eliminar">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => onRemoveItem(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
        
        {items.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={showActions ? 3 : 4} align="right">
                <Typography variant="subtitle2">Subtotal:</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle2">
                  ${calculateSubtotal().toFixed(2)}
                </Typography>
              </TableCell>
              {showActions && <TableCell></TableCell>}
            </TableRow>
            <TableRow>
              <TableCell colSpan={showActions ? 3 : 4} align="right">
                <Typography variant="subtitle2">IVA (16%):</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle2">
                  ${calculateTax().toFixed(2)}
                </Typography>
              </TableCell>
              {showActions && <TableCell></TableCell>}
            </TableRow>
            <TableRow>
              <TableCell colSpan={showActions ? 3 : 4} align="right">
                <Typography variant="subtitle1" fontWeight="bold">
                  Total:
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle1" fontWeight="bold">
                  ${calculateTotal().toFixed(2)}
                </Typography>
              </TableCell>
              {showActions && <TableCell></TableCell>}
            </TableRow>
          </TableFooter>
        )}
      </Table>
      
      {hasPagination && items.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={items.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
          {...paginationProps}
        />
      )}
    </TableContainer>
  );
};

export default OrderItemsList;
