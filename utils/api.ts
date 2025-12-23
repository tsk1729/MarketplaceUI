import { Platform } from 'react-native';

// Define multiple backend URLs
const API_URLS = {
    market: 'https://marketapi.owlit.in/',
    main: 'https://api.owlit.in/',
    auth: 'https://auth.owlit.in/',
    analytics: 'https://analytics.owlit.in/',
    local: 'http://127.0.0.1:8000/',
} as const;

type ApiService = keyof typeof API_URLS;

// Core HTTP methods that work with any base URL
const createApiMethods = (baseUrl: string) => {
    const get = async (endpoint: string) => {
        try {
            const res = await fetch(`${baseUrl}${endpoint}`);
            const data = await res.json();

            if (!res.ok) {
                const msg = data?.message || `GET ${endpoint} failed: ${res.status}`;
                console.error('API Error:', msg);
                return { success: false, message: msg };
            }

            return { success: true, data };
        } catch (err: any) {
            const msg = err?.message || 'Unexpected error occurred';
            console.error('Network/Error:', msg);
            return { success: false, message: msg };
        }
    };

    const post = async (endpoint: string, body: any) => {
        try {
            const res = await fetch(`${baseUrl}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            console.log("Body:", body);
            const data = await res.json();
            console.log(data);

            if (!res.ok) {
                const msg = data?.message || `POST ${endpoint} failed: ${res.status}`;
                return { success: false, message: msg, status: res.status };
            }
            console.log({ success: true, data });
            return { success: true, data };
        } catch (err: any) {
            console.error(err);
            console.error('API Error:', err?.message || 'Unknown error');
            return { success: false, message: err?.message || 'Unknown error' };
        }
    };

    const put = async (endpoint: string, body: any) => {
        try {
            const res = await fetch(`${baseUrl}${endpoint}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) {
                const msg = data?.message || `PUT ${endpoint} failed: ${res.status}`;
                return { success: false, message: msg, status: res.status };
            }
            return { success: true, data };
        } catch (err: any) {
            const msg = err?.message || 'Unexpected error occurred';
            return { success: false, message: msg };
        }
    };

    const postMultipart = async (
        endpoint: string,
        data: any,
        file?: { uri: string; name: string; type: string } | File | Blob
    ) => {
        try {
            const formData = new FormData();
            if (file) {
                if (Platform.OS === 'web') {
                    // If file is already a File or Blob, use it directly
                    if (file instanceof File || file instanceof Blob) {
                        formData.append('file', file, (file as File).name || 'upload.pdf');
                    } else if ((file as any).uri) {
                        // If file is a DocumentPicker result, fetch as Blob and create File
                        const response = await fetch((file as any).uri);
                        const blob = await response.blob();
                        const fileForForm = new File([blob], (file as any).name || 'upload.pdf', { type: (file as any).type || 'application/pdf' });
                        formData.append('file', fileForForm);
                    }
                } else {
                    // Native: file must be { uri, name, type }
                    formData.append('file', {
                        uri: (file as any).uri,
                        name: (file as any).name,
                        type: (file as any).type,
                    } as any);
                }
            }
            const url = `${baseUrl}${endpoint}?post_data=${encodeURIComponent(JSON.stringify(data))}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                },
                body: formData,
            });
            const responseData = await res.json();
            if (!res.ok) {
                const msg = responseData?.message || `POST ${endpoint} failed: ${res.status}`;
                return { success: false, message: msg, status: res.status };
            }
            return { success: true, data: responseData };
        } catch (err: any) {
            console.error('Multipart API Error:', err?.message || err);
            return { success: false, message: err?.message || 'Unknown error' };
        }
    };

    const putMultipart = async (
        endpoint: string,
        fields: Record<string, any>,
        file?: { uri: string; name: string; type: string } | File | Blob
    ) => {
        try {
            const formData = new FormData();

            // Append arbitrary fields. Object values are JSON stringified.
            Object.entries(fields || {}).forEach(([key, value]) => {
                if (value === undefined || value === null) return;
                if (typeof value === "object") {
                    formData.append(key, JSON.stringify(value));
                } else {
                    formData.append(key, String(value));
                }
            });

            // Optional file
            if (file) {
                if (Platform.OS === 'web') {
                    if (file instanceof File || file instanceof Blob) {
                        formData.append('file', file as any, (file as any as File).name || 'upload.bin');
                    } else if ((file as any).uri) {
                        // Fallback: try to fetch blob from uri if provided (rare on web)
                        // Skipped to avoid CORS surprises; callers should pass File/Blob on web.
                    }
                } else {
                    formData.append('file', {
                        uri: (file as any).uri,
                        name: (file as any).name,
                        type: (file as any).type,
                    } as any);
                }
            }

            const res = await fetch(`${baseUrl}${endpoint}`, {
                method: 'PUT',
                headers: { accept: 'application/json' } as any, // Let browser set boundary
                body: formData,
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const msg = (data as any)?.message || `PUT ${endpoint} failed: ${res.status}`;
                return { success: false, message: msg, status: res.status };
            }
            return { success: true, data };
        } catch (err: any) {
            console.error('Multipart API Error:', err?.message || err);
            return { success: false, message: err?.message || 'Unknown error' };
        }
    };

    const del = async (endpoint: string, body: any) => {
        try {
            const res = await fetch(`${baseUrl}${endpoint}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) {
                const msg = data?.message || `DELETE ${endpoint} failed: ${res.status}`;
                return { success: false, message: msg, status: res.status };
            }
            return { success: true, data };
        } catch (err: any) {
            console.error('API Error:', err?.message || 'Unknown error');
            return { success: false, message: err?.message || 'Unknown error' };
        }
    };

    return { get, post, put, postMultipart, putMultipart, del };
};

// Create service objects for each backend
export const marketapi = createApiMethods(API_URLS.market);
export const mainapi = createApiMethods(API_URLS.main);
export const authapi = createApiMethods(API_URLS.auth);
export const analyticsapi = createApiMethods(API_URLS.analytics);
export const localapi = createApiMethods(API_URLS.local);

// Export types and configuration for external use
export { ApiService, API_URLS };
