import axios from 'axios';

const currentUserId = localStorage.getItem('currentUserId') || '2';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'X-User-Id': currentUserId
  }
});

export function setCurrentUserId(id) {
  localStorage.setItem('currentUserId', String(id));
  api.defaults.headers['X-User-Id'] = String(id);
}

export function getCurrentUserId() {
  return parseInt(localStorage.getItem('currentUserId') || '2', 10);
}

export const usersApi = {
  list: () => api.get('/users').then(r => r.data)
};

export const babiesApi = {
  list: () => api.get('/babies').then(r => r.data)
};

export const recordsApi = {
  list: (params) => api.get('/records', { params }).then(r => r.data),
  get: (id) => api.get(`/records/${id}`).then(r => r.data),
  create: (data) => api.post('/records', data).then(r => r.data),
  update: (id, data) => api.put(`/records/${id}`, data).then(r => r.data),
  review: (id, data) => api.post(`/records/${id}/review`, data).then(r => r.data),
  invalidate: (id, data) => api.post(`/records/${id}/invalidate`, data).then(r => r.data),
  history: (id) => api.get(`/records/${id}/history`).then(r => r.data)
};

export const exportApi = {
  download: (params) => {
    const qs = new URLSearchParams(params).toString();
    window.open(`/api/export?${qs}`, '_blank');
  }
};

export const uploadApi = {
  file: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data);
  }
};

export default api;
