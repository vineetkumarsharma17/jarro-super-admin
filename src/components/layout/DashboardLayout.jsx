import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Tooltip,
  Chip,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import { usePresence } from '../../context/PresenceContext';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Restaurant as RestaurantIcon,
  People as PeopleIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  RamenDining as BrandIcon,
  MonitorHeart as MonitorHeartIcon,
  QrCode2 as QrCodeIcon,
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import { getPublicSystemStatus } from '../../services/systemService';
import { ENV_CONFIG, getActiveEnvKey, setActiveEnvKey } from '../../services/api';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const drawerWidth = 248;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Restaurants', icon: <RestaurantIcon />, path: '/restaurants' },
  { text: 'Users', icon: <PeopleIcon />, path: '/users' },
  { text: 'QR Generator', icon: <QrCodeIcon />, path: '/qr-generator' },
  { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
  { text: 'API Monitoring', icon: <MonitorHeartIcon />, path: '/monitoring' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

import CampaignIcon from '@mui/icons-material/Campaign';

export default function DashboardLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState('');
  const [isAnnouncementActive, setIsAnnouncementActive] = useState(false);
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  React.useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await getPublicSystemStatus();
        if (res) {
          if (res.maintenance) {
            setIsMaintenanceActive(true);
            setMaintenanceMsg(res.message || 'System is in Maintenance Mode');
          } else {
            setIsMaintenanceActive(false);
          }

          if (res.announcement && res.announcement.active) {
            setIsAnnouncementActive(true);
            setAnnouncementMsg(res.announcement.message || '');
          } else {
            setIsAnnouncementActive(false);
          }
        }
      } catch (err) {
        // Silently handle status check
      }
    };
    checkMaintenance();
    const interval = setInterval(checkMaintenance, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleLogout = () => logout();

  const { totalDevices, totalRestaurantsOnline, connected } = usePresence();

  const isActive = (path) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  const currentTitle =
    menuItems.find((m) => isActive(m.path))?.text || 'Admin Panel';

  const displayName = user?.username || user?.email || 'Super Admin';
  const initial = displayName.charAt(0).toUpperCase();

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ gap: 1.5, px: 2.5 }}>
        <Avatar
          variant="rounded"
          sx={{ bgcolor: 'primary.main', width: 38, height: 38 }}
        >
          <BrandIcon fontSize="small" />
        </Avatar>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
            JArro
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Super Admin
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ px: 0.5, py: 1, flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={isActive(item.path)}
              onClick={() => setMobileOpen(false)}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List sx={{ px: 0.5, py: 1 }}>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', bgcolor: 'background.default', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 700 }}>
            {currentTitle}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Tooltip title={connected
              ? `${totalDevices} device(s) online across ${totalRestaurantsOnline} restaurant(s)`
              : 'Connecting to live presence…'}>
              <Chip
                size="small"
                label={`${totalDevices} online`}
                variant="outlined"
                sx={{
                  fontWeight: 700,
                  borderColor: connected ? 'success.main' : 'divider',
                  color: connected ? 'success.main' : 'text.secondary',
                  '& .MuiChip-icon': { ml: 1 },
                }}
                icon={
                  <Box sx={{
                    width: 9, height: 9, borderRadius: '50%',
                    bgcolor: connected ? 'success.main' : 'text.disabled',
                    boxShadow: connected ? '0 0 0 3px rgba(22,163,74,0.18)' : 'none',
                  }} />
                }
              />
            </Tooltip>

            {/* PROD / DEV Environment Switcher Selector */}
            <FormControl size="small">
              <Select
                value={getActiveEnvKey()}
                onChange={(e) => setActiveEnvKey(e.target.value)}
                size="small"
                sx={{
                  height: 32,
                  fontSize: 12,
                  fontWeight: 800,
                  bgcolor: getActiveEnvKey() === 'prod' ? '#fee2e2' : '#fef3c7',
                  color: getActiveEnvKey() === 'prod' ? '#dc2626' : '#d97706',
                  borderRadius: 2,
                  '& .MuiSelect-select': { py: 0.5, px: 1.5, display: 'flex', alignItems: 'center' },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: getActiveEnvKey() === 'prod' ? '#fca5a5' : '#fde68a',
                  },
                }}
              >
                <MenuItem value="prod" sx={{ fontWeight: 700, fontSize: 13, color: '#dc2626' }}>
                  🔴 PROD (api.jarro.in)
                </MenuItem>
                <MenuItem value="dev" sx={{ fontWeight: 700, fontSize: 13, color: '#d97706' }}>
                  🟡 DEV (dev-api.jarro.in)
                </MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.1 }}>
                {displayName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.role || 'super'}
              </Typography>
            </Box>
            <Tooltip title={displayName}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: 15 }}>
                {initial}
              </Avatar>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid #e5e7eb',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {isMaintenanceActive && (
          <Box
            sx={{
              mb: 3,
              p: 2,
              borderRadius: 2,
              bgcolor: '#fee2e2',
              border: '1px solid #fca5a5',
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              gap: 2,
            }}
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              <WarningAmberIcon color="error" />
              <Box>
                <Typography variant="subtitle2" color="error.main" fontWeight={700}>
                  SYSTEM MAINTENANCE MODE IS CURRENTLY ACTIVE
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {maintenanceMsg} — Non-super-admin traffic is blocked.
                </Typography>
              </Box>
            </Box>
            <Chip
              component={Link}
              to="/settings"
              label="Manage Settings"
              color="error"
              clickable
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Box>
        )}
        {isAnnouncementActive && !isMaintenanceActive && (
          <Box
            sx={{
              mb: 3,
              p: 2,
              borderRadius: 2,
              bgcolor: '#fef3c7',
              border: '1px solid #fde68a',
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              gap: 2,
            }}
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              <CampaignIcon color="warning" />
              <Box>
                <Typography variant="subtitle2" color="#92400e" fontWeight={700}>
                  PUBLIC PRE-DEPLOYMENT ANNOUNCEMENT ACTIVE
                </Typography>
                <Typography variant="body2" color="#78350f">
                  {announcementMsg}
                </Typography>
              </Box>
            </Box>
            <Chip
              component={Link}
              to="/settings"
              label="Edit Notice"
              color="warning"
              clickable
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Box>
        )}
        {children}
      </Box>
    </Box>
  );
}
