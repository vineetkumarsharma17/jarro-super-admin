import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RestaurantList from './pages/Restaurants/RestaurantList';
import RestaurantCreate from './pages/Restaurants/RestaurantCreate';
import RestaurantView from './pages/Restaurants/RestaurantView';
import RestaurantMenus from './pages/Restaurants/RestaurantMenus';
import RestaurantCategories from './pages/Restaurants/RestaurantCategories';
import RestaurantTables from './pages/Restaurants/RestaurantTables';
import BannerManagement from './pages/Settings/BannerManagement';
import UserList from './pages/Users/UserList';
import Analytics from './pages/Analytics/Analytics';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#4f46e5', light: '#eef2ff', dark: '#4338ca', contrastText: '#fff' },
    secondary: { main: '#0ea5e9' },
    success: { main: '#16a34a', light: '#dcfce7' },
    warning: { main: '#d97706', light: '#fef3c7' },
    error: { main: '#dc2626', light: '#fee2e2' },
    info: { main: '#0284c7', light: '#e0f2fe' },
    background: { default: '#f4f6f9', paper: '#ffffff' },
    text: { primary: '#111827', secondary: '#6b7280' },
    divider: '#e5e7eb',
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily:
      '"Inter", "Segoe UI", Roboto, -apple-system, BlinkMacSystemFont, sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontWeight: 700 },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
    overline: { fontWeight: 600, letterSpacing: '0.08em' },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#111827',
          boxShadow: 'none',
          borderBottom: '1px solid #e5e7eb',
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid #e5e7eb',
          borderRadius: 14,
          boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: { outlined: { borderColor: '#e5e7eb' } },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 10, paddingInline: 16 } },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          color: '#6b7280',
          fontSize: 12,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          backgroundColor: '#f9fafb',
        },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '2px 8px',
          '&.Mui-selected': {
            backgroundColor: '#eef2ff',
            color: '#4f46e5',
            '& .MuiListItemIcon-root': { color: '#4f46e5' },
            '&:hover': { backgroundColor: '#e0e7ff' },
          },
        },
      },
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurants"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <RestaurantList />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurants/new"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <RestaurantCreate />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurants/:id"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <RestaurantView />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurants/:id/menus"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <RestaurantMenus />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurants/:id/categories"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <RestaurantCategories />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurants/:id/tables"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <RestaurantTables />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <UserList />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Analytics />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <BannerManagement />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
