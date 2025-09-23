import React, { useState, useEffect } from 'react';
import { Outlet, Link as RouterLink, useLocation } from 'react-router-dom';
import { styled, useTheme } from '@mui/material/styles';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer as MuiDrawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  Tooltip,
  Button,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AccountBalance as AccountingIcon,
  Inventory as InventoryIcon,
  ShoppingCart as OrdersIcon,
  PeopleAlt as SuppliersIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from '../../context/SnackbarContext';

const drawerWidth = 240;
const collapsedWidth = 64;

interface StyledDrawerProps {
  open?: boolean;
  children?: React.ReactNode;
  variant?: 'permanent' | 'persistent' | 'temporary';
  onClose?: () => void;
  ModalProps?: {
    keepMounted: boolean;
  };
  sx?: any;
}

const StyledDrawer = styled(MuiDrawer, { 
  shouldForwardProp: (prop) => prop !== 'open' 
})<StyledDrawerProps>(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    '& .MuiDrawer-paper': {
      width: open ? drawerWidth : collapsedWidth,
      transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      overflowX: 'hidden',
      [theme.breakpoints.down('md')]: {
        width: drawerWidth,
        transform: open ? 'translateX(0)' : `translateX(-${drawerWidth}px)`
      },
    },
  })
);

const AppBarStyled = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<{ open?: boolean }>(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  width: `calc(100% - ${collapsedWidth}px)`,
  marginLeft: collapsedWidth,
  [theme.breakpoints.down('md')]: {
    width: '100%',
    marginLeft: 0,
  },
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));


const Layout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentUser, signOut } = useAuth();
  const { showMessage } = useSnackbar();
  const location = useLocation();

  // Cerrar el menú móvil cuando se cambia de ruta
  useEffect(() => {
    if (mobileOpen) {
      setMobileOpen(false);
    }
  }, [location]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      showMessage('Sesión cerrada correctamente', 'success');
    } catch (error) {
      showMessage('Error al cerrar sesión', 'error');
    }
  };

  const menuItems = [
    { 
      text: 'Panel', 
      icon: <DashboardIcon />, 
      path: '/',
      description: 'Vista general del sistema'
    },
    { 
      text: 'Contabilidad', 
      icon: <AccountingIcon />, 
      path: '/accounting',
      description: 'Gestión financiera y reportes'
    },
    { 
      text: 'Inventario', 
      icon: <InventoryIcon />, 
      path: '/inventory',
      description: 'Gestión de productos y stock'
    },
    { 
      text: 'Proveedores', 
      icon: <SuppliersIcon />, 
      path: '/suppliers',
      description: 'Administración de proveedores'
    },
    { 
      text: 'Pedidos', 
      icon: <OrdersIcon />, 
      path: '/orders',
      description: 'Seguimiento de pedidos'
    },
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Administrador ClickStorm
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <Tooltip 
            key={item.text} 
            title={item.description} 
            placement="right"
            enterDelay={300}
            disableHoverListener={!isMobile}
            arrow
          >
            <ListItem 
              button 
              component={RouterLink} 
              to={item.path}
              sx={{
                '&:hover': {
                  backgroundColor: 'action.hover',
                  '& .MuiListItemIcon-root': {
                    color: 'primary.main',
                  },
                },
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                },
                transition: 'all 0.2s ease-in-out',
                mb: 0.5,
                mx: 1,
                borderRadius: 1,
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: 'medium',
                }}
              />
            </ListItem>
          </Tooltip>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem button onClick={handleSignOut}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Cerrar sesión" />
        </ListItem>
      </List>
    </div>
  );

  // Cerrar el menú móvil cuando cambia la ruta
  useEffect(() => {
    if (mobileOpen) {
      setMobileOpen(false);
    }
  }, [location]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBarStyled position="fixed" open={mobileOpen}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="abrir menú"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ 
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box 
            component="div" 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              flexGrow: 1,
            }}
          >
            <Typography 
              variant="h6" 
              noWrap 
              component="h1"
              sx={{ 
                fontSize: { xs: '1.1rem', sm: '1.5rem' },
                fontWeight: 600,
                letterSpacing: '0.5px',
                background: 'linear-gradient(45deg, #1976d2, #4dabf5)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mr: 2
              }}
            >
              ClickStorm Manager
            </Typography>
            
            <Box 
              sx={{ 
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                ml: 3,
                '& > *:not(:last-child)': {
                  mr: 2,
                }
              }}
            >
              {menuItems.slice(0, 3).map((item) => (
                <Button
                  key={item.path}
                  component={RouterLink}
                  to={item.path}
                  startIcon={React.cloneElement(item.icon, { fontSize: 'small' })}
                  sx={{
                    color: 'white',
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    fontWeight: location.pathname === item.path ? 600 : 400,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    }
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip 
              title={currentUser?.email || 'Usuario'} 
              placement="bottom"
              arrow
            >
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  cursor: 'pointer',
                  p: 0.5,
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                <AccountCircleIcon sx={{ mr: 1 }} />
                <Typography 
                  variant="subtitle2"
                  sx={{ 
                    display: { xs: 'none', sm: 'block' },
                    fontSize: '0.8rem',
                    maxWidth: 150,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {currentUser?.email || 'Usuario'}
                </Typography>
              </Box>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBarStyled>
      <Box
        component="nav"
        sx={{ 
          width: { md: drawerWidth }, 
          flexShrink: { md: 0 },
          zIndex: theme.zIndex.drawer + 1
        }}
        aria-label="menú de navegación"
      >
        {/* Drawer para móviles */}
        <StyledDrawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Mejor rendimiento en móviles
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: theme.palette.background.paper,
              borderRight: `1px solid ${theme.palette.divider}`
            },
          }}
        >
          {drawer}
        </StyledDrawer>
        
        {/* Drawer para escritorio */}
        <StyledDrawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: theme.palette.background.paper,
              borderRight: `1px solid ${theme.palette.divider}`,
              position: 'relative',
              height: '100vh',
              overflowY: 'auto'
            },
          }}
          open
        >
          {drawer}
        </StyledDrawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          mt: '64px',
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar />
        <Box
          component="div"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            backgroundColor: 'background.default',
          }}
        >
          <Outlet />
        </Box>
        
        {/* Footer */}
        <Box
          component="footer"
          sx={{
            py: 2,
            px: 3,
            backgroundColor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
            textAlign: 'center',
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: '0.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <span>© {new Date().getFullYear()} ClickStorm Manager</span>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography 
                component="a" 
                href="#" 
                variant="body2" 
                color="text.secondary"
                sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                Términos de servicio
              </Typography>
              <Typography 
                component="a" 
                href="#" 
                variant="body2" 
                color="text.secondary"
                sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                Política de privacidad
              </Typography>
              <Typography 
                component="a" 
                href="#" 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  textDecoration: 'none', 
                  '&:hover': { textDecoration: 'underline' },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                <span>Versión</span>
                <Chip 
                  label="1.0.0" 
                  size="small" 
                  sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }} 
                />
              </Typography>
            </Box>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
