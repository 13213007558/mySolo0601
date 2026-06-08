const BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

function setToken(t) {
  if (t) localStorage.setItem('token', t);
  else localStorage.removeItem('token');
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = 'Bearer ' + token;
  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || ('请求失败(' + res.status + ')'));
    return data;
  }
  if (!res.ok) throw new Error('请求失败(' + res.status + ')');
  return res;
}

export const api = {
  login: (username, password) => request('POST', '/auth/login', { username, password }),
  me: () => request('GET', '/auth/me'),
  listObs: () => request('GET', '/observations'),
  getObs: (id) => request('GET', '/observations/' + id),
  createObs: (data) => request('POST', '/observations', data),
  updateObs: (id, data) => request('PUT', '/observations/' + id, data),
  submitObs: (id, comment) => request('POST', `/observations/${id}/submit`, { comment }),
  returnObs: (id, comment) => request('POST', `/observations/${id}/return`, { comment }),
  archiveObs: (id, comment) => request('POST', `/observations/${id}/archive`, { comment }),
  batchSubmit: (ids) => request('POST', '/observations/batch-submit', { ids }),
  rollbackObs: (id, status, comment, reason) =>
    request('POST', `/observations/${id}/rollback`, { status, comment, reason }),
  meta: () => request('GET', '/meta/roles'),
  logout: () => { setToken(null); }
};

export function downloadExport(path) {
  const token = getToken();
  const url = BASE + path + (path.includes('?') ? '&' : '?') + '_t=' + Date.now();
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.setRequestHeader('Authorization', 'Bearer ' + token);
  xhr.responseType = 'blob';
  xhr.onload = function () {
    if (xhr.status !== 200) { alert('导出失败'); return; }
    const disposition = xhr.getResponseHeader('Content-Disposition') || '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match ? match[1] : 'export.csv';
    const blob = new Blob([xhr.response], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  xhr.send();
}

export { getToken, setToken };
