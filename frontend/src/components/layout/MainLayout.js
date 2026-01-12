import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    AppBar,
    Box,
    CssBaseline,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
    Badge,
    Avatar,
    Menu,
    MenuItem,
    Divider,
    Tooltip,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    DirectionsCar as CarIcon,
    Build as ServiceIcon,
    Assessment as ReportIcon,
    Notifications as NotificationIcon,
    Settings as SettingsIcon,
    AdminPanelSettings as AdminIcon,
    Logout as LogoutIcon,
    Person as PersonIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 240;

const MainLayout = () => {
    const [open, setOpen] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout, unreadCount, isAdmin } = useAuth();

    const handleDrawerToggle = () => {
        setOpen(!open);
    };

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleMenuClose();
        logout();
    };

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
        { text: 'Vehicles', icon: <CarIcon />, path: '/vehicles' },
        { text: 'Services', icon: <ServiceIcon />, path: '/services' },
        { text: 'Reports', icon: <ReportIcon />, path: '/reports' },
        { 
            text: 'Notifications', 
            icon: (
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationIcon />
                </Badge>
            ), 
            path: '/notifications' 
        },
        { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    ];

    if (isAdmin) {
        menuItems.push({ text: 'Admin', icon: <AdminIcon />, path: '/admin' });
    }

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    backgroundColor: '#1976d2',
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="toggle drawer"
                        onClick={handleDrawerToggle}
                        edge="start"
                        sx={{ mr: 2 }}
                    >
                        {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        Vehicle Service Management
                    </Typography>
                    
                    <Tooltip title="Account settings">
                        <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
                            <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                {user?.username?.charAt(0).toUpperCase() || <PersonIcon />}
                            </Avatar>
                        </IconButton>
                    </Tooltip>
                    
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        onClick={handleMenuClose}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                        <MenuItem disabled>
                            <ListItemIcon>
                                <PersonIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                                primary={user?.username}
                                secondary={user?.email}
                            />
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={() => navigate('/settings')}>
                            <ListItemIcon>
                                <SettingsIcon fontSize="small" />
                            </ListItemIcon>
                            Settings
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>
                            <ListItemIcon>
                                <LogoutIcon fontSize="small" />
                            </ListItemIcon>
                            Logout
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>
            
            <Drawer
                variant="permanent"
                sx={{
                    width: open ? drawerWidth : 0,
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    boxSizing: 'border-box',
                    ...(open && {
                        width: drawerWidth,
                        transition: (theme) => theme.transitions.create('width', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.enteringScreen,
                        }),
                    }),
                    ...(!open && {
                        transition: (theme) => theme.transitions.create('width', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.leavingScreen,
                        }),
                        overflowX: 'hidden',
                        width: 0,
                    }),
                }}
                open={open}
            >
                <Toolbar />
                <Box sx={{ overflow: 'auto' }}>
                    <List>
                        {menuItems.map((item) => (
                            <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                                <ListItemButton
                                    selected={location.pathname === item.path}
                                    onClick={() => navigate(item.path)}
                                    sx={{
                                        minHeight: 48,
                                        justifyContent: open ? 'initial' : 'center',
                                        px: 2.5,
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 0,
                                            mr: open ? 3 : 'auto',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={item.text} 
                                        sx={{ opacity: open ? 1 : 0 }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Drawer>
            
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
};

export default MainLayout;