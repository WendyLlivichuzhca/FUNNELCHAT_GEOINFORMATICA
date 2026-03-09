// API Configuration - uses environment variables if available, defaults to localhost for development

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://127.0.0.1:8000';

export { API_URL, SOCKET_URL };
