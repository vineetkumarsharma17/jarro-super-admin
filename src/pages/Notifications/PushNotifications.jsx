import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  InputLabel,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Paper,
  IconButton,
} from '@mui/material';
import {
  Send as SendIcon,
  NotificationsActive as NotificationsIcon,
  VolumeUp as VolumeIcon,
  Store as StoreIcon,
  People as RoleIcon,
  Public as PublicIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  TouchApp as ActionIcon,
  AltRoute as RouteIcon,
} from '@mui/icons-material';
import api from '../../services/api';

export default function PushNotifications() {
  const [target, setTarget] = useState('all'); // 'all', 'role', 'restaurant'
  const [role, setRole] = useState('waiter');
  const [restaurantId, setRestaurantId] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sound, setSound] = useState('order_chime');
  const [clickAction, setClickAction] = useState('/');
  const [screen, setScreen] = useState('/orders');
  const [imageUrl, setImageUrl] = useState('');
  const [actions, setActions] = useState([
    { id: 'view_order', title: '👁️ View Order' },
    { id: 'accept_order', title: '✅ Accept' },
  ]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const res = await api.get('/super/restaurants');
      if (res.data && res.data.restaurants) {
        setRestaurants(res.data.restaurants);
      }
    } catch (err) {
      console.error('Error fetching restaurants:', err);
    }
  };

  const handleAddAction = () => {
    if (actions.length >= 3) return;
    setActions([...actions, { id: `action_${actions.length + 1}`, title: 'New Action' }]);
  };

  const handleRemoveAction = (index) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const handleActionChange = (index, field, value) => {
    const updated = [...actions];
    updated[index][field] = value;
    setActions(updated);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError('Please enter notification title and message body.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const payload = {
        target,
        role: target === 'role' ? role : undefined,
        restaurantId: target === 'restaurant' ? restaurantId : undefined,
        title,
        body,
        sound,
        clickAction,
        screen,
        imageUrl: imageUrl.trim() || undefined,
        actions: actions.length > 0 ? actions : undefined,
      };

      const res = await api.post('/notifications/broadcast', payload);
      setResult(res.data);
      if (res.data.success) {
        setTitle('');
        setBody('');
        setImageUrl('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to dispatch push notification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 1, sm: 2 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationsIcon color="primary" /> Futuristic Push Notification Dispatch Center
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Broadcast rich push notifications with dynamic images, custom sound chimes, deep-link screen routing, and interactive action buttons — zero app updates required!
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {result && (
        <Alert severity={result.success ? 'success' : 'warning'} sx={{ mb: 3 }} onClose={() => setResult(null)}>
          <Typography variant="subtitle2" fontWeight={700}>
            {result.message}
          </Typography>
          {result.totalDevices !== undefined && (
            <Typography variant="body2">
              Sent to <strong>{result.sentCount}</strong> devices (Failed: {result.failedCount} / Total: {result.totalDevices}).
            </Typography>
          )}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main Composer Form */}
        <Grid item xs={12} md={7}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <form onSubmit={handleSend}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                  1. Target Audience
                </Typography>

                <FormControl component="fieldset" sx={{ mb: 2.5, width: '100%' }}>
                  <RadioGroup row value={target} onChange={(e) => setTarget(e.target.value)}>
                    <FormControlLabel
                      value="all"
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PublicIcon fontSize="small" color="action" /> All Devices
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="role"
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <RoleIcon fontSize="small" color="action" /> By Role
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="restaurant"
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <StoreIcon fontSize="small" color="action" /> By Restaurant
                        </Box>
                      }
                    />
                  </RadioGroup>
                </FormControl>

                {target === 'role' && (
                  <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
                    <InputLabel>Select Target Role</InputLabel>
                    <Select value={role} label="Select Target Role" onChange={(e) => setRole(e.target.value)}>
                      <MenuItem value="waiter">👨‍🍳 Waiters & Staff</MenuItem>
                      <MenuItem value="admin">🏢 Restaurant Admins</MenuItem>
                      <MenuItem value="user">📱 Diners / Customers</MenuItem>
                      <MenuItem value="super">👑 Super Admins</MenuItem>
                    </Select>
                  </FormControl>
                )}

                {target === 'restaurant' && (
                  <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
                    <InputLabel>Select Restaurant</InputLabel>
                    <Select
                      value={restaurantId}
                      label="Select Restaurant"
                      onChange={(e) => setRestaurantId(e.target.value)}
                    >
                      {restaurants.map((r) => (
                        <MenuItem key={r._id} value={r._id}>
                          {r.name} ({r.city || 'Dev'})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                  2. Notification Content & Rich Media
                </Typography>

                <TextField
                  fullWidth
                  label="Notification Title"
                  placeholder="e.g. 🔔 New Order Alert or 🎁 Special Offer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  size="small"
                  required
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Message Body"
                  placeholder="Write full notification message body..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  size="small"
                  required
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Rich Image URL (Optional)"
                  placeholder="https://example.com/banner.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  size="small"
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: <ImageIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />

                <Grid container spacing={2} sx={{ mb: 2.5 }}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Notification Sound</InputLabel>
                      <Select
                        value={sound}
                        label="Notification Sound"
                        onChange={(e) => setSound(e.target.value)}
                        startAdornment={<VolumeIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />}
                      >
                        <MenuItem value="order_chime">🔔 Order Chime (Custom)</MenuItem>
                        <MenuItem value="bell">🛎️ Service Bell</MenuItem>
                        <MenuItem value="default">🔊 System Default</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Deep Link Target Screen"
                      value={screen}
                      onChange={(e) => setScreen(e.target.value)}
                      placeholder="/orders"
                      InputProps={{
                        startAdornment: <RouteIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Interactive Action Buttons Builder */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ActionIcon fontSize="small" color="primary" /> Dynamic Action Buttons ({actions.length}/3)
                    </Typography>
                    {actions.length < 3 && (
                      <Button size="small" startIcon={<AddIcon />} onClick={handleAddAction}>
                        Add Button
                      </Button>
                    )}
                  </Box>

                  {actions.map((act, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                      <TextField
                        size="small"
                        label={`ID #${index + 1}`}
                        value={act.id}
                        onChange={(e) => handleActionChange(index, 'id', e.target.value)}
                        sx={{ width: 140 }}
                      />
                      <TextField
                        size="small"
                        fullWidth
                        label={`Button Label #${index + 1}`}
                        value={act.title}
                        onChange={(e) => handleActionChange(index, 'title', e.target.value)}
                      />
                      <IconButton size="small" color="error" onClick={() => handleRemoveAction(index)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                  sx={{ py: 1.2, fontWeight: 700 }}
                >
                  {loading ? 'Dispatching Push Notification...' : 'Send Push Notification Now'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Live Device Interactive Preview */}
        <Grid item xs={12} md={5}>
          <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: '#f9fafb', position: 'sticky', top: 20 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>
                Live Device Interactive Preview
              </Typography>

              <Paper
                elevation={0}
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: 3,
                  bgcolor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '6px',
                      bgcolor: 'primary.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    J
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, flexGrow: 1 }}>
                    JARRo Partner • now
                  </Typography>
                  <Chip
                    label={sound}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
                  />
                </Box>

                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#111827' }}>
                  {title || 'Sample Title'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: 13 }}>
                  {body || 'Notification message body will appear here when typed.'}
                </Typography>

                {/* Banner Image Preview */}
                {imageUrl && (
                  <Box
                    component="img"
                    src={imageUrl}
                    alt="Notification Banner"
                    onError={(e) => (e.target.style.display = 'none')}
                    sx={{
                      mt: 1.5,
                      width: '100%',
                      maxHeight: 140,
                      objectFit: 'cover',
                      borderRadius: 2,
                      border: '1px solid #e5e7eb',
                    }}
                  />
                )}

                {/* Action Buttons Preview */}
                {actions.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 1.5, pt: 1.5, borderTop: '1px border #f3f4f6' }}>
                    {actions.map((act, idx) => (
                      <Chip
                        key={idx}
                        label={act.title || `Button ${idx + 1}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontSize: 11, fontWeight: 700, borderRadius: 1.5 }}
                      />
                    ))}
                  </Box>
                )}
              </Paper>

              <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: '#eef2ff', border: '1px solid #c7d2fe' }}>
                <Typography variant="caption" color="primary.dark" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                  🚀 Zero App Update Architecture:
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Rich images, dynamic action buttons, custom sounds, and target deep links (`{screen}`) are parsed natively on-device in real time.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
