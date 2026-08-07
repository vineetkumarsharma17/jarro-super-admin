import api from './api';

export const analyticsService = {
    getSystemDashboard: async (params = {}) => {
        const response = await api.get('/super/analytics/dashboard', { params });
        return response.data;
    },

    getAllRestaurantsStats: async (params = {}) => {
        const response = await api.get('/super/analytics/restaurants', { params });
        return response.data;
    },

    getRestaurantComparison: async (restaurantIds, params = {}) => {
        const response = await api.get('/super/analytics/comparison', {
            params: { ...params, restaurantIds: restaurantIds.join(',') },
        });
        return response.data;
    },

    getRevenueTrends: async (params = {}) => {
        const response = await api.get('/super/analytics/revenue-trends', { params });
        return response.data;
    },

    getTopRestaurants: async (params = {}) => {
        const response = await api.get('/super/analytics/top-restaurants', { params });
        return response.data;
    },
};
