const API_BASE = '/api';

export const fetchRecords = (includeBad = false) =>
  fetch(`${API_BASE}/records${includeBad ? '?includeBad=true' : ''}`).then(r => r.json());

export const fetchRecord = (id) =>
  fetch(`${API_BASE}/records/${id}`).then(r => r.json());

export const createRecord = (data) =>
  fetch(`${API_BASE}/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json());

export const checkIngredients = (id, operator = '店长') =>
  fetch(`${API_BASE}/records/${id}/check-ingredients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operator })
  }).then(r => r.json());

export const manualOverride = (id, operator = '店长', remark = '') =>
  fetch(`${API_BASE}/records/${id}/manual-override`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operator, remark })
  }).then(r => r.json());

export const updateStatus = (id, status, operator = '服务员', remark = '') =>
  fetch(`${API_BASE}/records/${id}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, operator, remark })
  }).then(r => r.json());

export const supplementRecord = (id, operator = '服务员', supplementData = {}) =>
  fetch(`${API_BASE}/records/${id}/supplement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operator, supplementData })
  }).then(r => r.json());

export const exportRecords = (ids) =>
  fetch(`${API_BASE}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids })
  }).then(r => r.json());
