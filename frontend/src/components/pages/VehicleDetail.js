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
    IconButton,
    Chip,
    LinearProgress,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    Tabs,
    Tab,
    Tooltip,
} from '@mui/material';
import {
    ArrowBack,
    Edit,
    Delete,
    QrCode2,
    Build,
    Add,
    Refresh,
    WarningAmber,
    CheckCircle,
    CalendarToday,
    Speed,
    LocalGasStation,
    CarRepair,
    History,
} from '@mui/icons-material';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { format, parseISO, differenceInDays } from 'date-fns';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ChartTooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import apiService from '../services/api';
import QRCodeDialog from '../components/common/QRCodeDialog';

const VehicleDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    
    const [vehicle, setVehicle] = useState(null);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [openQRDialog, setOpenQRDialog] = useState(false);
    const [openServiceDialog, setOpenServiceDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [serviceForm, setServiceForm] = useState({
        service_type_id: '',
        service_date: format(new Date(), 'yyyy-MM-dd'),
        mileage_at_service: '',
        total_cost: '',
        notes: '',
    });

    useEffect(() => {
        loadVehicleData();
    }, [id]);

    const loadVehicleData = async () => {
        try {
            setLoading(true);
            
            // Load vehicle details
            const vehicleResponse = await apiService.getVehicle(id);
            if (vehicleResponse.success) {
                setVehicle(vehicleResponse.data);
                
                // Load QR code
                const qrResponse = await apiService.getVehicleQR(id);
                if (qrResponse.success) {
                    setQrCodeUrl(qrResponse.qrCodeUrl);
                }
            }
            
            // Load vehicle services
            const servicesResponse = await apiService.getServices({ vehicle_id: id });
            if (servicesResponse.success) {
                setServices(servicesResponse.data);
            }
        } catch (error) {
            enqueueSnackbar('Error loading vehicle data', { variant: 'error' });
            navigate('/vehicles');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleDeleteVehicle = async () => {
        try {
            const response = await apiService.deleteVehicle(id);
            if (response.success) {
                enqueueSnackbar('Vehicle deleted successfully', { variant: 'success' });
                navigate('/vehicles');
            }
        } catch (error) {
            enqueueSnackbar('Error deleting vehicle', { variant: 'error' });
        }
        setOpenDeleteDialog(false);
    };

    const handleServiceSubmit = async () => {
        try {
            const serviceData = {
                vehicle_id: id,
                ...serviceForm,
                mileage_at_service: parseFloat(serviceForm.mileage_at_service),
                total_cost: parseFloat(serviceForm.total_cost),
            };
            
            const response = await apiService.createService(serviceData);
            if (response.success) {
                enqueueSnackbar('Service recorded successfully', { variant: 'success' });
                setOpenServiceDialog(false);
                loadVehicleData();
                setServiceForm({
                    service_type_id: '',
                    service_date: format(new Date(), 'yyyy-MM-dd'),
                    mileage_at_service: '',
                    total_cost: '',
                    notes: '',
                });
            }
        } catch (error) {
            enqueueSnackbar('Error recording service', { variant: 'error' });
        }
    };

    const getServiceStatus = () => {
        if (!vehicle) return null;
        
        const now = new Date();
        const dueDate = new Date(vehicle.next_service_date);
        const daysUntilDue = differenceInDays(dueDate, now);
        const mileageRemaining = vehicle.next_service_due - vehicle.current_mileage;
        
        if (vehicle.current_mileage >= vehicle.next_service_due || daysUntilDue <= 0) {
            return {
                status: 'Overdue',
                color: 'error',
                icon: <WarningAmber />,
                message: 'Service is overdue',
            };
        } else if (mileageRemaining < 1000 || daysUntilDue <= 30) {
            return {
                status: 'Due Soon',
                color: 'warning',
                icon: <WarningAmber />,
                message: `Due in ${daysUntilDue} days or ${mileageRemaining.toFixed(0)} miles`,
            };
        } else {
            return {
                status: 'Good',
                color: 'success',
                icon: <CheckCircle />,
                message: `Next service in ${daysUntilDue} days`,
            };
        }
    };

    const getServiceChartData = () => {
        return services.map(service => ({
            date: format(parseISO(service.service_date), 'MMM dd'),
            mileage: service.mileage_at_service,
            cost: service.total_cost,
        }));
    };

    if (loading) {
        return (
            <Box sx={{ width: '100%' }}>
                <LinearProgress />
            </Box>
        );
    }

    if (!vehicle) {
        return (
            <Container>
                <Alert severity="error" sx={{ mt: 4 }}>
                    Vehicle not found
                </Alert>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/vehicles')}
                    sx={{ mt: 2 }}
                >
                    Back to Vehicles
                </Button>
            </Container>
        );
    }

    const serviceStatus = getServiceStatus();

    return (
        <Container maxWidth="lg">
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/vehicles')}
                    sx={{ mb: 2 }}
                >
                    Back to Vehicles
                </Button>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="h4" component="h1" gutterBottom>
                            {vehicle.make} {vehicle.model} ({vehicle.year})
                        </Typography>
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                            Plate: {vehicle.plate_number} • Chassis: {vehicle.chassis_number}
                        </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Record Service">
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => setOpenServiceDialog(true)}
                            >
                                Record Service
                            </Button>
                        </Tooltip>
                        <Tooltip title="QR Code">
                            <IconButton
                                onClick={() => setOpenQRDialog(true)}
                                color="primary"
                            >
                                <QrCode2 />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                            <IconButton
                                onClick={() => navigate(`/vehicles/${id}/edit`)}
                                color="primary"
                            >
                                <Edit />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <IconButton
                                onClick={() => setOpenDeleteDialog(true)}
                                color="error"
                            >
                                <Delete />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Speed sx={{ fontSize: 40, color: 'primary.main' }} />
                                <Box>
                                    <Typography color="textSecondary" variant="body2">
                                        Current Mileage
                                    </Typography>
                                    <Typography variant="h5">
                                        {vehicle.current_mileage.toLocaleString()} miles
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
                                <LocalGasStation sx={{ fontSize: 40, color: 'warning.main' }} />
                                <Box>
                                    <Typography color="textSecondary" variant="body2">
                                        Next Service Due
                                    </Typography>
                                    <Typography variant="h5">
                                        {vehicle.next_service_due.toLocaleString()} miles
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
                                <CalendarToday sx={{ fontSize: 40, color: 'info.main' }} />
                                <Box>
                                    <Typography color="textSecondary" variant="body2">
                                        Last Service Date
                                    </Typography>
                                    <Typography variant="h5">
                                        {vehicle.last_service_date 
                                            ? format(parseISO(vehicle.last_service_date), 'MMM dd, yyyy')
                                            : 'Never'
                                        }
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
                                <Box sx={{ fontSize: 40, color: `${serviceStatus.color}.main` }}>
                                    {serviceStatus.icon}
                                </Box>
                                <Box>
                                    <Typography color="textSecondary" variant="body2">
                                        Service Status
                                    </Typography>
                                    <Typography variant="h5">
                                        {serviceStatus.status}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {serviceStatus.message}
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
                    <Tab icon={<History />} label="Service History" />
                    <Tab icon={<CarRepair />} label="Service Details" />
                    <Tab icon={<Build />} label="Maintenance Schedule" />
                </Tabs>
                
                <Divider />
                
                {/* Tab Content */}
                <Box sx={{ p: 3 }}>
                    {tabValue === 0 && (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={8}>
                                <Typography variant="h6" gutterBottom>
                                    Service History
                                </Typography>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Date</TableCell>
                                                <TableCell>Service Type</TableCell>
                                                <TableCell>Mileage</TableCell>
                                                <TableCell>Cost</TableCell>
                                                <TableCell>Invoice</TableCell>
                                                <TableCell>Status</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {services.length > 0 ? (
                                                services.map((service) => (
                                                    <TableRow 
                                                        key={service.id}
                                                        hover
                                                        onClick={() => navigate(`/services/${service.id}`)}
                                                        sx={{ cursor: 'pointer' }}
                                                    >
                                                        <TableCell>
                                                            {format(parseISO(service.service_date), 'MMM dd, yyyy')}
                                                        </TableCell>
                                                        <TableCell>{service.service_type_name}</TableCell>
                                                        <TableCell>
                                                            {service.mileage_at_service.toLocaleString()} miles
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip 
                                                                label={`$${service.total_cost}`}
                                                                size="small"
                                                                color="success"
                                                                variant="outlined"
                                                            />
                                                        </TableCell>
                                                        <TableCell>{service.invoice_number}</TableCell>
                                                        <TableCell>
                                                            <Chip 
                                                                label={service.status}
                                                                size="small"
                                                                color={
                                                                    service.status === 'completed' ? 'success' :
                                                                    service.status === 'pending' ? 'warning' : 'default'
                                                                }
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                                        <Typography color="textSecondary">
                                                            No service history found
                                                        </Typography>
                                                        <Button
                                                            startIcon={<Add />}
                                                            onClick={() => setOpenServiceDialog(true)}
                                                            sx={{ mt: 2 }}
                                                        >
                                                            Record First Service
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>
                            
                            <Grid item xs={12} md={4}>
                                <Typography variant="h6" gutterBottom>
                                    Mileage Trend
                                </Typography>
                                <Box sx={{ height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={getServiceChartData()}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <ChartTooltip />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="mileage"
                                                stroke="#1976d2"
                                                name="Mileage"
                                                strokeWidth={2}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Grid>
                        </Grid>
                    )}
                    
                    {tabValue === 1 && (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="h6" gutterBottom>
                                    Vehicle Information
                                </Typography>
                                <Paper sx={{ p: 2 }}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="textSecondary">
                                                Plate Number
                                            </Typography>
                                            <Typography variant="body1">
                                                {vehicle.plate_number}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="textSecondary">
                                                Chassis Number
                                            </Typography>
                                            <Typography variant="body1">
                                                {vehicle.chassis_number}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="textSecondary">
                                                Make
                                            </Typography>
                                            <Typography variant="body1">
                                                {vehicle.make || 'N/A'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="textSecondary">
                                                Model
                                            </Typography>
                                            <Typography variant="body1">
                                                {vehicle.model || 'N/A'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="textSecondary">
                                                Year
                                            </Typography>
                                            <Typography variant="body1">
                                                {vehicle.year || 'N/A'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="textSecondary">
                                                Color
                                            </Typography>
                                            <Typography variant="body1">
                                                {vehicle.color || 'N/A'}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                                <Typography variant="h6" gutterBottom>
                                    Service Information
                                </Typography>
                                <Paper sx={{ p: 2 }}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="textSecondary">
                                                Total Services
                                            </Typography>
                                            <Typography variant="body1">
                                                {services.length}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="textSecondary">
                                                Total Service Cost
                                            </Typography>
                                            <Typography variant="body1">
                                                ${services.reduce((sum, s) => sum + s.total_cost, 0).toFixed(2)}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="textSecondary">
                                                Average Service Cost
                                            </Typography>
                                            <Typography variant="body1">
                                                ${services.length > 0 
                                                    ? (services.reduce((sum, s) => sum + s.total_cost, 0) / services.length).toFixed(2)
                                                    : '0.00'
                                                }
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="textSecondary">
                                                Last Service
                                            </Typography>
                                            <Typography variant="body1">
                                                {vehicle.last_service_date 
                                                    ? format(parseISO(vehicle.last_service_date), 'MMM dd, yyyy')
                                                    : 'Never'
                                                }
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Grid>
                        </Grid>
                    )}
                    
                    {tabValue === 2 && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Maintenance Schedule
                            </Typography>
                            <Paper sx={{ p: 2 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="subtitle1">
                                                Next Service
                                            </Typography>
                                            <Chip 
                                                label={serviceStatus.status}
                                                color={serviceStatus.color}
                                                icon={serviceStatus.icon}
                                            />
                                        </Box>
                                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                            Due at {vehicle.next_service_due.toLocaleString()} miles
                                            {vehicle.next_service_date && (
                                                <> or by {format(parseISO(vehicle.next_service_date), 'MMM dd, yyyy')}</>
                                            )}
                                        </Typography>
                                    </Grid>
                                    
                                    <Grid item xs={12}>
                                        <Divider sx={{ my: 2 }} />
                                        <Typography variant="subtitle1" gutterBottom>
                                            Recommended Maintenance
                                        </Typography>
                                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                                            <li>
                                                <Typography variant="body2">
                                                    Oil change every 3,000-5,000 miles
                                                </Typography>
                                            </li>
                                            <li>
                                                <Typography variant="body2">
                                                    Tire rotation every 6,000-8,000 miles
                                                </Typography>
                                            </li>
                                            <li>
                                                <Typography variant="body2">
                                                    Brake inspection every 10,000 miles
                                                </Typography>
                                            </li>
                                            <li>
                                                <Typography variant="body2">
                                                    Air filter replacement every 15,000 miles
                                                </Typography>
                                            </li>
                                        </ul>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Box>
                    )}
                </Box>
            </Paper>

            {/* QR Code Dialog */}
            <QRCodeDialog
                open={openQRDialog}
                onClose={() => setOpenQRDialog(false)}
                qrCodeUrl={qrCodeUrl}
            />

            {/* Record Service Dialog */}
            <Dialog 
                open={openServiceDialog} 
                onClose={() => setOpenServiceDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Record New Service</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Service Date"
                                    type="date"
                                    value={serviceForm.service_date}
                                    onChange={(e) => setServiceForm({...serviceForm, service_date: e.target.value})}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Current Mileage"
                                    type="number"
                                    value={serviceForm.mileage_at_service}
                                    onChange={(e) => setServiceForm({...serviceForm, mileage_at_service: e.target.value})}
                                    InputProps={{
                                        endAdornment: 'miles',
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Total Cost"
                                    type="number"
                                    value={serviceForm.total_cost}
                                    onChange={(e) => setServiceForm({...serviceForm, total_cost: e.target.value})}
                                    InputProps={{
                                        startAdornment: '$',
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Notes"
                                    multiline
                                    rows={3}
                                    value={serviceForm.notes}
                                    onChange={(e) => setServiceForm({...serviceForm, notes: e.target.value})}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenServiceDialog(false)}>Cancel</Button>
                    <Button 
                        onClick={handleServiceSubmit}
                        variant="contained"
                    >
                        Record Service
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={openDeleteDialog}
                onClose={() => setOpenDeleteDialog(false)}
            >
                <DialogTitle>Delete Vehicle</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Are you sure you want to delete this vehicle? This action cannot be undone.
                        All service records for this vehicle will also be deleted.
                    </Alert>
                    <Typography variant="body2" color="textSecondary">
                        Vehicle: {vehicle.plate_number} ({vehicle.make} {vehicle.model})
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
                    <Button 
                        onClick={handleDeleteVehicle}
                        variant="contained"
                        color="error"
                    >
                        Delete Vehicle
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default VehicleDetail;