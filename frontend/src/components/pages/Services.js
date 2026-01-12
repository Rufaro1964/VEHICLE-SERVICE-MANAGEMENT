import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Typography,
    Box,
    Chip,
    Grid,
    Card,
    CardContent,
    LinearProgress,
    Menu,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Tooltip,
    Fab,
    InputAdornment,
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    MoreVert,
    Search,
    FilterList,
    FileDownload,
    Refresh,
    Receipt,
    Build,
    CalendarToday,
    ArrowRight,
    Visibility,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { format, parseISO } from 'date-fns';
//import apiService from '../services/api';
import apiService from '../../services/api';

const Services = () => {
    const [services, setServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [vehicleFilter, setVehicleFilter] = useState('all');
    const [dateRange, setDateRange] = useState({
        start: null,
        end: null,
    });
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedService, setSelectedService] = useState(null);
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        fetchServices();
    }, []);

    useEffect(() => {
        filterServices();
    }, [services, searchTerm, statusFilter, vehicleFilter, dateRange]);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const response = await apiService.getServices();
            if (response.success) {
                setServices(response.data);
            }
        } catch (error) {
            enqueueSnackbar('Error fetching services', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const filterServices = () => {
        let filtered = services;

        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(service =>
                service.invoice_number?.toLowerCase().includes(term) ||
                service.plate_number?.toLowerCase().includes(term) ||
                service.service_type_name?.toLowerCase().includes(term)
            );
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(service => service.status === statusFilter);
        }

        // Apply vehicle filter
        if (vehicleFilter !== 'all') {
            filtered = filtered.filter(service => service.vehicle_id === parseInt(vehicleFilter));
        }

        // Apply date range filter
        if (dateRange.start) {
            filtered = filtered.filter(service => 
                new Date(service.service_date) >= dateRange.start
            );
        }
        if (dateRange.end) {
            filtered = filtered.filter(service => 
                new Date(service.service_date) <= dateRange.end
            );
        }

        setFilteredServices(filtered);
    };

    const handleAddClick = () => {
        setEditingService(null);
        setOpenDialog(true);
    };

    const handleEditClick = (service) => {
        setEditingService(service);
        setOpenDialog(true);
    };

    const handleDeleteClick = async (id) => {
        if (window.confirm('Are you sure you want to delete this service record?')) {
            try {
                const response = await apiService.deleteService(id);
                if (response.success) {
                    enqueueSnackbar('Service deleted successfully', { variant: 'success' });
                    fetchServices();
                }
            } catch (error) {
                enqueueSnackbar('Error deleting service', { variant: 'error' });
            }
        }
    };

    const handleMenuOpen = (event, service) => {
        setAnchorEl(event.currentTarget);
        setSelectedService(service);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedService(null);
    };

    const handleExport = async () => {
        try {
            const params = {};
            if (statusFilter !== 'all') params.status = statusFilter;
            if (vehicleFilter !== 'all') params.vehicle_id = vehicleFilter;
            if (dateRange.start) params.start_date = format(dateRange.start, 'yyyy-MM-dd');
            if (dateRange.end) params.end_date = format(dateRange.end, 'yyyy-MM-dd');
            
            const blob = await apiService.exportServicesToExcel(params);
            apiService.downloadFile(blob, `services-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
            enqueueSnackbar('Export completed successfully', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Error exporting services', { variant: 'error' });
        }
        handleMenuClose();
    };

    const getStatusChip = (status) => {
        const statusConfig = {
            completed: { color: 'success', label: 'Completed' },
            pending: { color: 'warning', label: 'Pending' },
            in_progress: { color: 'info', label: 'In Progress' },
            cancelled: { color: 'error', label: 'Cancelled' },
        };
        
        const config = statusConfig[status] || { color: 'default', label: status };
        return (
            <Chip
                label={config.label}
                color={config.color}
                size="small"
            />
        );
    };

    const getVehicles = () => {
        const vehiclesMap = new Map();
        services.forEach(service => {
            if (service.vehicle_id) {
                vehiclesMap.set(service.vehicle_id, {
                    id: service.vehicle_id,
                    name: service.plate_number || `Vehicle ${service.vehicle_id}`,
                });
            }
        });
        return Array.from(vehiclesMap.values());
    };

    const calculateStats = () => {
        const today = new Date();
        const last30Days = new Date();
        last30Days.setDate(today.getDate() - 30);

        const recentServices = services.filter(service => 
            new Date(service.service_date) >= last30Days
        );

        return {
            totalServices: services.length,
            recentServices: recentServices.length,
            totalRevenue: services.reduce((sum, service) => sum + service.total_cost, 0),
            recentRevenue: recentServices.reduce((sum, service) => sum + service.total_cost, 0),
            averageCost: services.length > 0 
                ? services.reduce((sum, service) => sum + service.total_cost, 0) / services.length
                : 0,
        };
    };

    if (loading) {
        return (
            <Box sx={{ width: '100%' }}>
                <LinearProgress />
            </Box>
        );
    }

    const stats = calculateStats();
    const vehicles = getVehicles();

    return (
        <Container maxWidth="xl">
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Service Records
                </Typography>
                <Typography variant="body1" color="textSecondary" paragraph>
                    Manage all vehicle service records, track maintenance history, and generate reports.
                </Typography>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom variant="body2">
                                Total Services
                            </Typography>
                            <Typography variant="h4">
                                {stats.totalServices}
                            </Typography>
                            <Typography variant="caption" color="success.main">
                                +{stats.recentServices} in last 30 days
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom variant="body2">
                                Total Revenue
                            </Typography>
                            <Typography variant="h4" color="success.main">
                                ${stats.totalRevenue.toFixed(2)}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                ${stats.recentRevenue.toFixed(2)} recent
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom variant="body2">
                                Average Service Cost
                            </Typography>
                            <Typography variant="h4">
                                ${stats.averageCost.toFixed(2)}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                per service
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom variant="body2">
                                Active Vehicles
                            </Typography>
                            <Typography variant="h4">
                                {vehicles.length}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                with service records
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Toolbar */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            placeholder="Search services..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    
                    <Grid item xs={12} md={9}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={statusFilter}
                                        label="Status"
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <MenuItem value="all">All Status</MenuItem>
                                        <MenuItem value="completed">Completed</MenuItem>
                                        <MenuItem value="pending">Pending</MenuItem>
                                        <MenuItem value="in_progress">In Progress</MenuItem>
                                        <MenuItem value="cancelled">Cancelled</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            
                            <Grid item xs={12} sm={4}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Vehicle</InputLabel>
                                    <Select
                                        value={vehicleFilter}
                                        label="Vehicle"
                                        onChange={(e) => setVehicleFilter(e.target.value)}
                                    >
                                        <MenuItem value="all">All Vehicles</MenuItem>
                                        {vehicles.map((vehicle) => (
                                            <MenuItem key={vehicle.id} value={vehicle.id}>
                                                {vehicle.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            
                            <Grid item xs={12} sm={4}>
                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                    <DatePicker
                                        label="From Date"
                                        value={dateRange.start}
                                        onChange={(newValue) => setDateRange({...dateRange, start: newValue})}
                                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            
                            <Grid item xs={12} sm={4}>
                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                    <DatePicker
                                        label="To Date"
                                        value={dateRange.end}
                                        onChange={(newValue) => setDateRange({...dateRange, end: newValue})}
                                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            
                            <Grid item xs={12} sm={4} sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    startIcon={<Refresh />}
                                    onClick={fetchServices}
                                    variant="outlined"
                                    fullWidth
                                >
                                    Refresh
                                </Button>
                                <Button
                                    startIcon={<FileDownload />}
                                    onClick={handleExport}
                                    variant="outlined"
                                    fullWidth
                                >
                                    Export
                                </Button>
                                <Button
                                    startIcon={<Add />}
                                    onClick={handleAddClick}
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                >
                                    Add Service
                                </Button>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>

            {/* Services Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Invoice #</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Vehicle</TableCell>
                            <TableCell>Service Type</TableCell>
                            <TableCell>Mileage</TableCell>
                            <TableCell>Cost</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Technician</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredServices.length > 0 ? (
                            filteredServices.map((service) => (
                                <TableRow key={service.id} hover>
                                    <TableCell>
                                        <Typography fontWeight="medium">
                                            {service.invoice_number || 'N/A'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {format(parseISO(service.service_date), 'MMM dd, yyyy')}
                                    </TableCell>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2">
                                                {service.plate_number}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {service.make} {service.model}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{service.service_type_name}</TableCell>
                                    <TableCell>
                                        {service.mileage_at_service.toLocaleString()} miles
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={`$${service.total_cost}`}
                                            color="success"
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {getStatusChip(service.status)}
                                    </TableCell>
                                    <TableCell>
                                        {service.technician_name || 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Tooltip title="View Details">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => navigate(`/services/${service.id}`)}
                                                >
                                                    <Visibility />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleEditClick(service)}
                                                >
                                                    <Edit />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="More options">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => handleMenuOpen(e, service)}
                                                >
                                                    <MoreVert />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Build sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                        <Typography variant="h6" color="textSecondary" gutterBottom>
                                            No service records found
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                                            {searchTerm || statusFilter !== 'all' || vehicleFilter !== 'all' 
                                                ? 'Try changing your filters'
                                                : 'Start by adding your first service record'
                                            }
                                        </Typography>
                                        {!searchTerm && statusFilter === 'all' && vehicleFilter === 'all' && (
                                            <Button
                                                startIcon={<Add />}
                                                onClick={handleAddClick}
                                                variant="contained"
                                            >
                                                Add Service Record
                                            </Button>
                                        )}
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Context Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => {
                    navigate(`/services/${selectedService.id}`);
                    handleMenuClose();
                }}>
                    <Visibility fontSize="small" sx={{ mr: 1 }} />
                    View Details
                </MenuItem>
                <MenuItem onClick={() => {
                    handleEditClick(selectedService);
                    handleMenuClose();
                }}>
                    <Edit fontSize="small" sx={{ mr: 1 }} />
                    Edit
                </MenuItem>
                <MenuItem onClick={() => {
                    navigate(`/vehicles/${selectedService.vehicle_id}`);
                    handleMenuClose();
                }}>
                    <ArrowRight fontSize="small" sx={{ mr: 1 }} />
                    Go to Vehicle
                </MenuItem>
                <MenuItem onClick={() => {
                    handleDeleteClick(selectedService.id);
                    handleMenuClose();
                }}>
                    <Delete fontSize="small" sx={{ mr: 1 }} />
                    Delete
                </MenuItem>
            </Menu>

            {/* Add/Edit Service Dialog */}
            <ServiceFormDialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                service={editingService}
                onSuccess={() => {
                    setOpenDialog(false);
                    fetchServices();
                }}
            />

            {/* Floating Action Button for Mobile */}
            <Fab
                color="primary"
                aria-label="add service"
                onClick={handleAddClick}
                sx={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                    display: { xs: 'flex', md: 'none' },
                }}
            >
                <Add />
            </Fab>
        </Container>
    );
};

// Service Form Dialog Component
const ServiceFormDialog = ({ open, onClose, service, onSuccess }) => {
    const [formData, setFormData] = useState({
        vehicle_id: '',
        service_type_id: '',
        service_date: format(new Date(), 'yyyy-MM-dd'),
        mileage_at_service: '',
        total_cost: '',
        notes: '',
        status: 'completed',
    });
    const [vehicles, setVehicles] = useState([]);
    const [serviceTypes, setServiceTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        if (open) {
            loadFormData();
            if (service) {
                setFormData({
                    vehicle_id: service.vehicle_id || '',
                    service_type_id: service.service_type_id || '',
                    service_date: format(parseISO(service.service_date), 'yyyy-MM-dd'),
                    mileage_at_service: service.mileage_at_service || '',
                    total_cost: service.total_cost || '',
                    notes: service.notes || '',
                    status: service.status || 'completed',
                });
            }
        }
    }, [open, service]);

    const loadFormData = async () => {
        try {
            // Load vehicles
            const vehiclesResponse = await apiService.getVehicles();
            if (vehiclesResponse.success) {
                setVehicles(vehiclesResponse.data);
            }
            
            // Load service types
            const typesResponse = await apiService.getServiceTypes();
            if (typesResponse.success) {
                setServiceTypes(typesResponse.data);
            }
        } catch (error) {
            enqueueSnackbar('Error loading form data', { variant: 'error' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const serviceData = {
                ...formData,
                mileage_at_service: parseFloat(formData.mileage_at_service),
                total_cost: parseFloat(formData.total_cost),
            };

            let response;
            if (service) {
                response = await apiService.updateService(service.id, serviceData);
            } else {
                response = await apiService.createService(serviceData);
            }

            if (response.success) {
                enqueueSnackbar(
                    service ? 'Service updated successfully' : 'Service created successfully',
                    { variant: 'success' }
                );
                onSuccess();
            }
        } catch (error) {
            enqueueSnackbar('Error saving service', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {service ? 'Edit Service' : 'Add New Service'}
            </DialogTitle>
            <DialogContent>
                <Box component="form" onSubmit={handleSubmit} sx={{ pt: 2 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Vehicle</InputLabel>
                                <Select
                                    value={formData.vehicle_id}
                                    onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})}
                                    label="Vehicle"
                                >
                                    <MenuItem value="">Select Vehicle</MenuItem>
                                    {vehicles.map((vehicle) => (
                                        <MenuItem key={vehicle.id} value={vehicle.id}>
                                            {vehicle.plate_number} - {vehicle.make} {vehicle.model}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Service Type</InputLabel>
                                <Select
                                    value={formData.service_type_id}
                                    onChange={(e) => setFormData({...formData, service_type_id: e.target.value})}
                                    label="Service Type"
                                >
                                    <MenuItem value="">Select Type</MenuItem>
                                    {serviceTypes.map((type) => (
                                        <MenuItem key={type.id} value={type.id}>
                                            {type.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Service Date"
                                type="date"
                                value={formData.service_date}
                                onChange={(e) => setFormData({...formData, service_date: e.target.value})}
                                InputLabelProps={{ shrink: true }}
                                required
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={formData.status}
                                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                                    label="Status"
                                >
                                    <MenuItem value="pending">Pending</MenuItem>
                                    <MenuItem value="in_progress">In Progress</MenuItem>
                                    <MenuItem value="completed">Completed</MenuItem>
                                    <MenuItem value="cancelled">Cancelled</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Mileage at Service"
                                type="number"
                                value={formData.mileage_at_service}
                                onChange={(e) => setFormData({...formData, mileage_at_service: e.target.value})}
                                required
                                InputProps={{
                                    endAdornment: 'miles',
                                }}
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Total Cost"
                                type="number"
                                value={formData.total_cost}
                                onChange={(e) => setFormData({...formData, total_cost: e.target.value})}
                                required
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                }}
                            />
                        </Grid>
                        
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Notes"
                                multiline
                                rows={3}
                                value={formData.notes}
                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                >
                    {loading ? 'Saving...' : (service ? 'Update Service' : 'Create Service')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default Services;