import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Avatar, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  CircularProgress,
  CardActionArea,
  Paper,
} from '@mui/material';
import { 
  Restaurant as MenuIcon,
  Category as CategoryIcon,
  TableBar as TableIcon,
  ArrowForward as ArrowForwardIcon,
  CardMembership as SubscriptionIcon,
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { restaurantService } from '../../services/restaurantService';
import { subscriptionService } from '../../services/subscriptionService';
import Breadcrumb from '../../components/common/Breadcrumb';
import { 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';

export default function RestaurantView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restaurant, setRestaurant] = useState(null);
  const [stats, setStats] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [balance, setBalance] = useState(0);

  // Modal state
  const [openModal, setOpenModal] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignData, setAssignData] = useState({
    type: 'YEARLY',
    amount: 2999,
    paymentMethod: 'cash',
    transactionId: '',
  });
  const [modalError, setModalError] = useState('');

  // Update Expiry Modal state
  const [openExpiryModal, setOpenExpiryModal] = useState(false);
  const [updatingExpiry, setUpdatingExpiry] = useState(false);
  const [newExpiryDate, setNewExpiryDate] = useState('');

  // Remove Subscription state
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await restaurantService.getRestaurantStats(id);
      setRestaurant(response.restaurant);
      setStats(response.stats);
      setSubscription(response.subscription);
      setBalance(response.balance);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch restaurant details');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSubscription = async () => {
    try {
      setAssigning(true);
      setModalError('');
      
      const payload = {
        ...assignData,
        userId: restaurant.ownerId._id,
      };

      await subscriptionService.purchaseSubscription(payload);
      setOpenModal(false);
      fetchData(); // Refresh data
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to assign subscription');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveSubscription = async () => {
    if (!window.confirm('Are you sure you want to remove this subscription?')) return;
    
    try {
      setRemoving(true);
      await subscriptionService.removeSubscription(subscription._id);
      fetchData(); // Refresh data
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove subscription');
    } finally {
      setRemoving(false);
    }
  };

  const handleUpdateExpiry = async () => {
    try {
      setUpdatingExpiry(true);
      await subscriptionService.updateSubscriptionExpiry(subscription._id, newExpiryDate);
      setOpenExpiryModal(false);
      fetchData(); // Refresh data
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update expiry date');
    } finally {
      setUpdatingExpiry(false);
    }
  };

  const handleToggleAdFree = async () => {
    try {
      const newStatus = !restaurant.isAdFree;
      await restaurantService.updateRestaurant(id, { isAdFree: newStatus });
      setRestaurant((prev) => ({ ...prev, isAdFree: newStatus }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update ad-free status');
    }
  };

  const breadcrumbItems = [
    { label: 'Restaurants', path: '/restaurants' },
    { label: restaurant?.name || 'Restaurant Details' },
  ];

  const navigationCards = [
    {
      title: 'Menu Items',
      count: stats?.menus ?? 0,
      icon: <MenuIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      bgColor: '#e3f2fd',
      path: `/restaurants/${id}/menus`,
      description: 'View all menu items',
    },
    {
      title: 'Categories',
      count: stats?.categories ?? 0,
      icon: <CategoryIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
      bgColor: '#e8f5e9',
      path: `/restaurants/${id}/categories`,
      description: 'View all categories',
    },
    {
      title: 'Tables',
      count: stats?.tables ?? 0,
      icon: <TableIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
      bgColor: '#fff3e0',
      path: `/restaurants/${id}/tables`,
      description: 'View all tables',
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !restaurant) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Restaurant details unavailable'}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 3 }}>
      <Breadcrumb items={breadcrumbItems} />

      {/* Restaurant Header */}
      <Card sx={{ borderRadius: 3, mb: 3, border: '1px solid #e5e7eb', boxShadow: 'none' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <Avatar sx={{ width: 72, height: 72, bgcolor: 'primary.main', fontSize: 28, fontWeight: 800 }}>
                {restaurant.name?.charAt(0) || 'R'}
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>{restaurant.name}</Typography>
                <Typography color="text.secondary" variant="body1">{restaurant.address || 'Address not configured'}</Typography>
                <Typography color="text.secondary" variant="body2">Phone: {restaurant.phone || 'N/A'}</Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
              <Chip
                label={restaurant.status ? 'ACTIVE STORE' : 'INACTIVE STORE'}
                color={restaurant.status ? 'success' : 'error'}
                sx={{ fontWeight: 800 }}
              />

              <Chip
                label={restaurant.isAdFree ? 'PRO AD-FREE' : 'FREE AD-SUPPORTED'}
                color={restaurant.isAdFree ? 'primary' : 'warning'}
                sx={{ fontWeight: 800 }}
              />

              <Button
                size="small"
                variant="outlined"
                color={restaurant.isAdFree ? 'warning' : 'primary'}
                onClick={handleToggleAdFree}
                sx={{ fontWeight: 700 }}
              >
                {restaurant.isAdFree ? 'Enable Ads' : 'Grant Ad-Free Pro'}
              </Button>

              <Button
                variant="outlined"
                color="secondary"
                onClick={() => navigate('/restaurants')}
                sx={{ fontWeight: 700 }}
              >
                Back to List
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Navigation Cards */}
        <Grid item xs={12}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Quick Navigation
          </Typography>
          <Grid container spacing={3}>
            {navigationCards.map((card, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card 
                  sx={{ 
                    borderRadius: 2,
                    height: '100%',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardActionArea 
                    onClick={() => navigate(card.path)}
                    sx={{ height: '100%' }}
                  >
                    <CardContent>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          mb: 2,
                        }}
                      >
                        <Box 
                          sx={{ 
                            bgcolor: card.bgColor, 
                            color: card.color,
                            borderRadius: 2,
                            p: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {card.icon}
                        </Box>
                        <ArrowForwardIcon sx={{ color: 'text.secondary' }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {card.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {card.description}
                      </Typography>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          bgcolor: card.bgColor, 
                          p: 1.5, 
                          borderRadius: 1,
                          textAlign: 'center',
                        }}
                      >
                        <Typography 
                          variant="h4" 
                          sx={{ fontWeight: 700, color: card.color }}
                        >
                          {card.count}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Total {card.title}
                        </Typography>
                      </Paper>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Restaurant Details & Subscription */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Restaurant Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Status
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {restaurant.status ? 'Active' : 'Inactive'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Total Users
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {stats?.users ?? 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Latitude
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {restaurant.latitude ?? 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Longitude
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {restaurant.longitude ?? 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    Description
                  </Typography>
                  <Typography color="text.secondary">
                    {restaurant.description || 'No description provided.'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Subscription Card */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Subscription Details
                    </Typography>
                    {!subscription ? (
                      <Button 
                        variant="contained" 
                        size="small"
                        onClick={() => setOpenModal(true)}
                        startIcon={<SubscriptionIcon />}
                      >
                        Assign Subscription
                      </Button>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                          variant="outlined" 
                          size="small"
                          color="primary"
                          onClick={() => {
                            setNewExpiryDate(subscription.endDate ? new Date(subscription.endDate).toISOString().split('T')[0] : '');
                            setOpenExpiryModal(true);
                          }}
                        >
                          Edit Expiry
                        </Button>
                        <Button 
                          variant="outlined" 
                          size="small"
                          color="error"
                          onClick={handleRemoveSubscription}
                          disabled={removing}
                        >
                          {removing ? 'Removing...' : 'Remove'}
                        </Button>
                      </Box>
                    )}
                  </Box>

                  {subscription ? (
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <SubscriptionIcon color="primary" />
                          <Box>
                            <Typography variant="body2" color="text.secondary">Plan Type</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>{subscription.type}</Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Box 
                            sx={{ 
                              width: 10, 
                              height: 10, 
                              borderRadius: '50%', 
                              bgcolor: subscription.status === 'ACTIVE' ? 'success.main' : 'error.main' 
                            }} 
                          />
                          <Box>
                            <Typography variant="body2" color="text.secondary">Status</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>{subscription.status}</Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Start Date</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {new Date(subscription.startDate).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Expiration Date</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </Grid>

                      {subscription.type === 'PAYG' && (
                        <Grid item xs={12}>
                          <Divider sx={{ my: 1 }} />
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <WalletIcon color="warning" />
                            <Box>
                              <Typography variant="body2" color="text.secondary">Current Balance</Typography>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main' }}>
                                ₹{balance}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  ) : (
                    <Box sx={{ py: 2, textAlign: 'center' }}>
                      <Alert severity="warning" sx={{ mb: 0 }}>
                        No active subscription assigned to this restaurant owner.
                      </Alert>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Owner Details */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Owner Information
              </Typography>
              <List disablePadding>
                <ListItem disablePadding sx={{ mb: 1 }}>
                  <ListItemText 
                    primary={
                      <Typography variant="body2" color="text.secondary">
                        Name
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {restaurant.ownerId?.username || 'N/A'}
                      </Typography>
                    } 
                  />
                </ListItem>
                <ListItem disablePadding sx={{ mb: 1 }}>
                  <ListItemText 
                    primary={
                      <Typography variant="body2" color="text.secondary">
                        Email
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {restaurant.ownerId?.email || 'N/A'}
                      </Typography>
                    } 
                  />
                </ListItem>
                <ListItem disablePadding>
                  <ListItemText 
                    primary={
                      <Typography variant="body2" color="text.secondary">
                        Mobile
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {restaurant.ownerId?.mobile || 'N/A'}
                      </Typography>
                    } 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Assign Subscription Modal */}
      <Dialog open={openModal} onClose={() => !assigning && setOpenModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Assign Subscription</DialogTitle>
        <DialogContent dividers>
          {modalError && <Alert severity="error" sx={{ mb: 2 }}>{modalError}</Alert>}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Assign a YEARLY subscription plan to <strong>{restaurant.ownerId?.username || 'the owner'}</strong>.
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Subscription Type"
                value={assignData.type}
                disabled // Locked to YEARLY for now as per user feedback
                SelectProps={{ native: true }}
              >
                <option value="YEARLY">Yearly Subscription (₹2999)</option>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Amount (INR)"
                type="number"
                value={assignData.amount}
                onChange={(e) => setAssignData({ ...assignData, amount: e.target.value })}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Payment Method"
                value={assignData.paymentMethod}
                onChange={(e) => setAssignData({ ...assignData, paymentMethod: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="other">Other</option>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Transaction ID / Reference"
                value={assignData.transactionId}
                onChange={(e) => setAssignData({ ...assignData, transactionId: e.target.value })}
                placeholder="Optional"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenModal(false)} disabled={assigning}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleAssignSubscription} 
            disabled={assigning}
            startIcon={assigning && <CircularProgress size={20} color="inherit" />}
          >
            {assigning ? 'Assigning...' : 'Assign Subscription'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Expiry Modal */}
      <Dialog open={openExpiryModal} onClose={() => !updatingExpiry && setOpenExpiryModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Update Expiry Date</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Change the expiration date for the current <strong>{subscription?.type}</strong> subscription.
          </Typography>
          
          <TextField
            fullWidth
            label="New Expiration Date"
            type="date"
            value={newExpiryDate}
            onChange={(e) => setNewExpiryDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenExpiryModal(false)} disabled={updatingExpiry}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleUpdateExpiry} 
            disabled={updatingExpiry}
            startIcon={updatingExpiry && <CircularProgress size={20} color="inherit" />}
          >
            {updatingExpiry ? 'Updating...' : 'Update Expiry'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
