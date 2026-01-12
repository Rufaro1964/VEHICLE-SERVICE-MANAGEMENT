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
    Alert,
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
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    WarningAmber,
    MoreVert,
    Search,
    FilterList,
    FileUpload,
    FileDownload,
    QrCode2,
    Refresh,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';
import apiService from '../services/api';
import VehicleForm from '../components/forms/VehicleForm';
import QRCodeDialog from '../components/common/QRCodeDialog';
import ImportDialog from '../components/common/ImportDialog';

const Vehicles = () => {
    const [vehicles, setVehicles] = useState([]);
    const [filteredVehicles, setFilteredVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [openQRDialog, setOpenQRDialog] = useState(false);
    const [openImportDialog, setOpenImportDialog] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedQR, setSelectedQR] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        fetchVehicles();
    }, []);

    useEffect(() => {
        filterVehicles();
    }, [vehicles, searchTerm, statusFilter]);

    const fetchVehicles = async () => {
        try {
            setLoading(true);
            const response = await apiService.getVehicles();
            if (response.success) {
                setVehicles(response.data);
            }
        } catch (error) {
            enqueueSnackbar('Error fetching vehicles', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const filterVehicles = () => {
        let filtered = vehicles;

        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(vehicle =>
                vehicle.plate_number.toLowerCase().includes(term) ||
                vehicle.chassis_number.toLowerCase().includes(term) ||
                vehicle.make?.toLowerCase().includes(term) ||
                vehicle.model?.toLowerCase().includes(term)
            );
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(vehicle => {
                const now = new Date();
                const dueDate = new Date(vehicle.next_service_date);
                const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

                if (statusFilter === 'due') {
                    return vehicle.current_mileage >= vehicle.next_service_due || daysUntilDue <= 0;
                } else if (statusFilter === 'soon') {
                    return daysUntilDue > 0 && daysUntilDue <= 30;
                } else if (statusFilter === 'good') {
                    return daysUntilDue > 30;
                }
                return true;
            });
        }

        setFilteredVehicles(filtered);
    };

    const handleAddClick = () => {
        setEditingVehicle(null);
        setOpenDialog(true);
    };

    const handleEditClick = (vehicle) => {
        setEditingVehicle(vehicle);
        setOpenDialog(true);
    };

    const handleDeleteClick = async (id) => {
        if (window.confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
            try {
                const response = await apiService.deleteVehicle(id);
                if (response.success) {
                    enqueueSnackbar('Vehicle deleted successfully', { variant: 'success' });
                    fetchVehicles();
                }
            } catch (error) {
                enqueueSnackbar('Error deleting vehicle', { variant: 'error' });
            }
        }
    };

    const handleQRClick = async (vehicleId) => {
        try {
            const response = await apiService.getVehicleQR(vehicleId);
            if (response.success) {
                setSelectedQR(response.qrCodeUrl);
                setOpenQRDialog(true);
            }
        } catch (error) {
            enqueueSnackbar('Error loading QR code', { variant: 'error' });
        }
    };

    const handleMenuOpen = (event, vehicle) => {
        setAnchorEl(event.currentTarget);
        setSelectedVehicle(vehicle);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedVehicle(null);
    };

    const handleExport = async () => {
        try {
            const blob = await apiService.exportVehiclesToExcel();
            apiService.downloadFile(blob, `vehicles-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
            enqueueSnackbar('Export completed successfully', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Error exporting vehicles', { variant: 'error' });
        }
        handleMenuClose();
    };

    const handleImportComplete = () => {
        fetchVehicles();
        setOpenImportDialog(false);
    };

    const getStatusChip = (vehicle) => {
        const now = new Date();
        const dueDate = new Date(vehicle.next_service_date);
        const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
        const mileageRemaining = vehicle.next_service_due - vehicle.current_mileage;

        if (vehicle.current_mileage >= vehicle.next_service_due || daysUntilDue <= 0) {
            return (
                <Chip
                    icon={<WarningAmber />}
                    label="Due Now"
                    color="error"
                    size="small"
                />
            );
        } else if (mileageRemaining < 1000 || daysUntilDue <= 30) {
            return (
                <Chip
                    label="Due Soon"
                    color="warning"
                    size="small"
                />
            );
        } else {
            return (
                <Chip
                    label="Good"
                    color="success"
                    size="small"
                />
            );
        }
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
                <Typography variant="h4" gutterBottom>
                    Vehicles
                </Typography>
                <Typography variant="body1" color="textSecondary" paragraph>
                    Manage your vehicle fleet, track service schedules, and generate QR codes for quick access.
                </Typography>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Vehicles
                            </Typography>
                            <Typography variant="h4">
                                {vehicles.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Due for Service
                            </Typography>
                            <Typography variant="h4" color="error">
                                {vehicles.filter(v => v.current_mileage >= v.next_service_due).length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Average Mileage
                            </Typography>
                            <Typography variant="h4">
                                {vehicles.length > 0
                                    ? Math.round(vehicles.reduce((sum, v) => sum + v.current_mileage, 0) / vehicles.length)
                                    : 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Service Cost (30 days)
                            </Typography>
                            <Typography variant="h4">
                                $0.00
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Toolbar */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            placeholder="Search vehicles..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Status Filter</InputLabel>
                            <Select
                                value={statusFilter}
                                label="Status Filter"
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <MenuItem value="all">All Status</MenuItem>
                                <MenuItem value="due">Due for Service</MenuItem>
                                <MenuItem value="soon">Due Soon (30 days)</MenuItem>
                                <MenuItem value="good">Good</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button
                            startIcon={<Refresh />}
                            onClick={fetchVehicles}
                            variant="outlined"
                        >
                            Refresh
                        </Button>
                        <Button
                            startIcon={<FileUpload />}
                            onClick={() => setOpenImportDialog(true)}
                            variant="outlined"
                        >
                            Import
                        </Button>
                        <Button
                            startIcon={<FileDownload />}
                            onClick={handleExport}
                            variant="outlined"
                        >
                            Export
                        </Button>
                        <Button
                            startIcon={<Add />}
                            onClick={handleAddClick}
                            variant="contained"
                            color="primary"
                        >
                            Add Vehicle
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Vehicles Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Plate Number</TableCell>
                            <TableCell>Chassis Number</TableCell>
                            <TableCell>Make/Model</TableCell>
                            <TableCell>Year</TableCell>
                            <TableCell>Current Mileage</TableCell>
                            <TableCell>Next Service Due</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredVehicles.length > 0 ? (
                            filteredVehicles.map((vehicle) => (
                                <TableRow key={vehicle.id} hover>
                                    <TableCell>
                                        <Typography fontWeight="medium">
                                            {vehicle.plate_number}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{vehicle.chassis_number}</TableCell>
                                    <TableCell>
                                        {vehicle.make} {vehicle.model}
                                    </TableCell>
                                    <TableCell>{vehicle.year}</TableCell>
                                    <TableCell>
                                        {vehicle.current_mileage.toLocaleString()} miles
                                    </TableCell>
                                    <TableCell>
                                        {vehicle.next_service_due.toLocaleString()} miles
                                        <br />
                                        <Typography variant="caption" color="textSecondary">
                                            {vehicle.next_service_date 
                                                ? format(new Date(vehicle.next_service_date), 'MMM dd, yyyy')
                                                : 'Not set'
                                            }
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusChip(vehicle)}
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Tooltip title="QR Code">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleQRClick(vehicle.id)}
                                                >
                                                    <QrCode2 />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleEditClick(vehicle)}
                                                >
                                                    <Edit />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="More options">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => handleMenuOpen(e, vehicle)}
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
                                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                    <Typography color="textSecondary">
                                        No vehicles found. {searchTerm && 'Try changing your search criteria.'}
                                    </Typography>
                                    {!searchTerm && (
                                        <Button
                                            startIcon={<Add />}
                                            onClick={handleAddClick}
                                            sx={{ mt: 2 }}
                                        >
                                            Add Your First Vehicle
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add/Edit Vehicle Dialog */}
            <Dialog 
                open={openDialog} 
                onClose={() => setOpenDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
                </DialogTitle>
                <DialogContent>
                    <VehicleForm
                        vehicle={editingVehicle}
                        onSuccess={() => {
                            setOpenDialog(false);
                            fetchVehicles();
                        }}
                        onCancel={() => setOpenDialog(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* QR Code Dialog */}
            <QRCodeDialog
                open={openQRDialog}
                onClose={() => setOpenQRDialog(false)}
                qrCodeUrl={selectedQR}
            />

            {/* Import Dialog */}
            <ImportDialog
                open={openImportDialog}
                onClose={() => setOpenImportDialog(false)}
                onComplete={handleImportComplete}
            />

            {/* Context Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => {
                    handleEditClick(selectedVehicle);
                    handleMenuClose();
                }}>
                    <Edit fontSize="small" sx={{ mr: 1 }} />
                    Edit
                </MenuItem>
                <MenuItem onClick={() => {
                    handleQRClick(selectedVehicle.id);
                    handleMenuClose();
                }}>
                    <QrCode2 fontSize="small" sx={{ mr: 1 }} />
                    View QR Code
                </MenuItem>
                <MenuItem onClick={() => {
                    handleDeleteClick(selectedVehicle.id);
                    handleMenuClose();
                }}>
                    <Delete fontSize="small" sx={{ mr: 1 }} />
                    Delete
                </MenuItem>
            </Menu>

            {/* Floating Action Button for Mobile */}
            <Fab
                color="primary"
                aria-label="add"
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

export default Vehicles;