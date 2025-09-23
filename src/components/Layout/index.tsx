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

// Configuración responsiva del drawer
const drawerConfig = {
  // Ancho del drawer en diferentes breakpoints
  width: {
    xs: '100%',
    sm: drawerWidth,
    md: drawerWidth,
    lg: collapsedWidth,
    xl: collapsedWidth
  },
  // Comportamiento del drawer en diferentes breakpoints
  variant: {
    xs: 'temporary',
    sm: 'permanent',
    md: 'permanent',
    lg: 'permanent',
    xl: 'permanent'
  }
};

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
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    '& .MuiDrawer-paper': {
      transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      overflowX: 'hidden',
      [theme.breakpoints.down('sm')]: {
        width: drawerConfig.width.xs,
        transform: open ? 'translateX(0)' : `translateX(-100%)`,
      },
      [theme.breakpoints.between('sm', 'md')]: {
        width: drawerConfig.width.sm,
      },
      [theme.breakpoints.between('md', 'lg')]: {
        width: drawerConfig.width.md,
      },
      [theme.breakpoints.up('lg')]: {
        width: drawerConfig.width.lg,
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
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    marginLeft: 0,
  },
  [theme.breakpoints.between('sm', 'md')]: {
    width: `calc(100% - ${drawerConfig.width.sm}px)`,
    marginLeft: drawerConfig.width.sm,
  },
  [theme.breakpoints.between('md', 'lg')]: {
    width: `calc(100% - ${drawerConfig.width.md}px)`,
    marginLeft: drawerConfig.width.md,
  },
  [theme.breakpoints.up('lg')]: {
    width: `calc(100% - ${drawerConfig.width.lg}px)`,
    marginLeft: drawerConfig.width.lg,
  },
  ...(open && {
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      marginLeft: 0,
    },
  }),
}));


const Layout: React.FC = () => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentUser, signOut } = useAuth();
  const { showMessage } = useSnackbar();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Cerrar el menú móvil cuando se cambia de ruta
  useEffect(() => {
    if (mobileOpen) {
      setMobileOpen(false);
    }
  }, [location, mobileOpen]);

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
      path: '/inventario',
      description: 'Gestión de productos y stock'
    },
    {
      text: 'Proveedores',
      icon: <SuppliersIcon />,
      path: '/proveedores',
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
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <MenuIcon />
          </IconButton>

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
              flexGrow: 1
            }}
          >
            ClickStorm Manager
          </Typography>

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
          flexShrink: { sm: 0 },
          zIndex: theme.zIndex.drawer + 1
        }}
        aria-label="menú de navegación"
      >
        {/* Drawer responsivo */}
        <StyledDrawer
          variant={isXs ? 'temporary' : 'permanent'}
          open={isXs ? mobileOpen : true}
          onClose={isXs ? handleDrawerToggle : undefined}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              backgroundColor: theme.palette.background.paper,
              borderRight: `1px solid ${theme.palette.divider}`,
              position: 'relative',
              height: '100vh',
              overflowY: 'auto'
            },
          }}
        >
          {drawer}
        </StyledDrawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: {
            xs: '100%',
            sm: `calc(100% - ${drawerConfig.width.sm}px)`,
            md: `calc(100% - ${drawerConfig.width.md}px)`,
            lg: `calc(100% - ${drawerConfig.width.lg}px)`,
          },
          ml: {
            xs: 0,
            sm: `${drawerConfig.width.sm}px`,
            md: `${drawerConfig.width.md}px`,
            lg: `${drawerConfig.width.lg}px`,
          },
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
