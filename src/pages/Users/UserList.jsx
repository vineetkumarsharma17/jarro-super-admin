import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, InputAdornment, MenuItem, Chip, IconButton, Tooltip,
  CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Snackbar, Stack, Avatar,
} from '@mui/material';
import {
  Search as SearchIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon,
} from '@mui/icons-material';
import { userService } from '../../services/userService';

const ROLES = ['super', 'admin', 'manager', 'user'];
const roleColor = { super: 'error', admin: 'primary', manager: 'warning', user: 'default' };

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });

  const notify = (msg, severity = 'success') => setToast({ open: true, msg, severity });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await userService.getAllUsers({ page: 1, limit: 500 });
      setUsers(res.users || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesQuery = !q ||
        [u.username, u.email, u.mobile].filter(Boolean).some((v) => v.toLowerCase().includes(q));
      return matchesRole && matchesQuery;
    });
  }, [users, search, roleFilter]);

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ username: u.username || '', email: u.email || '', mobile: u.mobile || '', role: u.role || 'user' });
  };

  const saveEdit = async () => {
    try {
      setSaving(true);
      await userService.updateUser(editUser._id, form);
      notify('User updated');
      setEditUser(null);
      fetchUsers();
    } catch (e) {
      notify(e.response?.data?.message || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      await userService.deleteUser(deleteTarget._id);
      notify('User deleted');
      setDeleteTarget(null);
      fetchUsers();
    } catch (e) {
      notify(e.response?.data?.message || 'Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4">Users</Typography>
          <Typography variant="body2" color="text.secondary">
            {users.length} total{roleFilter !== 'all' ? ` · ${filtered.length} ${roleFilter}` : ''}
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchUsers}><RefreshIcon /></IconButton>
        </Tooltip>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            fullWidth size="small" placeholder="Search by name, email, or mobile…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          />
          <TextField
            select size="small" label="Role" value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)} sx={{ minWidth: 160 }}
          >
            <MenuItem value="all">All roles</MenuItem>
            {ROLES.map((r) => <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>{r}</MenuItem>)}
          </TextField>
        </Stack>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error" action={<Button onClick={fetchUsers}>Retry</Button>}>{error}</Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
          <Table sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Mobile</TableCell>
                <TableCell>Role</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>No users found</TableCell></TableRow>
              ) : filtered.map((u) => (
                <TableRow key={u._id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: 'primary.light', color: 'primary.main' }}>
                        {(u.username || u.email || '?').charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="body2" fontWeight={600}>{u.username || '—'}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{u.email || '—'}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{u.mobile || '—'}</TableCell>
                  <TableCell>
                    <Chip size="small" label={u.role || 'user'} color={roleColor[u.role] || 'default'}
                      sx={{ textTransform: 'capitalize' }} variant={u.role === 'user' ? 'outlined' : 'filled'} />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(u)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteTarget(u)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editUser} onClose={() => setEditUser(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit user</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Username" value={form.username || ''} onChange={(e) => setForm({ ...form, username: e.target.value })} fullWidth />
            <TextField label="Email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth />
            <TextField label="Mobile" value={form.mobile || ''} onChange={(e) => setForm({ ...form, mobile: e.target.value })} fullWidth />
            <TextField select label="Role" value={form.role || 'user'} onChange={(e) => setForm({ ...form, role: e.target.value })} fullWidth>
              {ROLES.map((r) => <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>{r}</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUser(null)}>Cancel</Button>
          <Button variant="contained" onClick={saveEdit} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete user?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This permanently deletes <b>{deleteTarget?.username || deleteTarget?.email}</b>. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.severity} variant="filled" onClose={() => setToast({ ...toast, open: false })}>{toast.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
