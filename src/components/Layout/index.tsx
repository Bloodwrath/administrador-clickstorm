import React, { useState } from 'react';
import { Outlet, Link as RouterLink } from 'react-router-dom';
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
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AccountBalance as AccountingIcon,
  Inventory as InventoryIcon,
  ShoppingCart as OrdersIcon,
  PeopleAlt as SuppliersIcon,
  Logout as LogoutIcon,
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
  }),
);

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: collapsedWidth,
  width: `calc(100% - ${collapsedWidth}px)`,
  ...(open && {
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
  }),
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(2),
    marginLeft: 0,
    width: '100%',
  },
}));

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
    { text: 'Panel', icon: <DashboardIcon />, path: '/' },
    { text: 'Contabilidad', icon: <AccountingIcon />, path: '/accounting' },
    { text: 'Inventario', icon: <InventoryIcon />, path: '/inventory' },
    { text: 'Proveedores', icon: <SuppliersIcon />, path: '/inventory/suppliers' },
    { text: 'Pedidos', icon: <OrdersIcon />, path: '/orders' },
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
          <ListItem
            button
            key={item.text}
            component={RouterLink}
            to={item.path}
            onClick={() => {
              if (isMobile) setMobileOpen(false);
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
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
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBarStyled position="fixed" open={mobileOpen}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Gestor de Negocios
          </Typography>
          <Typography variant="subtitle2">
            {currentUser?.email}
          </Typography>
        </Toolbar>
      </AppBarStyled>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        <StyledDrawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </StyledDrawer>
      </Box>
      <Main open={mobileOpen}>
        <Toolbar />
        <Box sx={{ mt: 2 }}>
          <Outlet />
        </Box>
      </Main>
    </Box>
  );
};

export default Layout;
