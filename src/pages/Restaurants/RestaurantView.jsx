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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  Tooltip,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
} from '@mui/material';
import {
  Restaurant as MenuIcon,
  Category as CategoryIcon,
  TableBar as TableIcon,
  ArrowForward as ArrowForwardIcon,
  CardMembership as SubscriptionIcon,
  AccountBalanceWallet as WalletIcon,
  ShoppingCart as OrderIcon,
  AttachMoney as MoneyIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import { useParams, useNavigate } from 'react-router-dom';
import { restaurantService } from '../../services/restaurantService';
import { subscriptionService } from '../../services/subscriptionService';
import Breadcrumb from '../../components/common/Breadcrumb';

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

  const hourlyPeakData = stats?.hourlyPeakHours || [];
  const topItemsData = stats?.topSellingItems || [];

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

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Chip
                label={restaurant.status ? 'ACTIVE STORE' : 'INACTIVE STORE'}
                color={restaurant.status ? 'success' : 'error'}
                sx={{ fontWeight: 800 }}
              />
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

      {/* Detailed Restaurant Business Analytics & Performance Metrics */}
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <TrendingUpIcon color="primary" />
        Detailed Store Business Analytics (Last 30 Days)
      </Typography>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Total Orders & Daily Average Orders */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="overline" color="text.secondary" fontWeight={700}>
                Total Store Orders
              </Typography>
              <OrderIcon color="primary" />
            </Box>
            <Typography variant="h4" fontWeight={800}>
              {stats?.totalOrders?.toLocaleString() || 0}
            </Typography>
            <Typography variant="caption" color="primary.main" fontWeight={700}>
              ⚡ {stats?.dailyAverageOrders || 0} Average Orders / Day
            </Typography>
          </Card>
        </Grid>

        {/* Store Gross Revenue & AOV */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="overline" color="text.secondary" fontWeight={700}>
                Gross Store Revenue
              </Typography>
              <MoneyIcon color="success" />
            </Box>
            <Typography variant="h4" fontWeight={800} color="success.main">
              ₹{stats?.totalRevenue?.toLocaleString() || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Avg Order Value: ₹{stats?.avgOrderValue || 0}
            </Typography>
          </Card>
        </Grid>

        {/* Tables & Menu Scale */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="overline" color="text.secondary" fontWeight={700}>
                Tables & Menu Scale
              </Typography>
              <TableIcon color="warning" />
            </Box>
            <Typography variant="h4" fontWeight={800}>
              {stats?.tables || 0} <Typography component="span" variant="body1" color="text.secondary">Tables</Typography>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stats?.menus || 0} Menu Items • {stats?.categories || 0} Categories
            </Typography>
          </Card>
        </Grid>

        {/* Registered Staff Accounts */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="overline" color="text.secondary" fontWeight={700}>
                Registered Staff Accounts
              </Typography>
              <SpeedIcon color="info" />
            </Box>
            <Typography variant="h4" fontWeight={800}>
              {stats?.users || 0} <Typography component="span" variant="body1" color="text.secondary">Staff</Typography>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Active POS & Billing Operators
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Hourly Rush Hours & Top Selling Items */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Hourly Peak Rush Hours Chart */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb', boxShadow: 'none', height: '100%' }}>
            <Typography variant="h6" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScheduleIcon color="primary" />
              Hourly Peak Rush Hours (Order Velocity)
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              Identify store rush hours (e.g. 1pm–3pm Lunch Rush, 8pm–10pm Dinner Rush)
            </Typography>

            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={hourlyPeakData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <RechartsTooltip />
                <Bar dataKey="orders" fill="#16a34a" radius={[4, 4, 0, 0]} name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Top Selling Menu Items Table */}
        <Grid item xs={12} md={5}>
          <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid #e5e7eb', boxShadow: 'none', height: '100%' }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid #e5e7eb' }}>
              <Typography variant="h6" fontWeight={800}>
                Top Selling Menu Items
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Most ordered food items in this store
              </Typography>
            </Box>

            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f9fafb' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Qty Sold</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Revenue</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topItemsData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                      <Typography variant="caption" color="text.secondary">No item sales recorded yet.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  topItemsData.map((item, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {item.name}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={`${item.quantity} pcs`} size="small" color="primary" sx={{ fontWeight: 700 }} />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={700} color="success.main">
                          ₹{item.revenue}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* Quick Navigation Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
            Quick Navigation & Catalog Management
          </Typography>
          <Grid container spacing={3}>
            {navigationCards.map((card, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card 
                  sx={{ 
                    borderRadius: 3,
                    height: '100%',
                    border: '1px solid #e5e7eb',
                    boxShadow: 'none',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
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
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
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
                          borderRadius: 2,
                          textAlign: 'center',
                        }}
                      >
                        <Typography 
                          variant="h4" 
                          sx={{ fontWeight: 800, color: card.color }}
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

        {/* Restaurant Owner Details & Subscription Control */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb', boxShadow: 'none', mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Store Owner Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Owner Username</Typography>
                  <Typography variant="body1" fontWeight={700}>{restaurant.ownerId?.username || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Owner Email</Typography>
                  <Typography variant="body1" fontWeight={700}>{restaurant.ownerId?.email || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Owner Mobile</Typography>
                  <Typography variant="body1" fontWeight={700}>{restaurant.ownerId?.mobile || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Account Created</Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {new Date(restaurant.createdAt).toLocaleDateString()}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Subscription & Payg Balance */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb', boxShadow: 'none', mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SubscriptionIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Subscription Status
                </Typography>
              </Box>

              {subscription ? (
                <Box>
                  <Chip label={subscription.status} color="success" sx={{ fontWeight: 800, mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">Plan: {subscription.planName || 'Standard'}</Typography>
                  <Typography variant="body2" color="text.secondary">Expires: {new Date(subscription.endDate).toLocaleDateString()}</Typography>

                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Button size="small" variant="outlined" onClick={() => setOpenExpiryModal(true)}>
                      Extend Expiry
                    </Button>
                    <Button size="small" variant="outlined" color="error" onClick={handleRemoveSubscription} disabled={removing}>
                      Remove Plan
                    </Button>
                  </Stack>
                </Box>
              ) : (
                <Box>
                  <Alert severity="warning" sx={{ mb: 2 }}>No active subscription plan</Alert>
                  <Button variant="contained" fullWidth onClick={() => setOpenModal(true)} sx={{ fontWeight: 700 }}>
                    Assign Subscription
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
