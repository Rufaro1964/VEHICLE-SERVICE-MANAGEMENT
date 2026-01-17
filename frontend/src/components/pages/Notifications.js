import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemButton,
    IconButton,
    Chip,
    Button,
    Divider,
    Alert,
    LinearProgress,
    Menu,
    MenuItem,
    Badge,
    Card,
    CardContent,
    Grid,
} from '@mui/material';
import {
    Notifications,
    NotificationsActive,
    NotificationsOff,
    CheckCircle,
    Warning,
    Error,
    Info,
    Delete,
    Email,
    Sms,
    MarkEmailRead,
    ClearAll,
    FilterList,
    Refresh,
    MoreVert,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';

const NotificationsPage = () => {
    const { notifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, loadNotifications } = useAuth();
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all');
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        refreshNotifications();
    }, []);

    const refreshNotifications = async () => {
        setLoading(true);
        await loadNotifications();
        setLoading(false);
    };

    const handleMenuOpen = (event, notification) => {
        setAnchorEl(event.currentTarget);
        setSelectedNotification(notification);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedNotification(null);
    };

    const handleMarkAsRead = async () => {
        if (selectedNotification) {
            await markNotificationAsRead(selectedNotification.id);
            enqueueSnackbar('Notification marked as read', { variant: 'success' });
        }
        handleMenuClose();
    };

    const handleDelete = async () => {
        if (selectedNotification) {
            await deleteNotification(selectedNotification.id);
            enqueueSnackbar('Notification deleted', { variant: 'success' });
        }
        handleMenuClose();
    };

    const handleMarkAllAsRead = async () => {
        await markAllNotificationsAsRead();
        enqueueSnackbar('All notifications marked as read', { variant: 'success' });
    };

    const handleClearAll = async () => {
        if (window.confirm('Are you sure you want to clear all notifications?')) {
            // This would need backend implementation
            enqueueSnackbar('Feature coming soon', { variant: 'info' });
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'service_due':
                return <Warning color="warning" />;
            case 'alert':
                return <Error color="error" />;
            case 'reminder':
                return <NotificationsActive color="info" />;
            default:
                return <Info color="primary" />;
        }
    };

    const getTimeLabel = (dateString) => {
        const date = parseISO(dateString);
        if (isToday(date)) {
            return `Today at ${format(date, 'hh:mm a')}`;
        } else if (isYesterday(date)) {
            return `Yesterday at ${format(date, 'hh:mm a')}`;
        } else {
            return format(date, 'MMM dd, yyyy hh:mm a');
        }
    };

    const filteredNotifications = notifications.filter(notification => {
        if (filter === 'unread') return !notification.is_read;
        if (filter === 'read') return notification.is_read;
        return true;
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    if (loading) {
        return (
            <Box sx={{ width: '100%' }}>
                <LinearProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Notifications /> Notifications
                    {unreadCount > 0 && (
                        <Badge badgeContent={unreadCount} color="error">
                            <Box />
                        </Badge>
                    )}
                </Typography>
                <Typography variant="body1" color="textSecondary" paragraph>
                    Stay updated with vehicle service reminders and system notifications.
                </Typography>
            </Box>

            {/* Stats and Actions */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <NotificationsActive sx={{ fontSize: 40, color: 'primary.main' }} />
                                <Box>
                                    <Typography color="textSecondary" variant="body2">
                                        Total Notifications
                                    </Typography>
                                    <Typography variant="h4">
                                        {notifications.length}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <NotificationsOff sx={{ fontSize: 40, color: 'warning.main' }} />
                                <Box>
                                    <Typography color="textSecondary" variant="body2">
                                        Unread
                                    </Typography>
                                    <Typography variant="h4" color="warning.main">
                                        {unreadCount}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Quick Actions
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button
                                startIcon={<MarkEmailRead />}
                                onClick={handleMarkAllAsRead}
                                variant="outlined"
                                size="small"
                                disabled={unreadCount === 0}
                            >
                                Mark All as Read
                            </Button>
                            <Button
                                startIcon={<ClearAll />}
                                onClick={handleClearAll}
                                variant="outlined"
                                size="small"
                                color="error"
                                disabled={notifications.length === 0}
                            >
                                Clear All
                            </Button>
                            <Button
                                startIcon={<Refresh />}
                                onClick={refreshNotifications}
                                variant="outlined"
                                size="small"
                            >
                                Refresh
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                            label="All"
                            onClick={() => setFilter('all')}
                            color={filter === 'all' ? 'primary' : 'default'}
                            variant={filter === 'all' ? 'filled' : 'outlined'}
                        />
                        <Chip
                            label="Unread"
                            onClick={() => setFilter('unread')}
                            color={filter === 'unread' ? 'primary' : 'default'}
                            variant={filter === 'unread' ? 'filled' : 'outlined'}
                        />
                        <Chip
                            label="Read"
                            onClick={() => setFilter('read')}
                            color={filter === 'read' ? 'primary' : 'default'}
                            variant={filter === 'read' ? 'filled' : 'outlined'}
                        />
                    </Box>
                    
                    <Typography variant="body2" color="textSecondary">
                        Showing {filteredNotifications.length} of {notifications.length} notifications
                    </Typography>
                </Box>
            </Paper>

            {/* Notifications List */}
            <Paper>
                {filteredNotifications.length > 0 ? (
                    <List disablePadding>
                        {filteredNotifications.map((notification, index) => (
                            <React.Fragment key={notification.id}>
                                <ListItem
                                    secondaryAction={
                                        <IconButton
                                            edge="end"
                                            onClick={(e) => handleMenuOpen(e, notification)}
                                        >
                                            <MoreVert />
                                        </IconButton>
                                    }
                                    disablePadding
                                >
                                    <ListItemButton
                                        onClick={() => markNotificationAsRead(notification.id)}
                                        sx={{
                                            opacity: notification.is_read ? 0.7 : 1,
                                            bgcolor: notification.is_read ? 'transparent' : 'action.hover',
                                        }}
                                    >
                                        <ListItemIcon>
                                            {getNotificationIcon(notification.type)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="subtitle1">
                                                        {notification.title}
                                                    </Typography>
                                                    {!notification.is_read && (
                                                        <Chip
                                                            label="New"
                                                            size="small"
                                                            color="primary"
                                                        />
                                                    )}
                                                    {notification.vehicle_plate && (
                                                        <Chip
                                                            label={notification.vehicle_plate}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    )}
                                                </Box>
                                            }
                                            secondary={
                                                <>
                                                    <Typography variant="body2">
                                                        {notification.message}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {getTimeLabel(notification.created_at)}
                                                    </Typography>
                                                </>
                                            }
                                        />
                                    </ListItemButton>
                                </ListItem>
                                {index < filteredNotifications.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                ) : (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <NotificationsOff sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                            No notifications found
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {filter === 'all' 
                                ? "You're all caught up! No notifications at the moment."
                                : `No ${filter} notifications found.`
                            }
                        </Typography>
                    </Box>
                )}
            </Paper>

            {/* Context Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                {selectedNotification && !selectedNotification.is_read && (
                    <MenuItem onClick={handleMarkAsRead}>
                        <CheckCircle fontSize="small" sx={{ mr: 1 }} />
                        Mark as Read
                    </MenuItem>
                )}
                <MenuItem onClick={handleDelete}>
                    <Delete fontSize="small" sx={{ mr: 1 }} />
                    Delete
                </MenuItem>
            </Menu>
        </Container>
    );
};

export default NotificationsPage;