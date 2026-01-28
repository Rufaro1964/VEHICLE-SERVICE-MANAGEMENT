import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    TextField,
    Button,
    Divider,
    Switch,
    FormControlLabel,
    Alert,
    LinearProgress,
    Tabs,
    Tab,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Avatar,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    ListItemButton, 
    Chip,
} from '@mui/material';
import {
    Settings,
    Person,
    Notifications,
    Security,
    Email,
    Sms,
    Language,
    Save,
    Refresh,
    PhotoCamera,
    Delete,
    Add,
    Edit,
    Key,
    Visibility,
    VisibilityOff,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';

const SettingsPage = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        language: 'en',
        timezone: 'UTC',
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [notificationSettings, setNotificationSettings] = useState({
        emailNotifications: true,
        smsNotifications: false,
        serviceReminders: true,
        maintenanceAlerts: true,
        marketingEmails: false,
    });
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                email: user.email || '',
                phone: user.phone || '',
                language: user.language || 'en',
                timezone: user.timezone || 'UTC',
            });
        }
    }, [user]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleProfileChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({
            ...passwordData,
            [e.target.name]: e.target.value,
        });
    };

    const handleNotificationChange = (setting) => (e) => {
        setNotificationSettings({
            ...notificationSettings,
            [setting]: e.target.checked,
        });
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            enqueueSnackbar('Profile updated successfully', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Error updating profile', { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            enqueueSnackbar('Passwords do not match', { variant: 'error' });
            return;
        }
        
        setSaving(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            enqueueSnackbar('Password changed successfully', { variant: 'success' });
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        } catch (error) {
            enqueueSnackbar('Error changing password', { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveNotifications = async () => {
        setSaving(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            enqueueSnackbar('Notification settings updated', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Error updating settings', { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Español' },
        { code: 'fr', name: 'Français' },
        { code: 'de', name: 'Deutsch' },
        { code: 'zh', name: '中文' },
    ];

    const timezones = [
        'UTC',
        'America/New_York',
        'America/Chicago',
        'America/Denver',
        'America/Los_Angeles',
        'Europe/London',
        'Europe/Paris',
        'Asia/Tokyo',
        'Asia/Dubai',
        'Australia/Sydney',
    ];

    return (
        <Container maxWidth="lg">
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Settings /> Settings
                </Typography>
                <Typography variant="body1" color="textSecondary" paragraph>
                    Manage your account settings, preferences, and notification preferences.
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Left Side - Tabs */}
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <List disablePadding>
                                <ListItemButton
                                    selected={tabValue === 0}
                                    onClick={() => setTabValue(0)}
                                    sx={{ borderRadius: 1 }}
                                >
                                    <Person sx={{ mr: 2 }} />
                                    <ListItemText primary="Profile" />
                                </ListItemButton>
                                
                                <ListItemButton
                                    selected={tabValue === 1}
                                    onClick={() => setTabValue(1)}
                                    sx={{ borderRadius: 1 }}
                                >
                                    <Security sx={{ mr: 2 }} />
                                    <ListItemText primary="Security" />
                                </ListItemButton>
                                
                                <ListItemButton
                                    selected={tabValue === 2}
                                    onClick={() => setTabValue(2)}
                                    sx={{ borderRadius: 1 }}
                                >
                                    <Notifications sx={{ mr: 2 }} />
                                    <ListItemText primary="Notifications" />
                                </ListItemButton>
                                
                                <ListItemButton
                                    selected={tabValue === 3}
                                    onClick={() => setTabValue(3)}
                                    sx={{ borderRadius: 1 }}
                                >
                                    <Language sx={{ mr: 2 }} />
                                    <ListItemText primary="Preferences" />
                                </ListItemButton>
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right Side - Content */}
                <Grid item xs={12} md={9}>
                    {tabValue === 0 && (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Person /> Profile Information
                                </Typography>
                                
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
                                    <Avatar
                                        sx={{ width: 100, height: 100, mb: 2 }}
                                        src={user?.avatar}
                                    >
                                        {user?.username?.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Button
                                        startIcon={<PhotoCamera />}
                                        variant="outlined"
                                        size="small"
                                    >
                                        Change Photo
                                    </Button>
                                </Box>
                                
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Username"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleProfileChange}
                                            disabled={saving}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Email Address"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleProfileChange}
                                            disabled={saving}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Phone Number"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleProfileChange}
                                            disabled={saving}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Language</InputLabel>
                                            <Select
                                                name="language"
                                                value={formData.language}
                                                onChange={handleProfileChange}
                                                label="Language"
                                                disabled={saving}
                                            >
                                                {languages.map((lang) => (
                                                    <MenuItem key={lang.code} value={lang.code}>
                                                        {lang.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Timezone</InputLabel>
                                            <Select
                                                name="timezone"
                                                value={formData.timezone}
                                                onChange={handleProfileChange}
                                                label="Timezone"
                                                disabled={saving}
                                            >
                                                {timezones.map((tz) => (
                                                    <MenuItem key={tz} value={tz}>
                                                        {tz}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                                
                                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        startIcon={<Save />}
                                        onClick={handleSaveProfile}
                                        variant="contained"
                                        disabled={saving}
                                    >
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    )}
                    
                    {tabValue === 1 && (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Security /> Security Settings
                                </Typography>
                                
                                <Alert severity="info" sx={{ mb: 3 }}>
                                    For security reasons, please enter your current password to make changes.
                                </Alert>
                                
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Current Password"
                                            name="currentPassword"
                                            type={showPassword ? 'text' : 'password'}
                                            value={passwordData.currentPassword}
                                            onChange={handlePasswordChange}
                                            disabled={saving}
                                            InputProps={{
                                                endAdornment: (
                                                    <IconButton
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        edge="end"
                                                    >
                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                ),
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="New Password"
                                            name="newPassword"
                                            type={showPassword ? 'text' : 'password'}
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            disabled={saving}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Confirm New Password"
                                            name="confirmPassword"
                                            type={showPassword ? 'text' : 'password'}
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            disabled={saving}
                                        />
                                    </Grid>
                                </Grid>
                                
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Password Requirements
                                    </Typography>
                                    <List dense disablePadding>
                                        <ListItem>
                                            <ListItemText 
                                                primary="At least 8 characters"
                                                primaryTypographyProps={{ variant: 'body2' }}
                                            />
                                            <Chip
                                                label={passwordData.newPassword.length >= 8 ? '✓' : '✗'}
                                                size="small"
                                                color={passwordData.newPassword.length >= 8 ? 'success' : 'default'}
                                            />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemText 
                                                primary="Contains uppercase letter"
                                                primaryTypographyProps={{ variant: 'body2' }}
                                            />
                                            <Chip
                                                label={/[A-Z]/.test(passwordData.newPassword) ? '✓' : '✗'}
                                                size="small"
                                                color={/[A-Z]/.test(passwordData.newPassword) ? 'success' : 'default'}
                                            />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemText 
                                                primary="Contains lowercase letter"
                                                primaryTypographyProps={{ variant: 'body2' }}
                                            />
                                            <Chip
                                                label={/[a-z]/.test(passwordData.newPassword) ? '✓' : '✗'}
                                                size="small"
                                                color={/[a-z]/.test(passwordData.newPassword) ? 'success' : 'default'}
                                            />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemText 
                                                primary="Contains number"
                                                primaryTypographyProps={{ variant: 'body2' }}
                                            />
                                            <Chip
                                                label={/\d/.test(passwordData.newPassword) ? '✓' : '✗'}
                                                size="small"
                                                color={/\d/.test(passwordData.newPassword) ? 'success' : 'default'}
                                            />
                                        </ListItem>
                                    </List>
                                </Box>
                                
                                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        startIcon={<Key />}
                                        onClick={handleChangePassword}
                                        variant="contained"
                                        disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                                    >
                                        {saving ? 'Updating...' : 'Change Password'}
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    )}
                    
                    {tabValue === 2 && (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Notifications /> Notification Preferences
                                </Typography>
                                
                                <Grid container spacing={3}>
                                    <Grid item xs={12}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={notificationSettings.emailNotifications}
                                                    onChange={handleNotificationChange('emailNotifications')}
                                                    disabled={saving}
                                                />
                                            }
                                            label={
                                                <Box>
                                                    <Typography>Email Notifications</Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Receive important updates via email
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={12}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={notificationSettings.smsNotifications}
                                                    onChange={handleNotificationChange('smsNotifications')}
                                                    disabled={saving}
                                                />
                                            }
                                            label={
                                                <Box>
                                                    <Typography>SMS Notifications</Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Receive urgent alerts via SMS
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={12}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={notificationSettings.serviceReminders}
                                                    onChange={handleNotificationChange('serviceReminders')}
                                                    disabled={saving}
                                                />
                                            }
                                            label={
                                                <Box>
                                                    <Typography>Service Reminders</Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Get reminders for upcoming vehicle services
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={12}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={notificationSettings.maintenanceAlerts}
                                                    onChange={handleNotificationChange('maintenanceAlerts')}
                                                    disabled={saving}
                                                />
                                            }
                                            label={
                                                <Box>
                                                    <Typography>Maintenance Alerts</Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Alert me when maintenance is required
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={12}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={notificationSettings.marketingEmails}
                                                    onChange={handleNotificationChange('marketingEmails')}
                                                    disabled={saving}
                                                />
                                            }
                                            label={
                                                <Box>
                                                    <Typography>Marketing Emails</Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Receive updates about new features and promotions
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </Grid>
                                </Grid>
                                
                                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        startIcon={<Save />}
                                        onClick={handleSaveNotifications}
                                        variant="contained"
                                        disabled={saving}
                                    >
                                        {saving ? 'Saving...' : 'Save Preferences'}
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    )}
                    
                    {tabValue === 3 && (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Language /> Application Preferences
                                </Typography>
                                
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Default View</InputLabel>
                                            <Select
                                                value="dashboard"
                                                label="Default View"
                                                disabled={saving}
                                            >
                                                <MenuItem value="dashboard">Dashboard</MenuItem>
                                                <MenuItem value="vehicles">Vehicles</MenuItem>
                                                <MenuItem value="services">Services</MenuItem>
                                                <MenuItem value="reports">Reports</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Rows Per Page</InputLabel>
                                            <Select
                                                value={25}
                                                label="Rows Per Page"
                                                disabled={saving}
                                            >
                                                <MenuItem value={10}>10 rows</MenuItem>
                                                <MenuItem value={25}>25 rows</MenuItem>
                                                <MenuItem value={50}>50 rows</MenuItem>
                                                <MenuItem value={100}>100 rows</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    
                                    <Grid item xs={12}>
                                        <FormControlLabel
                                            control={<Switch defaultChecked />}
                                            label="Auto-refresh data"
                                            disabled={saving}
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={12}>
                                        <FormControlLabel
                                            control={<Switch defaultChecked />}
                                            label="Show confirmation dialogs"
                                            disabled={saving}
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={12}>
                                        <FormControlLabel
                                            control={<Switch />}
                                            label="Compact mode"
                                            disabled={saving}
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={12}>
                                        <FormControlLabel
                                            control={<Switch defaultChecked />}
                                            label="Enable animations"
                                            disabled={saving}
                                        />
                                    </Grid>
                                </Grid>
                                
                                <Divider sx={{ my: 3 }} />
                                
                                <Typography variant="subtitle2" gutterBottom>
                                    Data Management
                                </Typography>
                                
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <Button
                                            startIcon={<Refresh />}
                                            variant="outlined"
                                            fullWidth
                                            disabled={saving}
                                        >
                                            Clear Cache
                                        </Button>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Button
                                            startIcon={<Delete />}
                                            variant="outlined"
                                            color="error"
                                            fullWidth
                                            disabled={saving}
                                        >
                                            Delete All Data
                                        </Button>
                                    </Grid>
                                </Grid>
                                
                                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        startIcon={<Save />}
                                        variant="contained"
                                        disabled={saving}
                                    >
                                        {saving ? 'Saving...' : 'Save Preferences'}
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    )}
                </Grid>
            </Grid>
        </Container>
    );
};

export default SettingsPage;