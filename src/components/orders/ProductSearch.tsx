import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Product } from '../../types/product';
import { 
  TextField, 
  Autocomplete, 
  CircularProgress, 
  Box, 
  Typography, 
  InputAdornment, 
  IconButton,
  Paper,
  Divider,
  Chip
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon } from '@mui/icons-material';

interface ProductSearchProps {
  onSelectProduct: (product: Product) => void;
  disabled?: boolean;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ onSelectProduct, disabled = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Fetch products based on search term
  const fetchProducts = useCallback(async (term: string) => {
    if (term.length < 2) {
      setProducts([]);
      return;
    }

    setLoading(true);
    try {
      const productsRef = collection(db, 'productos');
      const q = query(
        productsRef,
        where('nombre', '>=', term),
        where('nombre', '<=', term + '\uf8ff'),
        where('activo', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));
      
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      // Handle error (e.g., show error message)
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm) {
        fetchProducts(searchTerm);
      } else {
        setProducts([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, fetchProducts]);

  const handleSelectProduct = (product: Product | null) => {
    if (product) {
      onSelectProduct(product);
      setSearchTerm('');
      setProducts([]);
    }
  };

  return (
    <Autocomplete
      freeSolo
      disabled={disabled}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={products}
      getOptionLabel={(option) => 
        typeof option === 'string' ? option : option.nombre
      }
      filterOptions={(options) => options}
      inputValue={searchTerm}
      onInputChange={(_, newValue) => setSearchTerm(newValue)}
      onChange={(_, newValue) => {
        if (newValue && typeof newValue !== 'string') {
          handleSelectProduct(newValue);
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Buscar productos..."
          variant="outlined"
          fullWidth
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <React.Fragment>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <li {...props}>
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography>{option.nombre}</Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip 
                  label={`$${option.precioMenudeo.toFixed(2)}`} 
                  size="small" 
                  color="primary"
                  variant="outlined"
                />
                {option.cantidadMayoreo > 1 && (
                  <Chip 
                    label={`${option.cantidadMayoreo}x $${option.precioMayoreo.toFixed(2)}`} 
                    size="small" 
                    color="secondary"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Código: {option.codigo}
              </Typography>
              <Typography 
                variant="body2" 
                color={option.stock > 0 ? 'text.secondary' : 'error'}
                fontWeight={500}
              >
                {option.stock > 0 ? `${option.stock} en stock` : 'Sin stock'}
              </Typography>
            </Box>
            {option.descripcion && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }} noWrap>
                {option.descripcion}
              </Typography>
            )}
          </Box>
        </li>
      )}
      PaperComponent={({ children }) => (
        <Paper>
          <Box sx={{ p: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {products.length} {products.length === 1 ? 'producto encontrado' : 'productos encontrados'}
              </Typography>
              <Box>
                <Chip 
                  label="Menudeo" 
                  size="small" 
                  color="primary"
                  variant="outlined"
                  sx={{ mr: 0.5 }}
                />
                <Chip 
                  label="Mayoreo" 
                  size="small" 
                  color="secondary"
                  variant="outlined"
                />
              </Box>
            </Box>
            <Divider />
            {children}
          </Box>
        </Paper>
      )}
    />
  );
};

export default ProductSearch;
