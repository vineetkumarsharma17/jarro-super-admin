import api from './api';

export const restaurantService = {
    getAllRestaurants: async (params = {}) => {
        const response = await api.get('/super/restaurants', { params });
        return response.data;
    },

    getRestaurantById: async (id) => {
        const response = await api.get(`/super/restaurants/${id}`);
        return response.data;
    },

    createRestaurant: async (data) => {
        const response = await api.post('/super/registerRestaurant', data);
        return response.data;
    },

    updateRestaurant: async (id, data) => {
        const response = await api.put(`/super/restaurants/${id}`, data);
        return response.data;
    },

    deleteRestaurant: async (id, permanent = false) => {
        const response = await api.delete(`/super/restaurants/${id}`, {
            params: { permanent },
        });
        return response.data;
    },

    // Permanently remove all data related to a restaurant
    deleteRestaurantData: async (id) => {
        const response = await api.delete(`/super/restaurants/${id}/all`);
        return response.data;
    },

    getRestaurantStats: async (id) => {
        const response = await api.get(`/super/restaurants/${id}/stats`);
        return response.data;
    },

    getRestaurantUsers: async (id, params = {}) => {
        const response = await api.get(`/super/restaurants/${id}/users`, { params });
        return response.data;
    },

    getRestaurantMenus: async (id, params = {}) => {
        const response = await api.get(`/super/restaurants/${id}/menus`, { params });
        return response.data;
    },

    getRestaurantCategories: async (id, params = {}) => {
        const response = await api.get(`/super/restaurants/${id}/categories`, { params });
        return response.data;
    },

    getRestaurantTables: async (id, params = {}) => {
        const response = await api.get(`/super/restaurants/${id}/tables`, { params });
        return response.data;
    },

    getRestaurantOrders: async (id, params = {}) => {
        const response = await api.get(`/super/restaurants/${id}/orders`, { params });
        return response.data;
    },

    deleteOrder: async (orderId) => {
        const response = await api.delete(`/super/orders/${orderId}`);
        return response.data;
    },

    bulkDeleteOrders: async (orderIds) => {
        const response = await api.delete('/super/orders/bulk-delete', { data: { orderIds } });
        return response.data;
    },

    deleteAllRestaurantOrders: async (id) => {
        const response = await api.delete(`/super/restaurants/${id}/orders`);
        return response.data;
    },

    impersonateRestaurant: async (id) => {
        const response = await api.post(`/super/impersonate-restaurant/${id}`);
        return response.data;
    },
};
