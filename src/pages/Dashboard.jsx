import React, { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  FormControl,
  Select,
  MenuItem,
  Avatar,
  Stack,
  Card,
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  People as PeopleIcon,
  ShoppingCart as OrderIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
  Storefront as StorefrontIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/common/StatCard';
import { analyticsService } from '../services/analyticsService';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [presetRange, setPresetRange] = useState('30d');
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [presetRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const end = new Date();
      let start = new Date();

      if (presetRange === '7d') {
        start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (presetRange === '30d') {
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (presetRange === '90d') {
        start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
      }

      const response = await analyticsService.getSystemDashboard({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });

      setDashboardData(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  const trendingList = dashboardData?.trendingRestaurants || [];
  const dailyTrend = dashboardData?.revenue?.dailyTrend || [];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      {/* Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="text.primary">
            Platform Executive Dashboard
          </Typography>
          <Typography variant="body2" color="textSecondary">
            SaaS Store Growth, Daily Order Velocity & Trending Restaurants
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={presetRange}
              onChange={(e) => setPresetRange(e.target.value)}
              sx={{ fontWeight: 700 }}
            >
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            onClick={fetchDashboardData}
            sx={{ fontWeight: 700 }}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* Top 4 Product Owner KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* 1. Total Onboarded Stores */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="overline" color="text.secondary" fontWeight={700}>
                Total Onboarded Stores
              </Typography>
              <StorefrontIcon color="primary" fontSize="large" />
            </Box>
            <Typography variant="h4" fontWeight={800}>
              {dashboardData?.restaurants?.total || 0}
            </Typography>
            <Typography variant="caption" color="success.main" fontWeight={700}>
              ● {dashboardData?.restaurants?.activeToday || 0} Stores Active Today
            </Typography>
          </Card>
        </Grid>

        {/* 2. Active Stores Today */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="overline" color="text.secondary" fontWeight={700}>
                Active Stores Today
              </Typography>
              <CheckCircleIcon color="success" fontSize="large" />
            </Box>
            <Typography variant="h4" fontWeight={800} color="success.main">
              {dashboardData?.restaurants?.activeToday || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Processed orders in last 24h
            </Typography>
          </Card>
        </Grid>

        {/* 3. Platform Total Orders */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="overline" color="text.secondary" fontWeight={700}>
                Platform Total Orders
              </Typography>
              <OrderIcon color="info" fontSize="large" />
            </Box>
            <Typography variant="h4" fontWeight={800}>
              {dashboardData?.orders?.total?.toLocaleString() || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Across all stores in period
            </Typography>
          </Card>
        </Grid>

        {/* 4. Avg Daily Orders / Store */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="overline" color="text.secondary" fontWeight={700}>
                Avg Daily Orders / Store
              </Typography>
              <SpeedIcon color="warning" fontSize="large" />
            </Box>
            <Typography variant="h4" fontWeight={800} color="warning.main">
              {dashboardData?.orders?.avgDailyOrdersPerStore || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Orders / Store / Day throughput
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* 🔥 Top Trending & Performing Restaurants */}
        <Grid item xs={12} lg={8}>
          <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid #e5e7eb', boxShadow: 'none', height: '100%' }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUpIcon color="error" />
                  Top Trending & Active Restaurants
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Stores processing the highest order volume in the selected window
                </Typography>
              </Box>

              <Button
                size="small"
                variant="outlined"
                onClick={() => navigate('/restaurants')}
                sx={{ fontWeight: 700 }}
              >
                View All Stores
              </Button>
            </Box>

            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f9fafb' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Rank</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Restaurant Name</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Total Orders</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Gross Volume</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Avg Order Value</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trendingList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No active orders recorded in selected period.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  trendingList.map((store, idx) => (
                    <TableRow key={store.id} hover>
                      <TableCell>
                        <Chip
                          label={`#${idx + 1}`}
                          size="small"
                          color={idx === 0 ? 'error' : idx === 1 ? 'warning' : 'default'}
                          sx={{ fontWeight: 800 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: 13, fontWeight: 700 }}>
                            {store.name ? store.name.charAt(0).toUpperCase() : 'R'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={700}>
                              {store.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {store.phone || store.address || 'Verified Store'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={800} color="primary.main">
                          {store.totalOrders.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={700}>
                          ₹{store.totalRevenue.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          ₹{store.avgOrderValue}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          startIcon={<VisibilityIcon fontSize="small" />}
                          onClick={() => navigate(`/restaurants/${store.id}`)}
                          sx={{ fontWeight: 700, fontSize: 11 }}
                        >
                          Analytics
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* 📈 Platform Daily Order Velocity Chart */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb', boxShadow: 'none', height: '100%' }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>
              Platform Daily Order Velocity
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              Daily total orders processed across all onboarded restaurants
            </Typography>

            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Daily Orders" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
