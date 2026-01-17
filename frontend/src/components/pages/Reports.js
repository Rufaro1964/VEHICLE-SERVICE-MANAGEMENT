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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    TextField,
    Alert,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    Assessment,
    TrendingUp,
    FileDownload,
    CalendarToday,
    FilterList,
    Refresh,
    Print,
    Email,
    BarChart,
    PieChart,
    ShowChart,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useSnackbar } from 'notistack';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
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
import apiService from '../../services/api'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Reports = () => {
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [reportType, setReportType] = useState('monthly');
    const [dateRange, setDateRange] = useState({
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date()),
    });
    const [monthlyReport, setMonthlyReport] = useState(null);
    const [financialReport, setFinancialReport] = useState(null);
    const [openExportDialog, setOpenExportDialog] = useState(false);
    const [exportFormat, setExportFormat] = useState('excel');
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        loadReports();
    }, [dateRange, reportType]);

    const loadReports = async () => {
        try {
            setLoading(true);

            // Load monthly report
            const year = dateRange.start.getFullYear();
            const month = dateRange.start.getMonth() + 1;
            const monthlyResponse = await apiService.getMonthlyReport(year, month);
            if (monthlyResponse.success) {
                setMonthlyReport(monthlyResponse);
            }

            // Load financial report
            const financialResponse = await apiService.getFinancialReport(year);
            if (financialResponse.success) {
                setFinancialReport(financialResponse);
            }
        } catch (error) {
            enqueueSnackbar('Error loading reports', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleExport = async () => {
        try {
            let blob;
            let filename;

            if (exportFormat === 'excel') {
                const params = {
                    start_date: format(dateRange.start, 'yyyy-MM-dd'),
                    end_date: format(dateRange.end, 'yyyy-MM-dd'),
                };
                blob = await apiService.exportServicesToExcel(params);
                filename = `service-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
            } else {
                // For PDF, we'll generate it client-side
                const input = document.getElementById('report-content');
                if (!input) return;

                const { default: html2canvas } = await import('html2canvas');
                const { default: jsPDF } = await import('jspdf');

                const canvas = await html2canvas(input, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const imgWidth = 210;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
                blob = pdf.output('blob');
                filename = `report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
            }

            apiService.downloadFile(blob, filename);
            enqueueSnackbar('Report exported successfully', { variant: 'success' });
            setOpenExportDialog(false);
        } catch (error) {
            enqueueSnackbar('Error exporting report', { variant: 'error' });
        }
    };

    const getChartData = () => {
        if (!monthlyReport?.daily_summary) return [];
        return monthlyReport.daily_summary.map(day => ({
            date: format(parseISO(day.date), 'MMM dd'),
            services: day.service_count,
            revenue: parseFloat(day.total_cost || 0),
        }));
    };

    const getServiceTypeData = () => {
        if (!monthlyReport?.services) return [];
        const typeCount = {};
        monthlyReport.services.forEach(service => {
            const type = service.service_type || 'Other';
            typeCount[type] = (typeCount[type] || 0) + 1;
        });
        return Object.entries(typeCount).map(([name, value]) => ({ name, value }));
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
                    <Assessment /> Reports & Analytics
                </Typography>
                <Typography variant="body1" color="textSecondary" paragraph>
                    Analyze service performance, track revenue, and generate detailed reports.
                </Typography>
            </Box>

            {/* Controls */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Report Type</InputLabel>
                            <Select
                                value={reportType}
                                label="Report Type"
                                onChange={(e) => setReportType(e.target.value)}
                            >
                                <MenuItem value="monthly">Monthly Report</MenuItem>
                                <MenuItem value="quarterly">Quarterly Report</MenuItem>
                                <MenuItem value="yearly">Yearly Report</MenuItem>
                                <MenuItem value="custom">Custom Range</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                    <DatePicker
                                        label="Start Date"
                                        value={dateRange.start}
                                        onChange={(newValue) => setDateRange({...dateRange, start: newValue})}
                                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            <Grid item xs={6}>
                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                    <DatePicker
                                        label="End Date"
                                        value={dateRange.end}
                                        onChange={(newValue) => setDateRange({...dateRange, end: newValue})}
                                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                    />
                                </LocalizationProvider>
                            </Grid>
                        </Grid>
                    </Grid>
                    
                    <Grid item xs={12} md={3} sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            startIcon={<Refresh />}
                            onClick={loadReports}
                            variant="outlined"
                            fullWidth
                        >
                            Refresh
                        </Button>
                        <Button
                            startIcon={<FileDownload />}
                            onClick={() => setOpenExportDialog(true)}
                            variant="contained"
                            fullWidth
                        >
                            Export
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <BarChart sx={{ fontSize: 40, color: 'primary.main' }} />
                                <Box>
                                    <Typography color="textSecondary" variant="body2">
                                        Total Services
                                    </Typography>
                                    <Typography variant="h4">
                                        {monthlyReport?.totals?.service_count || 0}
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
                                <TrendingUp sx={{ fontSize: 40, color: 'success.main' }} />
                                <Box>
                                    <Typography color="textSecondary" variant="body2">
                                        Total Revenue
                                    </Typography>
                                    <Typography variant="h4" color="success.main">
                                        ${monthlyReport?.totals?.total_cost?.toFixed(2) || '0.00'}
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
                                        Period
                                    </Typography>
                                    <Typography variant="h6">
                                        {monthlyReport?.month || format(dateRange.start, 'MMM yyyy')}
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
                                <ShowChart sx={{ fontSize: 40, color: 'warning.main' }} />
                                <Box>
                                    <Typography color="textSecondary" variant="body2">
                                        Vehicles Serviced
                                    </Typography>
                                    <Typography variant="h4">
                                        {monthlyReport?.vehicle_count || 0}
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
                    <Tab icon={<BarChart />} label="Overview" />
                    <Tab icon={<ShowChart />} label="Financial" />
                    <Tab icon={<PieChart />} label="Analytics" />
                </Tabs>
                
                <Box sx={{ p: 3 }} id="report-content">
                    {tabValue === 0 && (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={8}>
                                <Typography variant="h6" gutterBottom>
                                    Daily Service Trends
                                </Typography>
                                <Box sx={{ height: 400 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsBarChart data={getChartData()}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis yAxisId="left" />
                                            <YAxis yAxisId="right" orientation="right" />
                                            <ChartTooltip />
                                            <Legend />
                                            <Bar yAxisId="left" dataKey="services" name="Services" fill="#1976d2" />
                                            <Bar yAxisId="right" dataKey="revenue" name="Revenue ($)" fill="#2e7d32" />
                                        </RechartsBarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Grid>
                            
                            <Grid item xs={12} md={4}>
                                <Typography variant="h6" gutterBottom>
                                    Service Types Distribution
                                </Typography>
                                <Box sx={{ height: 400 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPieChart>
                                            <Pie
                                                data={getServiceTypeData()}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {getServiceTypeData().map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <ChartTooltip />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Grid>
                            
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                    Recent Services
                                </Typography>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Date</TableCell>
                                                <TableCell>Invoice #</TableCell>
                                                <TableCell>Vehicle</TableCell>
                                                <TableCell>Service Type</TableCell>
                                                <TableCell align="right">Mileage</TableCell>
                                                <TableCell align="right">Cost</TableCell>
                                                <TableCell>Status</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {monthlyReport?.services?.slice(0, 10).map((service) => (
                                                <TableRow key={service.id} hover>
                                                    <TableCell>
                                                        {format(parseISO(service.service_date), 'MM/dd/yyyy')}
                                                    </TableCell>
                                                    <TableCell>{service.invoice_number}</TableCell>
                                                    <TableCell>{service.plate_number}</TableCell>
                                                    <TableCell>{service.service_type}</TableCell>
                                                    <TableCell align="right">
                                                        {service.mileage_at_service?.toLocaleString() || 'N/A'}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Chip
                                                            label={`$${service.total_cost}`}
                                                            size="small"
                                                            color="success"
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
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
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>
                        </Grid>
                    )}
                    
                    {tabValue === 1 && financialReport && (
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                    Financial Summary - {financialReport.year}
                                </Typography>
                                <Alert severity="info" sx={{ mb: 3 }}>
                                    Total Revenue: <strong>${financialReport.totals?.revenue?.toFixed(2) || '0.00'}</strong>
                                    {' • '}
                                    Total Services: <strong>{financialReport.totals?.service_count || 0}</strong>
                                    {' • '}
                                    Average Service Cost: <strong>${(financialReport.totals?.revenue / financialReport.totals?.service_count || 0).toFixed(2)}</strong>
                                </Alert>
                            </Grid>
                            
                            <Grid item xs={12} md={8}>
                                <Typography variant="h6" gutterBottom>
                                    Monthly Revenue Trend
                                </Typography>
                                <Box sx={{ height: 400 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsLineChart data={financialReport.monthly_data || []}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" />
                                            <YAxis />
                                            <ChartTooltip />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="revenue"
                                                stroke="#1976d2"
                                                name="Revenue"
                                                strokeWidth={2}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="service_count"
                                                stroke="#2e7d32"
                                                name="Services"
                                                strokeWidth={2}
                                            />
                                        </RechartsLineChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Grid>
                            
                            <Grid item xs={12} md={4}>
                                <Typography variant="h6" gutterBottom>
                                    Monthly Breakdown
                                </Typography>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Month</TableCell>
                                                <TableCell align="right">Services</TableCell>
                                                <TableCell align="right">Revenue</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {financialReport.monthly_data?.map((month) => (
                                                <TableRow key={month.month}>
                                                    <TableCell>{month.month}</TableCell>
                                                    <TableCell align="right">{month.service_count}</TableCell>
                                                    <TableCell align="right">
                                                        <strong>${parseFloat(month.revenue || 0).toFixed(2)}</strong>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>
                        </Grid>
                    )}
                    
                    {tabValue === 2 && (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Performance Metrics
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" color="textSecondary">
                                                    Service Completion Rate
                                                </Typography>
                                                <Typography variant="h4" color="success.main">
                                                    98.5%
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" color="textSecondary">
                                                    Average Response Time
                                                </Typography>
                                                <Typography variant="h4">
                                                    2.3 days
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" color="textSecondary">
                                                    Customer Satisfaction
                                                </Typography>
                                                <Typography variant="h4" color="success.main">
                                                    4.8/5.0
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" color="textSecondary">
                                                    Repeat Service Rate
                                                </Typography>
                                                <Typography variant="h4">
                                                    75%
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Revenue Forecast
                                        </Typography>
                                        <Box sx={{ height: 200 }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RechartsLineChart data={[
                                                    { month: 'Jan', actual: 4500, forecast: 4200 },
                                                    { month: 'Feb', actual: 5200, forecast: 4800 },
                                                    { month: 'Mar', actual: 5800, forecast: 5500 },
                                                    { month: 'Apr', actual: 6200, forecast: 6000 },
                                                    { month: 'May', forecast: 6500 },
                                                    { month: 'Jun', forecast: 6800 },
                                                ]}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="month" />
                                                    <YAxis />
                                                    <ChartTooltip />
                                                    <Legend />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="actual"
                                                        stroke="#1976d2"
                                                        name="Actual"
                                                        strokeWidth={2}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="forecast"
                                                        stroke="#ff9800"
                                                        name="Forecast"
                                                        strokeWidth={2}
                                                        strokeDasharray="5 5"
                                                    />
                                                </RechartsLineChart>
                                            </ResponsiveContainer>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    )}
                </Box>
            </Paper>

            {/* Export Dialog */}
            <Dialog open={openExportDialog} onClose={() => setOpenExportDialog(false)}>
                <DialogTitle>Export Report</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Export Format</InputLabel>
                        <Select
                            value={exportFormat}
                            label="Export Format"
                            onChange={(e) => setExportFormat(e.target.value)}
                        >
                            <MenuItem value="excel">Excel (.xlsx)</MenuItem>
                            <MenuItem value="pdf">PDF Document</MenuItem>
                            <MenuItem value="csv">CSV File</MenuItem>
                        </Select>
                    </FormControl>
                    
                    <Alert severity="info" sx={{ mt: 2 }}>
                        {exportFormat === 'excel' && 'Export will include all data with formatting.'}
                        {exportFormat === 'pdf' && 'Export will generate a printable PDF document.'}
                        {exportFormat === 'csv' && 'Export will create a comma-separated values file.'}
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenExportDialog(false)}>Cancel</Button>
                    <Button onClick={handleExport} variant="contained">
                        Export
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Reports;