import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Contexts
import { AuthProvider, useAuth } from '../src/context/AuthContext';


// Layout Components
import MainLayout from './components/layout/MainLayout';

// Pages
import Login from './components/pages/Login';
import Register from './components/pages/Register';
import Dashboard from './components/pages/Dashboard';
import Vehicle from './components/pages/Vehicle';
import VehicleDetail from './components/pages/VehicleDetail';
import Services from './components/pages/Services';
import ServiceDetails from './components/pages/ServiceDetails'; // FIXED: Correct file name
import Reports from './components/pages/Reports';
import Notifications from './components/pages/Notifications'; // ADDED: This component is missing from your tree!
import Settings from './components/pages/Settings';
import AdminDashboard from './components/pages/AdminDashboard';

// Private Route
import PrivateRoute from './components/PrivateRoute';

const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
            light: '#42a5f5',
            dark: '#1565c0',
        },
        secondary: {
            main: '#dc004e',
            light: '#ff4081',
            dark: '#9a0036',
        },
        background: {
            default: '#f5f5f5',
            paper: '#ffffff',
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h4: {
            fontWeight: 600,
        },
        h5: {
            fontWeight: 600,
        },
        h6: {
            fontWeight: 600,
        },
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                },
            },
        },
    },
});

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <SnackbarProvider 
                    maxSnack={3}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    autoHideDuration={3000}
                >
                    <AuthProvider>
                        <Router>
                            <Routes>
                                {/* Public Routes */}
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                
                                {/* Private Routes with Layout */}
                                <Route path="/" element={
                                    <PrivateRoute>
                                        <MainLayout />
                                    </PrivateRoute>
                                }>
                                    <Route index element={<Dashboard />} />
                                    <Route path="vehicles" element={<Vehicle />} />
                                    <Route path="vehicles/:id" element={<VehicleDetail />} />
                                    <Route path="services" element={<Services />} />
                                    <Route path="services/:id" element={<ServiceDetails />} />
                                    <Route path="reports" element={<Reports />} />
                                    <Route path="notifications" element={<Notifications />} />
                                    <Route path="settings" element={<Settings />} />
                                </Route>
                                
                                {/* Admin Only Routes */}
                                <Route path="/admin" element={
                                    <PrivateRoute adminOnly={true}>
                                        <MainLayout />
                                    </PrivateRoute>
                                }>
                                    <Route index element={<AdminDashboard />} />
                                </Route>
                                
                                {/* 404 Redirect */}
                                <Route path="*" element={<Navigate to="/" />} />
                            </Routes>
                        </Router>
                    </AuthProvider>
                </SnackbarProvider>
            </LocalizationProvider>
        </ThemeProvider>
    );
}

export default App;