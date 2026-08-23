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
    Stack,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CampaignIcon from '@mui/icons-material/Campaign';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { getMaintenanceSettings, updateMaintenanceSettings } from '../../services/systemService';

const PRESET_MESSAGES = [
    {
        title: '15-Min Backend Deployment',
        text: 'Scheduled System Maintenance Notice: We will be performing a quick backend update (approx. 15 minutes). During this window, please avoid placing new orders as transactions may be temporarily interrupted. Thank you for your cooperation!',
    },
    {
        title: 'Server Migration Upgrade',
        text: 'Server Upgrade Notice: Infrastructure optimization in progress. Services remain online, but brief delays (~15 mins) may occur. Please avoid taking critical orders.',
    },
    {
        title: 'Scheduled Database Maintenance',
        text: 'Database Maintenance Notice: Scheduled system maintenance in progress. Order creation may be paused for 15 minutes. Please check back shortly.',
    },
];

export default function MaintenanceMode() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Live Maintenance Mode state
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [message, setMessage] = useState('');
    
    // Advance Announcement state
    const [announcementActive, setAnnouncementActive] = useState(false);
    const [announcementMessage, setAnnouncementMessage] = useState('');
    
    const [updatedAt, setUpdatedAt] = useState(null);
    const [alertInfo, setAlertInfo] = useState(null);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const data = await getMaintenanceSettings();
            if (data.success && data.settings) {
                setMaintenanceMode(data.settings.maintenanceMode || false);
                setMessage(data.settings.maintenanceMessage || '');
                setAnnouncementActive(data.settings.announcementActive || false);
                setAnnouncementMessage(
                    data.settings.announcementMessage || PRESET_MESSAGES[0].text
                );
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
        setConfirmDialogOpen(false);
    };

    const applyPreset = (presetText) => {
        setAnnouncementMessage(presetText);
    };

    const handleSave = async () => {
        setSaving(true);
        setAlertInfo(null);
        try {
            const res = await updateMaintenanceSettings({
                maintenanceMode,
                maintenanceMessage: message,
                announcementActive,
                announcementMessage,
            });
            if (res.success) {
                setAlertInfo({ type: 'success', text: res.message || 'Settings saved successfully.' });
                setUpdatedAt(res.settings?.updatedAt || new Date().toISOString());
            } else {
                setAlertInfo({ type: 'error', text: res.message || 'Failed to update settings.' });
            }
        } catch (err) {
            console.error('Error saving settings:', err);
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
        <Box sx={{ mt: 2 }}>
            {alertInfo && (
                <Alert severity={alertInfo.type} sx={{ mb: 3 }} onClose={() => setAlertInfo(null)}>
                    {alertInfo.text}
                </Alert>
            )}

            {/* SECTION 1: ADVANCE ANNOUNCEMENT BANNER SETTINGS */}
            <Card variant="outlined" sx={{ borderRadius: 3, mb: 4, border: announcementActive ? '2px solid #f59e0b' : '1px solid #e5e7eb' }}>
                <CardContent sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                            <CampaignIcon color={announcementActive ? 'warning' : 'action'} fontSize="medium" />
                            <Typography variant="h6" fontWeight={700}>
                                Pre-Deployment Announcement Notice
                            </Typography>
                        </Box>
                        <Chip
                            icon={<CampaignIcon />}
                            label={announcementActive ? 'PUBLIC ANNOUNCEMENT ACTIVE' : 'ANNOUNCEMENT OFF'}
                            color={announcementActive ? 'warning' : 'default'}
                            sx={{ fontWeight: 700, px: 1 }}
                        />
                    </Box>

                    <Typography variant="body2" color="text.secondary" paragraph>
                        Broadcast a non-blocking advance notice banner to restaurant operators and users before deployment starts.
                        The system remains <strong>100% operational</strong> while warning users not to place orders during the upcoming maintenance window.
                    </Typography>

                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} p={2} sx={{ bgcolor: announcementActive ? '#fffbebfd' : '#f9fafb', borderRadius: 2, border: '1px solid #fde68a' }}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight={700} color={announcementActive ? 'warning.dark' : 'text.primary'}>
                                Enable Public Advance Notice Banner
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Displays warning banner at the top of client apps and Super Admin panel without stopping API traffic.
                            </Typography>
                        </Box>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={announcementActive}
                                    onChange={(e) => setAnnouncementActive(e.target.checked)}
                                    color="warning"
                                    size="medium"
                                />
                            }
                            label=""
                        />
                    </Box>

                    {/* Preset Buttons */}
                    <Typography variant="subtitle2" fontWeight={700} mb={1} display="flex" alignItems="center" gap={1}>
                        <AutoAwesomeIcon color="primary" fontSize="small" /> Quick Professional Message Presets:
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} mb={2}>
                        {PRESET_MESSAGES.map((preset, idx) => (
                            <Chip
                                key={idx}
                                label={preset.title}
                                variant="outlined"
                                color="primary"
                                onClick={() => applyPreset(preset.text)}
                                clickable
                                sx={{ fontWeight: 600 }}
                            />
                        ))}
                    </Stack>

                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Announcement Notice Message"
                        value={announcementMessage}
                        onChange={(e) => setAnnouncementMessage(e.target.value)}
                        sx={{ mb: 2 }}
                        helperText="This message will be shown in the warning banner at the top of all user apps."
                    />

                    {/* Live Preview */}
                    <Box mt={2} p={2} sx={{ bgcolor: '#fef3c7', borderRadius: 2, border: '1px solid #fde68a' }}>
                        <Typography variant="caption" fontWeight={700} color="warning.dark" display="block" mb={0.5}>
                            LIVE ANNOUNCEMENT BANNER PREVIEW:
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                            <WarningAmberIcon color="warning" fontSize="small" />
                            <Typography variant="body2" fontWeight={600} color="#92400e">
                                {announcementMessage || 'No announcement message entered.'}
                            </Typography>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* SECTION 2: LIVE MAINTENANCE / CUTOVER MODE */}
            <Card variant="outlined" sx={{ borderRadius: 3, border: maintenanceMode ? '2px solid #dc2626' : '1px solid #e5e7eb' }}>
                <CardContent sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                            <BuildIcon color={maintenanceMode ? 'error' : 'primary'} fontSize="medium" />
                            <Typography variant="h6" fontWeight={700}>
                                Full System Maintenance & Cutover Lock
                            </Typography>
                        </Box>
                        <Chip
                            icon={maintenanceMode ? <WarningAmberIcon /> : <CheckCircleIcon />}
                            label={maintenanceMode ? 'MAINTENANCE LOCK ACTIVE' : 'SYSTEM OPERATIONAL'}
                            color={maintenanceMode ? 'error' : 'success'}
                            sx={{ fontWeight: 700, px: 1 }}
                        />
                    </Box>

                    <Typography variant="body2" color="text.secondary" paragraph>
                        Enable Maintenance Lock to stop non-Super-Admin API traffic during server migrations or database cutovers.
                        When active, non-Super-Admin requests return <strong>HTTP 503 Service Unavailable</strong>.
                    </Typography>

                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} p={2} sx={{ bgcolor: maintenanceMode ? '#fee2e2' : '#f9fafb', borderRadius: 2 }}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight={700} color={maintenanceMode ? 'error.main' : 'text.primary'}>
                                Enable Maintenance Mode (Lock API Traffic)
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Pauses write traffic and displays full-screen maintenance modal in mobile/web apps.
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
                        rows={2}
                        label="Maintenance Lock Message"
                        placeholder="System is undergoing scheduled maintenance for server migration. Please try again shortly."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        sx={{ mb: 3 }}
                    />

                    {updatedAt && (
                        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                            Last Saved: {new Date(updatedAt).toLocaleString()}
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
                            {saving ? 'Saving...' : 'Save All Settings'}
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* Confirmation Dialog */}
            <Dialog open={confirmDialogOpen} onClose={handleCancelActivation}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
                    <WarningAmberIcon color="error" /> Activate Maintenance Lock?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Activating Maintenance Lock will <strong>block all non-Super-Admin API traffic</strong> across mobile and web applications.
                        <br /><br />
                        Only Super Admins will retain access. Are you sure you want to proceed?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleCancelActivation} color="inherit">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmActivation} color="error" variant="contained">
                        Yes, Activate Maintenance Lock
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
