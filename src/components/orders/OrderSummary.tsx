import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  TextField, 
  MenuItem, 
  Grid,
  Button,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  LocalAtm as CashIcon, 
  CreditCard as CardIcon, 
  AccountBalance as BankIcon, 
  Receipt as ReceiptIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { Order, PaymentMethod, PaymentStatus } from '../../types/order';

export interface OrderSummaryProps {
  order: Partial<Order>;
  onUpdateOrder: (updates: Partial<Order>) => void;
  onSubmit?: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  showSubmitButton?: boolean;
  showPaymentStatus?: boolean;
  showNotes?: boolean;
}

const paymentMethods = [
  { value: 'efectivo', label: 'Efectivo', icon: <CashIcon fontSize="small" /> },
  { value: 'tarjeta', label: 'Tarjeta', icon: <CardIcon fontSize="small" /> },
  { value: 'transferencia', label: 'Transferencia', icon: <BankIcon fontSize="small" /> },
  { value: 'otro', label: 'Otro', icon: <ReceiptIcon fontSize="small" /> },
];

const paymentStatuses = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'partial', label: 'Parcial' },
  { value: 'paid', label: 'Pagado' },
  { value: 'refunded', label: 'Reembolsado' },
];

const OrderSummary: React.FC<OrderSummaryProps> = ({
  order,
  onUpdateOrder,
  onSubmit,
  submitLabel = 'Guardar Pedido',
  submitDisabled = false,
  showSubmitButton = true,
  showPaymentStatus = true,
  showNotes = true,
}) => {
  const {
    subtotal = 0,
    tax = 0,
    discount = 0,
    shipping = 0,
    total = 0,
    paymentMethod = 'efectivo',
    paymentStatus = 'pending',
    notes = ''
  } = order;

  const handleFieldChange = (field: keyof Order) => (event: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateOrder({ [field]: event.target.value });
  };

  const handleNumericFieldChange = (field: keyof Order) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value) || 0;
    onUpdateOrder({ [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit();
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
      <form onSubmit={handleSubmit}>
        <Box mb={3}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            Resumen del Pedido
            <Tooltip title="Los totales se calculan automáticamente">
              <InfoIcon fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} />
            </Tooltip>
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
              <Typography variant="body2">${subtotal.toFixed(2)}</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Descuento:
                </Typography>
                <Tooltip title="Descuento aplicado al pedido">
                  <InfoIcon fontSize="small" sx={{ ml: 0.5, color: 'text.secondary' }} />
                </Tooltip>
              </Box>
              <TextField
                value={discount}
                onChange={handleNumericFieldChange('discount')}
                type="number"
                size="small"
                variant="standard"
                inputProps={{
                  min: 0,
                  step: 0.01,
                  style: { textAlign: 'right', width: 80 }
                }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                sx={{ '& .MuiInputBase-input': { py: 0.5 } }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Envío:
                </Typography>
                <Tooltip title="Costo de envío">
                  <InfoIcon fontSize="small" sx={{ ml: 0.5, color: 'text.secondary' }} />
                </Tooltip>
              </Box>
              <TextField
                value={shipping}
                onChange={handleNumericFieldChange('shipping')}
                type="number"
                size="small"
                variant="standard"
                inputProps={{
                  min: 0,
                  step: 0.01,
                  style: { textAlign: 'right', width: 80 }
                }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                sx={{ '& .MuiInputBase-input': { py: 0.5 } }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                IVA (16%):
              </Typography>
              <Typography variant="body2">${tax.toFixed(2)}</Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Total:
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold">
                ${total.toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            Método de Pago
          </Typography>
          <Grid container spacing={2}>
            {paymentMethods.map((method) => (
              <Grid item xs={6} sm={3} key={method.value}>
                <Button
                  fullWidth
                  variant={paymentMethod === method.value ? 'contained' : 'outlined'}
                  color={paymentMethod === method.value ? 'primary' : 'inherit'}
                  startIcon={method.icon}
                  onClick={() => onUpdateOrder({ paymentMethod: method.value as PaymentMethod })}
                  sx={{
                    py: 1.5,
                    textTransform: 'none',
                    justifyContent: 'flex-start',
                    '& .MuiButton-startIcon': {
                      mr: 1,
                    },
                  }}
                >
                  {method.label}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>

        {showPaymentStatus && (
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom>
              Estado del Pago
            </Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={paymentStatus}
              onChange={handleFieldChange('paymentStatus')}
              variant="outlined"
            >
              {paymentStatuses.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        )}

        {showNotes && (
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom>
              Notas del Pedido
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              placeholder="Agregar notas sobre el pedido..."
              value={notes}
              onChange={handleFieldChange('notes')}
            />
          </Box>
        )}

        {showSubmitButton && (
          <Button
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            type="submit"
            disabled={submitDisabled}
          >
            {submitLabel}
          </Button>
        )}
      </form>
    </Paper>
  );
};

export default OrderSummary;
