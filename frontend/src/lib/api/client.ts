import axios from 'axios';

export const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
});

// Attach token
api.interceptors.request.use((config) => {
    const raw = localStorage.getItem('auth-storage');
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            const token = parsed?.state?.accessToken;
            if (token) config.headers.Authorization = `Bearer ${token}`;
        } catch { }
    }
    return config;
});

// Refresh token on 401
api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;
            try {
                const raw = localStorage.getItem('auth-storage');
                const refreshToken = raw ? JSON.parse(raw)?.state?.refreshToken : null;
                if (refreshToken) {
                    const { data } = await axios.post('/api/auth/refresh', { refreshToken });
                    const raw2 = localStorage.getItem('auth-storage');
                    if (raw2) {
                        const parsed = JSON.parse(raw2);
                        parsed.state.accessToken = data.accessToken;
                        parsed.state.refreshToken = data.refreshToken;
                        localStorage.setItem('auth-storage', JSON.stringify(parsed));
                    }
                    original.headers.Authorization = `Bearer ${data.accessToken}`;
                    return api(original);
                }
            } catch {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);
