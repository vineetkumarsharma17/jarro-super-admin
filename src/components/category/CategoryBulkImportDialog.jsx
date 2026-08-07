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

export default function CategoryBulkImportDialog({ open, onClose, restaurantId, onSuccess }) {
  const [activeStep, setActiveStep] = useState(0);
  const [jsonInput, setJsonInput] = useState('');
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
        throw new Error('JSON must be an array of categories');
      }
      
      if (parsed.length === 0) {
        throw new Error('Categories array cannot be empty');
      }
      
      if (parsed.length > 200) {
        throw new Error('Cannot import more than 200 categories at once');
      }

      // Validate each item
      parsed.forEach((item, index) => {
        if (!item.name || typeof item.name !== 'string') {
          throw new Error(`Item ${index + 1}: name is required and must be a string`);
        }
        if (item.name.trim().length === 0) {
          throw new Error(`Item ${index + 1}: name cannot be empty`);
        }
        if (item.imageUrl !== undefined && typeof item.imageUrl !== 'string') {
          throw new Error(`Item ${index + 1}: imageUrl must be a string`);
        }
        if (item.isActive !== undefined && typeof item.isActive !== 'boolean') {
          throw new Error(`Item ${index + 1}: isActive must be a boolean`);
        }
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/category/bulk-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          categories: parsedData,
          restaurantId: restaurantId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to import categories');
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
              Paste your AI-generated JSON array of categories below. Each category should include a name and optionally imageUrl and isActive status.
            </Typography>
            
            <TextField
              multiline
              rows={15}
              fullWidth
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={`[\n  {\n    "name": "Appetizers",\n    "imageUrl": "https://example.com/appetizers.jpg",\n    "isActive": true\n  },\n  {\n    "name": "Main Course",\n    "isActive": true\n  },\n  {\n    "name": "Desserts",\n    "isActive": true\n  }\n]`}
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
              Review {parsedData.length} categories before importing. Click "Confirm Import" to proceed.
            </Alert>

            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Image URL</TableCell>
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
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={item.isActive !== false ? 'Active' : 'Inactive'} 
                          color={item.isActive !== false ? 'success' : 'default'}
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        {item.imageUrl ? (
                          <Typography variant="caption" color="text.secondary">
                            {item.imageUrl.substring(0, 30)}...
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.disabled">
                            No image
                          </Typography>
                        )}
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
                    ? `Successfully imported all ${importResults.successCount} categories!`
                    : `Imported ${importResults.successCount} of ${importResults.totalSubmitted} categories. ${importResults.failedCount} failed.`}
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
          <Typography variant="h6">Bulk Import Categories</Typography>
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
