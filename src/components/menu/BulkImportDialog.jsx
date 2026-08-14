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
  Tabs,
  Tab,
  Card,
  CardContent,
  IconButton,
  Grid,
} from '@mui/material';
import {
  CloudUpload,
  CheckCircle,
  Error as ErrorIcon,
  AutoAwesome,
  Code,
  Image as ImageIcon,
  Delete as DeleteIcon,
  Restaurant,
  Category as CategoryIcon,
} from '@mui/icons-material';

const steps = ['Import Source', 'Preview & Confirm', 'Status'];

export default function BulkImportDialog({ open, onClose, restaurantId, onSuccess }) {
  const [activeStep, setActiveStep] = useState(0);
  const [tabValue, setTabValue] = useState(0); // 0: AI Image Extract, 1: Paste JSON
  const [selectedFiles, setSelectedFiles] = useState([]);
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
    setTabValue(0);
    setSelectedFiles([]);
    setJsonInput('');
    setParsedData([]);
    setValidationError('');
    setImportResults(null);
    setLoading(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
      setValidationError('');
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExtractWithAi = async () => {
    if (selectedFiles.length === 0) {
      setValidationError('Please select at least one menu image to extract.');
      return;
    }

    try {
      setLoading(true);
      setValidationError('');

      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/menu/extract-from-images`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to extract menu from images using AI.');
      }

      const extractedItems = data.menuItems || [];
      setParsedData(extractedItems);
      setJsonInput(JSON.stringify(extractedItems, null, 2));
      setActiveStep(1);
    } catch (error) {
      setValidationError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const validateAndParseJson = () => {
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

      // Validate and sanitize each item
      const sanitized = parsed.map((item, index) => {
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

        return {
          categoryName: item.categoryName.trim(),
          name: item.name.trim(),
          description: item.description || '',
          variants: item.variants,
          preparationTime: item.preparationTime ?? 15,
          isAvailable: item.isAvailable ?? true,
        };
      });

      setParsedData(sanitized);
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
          Authorization: `Bearer ${localStorage.getItem('token')}`,
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

  // Summary counts for preview step
  const totalMenuItemsCount = parsedData.length;
  const totalCategoriesCount = new Set(parsedData.map((item) => item.categoryName)).size;

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => {
                setTabValue(newValue);
                setValidationError('');
              }}
              variant="fullWidth"
              sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab icon={<AutoAwesome />} iconPosition="start" label="Extract Menu via Gemini AI" />
              <Tab icon={<Code />} iconPosition="start" label="Paste JSON" />
            </Tabs>

            {tabValue === 0 ? (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Upload photos or scans of restaurant menu card(s). Gemini AI will extract categories, items, prices, and descriptions automatically.
                </Typography>

                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    mt: 2,
                    textAlign: 'center',
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover',
                    cursor: 'pointer',
                  }}
                  component="label"
                >
                  <input
                    type="file"
                    multiple
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    hidden
                    onChange={handleFileChange}
                  />
                  <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Click or Drag Menu Images Here
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Supports JPG, PNG, WEBP images. Upload multiple pages if needed.
                  </Typography>
                </Paper>

                {selectedFiles.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Selected Menu Files ({selectedFiles.length}):
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxHeight: 150, overflowY: 'auto' }}>
                      {selectedFiles.map((file, index) => (
                        <Chip
                          key={index}
                          icon={<ImageIcon />}
                          label={`${file.name} (${(file.size / 1024).toFixed(1)} KB)`}
                          onDelete={() => handleRemoveFile(index)}
                          deleteIcon={<DeleteIcon />}
                          variant="outlined"
                          color="primary"
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {loading && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 1.5 }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" color="primary" fontWeight={600}>
                      Gemini AI is analyzing menu images and extracting items...
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      This takes just a few seconds.
                    </Typography>
                  </Box>
                )}

                {validationError && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {validationError}
                  </Alert>
                )}
              </Box>
            ) : (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Paste your JSON array of menu items below. Each item should include categoryName, name, and variants.
                </Typography>

                <TextField
                  multiline
                  rows={13}
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
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            {/* Summary statistics cards */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ bgcolor: 'primary.50' }}>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Restaurant color="primary" fontSize="medium" />
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Total Menu Items
                        </Typography>
                        <Typography variant="h6" fontWeight={700} color="primary.main">
                          {totalMenuItemsCount} Items
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={6}>
                <Card variant="outlined" sx={{ bgcolor: 'success.50' }}>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <CategoryIcon color="success" fontSize="medium" />
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Total Categories
                        </Typography>
                        <Typography variant="h6" fontWeight={700} color="success.main">
                          {totalCategoriesCount} Categories
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mb: 2 }}>
              Default prep time is set to 15 mins and item availability is set to Available. Review the extracted items below before confirming import.
            </Alert>

            <TableContainer component={Paper} sx={{ maxHeight: 360 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Variants</TableCell>
                    <TableCell align="center">Prep Time</TableCell>
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
                        <Chip label={item.categoryName} size="small" variant="outlined" color="primary" />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {item.variants.map((variant, vIndex) => (
                            <Box key={vIndex} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Chip
                                label={variant.label}
                                size="small"
                                color="default"
                                variant="outlined"
                              />
                              {variant.quantityDesc && (
                                <Typography variant="caption" color="text.secondary">
                                  {variant.quantityDesc}
                                </Typography>
                              )}
                              <Typography variant="body2" fontWeight={600}>
                                ₹{variant.price}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${item.preparationTime ?? 15} mins`}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
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
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            {tabValue === 0 ? (
              <Button
                variant="contained"
                onClick={handleExtractWithAi}
                disabled={loading || selectedFiles.length === 0}
                startIcon={loading ? <CircularProgress size={20} /> : <AutoAwesome />}
              >
                {loading ? 'AI Extracting...' : 'Extract & Preview with AI'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={validateAndParseJson}
                disabled={!jsonInput.trim()}
              >
                Validate & Preview
              </Button>
            )}
          </>
        );

      case 1:
        return (
          <>
            <Button onClick={() => setActiveStep(0)} disabled={loading}>
              Back
            </Button>
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
        sx: { minHeight: '620px' },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <CloudUpload color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Bulk Import Menu Items
          </Typography>
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

      <DialogActions sx={{ px: 3, pb: 2 }}>{renderActions()}</DialogActions>
    </Dialog>
  );
}
