import api from './api';

export const cleanImageUrl = (url) => {
    if (!url || typeof url !== 'string') return url;
    const lastHttpIndex = url.lastIndexOf('http');
    if (lastHttpIndex > 0) {
        return url.substring(lastHttpIndex);
    }
    return url;
};

export const bannerService = {
    getBanners: async () => {
        const response = await api.get('/auth/banners');
        const rawBanners = response.data?.banners || {};
        const cleanedBanners = {};
        for (const [key, value] of Object.entries(rawBanners)) {
            cleanedBanners[key] = cleanImageUrl(value);
        }
        return { ...response.data, banners: cleanedBanners };
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
        if (response.data?.banner?.url) {
            response.data.banner.url = cleanImageUrl(response.data.banner.url);
        }
        return response.data;
    },
};

