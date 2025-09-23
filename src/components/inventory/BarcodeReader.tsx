import React, { useState, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import Webcam from 'react-webcam';
type WebcamInstance = Webcam;
// La API BarcodeDetector es experimental y está disponible en el objeto window
declare global {
    interface Window {
        BarcodeDetector: any;
    }
}

interface BarcodeReaderProps {
    open: boolean;
    onClose: () => void;
    onDetect: (barcode: string) => void;
}

const BarcodeReader: React.FC<BarcodeReaderProps> = ({ open, onClose, onDetect }) => {
    const webcamRef = useRef<WebcamInstance>(null);
    const [scanning, setScanning] = useState(false);

    const startScanning = async () => {
        setScanning(true);
        try {
            if ('BarcodeDetector' in window) {
                const barcodeDetector = new window.BarcodeDetector({
                    formats: ['qr_code', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93', 'data_matrix']
                });

                while (scanning) {
                    if (webcamRef.current) {
                        const imageBitmap = webcamRef.current.getScreenshot();
                        if (imageBitmap) {
                            const codes = await barcodeDetector.detect(imageBitmap);
                            if (codes.length > 0) {
                                onDetect(codes[0].rawValue);
                                setScanning(false);
                                onClose();
                                break;
                            }
                        }
                    }
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            } else {
                console.error('Barcode Detection API not supported');
            }
        } catch (error) {
            console.error('Error scanning barcode:', error);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Escanear Código de Barras</DialogTitle>
            <DialogContent>
                <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                        facingMode: 'environment'
                    }}
                    style={{ width: '100%' }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={startScanning} color="primary" variant="contained">
                    Iniciar Escaneo
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BarcodeReader;