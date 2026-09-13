import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  LockOutlined,
  EmailOutlined,
  Visibility,
  VisibilityOff,
  RestaurantMenu,
  ShieldRounded,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const DEFAULT_BANNER = '/default_login_banner.jpg';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
        p: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Paper
        elevation={12}
        sx={{
          width: '100%',
          maxWidth: { xs: 440, md: 1040 },
          borderRadius: 4,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'row',
          minHeight: { xs: 'auto', md: 580 },
          boxShadow: '0 20px 60px rgba(15, 23, 42, 0.12)',
        }}
      >
        {/* Left Side Banner / Brand Panel (Desktop & Tablet only - Hidden on Mobile) */}
        <Box
          sx={{
            flex: { md: 1.1 },
            position: 'relative',
            background: `url(${DEFAULT_BANNER}) center/cover no-repeat`,
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'space-between',
            p: { md: 5 },
            color: 'white',
            overflow: 'hidden',
          }}
        >
          {/* Dark Gradient Overlay for readability */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.35) 0%, rgba(15, 23, 42, 0.75) 100%)',
              zIndex: 1,
            }}
          />

          {/* Top Brand Tag */}
          <Box sx={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 3,
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <RestaurantMenu sx={{ fontSize: 26, color: '#fff' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5, color: '#fff' }}>
              JArro <Typography component="span" sx={{ fontWeight: 400, opacity: 0.9, fontSize: '0.85em' }}>Super Admin</Typography>
            </Typography>
          </Box>

          {/* Bottom Banner Content */}
          <Box sx={{ position: 'relative', zIndex: 2, mt: 'auto' }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 0.5,
                borderRadius: 10,
                bgcolor: 'rgba(255, 255, 255, 0.18)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                mb: 2,
              }}
            >
              <ShieldRounded sx={{ fontSize: 16, color: '#4ADE80' }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#fff', letterSpacing: 0.5 }}>
                SECURE ENTERPRISE PORTAL
              </Typography>
            </Box>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                lineHeight: 1.2,
                mb: 1.5,
                color: '#fff',
                fontSize: { md: '2.1rem' },
              }}
            >
              Streamlined Control & Operations Management
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.88, maxWidth: 380, lineHeight: 1.6, color: '#F1F5F9' }}>
              Manage restaurants, monitoring, analytics, and authentication settings from one centralized portal.
            </Typography>
          </Box>
        </Box>

        {/* Right Side Form Panel */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            p: { xs: 3, sm: 4, md: 6 },
            bgcolor: '#FFFFFF',
          }}
        >
          {/* Mobile Only Brand Icon */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.5,
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <RestaurantMenu sx={{ fontSize: 24 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
              JArro <Typography component="span" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.85em' }}>Super Admin</Typography>
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
              Welcome Back
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please enter your credentials to access the admin panel
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            {error && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.5, display: 'block' }}>
              Email Address
            </Typography>
            <TextField
              margin="dense"
              required
              fullWidth
              id="email"
              placeholder="admin@jarro.in"
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlined sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2.5,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.5,
                  bgcolor: '#F8FAFC',
                  '&:hover': { bgcolor: '#F1F5F9' },
                  '&.Mui-focused': { bgcolor: '#FFFFFF' },
                },
              }}
            />

            <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.5, display: 'block' }}>
              Password
            </Typography>
            <TextField
              margin="dense"
              required
              fullWidth
              name="password"
              placeholder="••••••••"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={togglePasswordVisibility}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? (
                        <VisibilityOff sx={{ fontSize: 20, color: 'text.secondary' }} />
                      ) : (
                        <Visibility sx={{ fontSize: 20, color: 'text.secondary' }} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.5,
                  bgcolor: '#F8FAFC',
                  '&:hover': { bgcolor: '#F1F5F9' },
                  '&.Mui-focused': { bgcolor: '#FFFFFF' },
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                py: 1.5,
                borderRadius: 2.5,
                fontSize: '0.95rem',
                fontWeight: 700,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
                  boxShadow: '0 6px 20px rgba(79, 70, 229, 0.45)',
                },
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  <span>Signing In...</span>
                </Box>
              ) : (
                'Sign In'
              )}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}



