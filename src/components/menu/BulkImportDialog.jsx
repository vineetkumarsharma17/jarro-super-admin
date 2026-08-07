import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { CloudUpload, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';

const steps = ['Paste JSON', 'Preview', 'Import'];

export default function BulkImportDialog({ open, onClose, restaurantId, onSuccess }) {
  const [activeStep, setActiveStep] = useState(0);
  const [jsonInput, setJsonInput] = useState(`[
  {
    "categoryName": "Pizza",
    "name": "Margherita Pizza",
    "description": "Classic cheese pizza",
    "variants": [
      { "label": "Small", "quantityDesc": "2 pcs", "price": 200 },
      { "label": "Large", "quantityDesc": "4 pcs", "price": 400 }
    ],
    "preparationTime": 15,
    "isAvailable": true
  }
]`);
  const [parsedData, setParsedData] = useState([]);
  const [validationError, setValidationError] = useState('');
  const [loading, setLoading] = useState(false);
  const [importResults, setImportResults] = useState(null);

  const handleReset = () => {
    setActiveStep(0);
    setJsonInput('');
    setParsedData([]);
    setValidationError('');
    setImportResults(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const validateAndParse = () => {
    try {
      setValidationError('');
      
      // Parse JSON
      const parsed = JSON.parse(jsonInput);
      
      // Validate structure
      if (!Array.isArray(parsed)) {
        throw new Error('JSON must be an array of menu items');
      }
      
      if (parsed.length === 0) {
        throw new Error('Menu items array cannot be empty');
      }
      
      if (parsed.length > 500) {
        throw new Error('Cannot import more than 500 menu items at once');
      }

      // Validate each item
      parsed.forEach((item, index) => {
        if (!item.categoryName || typeof item.categoryName !== 'string') {
          throw new Error(`Item ${index + 1}: categoryName is required and must be a string`);
        }
        if (!item.name || typeof item.name !== 'string') {
          throw new Error(`Item ${index + 1}: name is required and must be a string`);
        }
        if (!item.variants || !Array.isArray(item.variants) || item.variants.length === 0) {
          throw new Error(`Item ${index + 1}: variants must be a non-empty array`);
        }
        
        item.variants.forEach((variant, vIndex) => {
          if (!variant.label || typeof variant.label !== 'string') {
            throw new Error(`Item ${index + 1}, variant ${vIndex + 1}: label is required`);
          }
          if (typeof variant.price !== 'number' || variant.price < 0) {
            throw new Error(`Item ${index + 1}, variant ${vIndex + 1}: price must be a non-negative number`);
          }
        });
      });

      setParsedData(parsed);
      setActiveStep(1);
    } catch (error) {
      setValidationError(error.message);
    }
  };

  const handleImport = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/menu/bulk-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          menuItems: parsedData,
          restaurantId: restaurantId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to import menu items');
      }

      setImportResults(data.results);
      setActiveStep(2);
      
      // If all successful, close and refresh after a short delay
      if (data.results.failedCount === 0) {
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      }
    } catch (error) {
      setValidationError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Paste your AI-generated JSON array of menu items below. Each item should include categoryName, name, and variants.
            </Typography>
            
            <TextField
              multiline
              rows={15}
              fullWidth
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}

              sx={{
                mt: 2,
                fontFamily: 'monospace',
                '& textarea': {
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                },
              }}
            />

            {validationError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {validationError}
              </Alert>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Review {parsedData.length} menu items before importing. Click "Confirm Import" to proceed.
            </Alert>

            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Variants</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parsedData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {item.name}
                        </Typography>
                        {item.description && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {item.description.substring(0, 50)}
                            {item.description.length > 50 ? '...' : ''}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={item.categoryName} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {item.variants.map((variant, vIndex) => (
                            <Box key={vIndex} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Chip 
                                label={variant.label} 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                              />
                              {variant.quantityDesc && (
                                <Typography variant="caption" color="text.secondary">
                                  {variant.quantityDesc}
                                </Typography>
                              )}
                              <Typography variant="body2" fontWeight={500}>
                                ₹{variant.price}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {validationError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {validationError}
              </Alert>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            {importResults && (
              <>
                <Alert 
                  severity={importResults.failedCount === 0 ? 'success' : 'warning'} 
                  sx={{ mb: 2 }}
                  icon={importResults.failedCount === 0 ? <CheckCircle /> : <ErrorIcon />}
                >
                  {importResults.failedCount === 0
                    ? `Successfully imported all ${importResults.successCount} menu items!`
                    : `Imported ${importResults.successCount} of ${importResults.totalSubmitted} menu items. ${importResults.failedCount} failed.`}
                </Alert>

                {importResults.failedCount > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom color="error">
                      Failed Items:
                    </Typography>
                    <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Index</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Error</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {importResults.failed.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.index + 1}</TableCell>
                              <TableCell>{item.name}</TableCell>
                              <TableCell>
                                <Typography variant="caption" color="error">
                                  {item.error}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  const renderActions = () => {
    switch (activeStep) {
      case 0:
        return (
          <>
            <Button onClick={handleClose}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={validateAndParse}
              disabled={!jsonInput.trim()}
            >
              Validate & Preview
            </Button>
          </>
        );
      
      case 1:
        return (
          <>
            <Button onClick={() => setActiveStep(0)}>Back</Button>
            <Button 
              variant="contained" 
              onClick={handleImport}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <CloudUpload />}
            >
              {loading ? 'Importing...' : 'Confirm Import'}
            </Button>
          </>
        );
      
      case 2:
        return (
          <>
            {importResults?.failedCount > 0 && (
              <Button onClick={() => setActiveStep(0)}>Import More</Button>
            )}
            <Button variant="contained" onClick={handleClose}>
              Done
            </Button>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <CloudUpload />
          <Typography variant="h6">Bulk Import Menu Items</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {renderActions()}
      </DialogActions>
    </Dialog>
  );
}
