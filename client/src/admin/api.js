/**
 * Admin API helper — all admin requests use credentials: 'include'
 * so the httpOnly cookie is sent automatically.
 * Demo Only: Use Fictional Data
 */
import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: `${BASE}/api/admin`,
  withCredentials: true,
});

export default api;
