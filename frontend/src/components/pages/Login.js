import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    Link,
    FormControlLabel,
    Checkbox,
    Grid,
    Fade,
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from 'notistack';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await login(email, password);
            
            if (response.success) {
                enqueueSnackbar('Login successful!', { variant: 'success' });
                navigate('/');
            } else {
                setError(response.message || 'Login failed');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = (role) => {
        if (role === 'admin') {
            setEmail('admin@example.com');
            setPassword('admin123');
        } else {
            setEmail('user@example.com');
            setPassword('user123');
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
                            🚗 Vehicle Service Management
                        </Typography>
                        
                        <Typography 
                            variant="h6" 
                            align="center" 
                            gutterBottom 
                            sx={{ mb: 4, color: 'text.secondary' }}
                        >
                            Sign in to your account
                        </Typography>
                        
                        {error && (
                            <Alert 
                                severity="error" 
                                sx={{ mb: 3 }}
                                onClose={() => setError('')}
                            >
                                {error}
                            </Alert>
                        )}
                        
                        <form onSubmit={handleSubmit}>
                            <TextField
                                fullWidth
                                label="Email Address"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                margin="normal"
                                required
                                autoComplete="email"
                                autoFocus
                            />
                            
                            <TextField
                                fullWidth
                                label="Password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                margin="normal"
                                required
                                autoComplete="current-password"
                            />
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            color="primary"
                                        />
                                    }
                                    label="Remember me"
                                />
                                
                                <Link 
                                    component={RouterLink} 
                                    to="/forgot-password" 
                                    variant="body2"
                                    sx={{ textDecoration: 'none' }}
                                >
                                    Forgot password?
                                </Link>
                            </Box>
                            
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
                                {loading ? 'Signing in...' : 'Sign In'}
                            </Button>
                        </form>
                        
                        <Box sx={{ mt: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                Don't have an account?{' '}
                                <Link 
                                    component={RouterLink} 
                                    to="/register" 
                                    sx={{ fontWeight: 'bold', textDecoration: 'none' }}
                                >
                                    Sign up
                                </Link>
                            </Typography>
                            
                            <Divider sx={{ my: 3 }}>
                                <Typography variant="body2" color="textSecondary">
                                    Demo Accounts
                                </Typography>
                            </Divider>
                            
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        color="primary"
                                        onClick={() => handleDemoLogin('admin')}
                                        sx={{ py: 1.5 }}
                                    >
                                        👑 Admin Demo
                                    </Button>
                                </Grid>
                                <Grid item xs={6}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        color="secondary"
                                        onClick={() => handleDemoLogin('user')}
                                        sx={{ py: 1.5 }}
                                    >
                                        👤 User Demo
                                    </Button>
                                </Grid>
                            </Grid>
                            
                            <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                <Typography variant="caption" color="textSecondary">
                                    <strong>Note:</strong> Demo accounts use pre-configured data.
                                    Admin has full access, while regular users can only manage their own vehicles.
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Fade>
            </Box>
        </Container>
    );
};

export default Login;