import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Grid,
    InputAdornment,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { format, parseISO } from 'date-fns';
import apiService from '../../services/api';

const ServiceFormDialog = ({ open, onClose, service, onSuccess }) => {
    const [formData, setFormData] = useState({
        vehicle_id: '',
        service_type_id: '',
        service_date: format(new Date(), 'yyyy-MM-dd'),
        mileage_at_service: '',
        total_cost: '',
        notes: '',
        status: 'pending', // Changed from 'completed' to 'pending' to match backend mapping
    });
    
    const [vehicles, setVehicles] = useState([]);
    const [serviceTypes, setServiceTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    // Fallback service types in case API fails or returns empty
    const fallbackServiceTypes = [
        { id: 1, name: 'Oil Change' },
        { id: 2, name: 'Brake Service' },
        { id: 3, name: 'Tire Rotation' },
        { id: 4, name: 'Engine Tune-up' },
        { id: 5, name: 'Transmission Service' },
        { id: 6, name: 'Battery Replacement' },
        { id: 7, name: 'AC Service' },
        { id: 8, name: 'General Maintenance' },
        { id: 9, name: 'Suspension Service' },
        { id: 10, name: 'Exhaust Repair' },
        { id: 11, name: 'Electrical Repair' },
        { id: 12, name: 'Cooling System Service' },
        { id: 13, name: 'Wheel Alignment' },
        { id: 14, name: 'Fuel System Service' },
        { id: 15, name: 'Spark Plug Replacement' },
        { id: 16, name: 'Air Filter Replacement' },
        { id: 17, name: 'Cabin Filter Replacement' },
        { id: 18, name: 'Windshield Wiper Replacement' },
        { id: 19, name: 'Headlight/Taillight Replacement' },
        { id: 20, name: 'Diagnostic Service' },
    ];

    useEffect(() => {
        if (open) {
            loadFormData();
            if (service) {
                // If editing existing service
                setFormData({
                    vehicle_id: service.vehicle_id || '',
                    service_type_id: service.service_type_id || '',
                    service_date: format(parseISO(service.service_date), 'yyyy-MM-dd'),
                    mileage_at_service: service.mileage_at_service || '',
                    total_cost: service.total_cost || '',
                    notes: service.notes || '',
                    status: service.status || 'pending', // Changed to 'pending'
                });
            } else {
                // If adding new service
                setFormData({
                    vehicle_id: '',
                    service_type_id: '',
                    service_date: format(new Date(), 'yyyy-MM-dd'),
                    mileage_at_service: '',
                    total_cost: '',
                    notes: '',
                    status: 'pending', // Changed to 'pending'
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
            await loadServiceTypes();
            
        } catch (error) {
            console.error('Error loading form data:', error);
            enqueueSnackbar('Error loading form data', { variant: 'error' });
        }
    };

    const loadServiceTypes = async () => {
        try {
            console.log('Loading service types from API...');
            const response = await apiService.getServiceTypes();
            console.log('Service Types API Response:', response);
            
            let types = [];
            
            // Handle different response structures
            if (response && response.data && Array.isArray(response.data)) {
                types = response.data;
            } else if (response && Array.isArray(response)) {
                types = response;
            } else if (response && response.success && response.data && Array.isArray(response.data)) {
                types = response.data;
            } else if (response && response.serviceTypes) {
                types = response.serviceTypes;
            }
            
            if (types && types.length > 0) {
                console.log(`Loaded ${types.length} service types from API`);
                setServiceTypes(types);
            } else {
                console.log('API returned empty data, using fallback service types');
                setServiceTypes(fallbackServiceTypes);
            }
            
        } catch (error) {
            console.warn('Failed to load service types from API, using fallback:', error.message);
            setServiceTypes(fallbackServiceTypes);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate required fields
        if (!formData.vehicle_id || !formData.service_date || !formData.mileage_at_service || !formData.total_cost) {
            enqueueSnackbar('Please fill in all required fields', { variant: 'warning' });
            return;
        }
        
        // Validate mileage is not too large
        const mileage = parseFloat(formData.mileage_at_service);
        if (mileage > 2000000) {
            enqueueSnackbar('Mileage value too large. Please enter a value under 2,000,000', { variant: 'error' });
            return;
        }
        
        if (mileage < 0) {
            enqueueSnackbar('Mileage cannot be negative', { variant: 'error' });
            return;
        }
        
        setLoading(true);

        try {
            const serviceData = {
                ...formData,
                vehicle_id: parseInt(formData.vehicle_id),
                service_type_id: formData.service_type_id ? parseInt(formData.service_type_id) : null,
                mileage_at_service: parseFloat(formData.mileage_at_service),
                total_cost: parseFloat(formData.total_cost),
            };

            console.log('Submitting service data:', serviceData);

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
            } else {
                throw new Error(response.message || 'Failed to save service');
            }
        } catch (error) {
            console.error('Error saving service:', error);
            enqueueSnackbar(error.message || 'Error saving service', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData({
            ...formData,
            [field]: value
        });
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="md" 
            fullWidth
            PaperProps={{
                sx: { maxHeight: '90vh' }
            }}
        >
            <DialogTitle>
                {service ? 'Edit Service' : 'Add New Service'}
            </DialogTitle>
            <DialogContent dividers>
                <Box component="form" onSubmit={handleSubmit} sx={{ pt: 1 }}>
                    <Grid container spacing={2}>
                        {/* Vehicle Selection */}
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Vehicle *</InputLabel>
                                <Select
                                    value={formData.vehicle_id}
                                    onChange={(e) => handleInputChange('vehicle_id', e.target.value)}
                                    label="Vehicle *"
                                    disabled={loading}
                                >
                                    <MenuItem value="">Select Vehicle</MenuItem>
                                    {vehicles.map((vehicle) => (
                                        <MenuItem key={vehicle.id} value={vehicle.id}>
                                            {vehicle.plate_number} - {vehicle.make} {vehicle.model} 
                                            {vehicle.year ? ` (${vehicle.year})` : ''}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        {/* Service Type Selection */}
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Service Type *</InputLabel>
                                <Select
                                    value={formData.service_type_id}
                                    onChange={(e) => handleInputChange('service_type_id', e.target.value)}
                                    label="Service Type *"
                                    disabled={loading}
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
                        
                        {/* Service Date */}
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Service Date *"
                                type="date"
                                value={formData.service_date}
                                onChange={(e) => handleInputChange('service_date', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                required
                                disabled={loading}
                            />
                        </Grid>
                        
                        {/* Status */}
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={formData.status}
                                    onChange={(e) => handleInputChange('status', e.target.value)}
                                    label="Status"
                                    disabled={loading}
                                >
                                    <MenuItem value="pending">Pending</MenuItem>
                                    <MenuItem value="in_progress">In Progress</MenuItem>
                                    <MenuItem value="completed">Completed</MenuItem>
                                    <MenuItem value="cancelled">Cancelled</MenuItem>
                                    <MenuItem value="delayed">Delayed</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        {/* Mileage */}
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Mileage at Service *"
                                type="number"
                                value={formData.mileage_at_service}
                                onChange={(e) => handleInputChange('mileage_at_service', e.target.value)}
                                required
                                disabled={loading}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">miles</InputAdornment>,
                                }}
                                helperText="Enter a value under 2,000,000"
                            />
                        </Grid>
                        
                        {/* Total Cost */}
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Total Cost *"
                                type="number"
                                value={formData.total_cost}
                                onChange={(e) => handleInputChange('total_cost', e.target.value)}
                                required
                                disabled={loading}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                }}
                            />
                        </Grid>
                        
                        {/* Notes */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Notes"
                                multiline
                                rows={3}
                                value={formData.notes}
                                onChange={(e) => handleInputChange('notes', e.target.value)}
                                disabled={loading}
                                placeholder="Enter any additional notes about the service..."
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
                    color="primary"
                >
                    {loading ? 'Saving...' : (service ? 'Update Service' : 'Create Service')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ServiceFormDialog;