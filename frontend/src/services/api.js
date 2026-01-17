import axios from 'axios';
import io from 'socket.io-client';

// FIXED: Changed from 5000 to 5001
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

class APIService {
    constructor() {
        this.axios = axios.create({
            baseURL: API_URL,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // Setup interceptors for auth token
        this.axios.interceptors.request.use(
            config => {
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            error => Promise.reject(error)
        );
        
        // Response interceptor for error handling
        this.axios.interceptors.response.use(
            response => {
                // Return data directly for convenience
                return response.data;
            },
            error => {
                if (error.response?.status === 401) {
                    // Token expired or invalid
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
        
        // FIXED: Changed from 5000 to 5001
        // Initialize Socket.IO (optional - comment out if not using real-time)
        try {
            this.socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001', {
                transports: ['websocket', 'polling'],
                withCredentials: true
            });
            
            // Socket event listeners
            this.socket.on('connect', () => {
                console.log('🔌 Socket.IO connected');
                const user = this.getStoredUser();
                if (user) {
                    this.socket.emit('join', user.id);
                }
            });
            
            this.socket.on('disconnect', () => {
                console.log('🔌 Socket.IO disconnected');
            });
        } catch (error) {
            console.warn('Socket.IO initialization failed:', error);
            this.socket = null;
        }
    }

    // ============ AUTH METHODS ============
    async register(userData) {
        try {
            const response = await this.axios.post('/auth/register', userData);
            
            // Handle different response formats
            if (response.token || response.data?.token) {
                const token = response.token || response.data.token;
                const user = response.user || response.data.user;
                
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                
                if (this.socket && user.id) {
                    this.socket.emit('join', user.id);
                }
            }
            
            return response;
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    }

    async login(email, password) {
        try {
            const response = await this.axios.post('/auth/login', { email, password });
            
            // Handle different response formats
            if (response.token || response.data?.token) {
                const token = response.token || response.data.token;
                const user = response.user || response.data.user;
                
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                
                if (this.socket && user.id) {
                    this.socket.emit('join', user.id);
                }
            }
            
            return response;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async getCurrentUser() {
        try {
            const response = await this.axios.get('/auth/me');
            return response;
        } catch (error) {
            console.error('Get current user error:', error);
            throw error;
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (this.socket) {
            this.socket.disconnect();
        }
        window.location.href = '/login';
    }

    getStoredUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    isAuthenticated() {
        return !!localStorage.getItem('token');
    }

    isAdmin() {
        const user = this.getStoredUser();
        return user?.role === 'admin';
    }

    // ============ VEHICLE METHODS ============
    async getVehicles(params = {}) {
        return this.axios.get('/vehicles', { params });
    }

    async getVehicle(id) {
        return this.axios.get(`/vehicles/${id}`);
    }

    async createVehicle(vehicleData) {
        return this.axios.post('/vehicles', vehicleData);
    }

    async updateVehicle(id, vehicleData) {
        return this.axios.put(`/vehicles/${id}`, vehicleData);
    }

    async deleteVehicle(id) {
        return this.axios.delete(`/vehicles/${id}`);
    }

    async getDueForService() {
        return this.axios.get('/vehicles/due/service');
    }

    async getVehicleQR(id) {
        return this.axios.get(`/vehicles/${id}/qr`);
    }

    // ============ SERVICE METHODS ============
    async getServices(params = {}) {
        return this.axios.get('/services', { params });
    }

    async getService(id) {
        return this.axios.get(`/services/${id}`);
    }

    async createService(serviceData) {
        return this.axios.post('/services', serviceData);
    }

    async updateService(id, serviceData) {
        return this.axios.put(`/services/${id}`, serviceData);
    }

    async deleteService(id) {
        return this.axios.delete(`/services/${id}`);
    }

    async getServiceTypes() {
        return this.axios.get('/services/types');
    }

    // ============ REPORT METHODS ============
    async getMonthlyReport(year, month) {
        return this.axios.get(`/services/report/${year}/${month}`);
    }

    async getDashboardStats() {
        return this.axios.get('/reports/dashboard');
    }

    async getFinancialReport(year = new Date().getFullYear()) {
        return this.axios.get(`/reports/financial?year=${year}`);
    }

    async exportServicesToExcel(params = {}) {
        return this.axios.get('/services/export/excel', {
            params,
            responseType: 'blob'
        });
    }

    async exportVehiclesToExcel() {
        return this.axios.get('/reports/export/vehicles', {
            responseType: 'blob'
        });
    }

    async importVehiclesFromExcel(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        return this.axios.post('/reports/import/vehicles', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }

    // ============ NOTIFICATION METHODS ============
    async getNotifications(params = {}) {
        return this.axios.get('/notifications', { params });
    }

    async markNotificationAsRead(id) {
        return this.axios.put(`/notifications/${id}/read`);
    }

    async markAllNotificationsAsRead() {
        return this.axios.put('/notifications/read-all');
    }

    async deleteNotification(id) {
        return this.axios.delete(`/notifications/${id}`);
    }

    async createNotification(notificationData) {
        return this.axios.post('/notifications', notificationData);
    }

    // ============ FILE UPLOAD/DOWNLOAD ============
    downloadFile(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    // ============ SOCKET.IO METHODS ============
    onSocketEvent(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        } else {
            console.warn('Socket.IO not initialized');
        }
    }

    offSocketEvent(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }

    emitSocketEvent(event, data) {
        if (this.socket) {
            this.socket.emit(event, data);
        } else {
            console.warn('Socket.IO not initialized');
        }
    }
}

// Create singleton instance
const apiService = new APIService();
export default apiService;