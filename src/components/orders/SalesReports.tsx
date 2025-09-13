import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  SelectChangeEvent, 
  Button, 
  TextField, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import { 
  DateRange as DateRangeIcon, 
  Refresh as RefreshIcon, 
  FileDownload as ExportIcon,
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  PieChart as PieChartIcon,
  TableChart as TableViewIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { db } from '../../services/firebase';
import { formatCurrency } from '../../types/order';

type ChartType = 'bar' | 'line' | 'pie' | 'table';
type GroupByOption = 'day' | 'week' | 'month' | 'year' | 'category' | 'product';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const DATE_RANGES = [
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: 'thisWeek', label: 'Esta Semana' },
  { value: 'lastWeek', label: 'Semana Pasada' },
  { value: 'thisMonth', label: 'Este Mes' },
  { value: 'lastMonth', label: 'Mes Pasado' },
  { value: 'thisYear', label: 'Este Año' },
  { value: 'custom', label: 'Personalizado' },
];

interface SalesReportData {
  date: string;
  totalSales: number;
  orderCount: number;
  averageOrderValue: number;
}

const SalesReports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date(),
  });
  const [dateRangePreset, setDateRangePreset] = useState('thisMonth');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [groupBy, setGroupBy] = useState<GroupByOption>('day');
  const [reportData, setReportData] = useState<SalesReportData[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState(0);
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
  });

  // Fetch and process data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Determine date range based on preset
        let startDate = new Date();
        let endDate = new Date();
        
        switch (dateRangePreset) {
          case 'today':
            startDate = startOfDay(new Date());
            endDate = endOfDay(new Date());
            break;
          case 'yesterday':
            const yesterday = subDays(new Date(), 1);
            startDate = startOfDay(yesterday);
            endDate = endOfDay(yesterday);
            break;
          case 'thisWeek':
            startDate = startOfDay(subDays(new Date(), 7));
            endDate = endOfDay(new Date());
            break;
          case 'thisMonth':
            startDate = startOfMonth(new Date());
            endDate = endOfDay(new Date());
            break;
          case 'custom':
            startDate = dateRange.start;
            endDate = dateRange.end;
            break;
          default:
            startDate = startOfMonth(new Date());
            endDate = endOfDay(new Date());
        }

        // Query orders
        const ordersRef = collection(db, 'orders');
        const q = query(
          ordersRef,
          where('createdAt', '>=', Timestamp.fromDate(startDate)),
          where('createdAt', '<=', Timestamp.fromDate(endDate)),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const ordersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          total: doc.data().total || 0,
          items: doc.data().items || []
        }));

        // Process data for charts
        processReportData(ordersData, startDate, endDate);
      } catch (error) {
        console.error('Error fetching sales data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRangePreset, dateRange, groupBy]);

  // Process data for charts and tables
  const processReportData = (orders: any[], startDate: Date, endDate: Date) => {
    // Group orders by selected time period
    const groupedData: Record<string, any> = {};
    let totalSales = 0;
    const totalOrders = orders.length;
    
    // Initialize date groups
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      let dateKey = '';
      
      switch (groupBy) {
        case 'day':
          dateKey = format(currentDate, 'yyyy-MM-dd');
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'week':
          dateKey = `Semana ${format(currentDate, 'w, yyyy')}`;
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'month':
          dateKey = format(currentDate, 'MMM yyyy', { locale: es });
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'year':
          dateKey = format(currentDate, 'yyyy');
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
        default:
          dateKey = format(currentDate, 'yyyy-MM-dd');
          currentDate.setDate(currentDate.getDate() + 1);
      }
      
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          date: dateKey,
          totalSales: 0,
          orderCount: 0,
          averageOrderValue: 0
        };
      }
    }
    
    // Process orders
    orders.forEach(order => {
      totalSales += order.total || 0;
      
      let dateKey = '';
      const orderDate = order.createdAt.toDate();
      
      switch (groupBy) {
        case 'day':
          dateKey = format(orderDate, 'yyyy-MM-dd');
          break;
        case 'week':
          dateKey = `Semana ${format(orderDate, 'w, yyyy')}`;
          break;
        case 'month':
          dateKey = format(orderDate, 'MMM yyyy', { locale: es });
          break;
        case 'year':
          dateKey = format(orderDate, 'yyyy');
          break;
        default:
          dateKey = format(orderDate, 'yyyy-MM-dd');
      }
      
      if (groupedData[dateKey]) {
        groupedData[dateKey].totalSales += order.total || 0;
        groupedData[dateKey].orderCount += 1;
      }
    });
    
    // Calculate averages
    Object.keys(groupedData).forEach(key => {
      if (groupedData[key].orderCount > 0) {
        groupedData[key].averageOrderValue = groupedData[key].totalSales / groupedData[key].orderCount;
      }
    });
    
    // Convert to array and sort
    const reportDataArray = Object.values(groupedData).sort((a: any, b: any) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    
    setReportData(reportDataArray);
    setSummary({
      totalSales,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0
    });
  };

  // Handle UI changes
  const handleDateRangePresetChange = (event: SelectChangeEvent) => {
    setDateRangePreset(event.target.value);
  };
  
  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      setDateRange(prev => ({
        ...prev,
        start: date
      }));
      setDateRangePreset('custom');
    }
  };
  
  const handleEndDateChange = (date: Date | null) => {
    if (date) {
      setDateRange(prev => ({
        ...prev,
        end: date
      }));
      setDateRangePreset('custom');
    }
  };
  
  const handleChartTypeChange = (event: React.SyntheticEvent, newValue: number) => {
    const chartTypes: ChartType[] = ['bar', 'line', 'pie', 'table'];
    setChartType(chartTypes[newValue]);
    setActiveTab(newValue);
  };
  
  const handleGroupByChange = (event: SelectChangeEvent) => {
    setGroupBy(event.target.value as GroupByOption);
  };
  
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Render chart based on selected type
  const renderChart = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height={400}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (reportData.length === 0) {
      return (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="textSecondary">
            No hay datos disponibles para el rango de fechas seleccionado
          </Typography>
        </Box>
      );
    }
    
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={reportData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                angle={-45} 
                textAnchor="end"
                height={70}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <RechartsTooltip 
                formatter={(value: number) => [formatCurrency(value), 'Ventas']}
              />
              <Legend />
              <Bar dataKey="totalSales" name="Ventas" fill="#8884d8">
                {reportData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={reportData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                angle={-45} 
                textAnchor="end"
                height={70}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <RechartsTooltip 
                formatter={(value: number) => [formatCurrency(value), 'Ventas']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="totalSales" 
                name="Ventas" 
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
        
      case 'pie':
        return (
          <Box display="flex" justifyContent="center" height={400} pt={4}>
            <PieChart width={500} height={400}>
              <Pie
                data={reportData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={150}
                fill="#8884d8"
                dataKey="totalSales"
                nameKey="date"
                label={({ name, percent }) => 
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {reportData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip 
                formatter={(value: number) => [formatCurrency(value), 'Ventas']}
              />
              <Legend />
            </PieChart>
          </Box>
        );
        
      case 'table':
      default:
        return (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell align="right">Ventas Totales</TableCell>
                  <TableCell align="right">Pedidos</TableCell>
                  <TableCell align="right">Ticket Promedio</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell align="right">{formatCurrency(row.totalSales)}</TableCell>
                      <TableCell align="right">{row.orderCount}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(row.averageOrderValue)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={reportData.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        );
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Reportes de Ventas
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={() => window.location.reload()}
          disabled={loading}
        >
          Actualizar
        </Button>
      </Box>
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Rango de Fechas</InputLabel>
              <Select
                value={dateRangePreset}
                onChange={handleDateRangePresetChange}
                label="Rango de Fechas"
              >
                {DATE_RANGES.map((range) => (
                  <MenuItem key={range.value} value={range.value}>
                    {range.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                label="Fecha de Inicio"
                value={dateRange.start}
                onChange={handleStartDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small'
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                label="Fecha de Fin"
                value={dateRange.end}
                onChange={handleEndDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small'
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Agrupar por</InputLabel>
              <Select
                value={groupBy}
                onChange={handleGroupByChange}
                label="Agrupar por"
              >
                <MenuItem value="day">Día</MenuItem>
                <MenuItem value="week">Semana</MenuItem>
                <MenuItem value="month">Mes</MenuItem>
                <MenuItem value="year">Año</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Ventas Totales
              </Typography>
              <Typography variant="h5">
                {formatCurrency(summary.totalSales)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                en {summary.totalOrders} pedidos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Ticket Promedio
              </Typography>
              <Typography variant="h5">
                {formatCurrency(summary.averageOrderValue)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                por pedido
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Período
              </Typography>
              <Typography variant="h6">
                {format(dateRange.start, 'PP', { locale: es })} - {format(dateRange.end, 'PP', { locale: es })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {reportData.length} {reportData.length === 1 ? 'período' : 'períodos'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Chart Tabs */}
      <Paper>
        <Tabs
          value={activeTab}
          onChange={handleChartTypeChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<BarChartIcon />} label="Barras" />
          <Tab icon={<LineChartIcon />} label="Líneas" />
          <Tab icon={<PieChartIcon />} label="Pastel" />
          <Tab icon={<TableViewIcon />} label="Tabla" />
        </Tabs>
        
        <Box p={3}>
          {renderChart()}
        </Box>
      </Paper>
    </Box>
  );
};

export default SalesReports;
