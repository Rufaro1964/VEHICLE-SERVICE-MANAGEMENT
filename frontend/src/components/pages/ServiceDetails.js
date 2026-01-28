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
    Alert,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
} from '@mui/material';
import {
    ArrowBack,
    Edit,
    Delete,
    Receipt,
    Print,
    Download,
    Build,
    DirectionsCar,
    CalendarToday,
    Speed,
    AttachMoney,
    Person,
    Note,
    Warning,
    CheckCircle,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { format, parseISO } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import apiService from '../../services/api';

const ServiceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

    useEffect(() => {
        loadServiceData();
    }, [id]);

    const loadServiceData = async () => {
        try {
            setLoading(true);
            const response = await apiService.getService(id);
            console.log('API Response:', response); // Debug log
            
            if (response.success) {
                setService(response.data);
            } else {
                throw new Error('Service not found');
            }
        } catch (error) {
            console.error('Error loading service:', error); // Debug log
            enqueueSnackbar('Error loading service details', { variant: 'error' });
            navigate('/services');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            const response = await apiService.deleteService(id);
            if (response.success) {
                enqueueSnackbar('Service deleted successfully', { variant: 'success' });
                navigate('/services');
            }
        } catch (error) {
            enqueueSnackbar('Error deleting service', { variant: 'error' });
        }
        setOpenDeleteDialog(false);
    };

    const handlePrintInvoice = () => {
        const input = document.getElementById('invoice-content');
        if (!input) return;

        html2canvas(input, {
            scale: 2,
            useCORS: true,
            logging: false,
        }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`invoice-${service?.invoice_number || id}.pdf`);
        });
    };

    const getStatusChip = (status) => {
        const config = {
            completed: { color: 'success', icon: <CheckCircle />, label: 'Completed' },
            pending: { color: 'warning', icon: <Warning />, label: 'Pending' },
            in_progress: { color: 'info', icon: <Build />, label: 'In Progress' },
            cancelled: { color: 'error', icon: <Warning />, label: 'Cancelled' },
        }[status] || { color: 'default', icon: null, label: status };

        return (
            <Chip
                icon={config.icon}
                label={config.label}
                color={config.color}
                sx={{ fontWeight: 'medium' }}
            />
        );
    };

    // Helper to safely parse spare_parts
    const getSpareParts = () => {
        if (!service?.spare_parts) return [];
        
        try {
            if (Array.isArray(service.spare_parts)) {
                return service.spare_parts;
            } else if (typeof service.spare_parts === 'string') {
                return JSON.parse(service.spare_parts);
            }
            return [];
        } catch (err) {
            console.error('Error parsing spare_parts:', err);
            return [];
        }
    };

    if (loading) {
        return (
            <Box sx={{ width: '100%' }}>
                <LinearProgress />
            </Box>
        );
    }

    if (!service) {
        return (
            <Container>
                <Alert severity="error" sx={{ mt: 4 }}>
                    Service not found
                </Alert>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/services')}
                    sx={{ mt: 2 }}
                >
                    Back to Services
                </Button>
            </Container>
        );
    }

    const spareParts = getSpareParts();

    return (
        <Container maxWidth="lg">
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/services')}
                    sx={{ mb: 2 }}
                >
                    Back to Services
                </Button>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h4" component="h1" gutterBottom>
                            Service #{service.invoice_number || `ID: ${id}`}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {getStatusChip(service.status)}
                            <Typography variant="body1" color="textSecondary">
                                • {service.service_date ? format(parseISO(service.service_date), 'MMMM dd, yyyy') : 'No date'}
                            </Typography>
                        </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            startIcon={<Print />}
                            onClick={handlePrintInvoice}
                            variant="outlined"
                        >
                            Print Invoice
                        </Button>
                        <Button
                            startIcon={<Download />}
                            onClick={handlePrintInvoice}
                            variant="outlined"
                        >
                            Download PDF
                        </Button>
                        <Button
                            startIcon={<Edit />}
                            onClick={() => navigate(`/services/${id}/edit`)}
                            variant="contained"
                        >
                            Edit
                        </Button>
                        <IconButton
                            onClick={() => setOpenDeleteDialog(true)}
                            color="error"
                        >
                            <Delete />
                        </IconButton>
                    </Box>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Left Column - Service Details */}
                <Grid item xs={12} md={8}>
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Build /> Service Details
                            </Typography>
                            
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <DirectionsCar fontSize="small" color="action" />
                                        <Typography variant="caption" color="textSecondary">
                                            Vehicle
                                        </Typography>
                                    </Box>
                                    <Typography variant="body1">
                                        {service.vehicles?.plate_number || 'N/A'} 
                                        {service.vehicles?.make || service.vehicles?.model ? 
                                            ` (${service.vehicles.make || ''} ${service.vehicles.model || ''})` : ''}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        Chassis: {service.vehicles?.chassis_number || 'N/A'}
                                    </Typography>
                                </Grid>
                                
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Build fontSize="small" color="action" />
                                        <Typography variant="caption" color="textSecondary">
                                            Service Type
                                        </Typography>
                                    </Box>
                                    <Typography variant="body1">
                                        {service.service_types?.name || 'Not specified'}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {service.service_types?.description || ''}
                                    </Typography>
                                </Grid>
                                
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <CalendarToday fontSize="small" color="action" />
                                        <Typography variant="caption" color="textSecondary">
                                            Service Date
                                        </Typography>
                                    </Box>
                                    <Typography variant="body1">
                                        {service.service_date ? format(parseISO(service.service_date), 'MMMM dd, yyyy') : 'N/A'}
                                    </Typography>
                                </Grid>
                                
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Speed fontSize="small" color="action" />
                                        <Typography variant="caption" color="textSecondary">
                                            Mileage at Service
                                        </Typography>
                                    </Box>
                                    <Typography variant="body1">
                                        {service.mileage_at_service ? service.mileage_at_service.toLocaleString() + ' miles' : 'N/A'}
                                    </Typography>
                                </Grid>
                                
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Person fontSize="small" color="action" />
                                        <Typography variant="caption" color="textSecondary">
                                            Technician
                                        </Typography>
                                    </Box>
                                    <Typography variant="body1">
                                        {service.users?.username || 'Not assigned'}
                                    </Typography>
                                    {service.users?.email && (
                                        <Typography variant="caption" color="textSecondary">
                                            {service.users.email}
                                        </Typography>
                                    )}
                                </Grid>
                                
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <AttachMoney fontSize="small" color="action" />
                                        <Typography variant="caption" color="textSecondary">
                                            Total Cost
                                        </Typography>
                                    </Box>
                                    <Typography variant="h5" color="success.main">
                                        ${service.total_cost ? service.total_cost.toFixed(2) : '0.00'}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Spare Parts Table */}
                    {spareParts.length > 0 && (
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Spare Parts Used
                                </Typography>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Part Number</TableCell>
                                                <TableCell>Description</TableCell>
                                                <TableCell align="right">Quantity</TableCell>
                                                <TableCell align="right">Unit Price</TableCell>
                                                <TableCell align="right">Total</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {spareParts.map((part, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{part.part_number || 'N/A'}</TableCell>
                                                    <TableCell>{part.part_name || 'N/A'}</TableCell>
                                                    <TableCell align="right">{part.quantity || 0}</TableCell>
                                                    <TableCell align="right">
                                                        ${part.unit_cost ? part.unit_cost.toFixed(2) : '0.00'}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <strong>${part.total_cost ? part.total_cost.toFixed(2) : '0.00'}</strong>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow>
                                                <TableCell colSpan={4} align="right">
                                                    <Typography variant="subtitle1">
                                                        Subtotal:
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="subtitle1">
                                                        ${spareParts.reduce((sum, part) => sum + (part.total_cost || 0), 0).toFixed(2)}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    )}

                    {/* Notes */}
                    {service.notes && (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Note /> Notes
                                </Typography>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {service.notes}
                                </Typography>
                            </CardContent>
                        </Card>
                    )}
                </Grid>

                {/* Right Column - Invoice Preview & Actions */}
                <Grid item xs={12} md={4}>
                    {/* Invoice Preview */}
                    <Card sx={{ mb: 3 }} id="invoice-content">
                        <CardContent>
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                <Receipt sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                                <Typography variant="h5" gutterBottom>
                                    SERVICE INVOICE
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Vehicle Service Management
                                </Typography>
                            </Box>
                            
                            <Divider sx={{ my: 2 }} />
                            
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary">
                                        Invoice Number
                                    </Typography>
                                </Grid>
                                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                                    <Typography variant="body2">
                                        {service.invoice_number || `SVC-${id}`}
                                    </Typography>
                                </Grid>
                                
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary">
                                        Date
                                    </Typography>
                                </Grid>
                                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                                    <Typography variant="body2">
                                        {service.service_date ? format(parseISO(service.service_date), 'MM/dd/yyyy') : 'N/A'}
                                    </Typography>
                                </Grid>
                                
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary">
                                        Vehicle
                                    </Typography>
                                </Grid>
                                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                                    <Typography variant="body2">
                                        {service.vehicles?.plate_number || 'N/A'}
                                    </Typography>
                                </Grid>
                                
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary">
                                        Status
                                    </Typography>
                                </Grid>
                                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                                    {getStatusChip(service.status)}
                                </Grid>
                            </Grid>
                            
                            <Divider sx={{ my: 2 }} />
                            
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Service Description
                                </Typography>
                                <Typography variant="body2">
                                    {service.service_types?.name || 'Service'}
                                </Typography>
                            </Box>
                            
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Amount Due
                                </Typography>
                                <Typography variant="h4" color="success.main" align="right">
                                    ${service.total_cost ? service.total_cost.toFixed(2) : '0.00'}
                                </Typography>
                            </Box>
                            
                            <Divider sx={{ my: 2 }} />
                            
                            <Typography variant="caption" color="textSecondary">
                                Thank you for your business!
                            </Typography>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Quick Actions
                            </Typography>
                            <List disablePadding>
                                <ListItem 
                                    button 
                                    onClick={() => navigate(`/vehicles/${service.vehicle_id}`)}
                                    sx={{ borderRadius: 1 }}
                                    disabled={!service.vehicle_id}
                                >
                                    <ListItemIcon>
                                        <DirectionsCar />
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary="View Vehicle Details"
                                        secondary="Go to vehicle page"
                                    />
                                </ListItem>
                                
                                <ListItem 
                                    button 
                                    onClick={() => navigate(`/services/${id}/edit`)}
                                    sx={{ borderRadius: 1 }}
                                >
                                    <ListItemIcon>
                                        <Edit />
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary="Edit Service"
                                        secondary="Update service information"
                                    />
                                </ListItem>
                                
                                <ListItem 
                                    button 
                                    onClick={handlePrintInvoice}
                                    sx={{ borderRadius: 1 }}
                                >
                                    <ListItemIcon>
                                        <Print />
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary="Print Invoice"
                                        secondary="Generate PDF invoice"
                                    />
                                </ListItem>
                                
                                <ListItem 
                                    button 
                                    onClick={() => setOpenDeleteDialog(true)}
                                    sx={{ borderRadius: 1, color: 'error.main' }}
                                >
                                    <ListItemIcon sx={{ color: 'error.main' }}>
                                        <Delete />
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary="Delete Service"
                                        secondary="Remove this service record"
                                    />
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>

                    {/* Next Service Info */}
                    {service.next_service_due && (
                        <Card sx={{ mt: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Next Service
                                </Typography>
                                <Alert severity="info" icon={false}>
                                    <Typography variant="body2">
                                        Next service due at{' '}
                                        <strong>{service.next_service_due?.toLocaleString() || 'N/A'} miles</strong>
                                    </Typography>
                                    {service.next_service_date && (
                                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                            Estimated date:{' '}
                                            {format(parseISO(service.next_service_date), 'MMMM dd, yyyy')}
                                        </Typography>
                                    )}
                                </Alert>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    sx={{ mt: 2 }}
                                    onClick={() => navigate(`/vehicles/${service.vehicle_id}`)}
                                    disabled={!service.vehicle_id}
                                >
                                    View Maintenance Schedule
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </Grid>
            </Grid>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={openDeleteDialog}
                onClose={() => setOpenDeleteDialog(false)}
            >
                <DialogTitle>Delete Service</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Are you sure you want to delete this service record? This action cannot be undone.
                    </Alert>
                    <Typography variant="body2" color="textSecondary">
                        Invoice: {service.invoice_number || `ID: ${id}`}
                        <br />
                        Vehicle: {service.vehicles?.plate_number || 'N/A'}
                        <br />
                        Date: {service.service_date ? format(parseISO(service.service_date), 'MMMM dd, yyyy') : 'N/A'}
                        <br />
                        Amount: ${service.total_cost ? service.total_cost.toFixed(2) : '0.00'}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleDelete}
                        variant="contained"
                        color="error"
                    >
                        Delete Service
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default ServiceDetail;