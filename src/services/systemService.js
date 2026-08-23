import api from './api';

export const getMaintenanceSettings = async () => {
    const response = await api.get('/super/maintenance');
    return response.data;
};

export const updateMaintenanceSettings = async (settingsData) => {
    const response = await api.post('/super/maintenance', settingsData);
    return response.data;
};

export const getPublicSystemStatus = async () => {
    const response = await api.get('/system/status');
    return response.data;
};
