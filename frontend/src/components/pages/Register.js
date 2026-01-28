import React, { useState } from 'react';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    Link,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Fade,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        // Clear error for this field
        if (errors[e.target.name]) {
            setErrors({
                ...errors,
                [e.target.name]: '',
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            // Remove confirmPassword from submission
            const { confirmPassword, ...registrationData } = formData;
            
            const response = await register(registrationData);
            
            if (response.success) {
                enqueueSnackbar('Registration successful! Welcome!', { variant: 'success' });
                navigate('/');
            } else {
                setErrors({ general: response.message });
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Registration failed';
            setErrors({ general: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, mb: 4 }}>
                <Fade in={true}>
                    <Paper 
                        elevation={3} 
                        sx={{ 
                            p: 4, 
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
                        }}
                    >
                        <Typography 
                            variant="h4" 
                            align="center" 
                            gutterBottom 
                            sx={{ 
                                fontWeight: 'bold',
                                color: '#1976d2',
                                mb: 3
                            }}
                        >
                            🚗 Create Account
                        </Typography>
                        
                        <Typography 
                            variant="body1" 
                            align="center" 
                            gutterBottom 
                            sx={{ mb: 4, color: 'text.secondary' }}
                        >
                            Join Vehicle Service Management to start managing your fleet
                        </Typography>
                        
                        {errors.general && (
                            <Alert 
                                severity="error" 
                                sx={{ mb: 3 }}
                                onClose={() => setErrors({ ...errors, general: '' })}
                            >
                                {errors.general}
                            </Alert>
                        )}
                        
                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Username"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        error={!!errors.username}
                                        helperText={errors.username}
                                        disabled={loading}
                                    />
                                </Grid>
                                
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Email Address"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        error={!!errors.email}
                                        helperText={errors.email}
                                        disabled={loading}
                                    />
                                </Grid>
                                
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Password"
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        error={!!errors.password}
                                        helperText={errors.password}
                                        disabled={loading}
                                    />
                                </Grid>
                                
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Confirm Password"
                                        name="confirmPassword"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        error={!!errors.confirmPassword}
                                        helperText={errors.confirmPassword}
                                        disabled={loading}
                                    />
                                </Grid>
                                
                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel>Account Type</InputLabel>
                                        <Select
                                            name="role"
                                            value={formData.role}
                                            onChange={handleChange}
                                            label="Account Type"
                                            disabled={loading}
                                        >
                                            <MenuItem value="user">Regular User</MenuItem>
                                            <MenuItem value="admin">Administrator</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                                        Note: Admin accounts require verification
                                    </Typography>
                                </Grid>
                            </Grid>
                            
                            <Button
                                fullWidth
                                type="submit"
                                variant="contained"
                                size="large"
                                disabled={loading}
                                sx={{ 
                                    mt: 3, 
                                    mb: 2,
                                    py: 1.5,
                                    fontSize: '1.1rem'
                                }}
                            >
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </Button>
                        </form>
                        
                        <Box sx={{ mt: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="textSecondary">
                                Already have an account?{' '}
                                <Link 
                                    component={RouterLink} 
                                    to="/login" 
                                    sx={{ fontWeight: 'bold', textDecoration: 'none' }}
                                >
                                    Sign in
                                </Link>
                            </Typography>
                            
                            <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                <Typography variant="caption" color="textSecondary">
                                    <strong>Benefits of registering:</strong>
                                    <br />
                                    • Track multiple vehicles
                                    <br />
                                    • Receive service reminders
                                    <br />
                                    • Generate detailed reports
                                    <br />
                                    • Export data to Excel
                                    <br />
                                    • QR code vehicle identification
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Fade>
            </Box>
        </Container>
    );
};

export default Register;