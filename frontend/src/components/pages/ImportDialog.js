import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Alert,
    LinearProgress,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
} from '@mui/material';
import { CloudUpload, CheckCircle, Error, Close } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useSnackbar } from 'notistack';
import apiService from '../../services/api';

const ImportDialog = ({ open, onClose, onComplete }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const { enqueueSnackbar } = useSnackbar();

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
        },
        maxFiles: 1,
        onDrop: (acceptedFiles) => {
            setFile(acceptedFiles[0]);
            setResult(null);
        },
    });

    const handleImport = async () => {
        if (!file) return;

        setLoading(true);
        try {
            const response = await apiService.importVehiclesFromExcel(file);
            setResult(response);
            if (response.success) {
                enqueueSnackbar('Import completed successfully', { variant: 'success' });
                onComplete();
            } else {
                enqueueSnackbar('Import completed with errors', { variant: 'warning' });
            }
        } catch (error) {
            enqueueSnackbar('Error importing file', { variant: 'error' });
            setResult({
                success: false,
                message: error.response?.data?.message || 'Import failed',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setResult(null);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Import Vehicles from Excel</Typography>
                    <Button onClick={handleClose} size="small">
                        <Close />
                    </Button>
                </Box>
            </DialogTitle>
            <DialogContent>
                {!result ? (
                    <>
                        <Box
                            {...getRootProps()}
                            sx={{
                                border: '2px dashed',
                                borderColor: isDragActive ? 'primary.main' : 'grey.300',
                                borderRadius: 2,
                                p: 4,
                                textAlign: 'center',
                                cursor: 'pointer',
                                bgcolor: isDragActive ? 'action.hover' : 'transparent',
                                mb: 2,
                            }}
                        >
                            <input {...getInputProps()} />
                            <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                {isDragActive ? 'Drop the file here' : 'Drag & drop Excel file here'}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                or click to select a file
                            </Typography>
                            <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
                                Supported formats: .xlsx, .xls
                            </Typography>
                        </Box>

                        {file && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                                <Typography variant="body2">
                                    Selected file: <strong>{file.name}</strong> ({Math.round(file.size / 1024)} KB)
                                </Typography>
                            </Alert>
                        )}

                        <Alert severity="warning" icon={false}>
                            <Typography variant="body2">
                                <strong>Important:</strong> Your Excel file must have the following columns:
                                <br />
                                Plate Number, Chassis Number, Make, Model, Year, Color, Current Mileage
                            </Typography>
                        </Alert>
                    </>
                ) : (
                    <>
                        <Alert
                            severity={result.success ? 'success' : 'warning'}
                            sx={{ mb: 2 }}
                        >
                            {result.message}
                        </Alert>

                        {result.imported && result.imported.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Successfully imported ({result.imported.length}):
                                </Typography>
                                <List dense>
                                    {result.imported.slice(0, 5).map((item, index) => (
                                        <ListItem key={index}>
                                            <ListItemIcon>
                                                <CheckCircle color="success" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={item.plate_number}
                                                secondary={`${item.make} ${item.model}`}
                                            />
                                        </ListItem>
                                    ))}
                                    {result.imported.length > 5 && (
                                        <ListItem>
                                            <ListItemText
                                                primary={`...and ${result.imported.length - 5} more`}
                                            />
                                        </ListItem>
                                    )}
                                </List>
                            </Box>
                        )}

                        {result.errors && result.errors.length > 0 && (
                            <Box>
                                <Typography variant="subtitle2" gutterBottom color="error">
                                    Errors ({result.errors.length}):
                                </Typography>
                                <List dense>
                                    {result.errors.slice(0, 5).map((error, index) => (
                                        <ListItem key={index}>
                                            <ListItemIcon>
                                                <Error color="error" />
                                            </ListItemIcon>
                                            <ListItemText primary={error} />
                                        </ListItem>
                                    ))}
                                    {result.errors.length > 5 && (
                                        <ListItem>
                                            <ListItemText
                                                primary={`...and ${result.errors.length - 5} more errors`}
                                            />
                                        </ListItem>
                                    )}
                                </List>
                            </Box>
                        )}
                    </>
                )}

                {loading && <LinearProgress sx={{ mt: 2 }} />}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    {result ? 'Close' : 'Cancel'}
                </Button>
                {!result && (
                    <Button
                        onClick={handleImport}
                        variant="contained"
                        disabled={!file || loading}
                    >
                        {loading ? 'Importing...' : 'Import'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ImportDialog;