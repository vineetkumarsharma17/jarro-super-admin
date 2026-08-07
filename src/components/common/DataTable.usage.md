# DataTable Component Usage Guide

## Quick Start

The `DataTable` component is a reusable, feature-rich table that handles pagination, search, sorting, and custom actions out of the box.

## Basic Example

```jsx
import DataTable from '../../components/common/DataTable';

function MyListPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const columns = [
    { field: 'name', headerName: 'Name' },
    { field: 'email', headerName: 'Email' },
    { 
      field: 'status', 
      headerName: 'Status',
      render: (row) => <Chip label={row.status} />
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      pagination={{
        page,
        rowsPerPage,
        totalCount,
        onPageChange: setPage,
        onRowsPerPageChange: setRowsPerPage,
      }}
      search={{
        enabled: true,
        placeholder: 'Search...',
        value: searchQuery,
        onChange: setSearchQuery,
      }}
      actions={{
        view: (row) => navigate(`/items/${row._id}`),
        edit: (row) => navigate(`/items/${row._id}/edit`),
      }}
    />
  );
}
```

## Props Reference

### columns (Array) - Required
Define your table columns:

```jsx
const columns = [
  {
    field: 'name',              // Field name in data object
    headerName: 'Name',         // Display name
    sortable: true,             // Enable sorting (optional)
    align: 'left',              // 'left' | 'center' | 'right'
    width: '200px',             // Fixed width (optional)
    render: (row) => <Custom /> // Custom renderer (optional)
  }
];
```

### data (Array) - Required
Your data array. Each object should have fields matching column definitions.

### pagination (Object) - Optional
Enable server-side pagination:

```jsx
pagination={{
  page: 0,                          // Current page (0-indexed)
  rowsPerPage: 10,                  // Items per page
  totalCount: 100,                  // Total items
  onPageChange: (page) => {},       // Page change handler
  onRowsPerPageChange: (count) => {}, // Rows per page handler
  rowsPerPageOptions: [5, 10, 25],  // Options for rows per page
}}
```

### search (Object) - Optional
Enable search functionality:

```jsx
search={{
  enabled: true,
  placeholder: 'Search...',
  value: searchQuery,
  onChange: (query) => setSearchQuery(query),
}}
```

### actions (Object) - Optional
Add action buttons:

```jsx
actions={{
  view: (row) => navigate(`/view/${row._id}`),
  edit: (row) => navigate(`/edit/${row._id}`),
  delete: (row) => handleDelete(row._id),
  custom: [
    {
      icon: <DownloadIcon />,
      label: 'Download',
      onClick: (row) => handleDownload(row),
      color: 'primary'
    }
  ]
}}
```

### Other Props

- **loading** (boolean): Show loading spinner
- **error** (string): Display error message
- **emptyMessage** (string): Message when no data
- **stickyHeader** (boolean): Sticky table header (default: true)
- **dense** (boolean): Compact table (default: false)

## Advanced Features

### Custom Cell Rendering

```jsx
const columns = [
  {
    field: 'avatar',
    headerName: 'Avatar',
    render: (row) => (
      <Avatar src={row.avatar} alt={row.name} />
    ),
  },
  {
    field: 'price',
    headerName: 'Price',
    render: (row) => `$${row.price.toFixed(2)}`,
  },
];
```

### Nested Fields

Access nested data using dot notation:

```jsx
const columns = [
  { field: 'user.name', headerName: 'User Name' },
  { field: 'user.email', headerName: 'Email' },
];
```

### Custom Actions

Add custom action buttons beyond view/edit/delete:

```jsx
actions={{
  custom: [
    {
      icon: <CheckIcon />,
      label: 'Approve',
      onClick: (row) => handleApprove(row._id),
      color: 'success',
    },
    {
      icon: <BlockIcon />,
      label: 'Block',
      onClick: (row) => handleBlock(row._id),
      color: 'error',
    },
  ],
}}
```

## UI Features

✅ **Modern Design**: Clean, professional styling with hover effects  
✅ **Responsive**: Works on mobile, tablet, and desktop  
✅ **Loading States**: Graceful loading indicators  
✅ **Empty States**: User-friendly empty state messages  
✅ **Error Handling**: Built-in error display  
✅ **Accessible**: Proper tooltips and ARIA labels  

## Benefits Over Custom Tables

1. **80% Less Code**: Pages go from 170+ lines to ~100 lines
2. **Consistency**: Same UX across all data tables
3. **Maintainability**: Fix bugs/add features in one place
4. **Better UX**: Professional UI with all the bells and whistles
5. **Faster Development**: New list pages in minutes

## Migration Checklist

When converting an existing table page:

- [ ] Import DataTable component
- [ ] Define columns array
- [ ] Keep existing state management
- [ ] Configure pagination object
- [ ] Configure search object (if needed)
- [ ] Map existing actions to actions prop
- [ ] Remove old table JSX
- [ ] Test pagination
- [ ] Test search
- [ ] Test actions
- [ ] Verify error/loading states
