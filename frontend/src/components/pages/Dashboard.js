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
    TrendingUp,
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
    const [stats, setStats] = useState(null);
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
            
            // Load dashboard stats
            const statsResponse = await apiService.getDashboardStats();
            if (statsResponse.success) {
                setStats(statsResponse.data);
            }
            
            // Load due vehicles
            const dueResponse = await apiService.getDueForService();
            if (dueResponse.success) {
                setDueVehicles(dueResponse.data);
            }
            
            // Load recent services
            const servicesResponse = await apiService.getServices({ limit: 5 });
            if (servicesResponse.success) {
                setRecentServices(servicesResponse.data);
            }
        } catch (error) {
            enqueueSnackbar('Error loading dashboard data', { variant: 'error' });
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
            const blob = await apiService.exportVehiclesToExcel();
            apiService.downloadFile(blob, `vehicles-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
            enqueueSnackbar('Export completed successfully', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Error exporting data', { variant: 'error' });
        }
        handleMenuClose();
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
                        {change && (
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
            <Box sx={{ width: '100%' }}>
                <LinearProgress />
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
                        value={stats?.vehicles || 0}
                        icon={<DirectionsCar />}
                        color="#1976d2"
                        change={12}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Recent Services"
                        value={stats?.recent_services || 0}
                        icon={<Build />}
                        color="#2e7d32"
                        change={8}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Cost"
                        value={`k${stats?.recent_cost?.toFixed(2) || '0.00'}`}
                        icon={<Assessment />}
                        color="#ed6c02"
                        change={15}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Due for Service"
                        value={stats?.due_for_service || 0}
                        icon={<Warning />}
                        color="#d32f2f"
                        change={-5}
                    />
                </Grid>
            </Grid>

            {/* Charts and Data Grids */}
            <Grid container spacing={3}>
                {/* Monthly Trend Chart */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Monthly Service Trend
                        </Typography>
                        <Box sx={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats?.monthly_trend || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="service_count" name="Services" fill="#1976d2" />
                                    <Bar dataKey="total_cost" name="Revenue ($)" fill="#2e7d32" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>

                {/* Service Type Distribution */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Service Types
                        </Typography>
                        <Box sx={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats?.popular_services || []}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="count"
                                    >
                                        {stats?.popular_services?.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
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
                                                {vehicle.plate_number}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                {vehicle.make} {vehicle.model}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Chip
                                                label={`${vehicle.current_mileage} miles`}
                                                color="warning"
                                                size="small"
                                            />
                                        </Box>
                                    </Box>
                                ))
                            ) : (
                                <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
                                    No vehicles due for service
                                </Typography>
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* Recent Services */}
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
                                                {service.invoice_number}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                {service.plate_number} • {format(new Date(service.service_date), 'MMM dd, yyyy')}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Chip
                                                label={`$${service.total_cost}`}
                                                color="success"
                                                size="small"
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
            </Grid>
        </Box>
    );
};

export default Dashboard;