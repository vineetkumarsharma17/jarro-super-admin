import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { restaurantService } from '../../../services/restaurantService';
import DataTable from '../../../components/common/DataTable';

export default function CategoryList() {
  const { id } = useParams();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, searchQuery]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await restaurantService.getRestaurantCategories(id, {
        page: page + 1,
        limit: rowsPerPage,
        search: searchQuery,
      });
      
      setCategories(response.categories || []);
      setTotalCount(response.pagination?.total || 0);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  // Column configuration
  const columns = [
    {
      field: 'imageUrl',
      headerName: 'Image',
      width: '80px',
      render: (row) => (
        <Avatar
          src={row.imageUrl || ''}
          alt={row.name}
          variant="rounded"
          sx={{ width: 50, height: 50 }}
        >
          {row.name?.charAt(0)}
        </Avatar>
      ),
    },
    {
      field: 'name',
      headerName: 'Category Name',
      sortable: true,
      width: '300px',
    },
    {
      field: 'isActive',
      headerName: 'Status',
      align: 'center',
      width: '150px',
      render: (row) => (
        <Chip
          label={row.isActive ? 'Active' : 'Inactive'}
          color={row.isActive ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created Date',
      align: 'center',
      width: '180px',
      render: (row) => new Date(row.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    },
    {
      field: 'updatedAt',
      headerName: 'Updated Date',
      align: 'center',
      width: '180px',
      render: (row) => new Date(row.updatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Categories
      </Typography>

      <DataTable
        columns={columns}
        data={categories}
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
          placeholder: 'Search categories by name...',
        }}
        emptyMessage="No categories found"
      />
    </Box>
  );
}
