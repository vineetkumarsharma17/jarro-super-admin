import api from './api';

export const subscriptionService = {
    getSubscriptionPlans: async () => {
        const response = await api.get('/subscriptions/plan');
        return response.data;
    },

    purchaseSubscription: async (data) => {
        const response = await api.post('/subscriptions/purchase', data);
        return response.data;
    },

    switchSubscription: async (data) => {
        const response = await api.post('/subscriptions/switch', data);
        return response.data;
    },

    removeSubscription: async (subscriptionId) => {
        const response = await api.delete(`/subscriptions/${subscriptionId}`);
        return response.data;
    },

    updateSubscriptionExpiry: async (subscriptionId, endDate) => {
        const response = await api.put(`/subscriptions/${subscriptionId}/expiry`, { endDate });
        return response.data;
    }
};
