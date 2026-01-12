import axios from 'axios';
import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
            response => response,
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
        
        // Initialize Socket.IO
        this.socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
            transports: ['websocket'],
            withCredentials: true
        });
        
        // Socket event listeners
        this.socket.on('connect', () => {
            console.log('🔌 Socket.IO connected');
            const user = this.getCurrentUser();
            if (user) {
                this.socket.emit('join', user.id);
            }
        });
        
        this.socket.on('disconnect', () => {
            console.log('🔌 Socket.IO disconnected');
        });
    }

    // ============ AUTH METHODS ============
    async register(userData) {
        const response = await this.axios.post('/auth/register', userData);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            this.socket.emit('join', response.data.user.id);
        }
        return response.data;
    }

    async login(email, password) {
        const response = await this.axios.post('/auth/login', { email, password });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            this.socket.emit('join', response.data.user.id);
        }
        return response.data;
    }

    async getCurrentUser() {
        const response = await this.axios.get('/auth/me');
        return response.data;
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.socket.disconnect();
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
        const response = await this.axios.get('/vehicles', { params });
        return response.data;
    }

    async getVehicle(id) {
        const response = await this.axios.get(`/vehicles/${id}`);
        return response.data;
    }

    async createVehicle(vehicleData) {
        const response = await this.axios.post('/vehicles', vehicleData);
        return response.data;
    }

    async updateVehicle(id, vehicleData) {
        const response = await this.axios.put(`/vehicles/${id}`, vehicleData);
        return response.data;
    }

    async deleteVehicle(id) {
        const response = await this.axios.delete(`/vehicles/${id}`);
        return response.data;
    }

    async getDueForService() {
        const response = await this.axios.get('/vehicles/due/service');
        return response.data;
    }

    async getVehicleQR(id) {
        const response = await this.axios.get(`/vehicles/${id}/qr`);
        return response.data;
    }

    // ============ SERVICE METHODS ============
    async getServices(params = {}) {
        const response = await this.axios.get('/services', { params });
        return response.data;
    }

    async getService(id) {
        const response = await this.axios.get(`/services/${id}`);
        return response.data;
    }

    async createService(serviceData) {
        const response = await this.axios.post('/services', serviceData);
        return response.data;
    }

    async updateService(id, serviceData) {
        const response = await this.axios.put(`/services/${id}`, serviceData);
        return response.data;
    }

    async deleteService(id) {
        const response = await this.axios.delete(`/services/${id}`);
        return response.data;
    }

    async getServiceTypes() {
        const response = await this.axios.get('/services/types');
        return response.data;
    }

    // ============ REPORT METHODS ============
    async getMonthlyReport(year, month) {
        const response = await this.axios.get(`/services/report/${year}/${month}`);
        return response.data;
    }

    async getDashboardStats() {
        const response = await this.axios.get('/reports/dashboard');
        return response.data;
    }

    async getFinancialReport(year = new Date().getFullYear()) {
        const response = await this.axios.get(`/reports/financial?year=${year}`);
        return response.data;
    }

    async exportServicesToExcel(params = {}) {
        const response = await this.axios.get('/services/export/excel', {
            params,
            responseType: 'blob'
        });
        return response.data;
    }

    async exportVehiclesToExcel() {
        const response = await this.axios.get('/reports/export/vehicles', {
            responseType: 'blob'
        });
        return response.data;
    }

    async importVehiclesFromExcel(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await this.axios.post('/reports/import/vehicles', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }

    // ============ NOTIFICATION METHODS ============
    async getNotifications(params = {}) {
        const response = await this.axios.get('/notifications', { params });
        return response.data;
    }

    async markNotificationAsRead(id) {
        const response = await this.axios.put(`/notifications/${id}/read`);
        return response.data;
    }

    async markAllNotificationsAsRead() {
        const response = await this.axios.put('/notifications/read-all');
        return response.data;
    }

    async deleteNotification(id) {
        const response = await this.axios.delete(`/notifications/${id}`);
        return response.data;
    }

    async createNotification(notificationData) {
        const response = await this.axios.post('/notifications', notificationData);
        return response.data;
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
        this.socket.on(event, callback);
    }

    offSocketEvent(event, callback) {
        this.socket.off(event, callback);
    }

    emitSocketEvent(event, data) {
        this.socket.emit(event, data);
    }
}

// Create singleton instance
const apiService = new APIService();
export default apiService;