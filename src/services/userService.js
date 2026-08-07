import api from './api';

export const userService = {
    getAllUsers: async (params = {}) => {
        const response = await api.get('/super/users', { params });
        return response.data;
    },

    updateUser: async (userId, data) => {
        const response = await api.put(`/super/users/${userId}`, data);
        return response.data;
    },

    deleteUser: async (userId) => {
        const response = await api.delete(`/super/users/${userId}`);
        return response.data;
    },
};
