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
  Popover,
} from '@mui/material';
import { CloudUpload, Edit, Delete, DeleteSweep } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { restaurantService } from '../../services/restaurantService';
import DataTable from '../../components/common/DataTable';
import Breadcrumb from '../../components/common/Breadcrumb';
import BulkImportDialog from '../../components/menu/BulkImportDialog';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function RestaurantMenus() {
  const { id } = useParams();
  const [menus, setMenus] = useState([]);
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
  const [variantAnchorEl, setVariantAnchorEl] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState([]);

  useEffect(() => {
    fetchRestaurant();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    fetchMenus();
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

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const response = await restaurantService.getRestaurantMenus(id, {
        page: page + 1,
        limit: rowsPerPage,
        search: searchQuery,
      });
      
      setMenus(response.menus || []);
      setTotalCount(response.pagination?.total || 0);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch menus');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkImportSuccess = () => {
    fetchMenus();
  };

  const handleVariantClick = (event, variants) => {
    event.stopPropagation();
    setVariantAnchorEl(event.currentTarget);
    setSelectedVariants(variants || []);
  };

  const handleVariantClose = () => {
    setVariantAnchorEl(null);
    setSelectedVariants([]);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelected(menus.map(item => item._id));
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
      await fetch(`${import.meta.env.VITE_API_URL}/menu/${itemToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      fetchMenus();
    } catch (err) {
      console.error('Failed to delete menu item:', err);
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setBulkDeleteLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/menu/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          menuItemIds: selected,
          restaurantId: id,
        }),
      });
      
      if (response.ok) {
        setSelected([]);
        fetchMenus();
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
    { label: 'Menu Items' },
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
          checked={menus.length > 0 && selected.length === menus.length}
          indeterminate={selected.length > 0 && selected.length < menus.length}
          onChange={handleSelectAll}
        />
      ),
    },
    {
      field: 'imageUrls',
      headerName: 'Image',
      width: '80px',
      render: (row) => (
        <Avatar
          src={row.imageUrls?.[0] || ''}
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
      headerName: 'Name',
      sortable: true,
      width: '200px',
    },
    {
      field: 'categoryId.name',
      headerName: 'Category',
      width: '150px',
      render: (row) => row.categoryId?.name || 'N/A',
    },
    {
      field: 'description',
      headerName: 'Description',
      render: (row) => (
        <Typography
          variant="body2"
          sx={{
            maxWidth: 300,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {row.description || 'No description'}
        </Typography>
      ),
    },
    {
      field: 'variants',
      headerName: 'Variants',
      align: 'center',
      width: '100px',
      render: (row) => {
        const variantCount = row.variants?.length || 0;
        
        return (
          <Chip
            label={variantCount}
            size="small"
            color="primary"
            variant="outlined"
            onClick={(event) => handleVariantClick(event, row.variants)}
            sx={{ cursor: variantCount > 0 ? 'pointer' : 'default' }}
            disabled={variantCount === 0}
          />
        );
      },
    },
    {
      field: 'isAvailable',
      headerName: 'Status',
      align: 'center',
      width: '120px',
      render: (row) => (
        <Chip
          label={row.isAvailable ? 'Available' : 'Unavailable'}
          color={row.isAvailable ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'preparationTime',
      headerName: 'Prep Time',
      align: 'center',
      width: '100px',
      render: (row) => row.preparationTime ? `${row.preparationTime} min` : 'N/A',
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
                Menu Items
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {restaurant?.name} - {totalCount} menu items
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant="contained"
                startIcon={<CloudUpload />}
                onClick={() => setBulkImportOpen(true)}
                sx={{ px: 3 }}
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
        data={menus}
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
          placeholder: 'Search menus by name or description...',
        }}
        emptyMessage="No menu items found"
      />

      <BulkImportDialog
        open={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        restaurantId={id}
        onSuccess={handleBulkImportSuccess}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Menu Item"
        message={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        severity="error"
        loading={bulkDeleteLoading}
      />

      <Popover
        open={Boolean(variantAnchorEl)}
        anchorEl={variantAnchorEl}
        onClose={handleVariantClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: { mt: 1 }
        }}
      >
        <Box sx={{ p: 2, minWidth: 200, maxWidth: 350 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
            Variant Details
          </Typography>
          {selectedVariants.length > 0 ? (
            selectedVariants.map((variant, index) => (
              <Box 
                key={index} 
                sx={{ 
                  mb: index < selectedVariants.length - 1 ? 1.5 : 0,
                  pb: index < selectedVariants.length - 1 ? 1.5 : 0,
                  borderBottom: index < selectedVariants.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {variant.label}
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="primary">
                    ₹{variant.price}
                  </Typography>
                </Box>
                {variant.quantityDesc && (
                  <Typography variant="caption" color="text.secondary">
                    {variant.quantityDesc}
                  </Typography>
                )}
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No variants available
            </Typography>
          )}
        </Box>
      </Popover>
    </Box>
  );
}
