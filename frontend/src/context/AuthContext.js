import React, { createContext, useState, useContext, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {  // <-- Changed to named export
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (token) {
            // Try to get current user from API
            apiService.getCurrentUser()
                .then(response => {
                    if (response.success) {
                        // Handle both username and name fields
                        const userData = response.user;
                        if (userData.username && !userData.name) {
                            userData.name = userData.username;
                        }
                        setUser(userData);
                        loadNotifications();
                    } else {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                    }
                })
                .catch(() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }

        // Socket.IO listeners (commented out if not needed)
        // apiService.onSocketEvent('new-notification', (notification) => {
        //     setNotifications(prev => [notification, ...prev]);
        //     setUnreadCount(prev => prev + 1);
        // });

        return () => {
            // apiService.offSocketEvent('new-notification');
        };
    }, []);

    const loadNotifications = async () => {
        try {
            const response = await apiService.getNotifications({ limit: 20 });
            if (response.success) {
                setNotifications(response.data);
                const unread = response.data.filter(n => !n.is_read).length;
                setUnreadCount(unread);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    };

    const login = async (email, password) => {
        const response = await apiService.login(email, password);
        if (response.success) {
            // Handle both username and name fields
            const userData = response.user;
            if (userData.username && !userData.name) {
                userData.name = userData.username;
            }
            setUser(userData);
            await loadNotifications();
        }
        return response;
    };

    const register = async (userData) => {
        const response = await apiService.register(userData);
        if (response.success) {
            // Handle both username and name fields
            const userData = response.user;
            if (userData.username && !userData.name) {
                userData.name = userData.username;
            }
            setUser(userData);
            await loadNotifications();
        }
        return response;
    };

    const logout = () => {
        apiService.logout();
        setUser(null);
        setNotifications([]);
        setUnreadCount(0);
    };

    const markNotificationAsRead = async (id) => {
        try {
            await apiService.markNotificationAsRead(id);
            setNotifications(prev =>
                prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllNotificationsAsRead = async () => {
        try {
            await apiService.markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const deleteNotification = async (id) => {
        try {
            await apiService.deleteNotification(id);
            const notification = notifications.find(n => n.id === id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            if (notification && !notification.is_read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const value = {
        user,
        loading,
        notifications,
        unreadCount,
        login,
        register,
        logout,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        loadNotifications,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isTechnician: user?.role === 'technician',
        isUser: user?.role === 'user'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Keep default export for backward compatibility
export default AuthProvider;