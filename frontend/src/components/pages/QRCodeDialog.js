import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    IconButton,
} from '@mui/material';
import { Close, Download } from '@mui/icons-material';
import QRCode from 'qrcode.react';

const QRCodeDialog = ({ open, onClose, qrCodeUrl }) => {
    const downloadQRCode = () => {
        const canvas = document.getElementById('qr-code-canvas');
        if (canvas) {
            const pngUrl = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = 'vehicle-qr-code.png';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Vehicle QR Code</Typography>
                    <IconButton onClick={onClose} size="small">
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ textAlign: 'center', py: 3 }}>
                    {qrCodeUrl ? (
                        <>
                            <QRCode
                                id="qr-code-canvas"
                                value={qrCodeUrl}
                                size={256}
                                level="H"
                                includeMargin={true}
                            />
                            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                                Scan this QR code to view vehicle information
                            </Typography>
                        </>
                    ) : (
                        <Typography color="textSecondary">
                            QR code not available
                        </Typography>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
                <Button
                    onClick={downloadQRCode}
                    startIcon={<Download />}
                    variant="contained"
                    disabled={!qrCodeUrl}
                >
                    Download QR Code
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default QRCodeDialog;