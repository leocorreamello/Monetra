const rawBaseUrl = import.meta.env['NG_APP_API_BASE_URL'] ?? 'http://localhost:3000';
export const API_BASE_URL = rawBaseUrl.replace(/\/$/, '');
