import React from 'react';
import {
  DataGrid as MuiDataGrid,
  DataGridProps as MuiDataGridProps,
  GridColDef,
  GridToolbar,
  esES,
} from '@mui/x-data-grid';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';

// Type for our enhanced column definition
type DataTableColumn = GridColDef & {
  hideOnMobile?: boolean;
};

interface DataTableProps extends Omit<MuiDataGridProps, 'columns'> {
  columns: DataTableColumn[];
  loading?: boolean;
  title?: string;
  height?: string | number;
  withToolbar?: boolean;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  rows,
  loading = false,
  title,
  height = '70vh',
  withToolbar = true,
  ...props
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Ajustar columnas para dispositivos móviles
  const processedColumns = React.useMemo(() => {
    return columns.map((column: any) => ({
      ...column,
      hideOnMobile: column.hideOnMobile ?? (column.field !== 'actions' && column.field !== 'nombre' ? isMobile : false),
    }));
  }, [columns, isMobile]);

  return (
    <Box 
      sx={{ 
        height,
        width: '100%',
        '& .MuiDataGrid-root': {
          border: 'none',
          '& .MuiDataGrid-cell': {
            borderBottom: `1px solid ${theme.palette.divider}`,
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: theme.palette.background.paper,
            borderBottom: `1px solid ${theme.palette.divider}`,
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: `1px solid ${theme.palette.divider}`,
          },
          '& .MuiDataGrid-toolbarContainer': {
            padding: theme.spacing(1, 2),
            backgroundColor: 'transparent',
            borderBottom: `1px solid ${theme.palette.divider}`,
          },
        },
      }}
    >
      {title && (
        <Box sx={{ p: 2, pb: 0 }}>
          <Typography variant="h6" component="h2">
            {title}
          </Typography>
        </Box>
      )}
      <MuiDataGrid
        rows={rows}
        columns={processedColumns}
        loading={loading}
        disableRowSelectionOnClick={true}
        disableColumnMenu={isTablet}
        density={isMobile ? 'compact' : 'standard'}
        components={{
          Toolbar: withToolbar ? GridToolbar : null,
        }}
        componentsProps={{
          toolbar: {
            showQuickFilter: true,
            printOptions: { disableToolbarButton: true },
            csvOptions: { disableToolbarButton: false },
          },
        }}
        localeText={{
          ...esES.components.MuiDataGrid.defaultProps.localeText,
          toolbarDensity: 'Densidad',
          toolbarDensityLabel: 'Densidad',
          toolbarDensityCompact: 'Compacta',
          toolbarDensityStandard: 'Estándar',
          toolbarDensityComfortable: 'Cómoda',
          toolbarExport: 'Exportar',
          toolbarExportCSV: 'Descargar como CSV',
          toolbarExportPrint: 'Imprimir',
          toolbarFilters: 'Filtros',
          filterPanelAddFilter: 'Agregar filtro',
          filterPanelRemoveAll: 'Eliminar todos',
          filterPanelOperator: 'Operador',
          filterPanelOperatorAnd: 'Y',
          filterPanelOperatorOr: 'O',
          filterPanelColumns: 'Columnas',
          filterPanelInputLabel: 'Valor',
          filterPanelInputPlaceholder: 'Filtrar valor',
          filterOperatorContains: 'contiene',
          filterOperatorEquals: 'igual a',
          filterOperatorStartsWith: 'comienza con',
          filterOperatorEndsWith: 'termina con',
          filterOperatorIsEmpty: 'está vacío',
          filterOperatorIsNotEmpty: 'no está vacío',
          filterOperatorIsAnyOf: 'es cualquiera de',
          filterOperatorIs: 'es',
          filterOperatorNot: 'no es',
          filterOperatorAfter: 'es posterior a',
          filterOperatorOnOrAfter: 'es en o posterior a',
          filterOperatorBefore: 'es anterior a',
          filterOperatorOnOrBefore: 'es en o antes de',
          columnMenuLabel: 'Menú',
          columnMenuShowColumns: 'Mostrar columnas',
          columnMenuFilter: 'Filtrar',
          columnMenuHideColumn: 'Ocultar',
          columnMenuUnsort: 'Desordenar',
          columnMenuSortAsc: 'Ordenar ASC',
          columnMenuSortDesc: 'Ordenar DESC',
          columnsPanelTextFieldLabel: 'Buscar columna',
          columnsPanelTextFieldPlaceholder: 'Título de columna',
          columnsPanelDragIconLabel: 'Reordenar columna',
          columnsPanelShowAllButton: 'Mostrar todo',
          columnsPanelHideAllButton: 'Ocultar todo',
        }}
        sx={{
          '& .MuiDataGrid-columnHeader': {
            backgroundColor: theme.palette.background.paper,
          },
          '& .MuiDataGrid-row': {
            '&:nth-of-type(odd)': {
              backgroundColor: theme.palette.action.hover,
            },
            '&:hover': {
              backgroundColor: theme.palette.action.selected,
            },
          },
          '& .MuiDataGrid-cell': {
            '&:focus': {
              outline: 'none',
            },
          },
          '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-cell:focus': {
            outline: 'none',
          },
        }}
        {...props}
      />
    </Box>
  );
};

export default DataTable;
