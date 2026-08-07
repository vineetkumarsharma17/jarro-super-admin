import React from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Typography,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

/**
 * Reusable DataTable component with pagination, search, and custom actions
 * 
 * @param {Object} props
 * @param {Array} props.columns - Column configuration
 * @param {Array} props.data - Data array
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message
 * @param {Object} props.pagination - Pagination configuration
 * @param {Object} props.search - Search configuration
 * @param {Object} props.actions - Action buttons configuration
 * @param {string} props.emptyMessage - Message when no data
 * @param {boolean} props.stickyHeader - Sticky table header
 * @param {boolean} props.dense - Compact table
 */
export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  error = null,
  pagination = null,
  search = null,
  actions = null,
  emptyMessage = 'No data available',
  stickyHeader = true,
  dense = false,
}) {
  // Helper function to render cell content
  const renderCellContent = (column, row) => {
    if (column.render) {
      return column.render(row);
    }
    
    const value = row[column.field];
    
    // Handle nested fields (e.g., 'user.name')
    if (column.field.includes('.')) {
      const keys = column.field.split('.');
      let nestedValue = row;
      for (const key of keys) {
        nestedValue = nestedValue?.[key];
      }
      return nestedValue || '-';
    }
    
    return value || '-';
  };

  // Render action buttons
  const renderActions = (row) => {
    if (!actions) return null;

    return (
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {actions.view && (
          <Tooltip title="View">
            <IconButton
              size="small"
              color="info"
              onClick={() => actions.view(row)}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {actions.edit && (
          <Tooltip title="Edit">
            <IconButton
              size="small"
              color="primary"
              onClick={() => actions.edit(row)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {actions.delete && (
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => actions.delete(row)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {actions.custom?.map((action, index) => (
          <Tooltip key={index} title={action.label}>
            <IconButton
              size="small"
              color={action.color || 'default'}
              onClick={() => action.onClick(row)}
            >
              {action.icon}
            </IconButton>
          </Tooltip>
        ))}
      </Box>
    );
  };

  return (
    <Box>
      {/* Search Bar */}
      {search?.enabled && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder={search.placeholder || 'Search...'}
            value={search.value || ''}
            onChange={(e) => search.onChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Paper>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
          borderRadius: 2,
        }}
      >
        <Table 
          stickyHeader={stickyHeader}
          size={dense ? 'small' : 'medium'}
        >
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.field}
                  align={column.align || 'left'}
                  sx={{
                    fontWeight: 600,
                    backgroundColor: '#f5f5f5',
                    borderBottom: '2px solid #e0e0e0',
                    ...(column.width && { width: column.width }),
                  }}
                >
                  {column.headerName}
                </TableCell>
              ))}
              {actions && (
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 600,
                    backgroundColor: '#f5f5f5',
                    borderBottom: '2px solid #e0e0e0',
                    width: '120px',
                  }}
                >
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (actions ? 1 : 0)} 
                  align="center"
                  sx={{ py: 8 }}
                >
                  <CircularProgress />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Loading data...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (actions ? 1 : 0)} 
                  align="center"
                  sx={{ py: 8 }}
                >
                  <Typography variant="body1" color="text.secondary">
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow
                  key={row.id || row._id || index}
                  sx={{
                    '&:hover': {
                      backgroundColor: '#f9f9f9',
                    },
                    '&:last-child td': {
                      borderBottom: 0,
                    },
                  }}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.field}
                      align={column.align || 'left'}
                    >
                      {renderCellContent(column, row)}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell align="center">
                      {renderActions(row)}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {pagination && (
          <TablePagination
            rowsPerPageOptions={pagination.rowsPerPageOptions || [5, 10, 25, 50]}
            component="div"
            count={pagination.totalCount || 0}
            rowsPerPage={pagination.rowsPerPage}
            page={pagination.page}
            onPageChange={(e, newPage) => pagination.onPageChange(newPage)}
            onRowsPerPageChange={(e) => pagination.onRowsPerPageChange(parseInt(e.target.value, 10))}
            sx={{
              borderTop: '1px solid #e0e0e0',
            }}
          />
        )}
      </TableContainer>
    </Box>
  );
}
