import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Switch,
    FormControlLabel,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Divider,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getMaintenanceSettings, updateMaintenanceSettings } from '../../services/systemService';

export default function MaintenanceMode() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [message, setMessage] = useState('');
    const [updatedAt, setUpdatedAt] = useState(null);
    const [alertInfo, setAlertInfo] = useState(null);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [pendingToggleState, setPendingToggleState] = useState(false);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const data = await getMaintenanceSettings();
            if (data.success && data.settings) {
                setMaintenanceMode(data.settings.maintenanceMode);
                setMessage(data.settings.maintenanceMessage || '');
                setUpdatedAt(data.settings.updatedAt);
            }
        } catch (err) {
            console.error('Error fetching maintenance settings:', err);
            setAlertInfo({ type: 'error', text: 'Failed to load maintenance settings.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSwitchChange = (e) => {
        const nextState = e.target.checked;
        if (nextState) {
            // Activating maintenance mode requires explicit confirmation
            setPendingToggleState(true);
            setConfirmDialogOpen(true);
        } else {
            setMaintenanceMode(false);
        }
    };

    const handleConfirmActivation = () => {
        setMaintenanceMode(true);
        setConfirmDialogOpen(false);
    };

    const handleCancelActivation = () => {
        setPendingToggleState(false);
        setConfirmDialogOpen(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setAlertInfo(null);
        try {
            const res = await updateMaintenanceSettings({
                maintenanceMode,
                maintenanceMessage: message,
            });
            if (res.success) {
                setAlertInfo({ type: 'success', text: res.message || 'Settings saved successfully.' });
                setUpdatedAt(res.settings?.updatedAt || new Date().toISOString());
            } else {
                setAlertInfo({ type: 'error', text: res.message || 'Failed to update settings.' });
            }
        } catch (err) {
            console.error('Error saving maintenance settings:', err);
            setAlertInfo({ type: 'error', text: err.response?.data?.message || 'Error saving settings.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="250px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ mt: 3 }}>
            <Card variant="outlined" sx={{ borderRadius: 3, border: maintenanceMode ? '2px solid #dc2626' : '1px solid #e5e7eb' }}>
                <CardContent sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                            <BuildIcon color={maintenanceMode ? 'error' : 'primary'} fontSize="medium" />
                            <Typography variant="h6" fontWeight={700}>
                                System Maintenance & Cutover Mode
                            </Typography>
                        </Box>
                        <Chip
                            icon={maintenanceMode ? <WarningAmberIcon /> : <CheckCircleIcon />}
                            label={maintenanceMode ? 'MAINTENANCE MODE ACTIVE' : 'SYSTEM OPERATIONAL'}
                            color={maintenanceMode ? 'error' : 'success'}
                            sx={{ fontWeight: 700, px: 1 }}
                        />
                    </Box>

                    <Typography variant="body2" color="text.secondary" paragraph>
                        Enable Maintenance Mode to pause non-Super-Admin API traffic during server migrations or database cutovers.
                        When active, users and restaurant apps will receive a clean maintenance message while preventing new database writes.
                    </Typography>

                    {alertInfo && (
                        <Alert severity={alertInfo.type} sx={{ mb: 2 }} onClose={() => setAlertInfo(null)}>
                            {alertInfo.text}
                        </Alert>
                    )}

                    <Divider sx={{ my: 2 }} />

                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} p={2} sx={{ bgcolor: maintenanceMode ? '#fee2e2' : '#f9fafb', borderRadius: 2 }}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight={700} color={maintenanceMode ? 'error.main' : 'text.primary'}>
                                Enable System Maintenance Mode
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Lock client applications and return HTTP 503 Service Unavailable during migration.
                            </Typography>
                        </Box>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={maintenanceMode}
                                    onChange={handleSwitchChange}
                                    color="error"
                                    size="medium"
                                />
                            }
                            label=""
                        />
                    </Box>

                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Maintenance Notice Message"
                        placeholder="System is undergoing scheduled maintenance for server migration. Please try again shortly."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        sx={{ mb: 3 }}
                        helperText="This message will be displayed to users in the app when maintenance mode is active."
                    />

                    {updatedAt && (
                        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                            Last Updated: {new Date(updatedAt).toLocaleString()}
                        </Typography>
                    )}

                    <Box display="flex" justifyContent="flex-end" gap={2}>
                        <Button
                            variant="outlined"
                            onClick={fetchSettings}
                            disabled={saving}
                        >
                            Reset
                        </Button>
                        <Button
                            variant="contained"
                            color={maintenanceMode ? 'error' : 'primary'}
                            onClick={handleSave}
                            disabled={saving}
                            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null}
                        >
                            {saving ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* Confirmation Dialog before turning ON */}
            <Dialog open={confirmDialogOpen} onClose={handleCancelActivation}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
                    <WarningAmberIcon color="error" /> Activate Maintenance Mode?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Activating Maintenance Mode will <strong>block all restaurant and user application traffic</strong> and set the system into read-only/maintenance mode.
                        <br /><br />
                        Only Super Admins will retain access to the API and management dashboard. Are you sure you want to proceed?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleCancelActivation} color="inherit">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmActivation} color="error" variant="contained">
                        Yes, Activate Maintenance Mode
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
