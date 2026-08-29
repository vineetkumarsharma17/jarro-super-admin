// TODO (Future Analytics Module):
// Create a dedicated Device & Presence Analytics Module in Super Admin to track:
// 1. Historical device connection logs per restaurant.
// 2. Peak device usage hours and concurrent connection trends.
// 3. Platform breakdown (Android, iOS, Web POS, Waiter Devices).

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  TextField,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  Storefront as StoreIcon,
  Devices as DevicesIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  CheckCircle as OnlineIcon,
} from '@mui/icons-material';
import { usePresence } from '../../context/PresenceContext';
import api from '../../services/api';

export default function OnlinePresenceModal({ open, onClose }) {
  const { connected, onlineRestaurantIds, deviceCounts, totalDevices, totalRestaurantsOnline } = usePresence();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open) {
      fetchRestaurants();
    }
  }, [open]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super/restaurants');
      if (res.data && res.data.restaurants) {
        setRestaurants(res.data.restaurants);
      }
    } catch (err) {
      console.error('Error fetching restaurant details for presence modal:', err);
    } finally {
      setLoading(false);
    }
  };

  // Map online restaurant IDs to restaurant names
  const onlineList = (onlineRestaurantIds || []).map((id) => {
    const found = restaurants.find((r) => r._id === id);
    return {
      id,
      name: found?.name || `Restaurant ID: ${id}`,
      mobile: found?.ownerId?.mobile || found?.phone || '',
      devices: deviceCounts[id] || 1,
    };
  });

  const filteredList = onlineList.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.mobile.includes(search) ||
      item.id.includes(search)
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth paperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: 'success.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'success.dark',
            }}
          >
            <DevicesIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem' }}>
              Online Restaurants & Devices
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {totalDevices} device(s) active across {totalRestaurantsOnline} restaurant(s)
            </Typography>
          </Box>
        </Box>
        <Chip
          label={connected ? 'Live Sync' : 'Connecting'}
          color={connected ? 'success' : 'default'}
          size="small"
          sx={{ fontWeight: 700 }}
        />
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        {/* Search filter */}
        <TextField
          size="small"
          fullWidth
          placeholder="Search online restaurant by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : filteredList.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <StoreIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {onlineList.length === 0
                ? 'No active restaurant devices connected right now.'
                : 'No online restaurant matches your search.'}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {filteredList.map((item) => (
              <ListItem
                key={item.id}
                sx={{
                  mb: 1,
                  borderRadius: 2,
                  bgcolor: 'background.neutral',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <ListItemIcon>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: 'success.50',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'success.main',
                    }}
                  >
                    <OnlineIcon fontSize="small" />
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={<Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.name}</Typography>}
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {item.mobile ? `Phone: ${item.mobile}` : `ID: ${item.id}`}
                    </Typography>
                  }
                />
                <Chip
                  icon={<DevicesIcon style={{ fontSize: 14 }} />}
                  label={`${item.devices} device${item.devices > 1 ? 's' : ''}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" disableElevation sx={{ borderRadius: 2 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
