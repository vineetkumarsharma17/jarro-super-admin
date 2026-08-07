import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  Button,
  Tooltip,
  Popover,
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { restaurantService } from '../../../services/restaurantService';
import DataTable from '../../../components/common/DataTable';
import BulkImportDialog from '../../../components/menu/BulkImportDialog';

export default function MenuList() {
  const { id } = useParams();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [variantAnchorEl, setVariantAnchorEl] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState([]);

  useEffect(() => {
    fetchMenus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, searchQuery]);

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

  const handleVariantClick = (event, variants) => {
    event.stopPropagation(); // Prevent event bubbling
    console.log('Variant clicked:', variants); // Debug log
    setVariantAnchorEl(event.currentTarget);
    setSelectedVariants(variants || []);
  };

  const handleVariantClose = () => {
    setVariantAnchorEl(null);
    setSelectedVariants([]);
  };

  // Column configuration
  const columns = [
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
  ];

  const handleBulkImportSuccess = () => {
    fetchMenus();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Menu Items
        </Typography>
        <Button
          variant="contained"
          startIcon={<CloudUpload />}
          onClick={() => setBulkImportOpen(true)}
          size="small"
        >
          Bulk Import
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={menus}
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
        <Box sx={{ p: 2, minWidth: 200 }}>
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
