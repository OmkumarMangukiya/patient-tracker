import axios from 'axios';

/**
 * Centralized Axios instance with the API base URL.
 * All API calls should use this instead of raw axios + hardcoded URLs.
 *
 * Usage:
 *   import apiClient from '../lib/apiClient';
 *   const res = await apiClient.get('/doctor/retrievePatients', { headers: ... });
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

export default apiClient;
