import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  DeleteForever as DeleteForeverIcon,
  ReceiptLong as OrderIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { restaurantService } from '../../services/restaurantService';
import DataTable from '../../components/common/DataTable';
import Breadcrumb from '../../components/common/Breadcrumb';

export default function RestaurantOrders() {
  const { id } = useParams();
  const [orders, setOrders] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Delete single order state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Bulk delete orders state
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    fetchRestaurant();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, searchQuery, statusFilter]);

  const fetchRestaurant = async () => {
    try {
      const response = await restaurantService.getRestaurantById(id);
      setRestaurant(response.restaurant);
    } catch (err) {
      console.error('Failed to fetch restaurant details:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await restaurantService.getRestaurantOrders(id, {
        page: page + 1,
        limit: rowsPerPage,
        search: searchQuery,
        status: statusFilter,
      });

      setOrders(response.orders || []);
      setTotalCount(response.pagination?.total || 0);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch restaurant orders');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSingleOrder = async () => {
    if (!selectedOrder) return;
    try {
      setDeleting(true);
      await restaurantService.deleteOrder(selectedOrder._id);
      setDeleteDialogOpen(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete order');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAllOrders = async () => {
    try {
      setBulkDeleting(true);
      const response = await restaurantService.deleteAllRestaurantOrders(id);
      alert(response.message || 'All restaurant orders deleted successfully');
      setBulkDeleteDialogOpen(false);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete all restaurant orders');
    } finally {
      setBulkDeleting(false);
    }
  };

  const breadcrumbItems = [
    { label: 'Restaurants', path: '/restaurants' },
    { label: restaurant?.name || 'Restaurant', path: `/restaurants/${id}` },
    { label: 'Orders' },
  ];

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'completed':
      case 'served':
        return 'success';
      case 'preparing':
      case 'cooking':
        return 'warning';
      case 'pending':
      case 'placed':
        return 'info';
      case 'cancelled':
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      field: 'orderNumber',
      headerName: 'Order #',
      sortable: true,
      width: '160px',
      render: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
            {row.orderNumber || `#${row._id?.substring(row._id.length - 6)}`}
          </Typography>
          {row.orderType && (
            <Chip
              label={row.orderType.toUpperCase()}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.65rem', height: 18, mt: 0.5 }}
            />
          )}
        </Box>
      ),
    },
    {
      field: 'user',
      headerName: 'Customer',
      width: '200px',
      render: (row) => {
        const userName = row.user?.name || row.userId?.username || 'Walk-in Customer';
        const userMobile = row.user?.mobile || row.userId?.mobile || 'N/A';
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {userName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {userMobile}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'table',
      headerName: 'Table',
      width: '130px',
      render: (row) => {
        const tableNum = row.tableId?.tableNumber || row.tableName || 'N/A';
        return (
          <Chip
            label={tableNum !== 'N/A' ? `Table ${tableNum}` : 'Takeaway / Parcel'}
            size="small"
            color={tableNum !== 'N/A' ? 'primary' : 'default'}
            variant="outlined"
          />
        );
      },
    },
    {
      field: 'items',
      headerName: 'Items Summary',
      width: '250px',
      render: (row) => {
        const items = row.items || [];
        if (items.length === 0) return <Typography variant="caption" color="text.secondary">No items</Typography>;
        const summaryStr = items.map((i) => `${i.name} (x${i.quantity || 1})`).join(', ');
        return (
          <Tooltip title={summaryStr} arrow placement="top">
            <Typography
              variant="body2"
              sx={{
                maxWidth: 240,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {summaryStr}
            </Typography>
          </Tooltip>
        );
      },
    },
    {
      field: 'amount',
      headerName: 'Total Amount',
      align: 'right',
      width: '130px',
      render: (row) => {
        const amount = row.charges?.grandTotal ?? row.totalAmount ?? row.grandTotal ?? 0;
        return (
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.dark' }}>
            ₹{Number(amount).toFixed(2)}
          </Typography>
        );
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      align: 'center',
      width: '130px',
      render: (row) => (
        <Chip
          label={(row.status || 'PENDING').toUpperCase()}
          color={getStatusColor(row.status)}
          size="small"
          sx={{ fontWeight: 700 }}
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Order Date & Time',
      width: '180px',
      render: (row) => {
        if (!row.createdAt) return 'N/A';
        const dateObj = new Date(row.createdAt);
        return (
          <Box>
            <Typography variant="body2">{dateObj.toLocaleDateString()}</Typography>
            <Typography variant="caption" color="text.secondary">
              {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Action',
      align: 'center',
      width: '100px',
      render: (row) => (
        <Tooltip title="Delete Order">
          <IconButton
            size="small"
            color="error"
            onClick={() => {
              setSelectedOrder(row);
              setDeleteDialogOpen(true);
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box sx={{ py: 3 }}>
      <Breadcrumb items={breadcrumbItems} />

      <Card sx={{ borderRadius: 2, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                Restaurant Orders
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {restaurant?.name || 'Restaurant'} — {totalCount} total orders recorded
              </Typography>
            </Box>

            <Stack direction="row" spacing={2} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Filter Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Filter Status"
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="preparing">Preparing</MenuItem>
                  <MenuItem value="ready">Ready</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                color="secondary"
                startIcon={<RefreshIcon />}
                onClick={fetchOrders}
              >
                Refresh
              </Button>

              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteForeverIcon />}
                onClick={() => setBulkDeleteDialogOpen(true)}
                disabled={totalCount === 0}
                sx={{ fontWeight: 700 }}
              >
                Clear All Orders
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        error={error}
        pagination={{
          enabled: true,
          count: totalCount,
          page: page,
          rowsPerPage: rowsPerPage,
          onPageChange: (newPage) => setPage(newPage),
          onRowsPerPageChange: (newRowsPerPage) => {
            setRowsPerPage(newRowsPerPage);
            setPage(0);
          },
        }}
        search={{
          enabled: true,
          value: searchQuery,
          onChange: (value) => {
            setSearchQuery(value);
            setPage(0);
          },
          placeholder: 'Search by Order # or Customer Name/Mobile...',
        }}
        emptyMessage="No orders found for this restaurant"
      />

      {/* Delete Single Order Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteIcon /> Delete Order
        </DialogTitle>
        <DialogContent dividers>
          <DialogContentText color="text.primary">
            Are you sure you want to delete order{' '}
            <strong>{selectedOrder?.orderNumber || selectedOrder?._id}</strong>?
          </DialogContentText>
          <Typography variant="body2" color="error.main" sx={{ mt: 1.5, fontWeight: 600 }}>
            ⚠️ This action will permanently remove the order record and its invoice. It cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteSingleOrder}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={18} color="inherit" /> : <DeleteIcon />}
          >
            {deleting ? 'Deleting...' : 'Delete Order'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete All Orders Dialog */}
      <Dialog
        open={bulkDeleteDialogOpen}
        onClose={() => !bulkDeleting && setBulkDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteForeverIcon /> Clear All Restaurant Orders
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="error" sx={{ mb: 2, fontWeight: 700 }}>
            DANGER ZONE: Permanent Data Loss
          </Alert>
          <DialogContentText color="text.primary">
            Are you sure you want to delete ALL <strong>{totalCount}</strong> orders for{' '}
            <strong>{restaurant?.name}</strong>?
          </DialogContentText>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            This will purge all history, bills, and invoices for this store.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setBulkDeleteDialogOpen(false)} disabled={bulkDeleting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteAllOrders}
            disabled={bulkDeleting}
            startIcon={bulkDeleting ? <CircularProgress size={18} color="inherit" /> : <DeleteForeverIcon />}
          >
            {bulkDeleting ? 'Clearing All...' : 'Yes, Delete All Orders'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
