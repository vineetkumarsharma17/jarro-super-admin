import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { restaurantService } from '../../services/restaurantService';
import DataTable from '../../components/common/DataTable';
import Breadcrumb from '../../components/common/Breadcrumb';

export default function RestaurantList() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  const breadcrumbItems = [
    { label: 'Restaurants' },
  ];

  useEffect(() => {
    fetchRestaurants();
  }, [page, rowsPerPage, searchQuery]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const response = await restaurantService.getAllRestaurants({
        page: page + 1,
        limit: rowsPerPage,
        search: searchQuery,
      });
      
      setRestaurants(response.restaurants || []);
      setTotalCount(response.pagination?.total || 0);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch restaurants');
    } finally {
      setLoading(false);
    }
  };

  // Column configuration
  const columns = [
    {
      field: 'name',
      headerName: 'Name',
      sortable: true,
    },
    {
      field: 'address',
      headerName: 'Address',
    },
    {
      field: 'phone',
      headerName: 'Phone',
    },
    {
      field: 'ownerId.username',
      headerName: 'Owner',
      render: (row) => row.ownerId?.username || 'N/A',
    },
    {
      field: 'status',
      headerName: 'Status',
      align: 'center',
      width: '120px',
      render: (row) => (
        <Chip
          label={row.status ? 'Active' : 'Inactive'}
          color={row.status ? 'success' : 'default'}
          size="small"
        />
      ),
    },
  ];

  return (
    <Box>
      <Breadcrumb items={breadcrumbItems} />
      
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Restaurants
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/restaurants/new')}
          sx={{ borderRadius: 2 }}
        >
          Add Restaurant
        </Button>
      </Box>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={restaurants}
        loading={loading}
        error={error}
        pagination={{
          page,
          rowsPerPage,
          totalCount,
          onPageChange: setPage,
          onRowsPerPageChange: (newRowsPerPage) => {
            setRowsPerPage(newRowsPerPage);
            setPage(0);
          },
          rowsPerPageOptions: [5, 10, 25],
        }}
        search={{
          enabled: true,
          placeholder: 'Search restaurants by name, address, or phone...',
          value: searchQuery,
          onChange: (query) => {
            setSearchQuery(query);
            setPage(0);
          },
        }}
        actions={{
          view: (row) => navigate(`/restaurants/${row._id}`),
          edit: (row) => navigate(`/restaurants/${row._id}/edit`),
          delete: (row) => {
            // Open confirmation dialog
            setSelectedRestaurant(row);
            setConfirmOpen(true);
          },
        }}
        emptyMessage="No restaurants found. Click 'Add Restaurant' to create one."
      />

      {/* Confirmation Dialog for permanent delete */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        aria-labelledby="confirm-delete-title"
      >
        <DialogTitle id="confirm-delete-title">Delete restaurant?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete "{selectedRestaurant?.name}" and all its related data? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={loading}>Cancel</Button>
          <Button
            color="error"
            onClick={async () => {
              if (!selectedRestaurant) return;
              try {
                setLoading(true);
                await restaurantService.deleteRestaurantData(selectedRestaurant._id);
                setConfirmOpen(false);
                setSelectedRestaurant(null);
                // refresh list
                fetchRestaurants();
              } catch (err) {
                setError(err.response?.data?.message || 'Failed to delete restaurant data');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
