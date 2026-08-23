import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, Paper } from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import ImageIcon from '@mui/icons-material/Image';
import MaintenanceMode from './MaintenanceMode';
import BannerManagement from './BannerManagement';

export default function Settings() {
    const [tabIndex, setTabIndex] = useState(0);

    const handleTabChange = (event, newValue) => {
        setTabIndex(newValue);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
                System Settings & Management
            </Typography>

            <Paper variant="outlined" sx={{ borderRadius: 3, mt: 2 }}>
                <Tabs
                    value={tabIndex}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                    sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
                >
                    <Tab icon={<BuildIcon fontSize="small" />} iconPosition="start" label="Server Cutover & Maintenance" />
                    <Tab icon={<ImageIcon fontSize="small" />} iconPosition="start" label="Auth Banner Management" />
                </Tabs>

                <Box sx={{ p: 3 }}>
                    {tabIndex === 0 && <MaintenanceMode />}
                    {tabIndex === 1 && <BannerManagement />}
                </Box>
            </Paper>
        </Box>
    );
}
