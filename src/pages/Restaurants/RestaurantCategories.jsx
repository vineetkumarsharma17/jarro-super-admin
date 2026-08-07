import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  Card,
  CardContent,
  Button,
  IconButton,
  Checkbox,
  Toolbar,
  Tooltip,
} from '@mui/material';
import { CloudUpload, Edit, Delete, DeleteSweep } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { restaurantService } from '../../services/restaurantService';
import DataTable from '../../components/common/DataTable';
import Breadcrumb from '../../components/common/Breadcrumb';
import CategoryBulkImportDialog from '../../components/category/CategoryBulkImportDialog';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function RestaurantCategories() {
  const { id } = useParams();
  const [categories, setCategories] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [selected, setSelected] = useState([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  useEffect(() => {
    fetchRestaurant();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    fetchCategories();
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

  const handleBulkImportSuccess = () => {
    fetchCategories();
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelected(categories.map(item => item._id));
    } else {
      setSelected([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setBulkDeleteLoading(true);
      await fetch(`${import.meta.env.VITE_API_URL}/category/${itemToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      fetchCategories();
    } catch (err) {
      console.error('Failed to delete category:', err);
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setBulkDeleteLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/category/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          categoryIds: selected,
          restaurantId: id,
        }),
      });
      
      if (response.ok) {
        setSelected([]);
        fetchCategories();
      }
    } catch (err) {
      console.error('Failed to bulk delete:', err);
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const breadcrumbItems = [
    { label: 'Restaurants', path: '/restaurants' },
    { label: restaurant?.name || 'Restaurant', path: `/restaurants/${id}` },
    { label: 'Categories' },
  ];

  // Column configuration
  const columns = [
    {
      field: 'select',
      headerName: '',
      width: '50px',
      render: (row) => (
        <Checkbox
          checked={selected.includes(row._id)}
          onChange={() => handleSelectOne(row._id)}
        />
      ),
      headerRender: () => (
        <Checkbox
          checked={categories.length > 0 && selected.length === categories.length}
          indeterminate={selected.length > 0 && selected.length < categories.length}
          onChange={handleSelectAll}
        />
      ),
    },
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
    {
      field: 'actions',
      headerName: 'Actions',
      align: 'right',
      width: '100px',
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
          <Tooltip title="Edit">
            <IconButton size="small" color="primary">
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDeleteClick(row)}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
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
                Categories
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {restaurant?.name} - {totalCount} categories
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<CloudUpload />}
                onClick={() => setBulkImportOpen(true)}
              >
                Bulk Import
              </Button>
              <Chip
                label={`Total: ${totalCount}`}
                color="primary"
                sx={{ px: 2, py: 3, fontSize: '1rem', fontWeight: 600 }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {selected.length > 0 && (
        <Toolbar
          sx={{
            pl: 2,
            pr: 1,
            bgcolor: 'primary.lighter',
            borderRadius: 2,
            mb: 2,
          }}
        >
          <Typography sx={{ flex: '1 1 100%' }} color="primary" variant="subtitle1">
            {selected.length} selected
          </Typography>
          <Tooltip title="Delete selected">
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteSweep />}
              onClick={handleBulkDelete}
              disabled={bulkDeleteLoading}
            >
              Delete Selected
            </Button>
          </Tooltip>
        </Toolbar>
      )}

      <DataTable
        columns={columns}
        data={categories}
        loading={loading}
        error={error}
        pagination={{
          enabled: true,
          totalCount: totalCount,
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

      <CategoryBulkImportDialog
        open={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        restaurantId={id}
        onSuccess={handleBulkImportSuccess}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        message={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        severity="error"
        loading={bulkDeleteLoading}
      />
    </Box>
  );
}
