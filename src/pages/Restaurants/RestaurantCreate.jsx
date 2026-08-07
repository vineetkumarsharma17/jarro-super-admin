import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import FormInput from '../../components/common/FormInput';
import FormSelect from '../../components/common/FormSelect';
import { restaurantService } from '../../services/restaurantService';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'staff', label: 'Staff' },
];

export default function RestaurantCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    // User details
    username: '',
    email: '',
    mobile: '',
    password: '',
    role: 'admin',
    
    // Restaurant details
    name: '',
    address: '',
    phone: '',
    latitude: '',
    longitude: '',
  });

  // Form errors
  const [formErrors, setFormErrors] = useState({});

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    // User validations
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!formData.mobile.trim()) {
      errors.mobile = 'Mobile number is required';
    } else if (!/^[0-9]{10}$/.test(formData.mobile)) {
      errors.mobile = 'Mobile number must be 10 digits';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (!formData.role) {
      errors.role = 'Role is required';
    }

    // Restaurant validations
    if (!formData.name.trim()) {
      errors.name = 'Restaurant name is required';
    }
    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }

    // Optional geo-coordinates validation
    if (formData.latitude && isNaN(formData.latitude)) {
      errors.latitude = 'Latitude must be a number';
    }
    if (formData.longitude && isNaN(formData.longitude)) {
      errors.longitude = 'Longitude must be a number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setError('Please fix the errors in the form');
      return;
    }

    try {
      setLoading(true);

      // Prepare data for API
      const submitData = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      };

      const response = await restaurantService.createRestaurant(submitData);

      setSuccess('Restaurant registered successfully!');
      
      // Redirect to restaurant list after 2 seconds
      setTimeout(() => {
        navigate('/restaurants');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register restaurant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/restaurants')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Register New Restaurant
        </Typography>
      </Box>

      {/* Form */}
      <Paper sx={{ p: 4, maxWidth: 900, mx: 'auto' }}>
        <form onSubmit={handleSubmit}>
          {/* Success/Error Messages */}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Owner/User Details Section */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Owner Details
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <FormInput
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                error={!!formErrors.username}
                helperText={formErrors.username}
                required
                placeholder="e.g., burger_point"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormInput
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!formErrors.email}
                helperText={formErrors.email}
                required
                placeholder="owner@example.com"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormInput
                label="Mobile Number"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                error={!!formErrors.mobile}
                helperText={formErrors.mobile}
                required
                placeholder="1234567890"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormInput
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={!!formErrors.password}
                helperText={formErrors.password}
                required
                placeholder="Min. 6 characters"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormSelect
                label="Role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                options={ROLE_OPTIONS}
                error={!!formErrors.role}
                helperText={formErrors.role}
                required
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Restaurant Details Section */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Restaurant Details
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <FormInput
                label="Restaurant Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
                placeholder="e.g., Hardoi Kitchen Cafe & Restaurant"
              />
            </Grid>
            <Grid item xs={12}>
              <FormInput
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                error={!!formErrors.address}
                helperText={formErrors.address}
                required
                multiline
                rows={3}
                placeholder="Full address with landmarks"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormInput
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                error={!!formErrors.phone}
                helperText={formErrors.phone}
                required
                placeholder="+1 555-123-4567"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormInput
                label="Latitude (Optional)"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                error={!!formErrors.latitude}
                helperText={formErrors.latitude || 'e.g., 27.403475'}
                placeholder="27.403475"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormInput
                label="Longitude (Optional)"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                error={!!formErrors.longitude}
                helperText={formErrors.longitude || 'e.g., 80.127659'}
                placeholder="80.127659"
              />
            </Grid>
          </Grid>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/restaurants')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register Restaurant'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
