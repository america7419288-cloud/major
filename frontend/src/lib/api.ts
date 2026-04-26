import axios from 'axios';
import { useAuthStore } from '../store';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // Attempt to refresh token
                const { refreshToken } = useAuthStore.getState();
                if (!refreshToken) throw new Error('No refresh token');

                const response = await axios.post('http://localhost:4000/api/auth/refresh', { refreshToken });
                const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

                useAuthStore.getState().setAuth(
                    useAuthStore.getState().user!,
                    newAccessToken,
                    newRefreshToken
                );

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                useAuthStore.getState().clearAuth();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
