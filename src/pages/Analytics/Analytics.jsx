import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Paper, Typography, CircularProgress, Alert, ToggleButton,
  ToggleButtonGroup, Stack,
} from '@mui/material';
import {
  Restaurant as RestaurantIcon, ShoppingCart as OrderIcon,
  AttachMoney as RevenueIcon, TrendingUp as TrendIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import StatCard from '../../components/common/StatCard';
import { analyticsService } from '../../services/analyticsService';

const PIE_COLORS = ['#4f46e5', '#0ea5e9', '#16a34a', '#d97706', '#dc2626', '#7c3aed'];

const rangeToDates = (days) => {
  const end = new Date();
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
};

export default function Analytics() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [trends, setTrends] = useState([]);
  const [topRestaurants, setTopRestaurants] = useState([]);

  const load = async (rangeDays) => {
    try {
      setLoading(true);
      setError('');
      const params = rangeToDates(rangeDays);
      const [dash, trendRes, topRes] = await Promise.all([
        analyticsService.getSystemDashboard(params),
        analyticsService.getRevenueTrends(params),
        analyticsService.getTopRestaurants({ ...params, limit: 8 }),
      ]);
      setDashboard(dash.data || null);
      setTrends(
        (trendRes.data?.trends || []).map((t) => ({
          label: `${t.date?.day ?? ''}/${t.date?.month ?? ''}`,
          revenue: t.totalRevenue,
          orders: t.totalOrders,
        }))
      );
      setTopRestaurants(
        (topRes.data?.restaurants || []).map((r) => ({
          name: (r.restaurantName || 'Unknown').slice(0, 18),
          revenue: r.totalRevenue,
          orders: r.totalOrders,
        }))
      );
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(days); /* eslint-disable-next-line */ }, [days]);

  const statusData = (dashboard?.orders?.byStatus || []).map((s) => ({
    name: s._id || 'unknown',
    value: s.count,
  }));

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4">Analytics</Typography>
          <Typography variant="body2" color="text.secondary">System performance overview</Typography>
        </Box>
        <ToggleButtonGroup
          size="small" exclusive value={days}
          onChange={(_, v) => v && setDays(v)} color="primary"
        >
          <ToggleButton value={7}>7d</ToggleButton>
          <ToggleButton value={30}>30d</ToggleButton>
          <ToggleButton value={90}>90d</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Total Revenue" value={`₹${(dashboard?.revenue?.total || 0).toLocaleString()}`} icon={<RevenueIcon />} color="warning" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Total Orders" value={dashboard?.orders?.total || 0} icon={<OrderIcon />} color="success" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Avg Order Value" value={`₹${(dashboard?.revenue?.average || 0).toFixed(2)}`} icon={<TrendIcon />} color="info" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Restaurants" value={dashboard?.restaurants?.total || 0} icon={<RestaurantIcon />} color="primary" />
          </Grid>

          {/* Revenue trend */}
          <Grid item xs={12} md={8}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" gutterBottom>Revenue Trend</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2.5} dot={false} name="Revenue (₹)" />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Order status distribution */}
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Order Status</Typography>
              {statusData.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>No orders in range</Typography>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                      {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Paper>
          </Grid>

          {/* Top restaurants */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" gutterBottom>Top Restaurants by Revenue</Typography>
              {topRestaurants.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No data in range</Typography>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={topRestaurants} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#4f46e5" radius={[6, 6, 0, 0]} name="Revenue (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
