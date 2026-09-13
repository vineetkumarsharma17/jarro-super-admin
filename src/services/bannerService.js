import api from './api';

export const bannerService = {
    getBanners: async () => {
        const response = await api.get('/auth/banners');
        return response.data;
    },

    uploadBanner: async (type, imageFile) => {
        const formData = new FormData();
        formData.append('type', type);
        formData.append('image', imageFile);

        const response = await api.post('/super/upload-auth-banner', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};
