import React, { useState, useEffect } from 'react';
import {
    Grid,
    Paper,
    Typography,
    Box,
    Card,
    CardContent,
    LinearProgress,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    Button,
} from '@mui/material';
import {
    DirectionsCar,
    Build,
    Assessment,
    Warning,
    MoreVert,
    Refresh,
    Download,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import apiService from '../../services/api';
import { format } from 'date-fns';

const Dashboard = () => {
    const [stats, setStats] = useState({
        vehicles: 0,
        services: 0,
        recent_cost: 0,
        due_for_service: 0
    });
    const [dueVehicles, setDueVehicles] = useState([]);
    const [recentServices, setRecentServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            
            // Load all data in parallel
            const [vehiclesResponse, servicesResponse] = await Promise.allSettled([
                apiService.getVehicles(),
                apiService.getServices({ limit: 10 })
            ]);
            
            // Calculate dashboard stats
            const vehicles = vehiclesResponse.status === 'fulfilled' 
                ? vehiclesResponse.value.data || []
                : [];
            
            const services = servicesResponse.status === 'fulfilled'
                ? servicesResponse.value.data || []
                : [];
            
            // Calculate statistics
            const totalVehicles = vehicles.length;
            const recentServicesCount = services.length;
            
            // Safely calculate total cost
            const totalCost = services.reduce((sum, service) => {
                const cost = Number(service.total_cost) || 0;
                return sum + cost;
            }, 0);
            
            // Simple due for service calculation
            const dueForService = vehicles.filter(v => (v.current_mileage || 0) > 0).length;
            
            setStats({
                vehicles: totalVehicles,
                recent_services: recentServicesCount,
                recent_cost: totalCost,
                due_for_service: dueForService
            });
            
            // Set recent services (first 5)
            setRecentServices(services.slice(0, 5));
            
            // For due vehicles, use all vehicles as placeholder
            setDueVehicles(vehicles.slice(0, 3));
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            enqueueSnackbar('Error loading dashboard data', { variant: 'error' });
            
            // Set default data on error
            setStats({
                vehicles: 0,
                recent_services: 0,
                recent_cost: 0,
                due_for_service: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleExport = async () => {
        try {
            enqueueSnackbar('Export feature coming soon', { variant: 'info' });
        } catch (error) {
            enqueueSnackbar('Export feature not available', { variant: 'info' });
        }
        handleMenuClose();
    };

    // Helper function to safely format currency
    const formatCurrency = (amount) => {
        const num = Number(amount) || 0;
        return num.toFixed(2);
    };

    const StatCard = ({ title, value, icon, color, change }) => (
        <Card>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography color="textSecondary" gutterBottom variant="body2">
                            {title}
                        </Typography>
                        <Typography variant="h4" component="div">
                            {value}
                        </Typography>
                        {change !== undefined && (
                            <Typography variant="caption" color={change > 0 ? 'success.main' : 'error.main'}>
                                {change > 0 ? '+' : ''}{change}% from last month
                            </Typography>
                        )}
                    </Box>
                    <Box
                        sx={{
                            backgroundColor: `${color}20`,
                            borderRadius: '50%',
                            width: 56,
                            height: 56,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {React.cloneElement(icon, { sx: { fontSize: 32, color } })}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <LinearProgress sx={{ width: '50%' }} />
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Dashboard
                </Typography>
                <Box>
                    <Button
                        startIcon={<Refresh />}
                        onClick={loadDashboardData}
                        sx={{ mr: 1 }}
                        variant="outlined"
                    >
                        Refresh
                    </Button>
                    <IconButton onClick={handleMenuOpen}>
                        <MoreVert />
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                    >
                        <MenuItem onClick={handleExport}>
                            <Download fontSize="small" sx={{ mr: 1 }} />
                            Export Data
                        </MenuItem>
                    </Menu>
                </Box>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Vehicles"
                        value={stats.vehicles}
                        icon={<DirectionsCar />}
                        color="#1976d2"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Recent Services"
                        value={stats.recent_services}
                        icon={<Build />}
                        color="#2e7d32"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Cost"
                        value={`K${formatCurrency(stats.recent_cost)}`}
                        icon={<Assessment />}
                        color="#ed6c02"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Due for Service"
                        value={stats.due_for_service}
                        icon={<Warning />}
                        color="#d32f2f"
                    />
                </Grid>
            </Grid>

            {/* Charts and Data Grids */}
            <Grid container spacing={3}>
                {/* Due for Service */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Recent Services
                        </Typography>
                        <Box>
                            {recentServices.length > 0 ? (
                                recentServices.map((service) => (
                                    <Box
                                        key={service.id}
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            p: 2,
                                            borderBottom: '1px solid #eee',
                                            '&:last-child': { borderBottom: 'none' },
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: 'action.hover' },
                                        }}
                                        onClick={() => navigate(`/services/${service.id}`)}
                                    >
                                        <Box>
                                            <Typography variant="subtitle1">
                                                {service.invoice_number || `Service #${service.id}`}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                {service.plate_number || 'Unknown'} • {service.service_date ? format(new Date(service.service_date), 'MMM dd, yyyy') : 'No date'}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Chip
                                                label={`K${formatCurrency(service.total_cost)}`}
                                                color="success"
                                                size="small"
                                            />
                                            <Chip
                                                label={service.status || 'pending'}
                                                color="primary"
                                                size="small"
                                                sx={{ ml: 1 }}
                                            />
                                        </Box>
                                    </Box>
                                ))
                            ) : (
                                <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
                                    No recent services
                                </Typography>
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* Due for Service */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Vehicles Due for Service
                        </Typography>
                        <Box>
                            {dueVehicles.length > 0 ? (
                                dueVehicles.map((vehicle) => (
                                    <Box
                                        key={vehicle.id}
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            p: 2,
                                            borderBottom: '1px solid #eee',
                                            '&:last-child': { borderBottom: 'none' },
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: 'action.hover' },
                                        }}
                                        onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                                    >
                                        <Box>
                                            <Typography variant="subtitle1">
                                                {vehicle.plate_number || 'No Plate'}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                {vehicle.make || 'Unknown'} {vehicle.model || ''}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Chip
                                                label={`${vehicle.current_mileage || 0} miles`}
                                                color="warning"
                                                size="small"
                                            />
                                        </Box>
                                    </Box>
                                ))
                            ) : (
                                <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
                                    No vehicles found
                                </Typography>
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* Charts Section - Simplified */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Service Summary
                        </Typography>
                        <Typography variant="body2" color="textSecondary" paragraph>
                            Total services recorded: {stats.recent_services} services
                        </Typography>
                        <Typography variant="body2" color="textSecondary" paragraph>
                            Total cost of all services: K{formatCurrency(stats.recent_cost)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Vehicles in system: {stats.vehicles} vehicles
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;