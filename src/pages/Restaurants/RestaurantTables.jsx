import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { restaurantService } from '../../services/restaurantService';
import DataTable from '../../components/common/DataTable';
import Breadcrumb from '../../components/common/Breadcrumb';

export default function RestaurantTables() {
  const { id } = useParams();
  const [tables, setTables] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRestaurant();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    fetchTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, searchQuery]);

  const fetchRestaurant = async () => {
    try {
      const response = await restaurantService.getRestaurantById(id);
      setRestaurant(response.restaurant);
    } catch (err) {
      console.error('Failed to fetch restaurant:', err);
    }
  };

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await restaurantService.getRestaurantTables(id, {
        page: page + 1,
        limit: rowsPerPage,
        search: searchQuery,
      });
      
      setTables(response.tables || []);
      setTotalCount(response.pagination?.total || 0);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch tables');
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbItems = [
    { label: 'Restaurants', path: '/restaurants' },
    { label: restaurant?.name || 'Restaurant', path: `/restaurants/${id}` },
    { label: 'Tables' },
  ];

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'occupied':
        return 'error';
      case 'reserved':
        return 'warning';
      case 'inactive':
        return 'default';
      default:
        return 'default';
    }
  };

  // Column configuration
  const columns = [
    {
      field: 'tableNumber',
      headerName: 'Table Number',
      sortable: true,
      width: '150px',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {row.tableNumber}
        </Typography>
      ),
    },
    {
      field: 'location',
      headerName: 'Location',
      width: '200px',
      render: (row) => row.location || 'N/A',
    },
    {
      field: 'capacity',
      headerName: 'Capacity',
      align: 'center',
      width: '120px',
      render: (row) => (
        <Chip
          label={`${row.capacity} ${row.capacity === 1 ? 'seat' : 'seats'}`}
          size="small"
          color="primary"
          variant="outlined"
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      align: 'center',
      width: '130px',
      render: (row) => (
        <Chip
          label={row.status.charAt(0).toUpperCase() + row.status.slice(1)}
          color={getStatusColor(row.status)}
          size="small"
        />
      ),
    },
    {
      field: 'pricePerHour',
      headerName: 'Price/Hour',
      align: 'center',
      width: '130px',
      render: (row) => `₹${row.pricePerHour}`,
    },
    {
      field: 'qrCode',
      headerName: 'QR Code',
      width: '220px',
      render: (row) => (
        <Typography
          variant="body2"
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            maxWidth: 200,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {row.qrCode}
        </Typography>
      ),
    },
    {
      field: 'amenities',
      headerName: 'Amenities',
      width: '150px',
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {row.amenities && row.amenities.length > 0 ? (
            row.amenities.slice(0, 2).map((amenity, index) => (
              <Chip
                key={index}
                label={amenity}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              None
            </Typography>
          )}
          {row.amenities && row.amenities.length > 2 && (
            <Chip
              label={`+${row.amenities.length - 2}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ py: 3 }}>
      <Breadcrumb items={breadcrumbItems} />

      <Card sx={{ borderRadius: 2, mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                Tables
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {restaurant?.name} - {totalCount} tables
              </Typography>
            </Box>
            <Chip
              label={`Total: ${totalCount}`}
              color="primary"
              sx={{ px: 2, py: 3, fontSize: '1rem', fontWeight: 600 }}
            />
          </Box>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={tables}
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
          placeholder: 'Search tables by number or location...',
        }}
        emptyMessage="No tables found"
      />
    </Box>
  );
}
