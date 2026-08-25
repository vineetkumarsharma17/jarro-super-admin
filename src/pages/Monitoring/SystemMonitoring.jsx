import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Stack,
  Divider,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Storage as StorageIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Dns as DnsIcon,
  Restaurant as RestaurantIcon,
  People as PeopleIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { getSystemMonitoring } from '../../services/monitoringService';
import { restaurantService } from '../../services/restaurantService';

export default function SystemMonitoring() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(10); // 10 seconds

  // Filter States
  const [presetRange, setPresetRange] = useState('24h');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState('all');
  const [statusGroup, setStatusGroup] = useState('all');
  const [routeSearch, setRouteSearch] = useState('');

  // Data States
  const [restaurantsList, setRestaurantsList] = useState([]);
  const [data, setData] = useState(null);

  // Load Restaurants List for Filter Dropdown
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await restaurantService.getAllRestaurants();
        if (res && res.data) {
          setRestaurantsList(res.data);
        } else if (Array.isArray(res)) {
          setRestaurantsList(res);
        }
      } catch (err) {
        // Silently fail if restaurant list fails to load
      }
    };
    fetchRestaurants();
  }, []);

  // Compute dates based on preset
  const getComputedDates = useCallback(() => {
    const now = new Date();
    let start = new Date();

    if (presetRange === '1h') {
      start = new Date(now.getTime() - 1 * 60 * 60 * 1000);
    } else if (presetRange === '24h') {
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (presetRange === '7d') {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (presetRange === '30d') {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (presetRange === 'custom') {
      return {
        startDate: startDate ? new Date(startDate).toISOString() : '',
        endDate: endDate ? new Date(endDate).toISOString() : '',
      };
    }

    return {
      startDate: start.toISOString(),
      endDate: now.toISOString(),
    };
  }, [presetRange, startDate, endDate]);

  // Fetch Monitoring Data
  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    setError(null);

    try {
      const dates = getComputedDates();
      const params = {
        startDate: dates.startDate,
        endDate: dates.endDate,
        restaurantId: selectedRestaurant,
        statusGroup: statusGroup,
        routeSearch: routeSearch,
      };

      const result = await getSystemMonitoring(params);
      setData(result);
    } catch (err) {
      console.error('Failed to fetch system monitoring metrics:', err);
      setError(err.response?.data?.message || 'Failed to connect to monitoring service');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getComputedDates, selectedRestaurant, statusGroup, routeSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto Refresh Interval Loop
  useEffect(() => {
    if (!autoRefreshInterval || autoRefreshInterval <= 0) return;
    const interval = setInterval(() => {
      fetchData();
    }, autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval, fetchData]);

  const summary = data?.summary || {};
  const serverHealth = data?.serverHealth || {};
  const statusDistribution = data?.statusDistribution || [];
  const topRoutes = data?.topRoutes || [];
  const timeSeries = data?.timeSeries || [];

  const parsePercent = (valStr) => parseFloat(String(valStr || '0').replace('%', ''));

  const cpuPercent = parsePercent(serverHealth.cpu?.usagePercent);
  const memPercent = parsePercent(serverHealth.memory?.usagePercent);

  const getMethodColor = (method) => {
    switch (method) {
      case 'GET': return 'info';
      case 'POST': return 'success';
      case 'PUT': return 'warning';
      case 'DELETE': return 'error';
      default: return 'default';
    }
  };

  const getLatencyColor = (latencyMs) => {
    if (latencyMs < 200) return '#16a34a'; // Green
    if (latencyMs < 500) return '#d97706'; // Yellow
    return '#dc2626'; // Red
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SpeedIcon color="primary" fontSize="large" />
            Backend System & API Monitoring
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time server hardware health, API request volume, and endpoint performance analytics
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Auto Refresh</InputLabel>
            <Select
              value={autoRefreshInterval}
              label="Auto Refresh"
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
            >
              <MenuItem value={0}>Off</MenuItem>
              <MenuItem value={5}>Every 5s</MenuItem>
              <MenuItem value={10}>Every 10s</MenuItem>
              <MenuItem value={30}>Every 30s</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={refreshing ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon />}
            onClick={() => fetchData(true)}
            disabled={refreshing}
            sx={{ fontWeight: 700 }}
          >
            Refresh Now
          </Button>
        </Stack>
      </Box>

      {/* Filter Control Bar */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterIcon fontSize="small" color="primary" />
          <Typography variant="subtitle2" fontWeight={700}>
            Filter Monitoring Metrics
          </Typography>
        </Box>

        <Grid container spacing={2} alignItems="center">
          {/* Preset Range Selector */}
          <Grid item xs={12} sm={6} md={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Time Window</InputLabel>
              <Select
                value={presetRange}
                label="Time Window"
                onChange={(e) => setPresetRange(e.target.value)}
              >
                <MenuItem value="1h">Last 1 Hour</MenuItem>
                <MenuItem value="24h">Last 24 Hours</MenuItem>
                <MenuItem value="7d">Last 7 Days</MenuItem>
                <MenuItem value="30d">Last 30 Days</MenuItem>
                <MenuItem value="custom">Custom Date Range</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Custom Date Pickers if selected */}
          {presetRange === 'custom' && (
            <>
              <Grid item xs={12} sm={6} md={2.5}>
                <TextField
                  fullWidth
                  size="small"
                  type="datetime-local"
                  label="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.5}>
                <TextField
                  fullWidth
                  size="small"
                  type="datetime-local"
                  label="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </>
          )}

          {/* Restaurant Filter */}
          <Grid item xs={12} sm={6} md={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Restaurant</InputLabel>
              <Select
                value={selectedRestaurant}
                label="Restaurant"
                onChange={(e) => setSelectedRestaurant(e.target.value)}
              >
                <MenuItem value="all">All Restaurants</MenuItem>
                {restaurantsList.map((r) => (
                  <MenuItem key={r._id || r.id} value={r._id || r.id}>
                    {r.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Status Code Filter */}
          <Grid item xs={12} sm={6} md={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Status Code</InputLabel>
              <Select
                value={statusGroup}
                label="Status Code"
                onChange={(e) => setStatusGroup(e.target.value)}
              >
                <MenuItem value="all">All Responses</MenuItem>
                <MenuItem value="success">2xx / 3xx Success</MenuItem>
                <MenuItem value="client_error">4xx Client Errors</MenuItem>
                <MenuItem value="server_error">5xx Server Errors</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Route Search */}
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search route path..."
              value={routeSearch}
              onChange={(e) => setRouteSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress size={40} />
        </Box>
      ) : (
        <>
          {/* Top 4 KPI Stat Cards */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            {/* 1. Total Requests */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="overline" color="text.secondary">
                    Total API Requests
                  </Typography>
                  <DnsIcon color="primary" />
                </Box>
                <Typography variant="h4" fontWeight={800}>
                  {summary.totalRequests?.toLocaleString() || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {summary.successRequests?.toLocaleString() || 0} Success • {summary.failedRequests?.toLocaleString() || 0} Failed
                </Typography>
              </Card>
            </Grid>

            {/* 2. Success Rate % */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="overline" color="text.secondary">
                    Success Rate
                  </Typography>
                  <CheckCircleIcon color="success" />
                </Box>
                <Typography variant="h4" fontWeight={800} color="success.main">
                  {summary.successRate || '100%'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Target: &gt;99.5% operational uptime
                </Typography>
              </Card>
            </Grid>

            {/* 3. Average Response Time */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="overline" color="text.secondary">
                    Avg Response Time
                  </Typography>
                  <SpeedIcon sx={{ color: getLatencyColor(summary.avgResponseTimeMs || 0) }} />
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: getLatencyColor(summary.avgResponseTimeMs || 0) }}>
                  {summary.avgResponseTimeMs || 0} <Typography component="span" variant="h6">ms</Typography>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Min: {summary.minResponseTimeMs || 0}ms • Max: {summary.maxResponseTimeMs || 0}ms
                </Typography>
              </Card>
            </Grid>

            {/* 4. Active Ecosystem */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="overline" color="text.secondary">
                    Active Ecosystem
                  </Typography>
                  <RestaurantIcon color="info" />
                </Box>
                <Typography variant="h4" fontWeight={800}>
                  {summary.totalRestaurants || 0} <Typography component="span" variant="body1" color="text.secondary">Stores</Typography>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {summary.totalUsers || 0} Registered Staff / Users
                </Typography>
              </Card>
            </Grid>
          </Grid>

          {/* Hardware & Server Health Panel */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            {/* CPU Usage Card */}
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <MemoryIcon color="primary" />
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      CPU Hardware Usage
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {serverHealth.cpu?.cores || 1} Core(s) • {serverHealth.cpu?.model || 'CPU'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Current Load:</Typography>
                  <Typography variant="body2" fontWeight={800}>{serverHealth.cpu?.usagePercent || '0%'}</Typography>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={cpuPercent}
                  color={cpuPercent > 80 ? 'error' : cpuPercent > 50 ? 'warning' : 'primary'}
                  sx={{ height: 10, borderRadius: 5, mb: 2 }}
                />

                <Chip
                  size="small"
                  label={cpuPercent > 80 ? 'HIGH CPU LOAD' : 'NORMAL CPU'}
                  color={cpuPercent > 80 ? 'error' : 'success'}
                  sx={{ fontWeight: 700 }}
                />
              </Card>
            </Grid>

            {/* Memory RAM Usage Card */}
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <StorageIcon color="secondary" />
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      RAM Memory Allocation
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Used: {serverHealth.memory?.usedMB || 0} MB / {serverHealth.memory?.totalMB || 0} MB Total
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">RAM Usage:</Typography>
                  <Typography variant="body2" fontWeight={800}>{serverHealth.memory?.usagePercent || '0%'}</Typography>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={memPercent}
                  color={memPercent > 85 ? 'error' : memPercent > 65 ? 'warning' : 'info'}
                  sx={{ height: 10, borderRadius: 5, mb: 2 }}
                />

                <Typography variant="caption" color="text.secondary" display="block">
                  Free Memory: {serverHealth.memory?.freeMB || 0} MB available
                </Typography>
              </Card>
            </Grid>

            {/* Database & Runtime Health Card */}
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                  Database & Server Runtime
                </Typography>

                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">MongoDB Database:</Typography>
                    <Chip
                      size="small"
                      label={serverHealth.database?.mongoStatus === 'connected' ? 'CONNECTED' : 'DISCONNECTED'}
                      color={serverHealth.database?.mongoStatus === 'connected' ? 'success' : 'error'}
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Redis Cache:</Typography>
                    <Chip
                      size="small"
                      label={serverHealth.database?.redisStatus === 'connected' ? 'CONNECTED' : 'DISCONNECTED'}
                      color={serverHealth.database?.redisStatus === 'connected' ? 'success' : 'warning'}
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">Process Uptime:</Typography>
                    <Typography variant="caption" fontWeight={700}>
                      {Math.floor((serverHealth.uptimeSeconds || 0) / 3600)}h {Math.floor(((serverHealth.uptimeSeconds || 0) % 3600) / 60)}m
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">Node Runtime:</Typography>
                    <Typography variant="caption" fontWeight={700}>{serverHealth.nodeVersion || 'v20'}</Typography>
                  </Box>
                </Stack>
              </Card>
            </Grid>
          </Grid>

          {/* Response Status Code Distribution Chips */}
          <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
              Response Status Code Distribution
            </Typography>

            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              {statusDistribution.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No response logs recorded in selected date window</Typography>
              ) : (
                statusDistribution.map((item) => {
                  const code = item.statusCode;
                  const isSuccess = code >= 200 && code < 400;
                  const isClientError = code >= 400 && code < 500;
                  return (
                    <Chip
                      key={code}
                      label={`HTTP ${code}: ${item.count.toLocaleString()} calls`}
                      color={isSuccess ? 'success' : isClientError ? 'warning' : 'error'}
                      variant="outlined"
                      sx={{ fontWeight: 700, fontSize: 13 }}
                    />
                  );
                })
              )}
            </Stack>
          </Paper>

          {/* Top API Endpoints Performance Table */}
          <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid #e5e7eb', boxShadow: 'none' }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid #e5e7eb' }}>
              <Typography variant="h6" fontWeight={800}>
                API Route Performance & Endpoint Health
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Top endpoints ranked by total call volume and response latency
              </Typography>
            </Box>

            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f9fafb' }}>
                  <TableCell>Method</TableCell>
                  <TableCell>API Route Path</TableCell>
                  <TableCell align="right">Total Calls</TableCell>
                  <TableCell align="right">Success Count</TableCell>
                  <TableCell align="right">Error Count</TableCell>
                  <TableCell align="right">Success Rate</TableCell>
                  <TableCell align="right">Avg Latency</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topRoutes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No API request logs recorded in this filter criteria.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  topRoutes.map((row, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>
                        <Chip
                          label={row.method}
                          color={getMethodColor(row.method)}
                          size="small"
                          sx={{ fontWeight: 800, minWidth: 60 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                          {row.route}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={700}>
                          {row.totalCalls.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="success.main" fontWeight={600}>
                          {row.successCount.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color={row.errorCount > 0 ? 'error.main' : 'text.secondary'} fontWeight={600}>
                          {row.errorCount.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${row.successRate}%`}
                          size="small"
                          color={parseFloat(row.successRate) >= 99 ? 'success' : parseFloat(row.successRate) >= 95 ? 'warning' : 'error'}
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={700} sx={{ color: getLatencyColor(row.avgLatencyMs) }}>
                          {row.avgLatencyMs} ms
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}
