import React, { useState, useEffect } from 'react';
import {
    TextField,
    Button,
    Grid,
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Alert,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import apiService from '../../services/api';


const VehicleForm = ({ vehicle, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        plate_number: '',
        chassis_number: '',
        make: '',
        model: '',
        year: '',
        color: '',
        current_mileage: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        if (vehicle) {
            setFormData({
                plate_number: vehicle.plate_number || '',
                chassis_number: vehicle.chassis_number || '',
                make: vehicle.make || '',
                model: vehicle.model || '',
                year: vehicle.year || '',
                color: vehicle.color || '',
                current_mileage: vehicle.current_mileage || '',
            });
        }
    }, [vehicle]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (vehicle) {
                // Update vehicle
                const response = await apiService.updateVehicle(vehicle.id, formData);
                if (response.success) {
                    enqueueSnackbar('Vehicle updated successfully', { variant: 'success' });
                    onSuccess();
                } else {
                    setError(response.message);
                }
            } else {
                // Create vehicle
                const response = await apiService.createVehicle(formData);
                if (response.success) {
                    enqueueSnackbar('Vehicle created successfully', { variant: 'success' });
                    onSuccess();
                } else {
                    setError(response.message);
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Plate Number"
                        name="plate_number"
                        value={formData.plate_number}
                        onChange={handleChange}
                        required
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Chassis Number"
                        name="chassis_number"
                        value={formData.chassis_number}
                        onChange={handleChange}
                        required
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Make"
                        name="make"
                        value={formData.make}
                        onChange={handleChange}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Model"
                        name="model"
                        value={formData.model}
                        onChange={handleChange}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel>Year</InputLabel>
                        <Select
                            name="year"
                            value={formData.year}
                            onChange={handleChange}
                            label="Year"
                        >
                            <MenuItem value="">Select Year</MenuItem>
                            {years.map((year) => (
                                <MenuItem key={year} value={year}>
                                    {year}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Color"
                        name="color"
                        value={formData.color}
                        onChange={handleChange}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Current Mileage"
                        name="current_mileage"
                        type="number"
                        value={formData.current_mileage}
                        onChange={handleChange}
                        InputProps={{
                            endAdornment: 'miles',
                        }}
                    />
                </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                >
                    {loading ? 'Saving...' : vehicle ? 'Update Vehicle' : 'Add Vehicle'}
                </Button>
            </Box>
        </Box>
    );
};

export default VehicleForm;