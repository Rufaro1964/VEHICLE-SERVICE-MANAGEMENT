import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    Button,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    Tabs,
    Tab,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tooltip,
} from '@mui/material';
import {
    AdminPanelSettings,
    People,
    DirectionsCar,
    Build,
    Assessment,
    Warning,
    TrendingUp,
    MoreVert,
    Edit,
    Delete,
    Block,
    CheckCircle,
    Refresh,
    FileDownload,
    Email,
    Notifications,
    BarChart,
    PieChart,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { format, parseISO } from 'date-fns';
import {
    BarChart as RechartsBarChart,
    Bar,
    LineChart as RechartsLineChart,
    Line,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ChartTooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import apiService from '../../services/api';

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [services, setServices] = useState([]);
    const [tabValue, setTabValue] = useState(0);
    const [openUserDialog, setOpenUserDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        loadAdminData();
    }, []);

    const loadAdminData = async () => {
        try {
            setLoading(true);
            
            // Load stats
            const statsResponse = await apiService.getDashboardStats();
            if (statsResponse.success) {
                setStats(statsResponse.data);
            }
            
            // Load users (this would need a separate API endpoint)
            // For now, we'll simulate with mock data
            const mockUsers = [
                { id: 1, username: 'admin', email: 'admin@example.com', role: 'admin', status: 'active', created_at: '2024-01-01' },
                { id: 2, username: 'user1', email: 'user1@example.com', role: 'user', status: 'active', created_at: '2024-01-02' },
                { id: 3, username: 'user2', email: 'user2@example.com', role: 'user', status: 'inactive', created_at: '2024-01-03' },
                { id: 4, username: 'user3', email: 'user3@example.com', role: 'user', status: 'active', created_at: '2024-01-04' },
            ];
            setUsers(mockUsers);
            
            // Load vehicles
            const vehiclesResponse = await apiService.getVehicles();
            if (vehiclesResponse.success) {
                setVehicles(vehiclesResponse.data);
            }
            
            // Load services
            const servicesResponse = await apiService.getServices();
            if (servicesResponse.success) {
                setServices(servicesResponse.data);
            }
        } catch (error) {
            enqueueSnackbar('Error loading admin data', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setOpenUserDialog(true);
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            // This would call an API endpoint
            enqueueSnackbar('User deleted (simulated)', { variant: 'success' });
        }
    };

    const handleToggleUserStatus = async (userId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        // This would call an API endpoint
        enqueueSnackbar(`User ${newStatus} (simulated)`, { variant: 'success' });
    };

    const getStatusChip = (status) => {
        return (
            <Chip
                label={status}
                color={status === 'active' ? 'success' : 'error'}
                size="small"
            />
        );
    };

    const getRoleChip = (role) => {
        return (
            <Chip
                label={role}
                color={role === 'admin' ? 'primary' : 'default'}
                size="small"
                variant="outlined"
            />
        );
    };

    const getChartData = () => {
        // Mock data for charts
        return [
            { month: 'Jan', users: 5, vehicles: 8, services: 12 },
            { month: 'Feb', users: 8, vehicles: 12, services: 18 },
            { month: 'Mar', users: 12, vehicles: 15, services: 22 },
            { month: 'Apr', users: 15, vehicles: 18, services: 25 },
            { month: 'May', users: 18, vehicles: 22, services: 30 },
            { month: 'Jun', users: 20, vehicles: 25, services: 35 },
        ];
    };

    if (loading) {
        return (
            <Box sx={{ width: '100%' }}>
                <LinearProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="xl">
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AdminPanelSettings /> Admin Dashboard
                </Typography>
                <Typography variant="body1" color="textSecondary" paragraph>
                    Manage users, monitor system activity, and view comprehensive analytics.
                </Typography>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <People sx={{ fontSize: 40, color: 'primary.main' }} />
                                <Box>
                                    <Typography color="textSecondary" variant="body2">
                                        Total Users
                                    </Typography>
                                    <Typography variant="h4">
                                        {users.length}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {users.filter(u => u.status === 'active').length} active
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <DirectionsCar sx={{ fontSize: 40, color: 'success.main' }} />
                                <Box>
                                    <Typography color="textSecondary" variant="body2">
                                        Total Vehicles
                                    </Typography>
                                    <Typography variant="h4">
                                        {vehicles.length}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {vehicles.filter(v => v.current_mileage >= v.next_service_due).length} due
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Build sx={{ fontSize: 40, color: 'warning.main' }} />
                                <Box>
                                    <Typography color="textSecondary" variant="body2">
                                        Total Services
                                    </Typography>
                                    <Typography variant="h4">
                                        {services.length}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        ${services.reduce((sum, s) => sum + s.total_cost, 0).toFixed(2)} revenue
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <TrendingUp sx={{ fontSize: 40, color: 'info.main' }} />
                                <Box>
                                    <Typography color="textSecondary" variant="body2">
                                        Growth Rate
                                    </Typography>
                                    <Typography variant="h4">
                                        24.5%
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        Last 30 days
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange} centered>
                    <Tab icon={<BarChart />} label="Analytics" />
                    <Tab icon={<People />} label="User Management" />
                    <Tab icon={<DirectionsCar />} label="Vehicle Overview" />
                    <Tab icon={<Build />} label="Service Reports" />
                </Tabs>
                
                <Box sx={{ p: 3 }}>
                    {tabValue === 0 && (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={8}>
                                <Typography variant="h6" gutterBottom>
                                    System Growth
                                </Typography>
                                <Box sx={{ height: 400 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsLineChart data={getChartData()}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" />
                                            <YAxis />
                                            <ChartTooltip />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="users"
                                                stroke="#1976d2"
                                                name="Users"
                                                strokeWidth={2}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="vehicles"
                                                stroke="#2e7d32"
                                                name="Vehicles"
                                                strokeWidth={2}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="services"
                                                stroke="#ed6c02"
                                                name="Services"
                                                strokeWidth={2}
                                            />
                                        </RechartsLineChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Grid>
                            
                            <Grid item xs={12} md={4}>
                                <Typography variant="h6" gutterBottom>
                                    User Distribution
                                </Typography>
                                <Box sx={{ height: 400 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Admins', value: users.filter(u => u.role === 'admin').length },
                                                    { name: 'Users', value: users.filter(u => u.role === 'user').length },
                                                ]}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                <Cell fill="#1976d2" />
                                                <Cell fill="#2e7d32" />
                                            </Pie>
                                            <ChartTooltip />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Grid>
                        </Grid>
                    )}
                    
                    {tabValue === 1 && (
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6">
                                    User Management
                                </Typography>
                                <Button
                                    startIcon={<People />}
                                    variant="contained"
                                >
                                    Add New User
                                </Button>
                            </Box>
                            
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Username</TableCell>
                                            <TableCell>Email</TableCell>
                                            <TableCell>Role</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Joined</TableCell>
                                            <TableCell>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {users.map((user) => (
                                            <TableRow key={user.id} hover>
                                                <TableCell>
                                                    <Typography fontWeight="medium">
                                                        {user.username}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>
                                                    {getRoleChip(user.role)}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusChip(user.status)}
                                                </TableCell>
                                                <TableCell>
                                                    {format(parseISO(user.created_at), 'MMM dd, yyyy')}
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <Tooltip title="Edit User">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleEditUser(user)}
                                                            >
                                                                <Edit />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Toggle Status">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleToggleUserStatus(user.id, user.status)}
                                                            >
                                                                {user.status === 'active' ? <Block /> : <CheckCircle />}
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Delete User">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleDeleteUser(user.id)}
                                                                color="error"
                                                            >
                                                                <Delete />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
                    
                    {tabValue === 2 && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Vehicle Overview
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Vehicle Status Distribution
                                            </Typography>
                                            <Box sx={{ height: 300 }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RechartsPieChart>
                                                        <Pie
                                                            data={[
                                                                { name: 'Due for Service', value: vehicles.filter(v => v.current_mileage >= v.next_service_due).length },
                                                                { name: 'Due Soon', value: vehicles.filter(v => {
                                                                    const remaining = v.next_service_due - v.current_mileage;
                                                                    return remaining > 0 && remaining < 1000;
                                                                }).length },
                                                                { name: 'Good', value: vehicles.filter(v => {
                                                                    const remaining = v.next_service_due - v.current_mileage;
                                                                    return remaining >= 1000;
                                                                }).length },
                                                            ]}
                                                            cx="50%"
                                                            cy="50%"
                                                            labelLine={false}
                                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                                                            outerRadius={80}
                                                            fill="#8884d8"
                                                            dataKey="value"
                                                        >
                                                            <Cell fill="#d32f2f" />
                                                            <Cell fill="#ed6c02" />
                                                            <Cell fill="#2e7d32" />
                                                        </Pie>
                                                        <ChartTooltip />
                                                    </RechartsPieChart>
                                                </ResponsiveContainer>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                
                                <Grid item xs={12} md={6}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Recent Vehicle Additions
                                            </Typography>
                                            <TableContainer>
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell>Plate</TableCell>
                                                            <TableCell>Make/Model</TableCell>
                                                            <TableCell>Owner</TableCell>
                                                            <TableCell>Status</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {vehicles.slice(0, 5).map((vehicle) => (
                                                            <TableRow key={vehicle.id} hover>
                                                                <TableCell>{vehicle.plate_number}</TableCell>
                                                                <TableCell>
                                                                    {vehicle.make} {vehicle.model}
                                                                </TableCell>
                                                                <TableCell>{vehicle.owner_name}</TableCell>
                                                                <TableCell>
                                                                    {vehicle.current_mileage >= vehicle.next_service_due ? (
                                                                        <Chip label="Due" color="error" size="small" />
                                                                    ) : (
                                                                        <Chip label="Good" color="success" size="small" />
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                    
                    {tabValue === 3 && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Service Reports
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={8}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Revenue Trend
                                            </Typography>
                                            <Box sx={{ height: 300 }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RechartsBarChart data={getChartData()}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="month" />
                                                        <YAxis />
                                                        <ChartTooltip />
                                                        <Legend />
                                                        <Bar dataKey="services" name="Services" fill="#1976d2" />
                                                    </RechartsBarChart>
                                                </ResponsiveContainer>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                
                                <Grid item xs={12} md={4}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Service Status
                                            </Typography>
                                            <List disablePadding>
                                                <ListItem>
                                                    <ListItemText 
                                                        primary="Completed Services"
                                                        secondary={services.filter(s => s.status === 'completed').length}
                                                    />
                                                    <Chip label="Completed" color="success" size="small" />
                                                </ListItem>
                                                <ListItem>
                                                    <ListItemText 
                                                        primary="Pending Services"
                                                        secondary={services.filter(s => s.status === 'pending').length}
                                                    />
                                                    <Chip label="Pending" color="warning" size="small" />
                                                </ListItem>
                                                <ListItem>
                                                    <ListItemText 
                                                        primary="In Progress"
                                                        secondary={services.filter(s => s.status === 'in_progress').length}
                                                    />
                                                    <Chip label="In Progress" color="info" size="small" />
                                                </ListItem>
                                                <ListItem>
                                                    <ListItemText 
                                                        primary="Cancelled"
                                                        secondary={services.filter(s => s.status === 'cancelled').length}
                                                    />
                                                    <Chip label="Cancelled" color="error" size="small" />
                                                </ListItem>
                                            </List>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </Box>
            </Paper>

            {/* Quick Actions */}
            <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Quick Actions
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Button
                            fullWidth
                            startIcon={<Email />}
                            variant="outlined"
                        >
                            Send Bulk Email
                        </Button>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Button
                            fullWidth
                            startIcon={<Notifications />}
                            variant="outlined"
                        >
                            System Announcement
                        </Button>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Button
                            fullWidth
                            startIcon={<FileDownload />}
                            variant="outlined"
                        >
                            Export All Data
                        </Button>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Button
                            fullWidth
                            startIcon={<Refresh />}
                            variant="contained"
                            onClick={loadAdminData}
                        >
                            Refresh Data
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Edit User Dialog */}
            <Dialog 
                open={openUserDialog} 
                onClose={() => setOpenUserDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Edit User: {selectedUser?.username}
                </DialogTitle>
                <DialogContent>
                    {selectedUser && (
                        <Box sx={{ pt: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Username"
                                        defaultValue={selectedUser.username}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        type="email"
                                        defaultValue={selectedUser.email}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel>Role</InputLabel>
                                        <Select
                                            defaultValue={selectedUser.role}
                                            label="Role"
                                        >
                                            <MenuItem value="user">User</MenuItem>
                                            <MenuItem value="admin">Admin</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel>Status</InputLabel>
                                        <Select
                                            defaultValue={selectedUser.status}
                                            label="Status"
                                        >
                                            <MenuItem value="active">Active</MenuItem>
                                            <MenuItem value="inactive">Inactive</MenuItem>
                                            <MenuItem value="suspended">Suspended</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenUserDialog(false)}>
                        Cancel
                    </Button>
                    <Button variant="contained">
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AdminDashboard;