import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';
import { bannerService } from '../../services/bannerService';

const bannerTypes = [
  { value: 'login', label: 'Login Screen' },
  { value: 'signup', label: 'Signup Screen' },
  { value: 'forgot_password', label: 'Forgot Password Screen' },
];

export default function BannerManagement() {
  const [banners, setBanners] = useState({
    login: null,
    signup: null,
    forgot_password: null,
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('login');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await bannerService.getBanners();
      setBanners(response.banners || {});
    } catch (err) {
      setError('Failed to fetch banners');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image');
      return;
    }

    try {
      setUploading(true);
      setError('');
      await bannerService.uploadBanner(selectedType, selectedFile);
      setSuccess(`${bannerTypes.find(t => t.value === selectedType).label} banner uploaded successfully!`);
      setDialogOpen(false);
      setSelectedFile(null);
      setPreviewUrl('');
      fetchBanners(); // Refresh banners
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload banner');
    } finally {
      setUploading(false);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedFile(null);
    setPreviewUrl('');
    setError('');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Banner Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Upload banners for authentication screens
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Upload Banner
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Grid container spacing={3}>
        {bannerTypes.map((type) => (
          <Grid item xs={12} md={4} key={type.value}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {type.label}
                </Typography>
                {banners[type.value] ? (
                  <Box>
                    <CardMedia
                      component="img"
                      image={banners[type.value]}
                      alt={type.label}
                      sx={{ 
                        width: '100%', 
                        height: 200, 
                        objectFit: 'cover',
                        borderRadius: 1,
                        mb: 2
                      }}
                    />
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => {
                        setSelectedType(type.value);
                        setDialogOpen(true);
                      }}
                    >
                      Change Banner
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    <Box
                      sx={{
                        height: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'grey.100',
                        borderRadius: 1,
                        mb: 2,
                      }}
                    >
                      <Typography color="textSecondary">No banner uploaded</Typography>
                    </Box>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => {
                        setSelectedType(type.value);
                        setDialogOpen(true);
                      }}
                    >
                      Upload Banner
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Upload Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Banner</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 3 }}>
            <InputLabel>Banner Type</InputLabel>
            <Select
              value={selectedType}
              label="Banner Type"
              onChange={(e) => setSelectedType(e.target.value)}
            >
              {bannerTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ mb: 2 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="banner-file-input"
              type="file"
              onChange={handleFileSelect}
            />
            <label htmlFor="banner-file-input">
              <Button variant="outlined" component="span" fullWidth>
                Select Image
              </Button>
            </label>
          </Box>

          {previewUrl && (
            <Box>
              <Typography variant="body2" gutterBottom>
                Preview:
              </Typography>
              <CardMedia
                component="img"
                image={previewUrl}
                alt="Preview"
                sx={{ 
                  width: '100%', 
                  maxHeight: 300, 
                  objectFit: 'contain',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              />
            </Box>
          )}

          {selectedFile && (
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
              Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
