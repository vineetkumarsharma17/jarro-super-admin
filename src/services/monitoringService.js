import api from './api';

/**
 * Fetch system and API monitoring metrics (Super Admin)
 * @param {Object} params { startDate, endDate, restaurantId, statusGroup, statusCode, routeSearch }
 */
export const getSystemMonitoring = async (params = {}) => {
  const response = await api.get('/super/system-monitoring', { params });
  return response.data;
};

/**
 * Reset/Clear all API Metrics Logs (Super Admin)
 */
export const clearApiLogs = async () => {
  const response = await api.delete('/super/system-monitoring/logs');
  return response.data;
};

/**
 * Fetch detailed performance & log entries for a specific API route
 * @param {Object} params { route, method, startDate, endDate, restaurantId }
 */
export const getRouteDetails = async (params = {}) => {
  const response = await api.get('/super/system-monitoring/route-details', { params });
  return response.data;
};
