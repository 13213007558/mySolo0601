let currentRecords = [];
let currentDetail = null;

function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast show ' + type;
  setTimeout(() => {
    toast.className = 'toast';
  }, 2500);
}

function formatTime(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  const pad = n => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getStatusText(s) {
  return { authorized: '已授权', revoked: '已撤回', pending: '待确认' }[s] || s;
}

function getOpText(op) {
  return {
    create: '首次录入',
    update: '更新修改',
    late_create: '补录创建',
    late_supplement: '手工补录'
  }[op] || op;
}

function getAnomalyTypeText(t) {
  return { unit_mixed: '单位混用', boundary_value: '边界值' }[t] || t;
}

function switchView(view, data) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const viewEl = document.getElementById('view' + view.charAt(0).toUpperCase() + view.slice(1));
  if (viewEl) viewEl.classList.add('active');

  const navBtn = document.querySelector(`.nav-btn[data-view="${view}"]`);
  if (navBtn) navBtn.classList.add('active');

  if (view === 'list') {
    document.getElementById('navDetail').style.display = 'none';
    loadRecords();
  } else if (view === 'detail') {
    document.getElementById('navDetail').style.display = 'inline-block';
    if (data) loadDetail(data);
  } else if (view === 'new') {
    resetForm();
  }
}

async function loadRecords() {
  try {
    const res = await fetch('/api/records');
    const data = await res.json();
    currentRecords = data.records;

    document.getElementById('statTotal').textContent = data.total;
    document.getElementById('statAuthorized').textContent = data.authorized;
    document.getElementById('statRevoked').textContent = data.revoked;
    document.getElementById('statPending').textContent = data.pending;

    renderRecords();
  } catch (e) {
    console.error(e);
    showToast('加载记录失败', 'error');
  }
}

function renderRecords() {
  const tbody = document.getElementById('recordsTbody');
  const kw = document.getElementById('searchInput').value.trim().toLowerCase();

  const filtered = currentRecords.filter(r =>
    !kw ||
    r.babyName?.toLowerCase().includes(kw) ||
    r.guardianName?.toLowerCase().includes(kw) ||
    r.roomNo?.toLowerCase().includes(kw)
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="empty-state">暂无记录</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(r => `
    <tr>
      <td>
        ${r.babyName || '-'}
        ${r.isLateRecord ? '<span class="late-tag">补录</span>' : ''}
      </td>
      <td>${r.guardianName || '-'}</td>
      <td>${r.roomNo || '-'}</td>
      <td>${r.babyAgeDays !== null && r.babyAgeDays !== undefined ? r.babyAgeDays + ' 天' : '-'}</td>
      <td>${r.photoCount || 0} 张</td>
      <td><span class="status-badge status-${r.status}">${getStatusText(r.status)}</span></td>
      <td><span class="version-tag-cell">v${r.latestVersion}</span></td>
      <td>${formatTime(r.updatedAt)}</td>
      <td>
        <span class="action-link" onclick="switchView('detail','${r.id}')">详情</span>
        <span class="action-link" onclick="editRecord('${r.id}')">补录/修改</span>
      </td>
    </tr>
  `).join('');
}

async function loadDetail(id) {
  try {
    const res = await fetch(`/api/records/${id}`);
    const data = await res.json();
    currentDetail = data;
    renderDetail(data);
  } catch (e) {
    console.error(e);
    showToast('加载详情失败', 'error');
  }
}

function renderDetail(data) {
  const { record, versions, anomalies } = data;
  const container = document.getElementById('detailContent');

  const anomalyFieldSet = new Set(anomalies.map(a => a.field));

  container.innerHTML = `
    <div class="detail-container">
      <div class="detail-toolbar">
        <span class="back-link" onclick="switchView('list')">← 返回列表</span>
        <button class="btn-primary" onclick="editRecord('${record.id}')">补录/修改（创建新版本）</button>
      </div>

      <div class="detail-card">
        <h3>
          📋 基本信息
          <span class="version-tag-cell">当前版本 v${record.latestVersion}</span>
          ${record.isLateRecord ? '<span class="late-tag" style="font-size:12px;">含补录</span>' : ''}
        </h3>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">婴儿姓名</span>
            <span class="detail-value">${record.babyName || '-'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">监护人</span>
            <span class="detail-value">${record.guardianName || '-'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">房号</span>
            <span class="detail-value">${record.roomNo || '-'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">婴儿年龄</span>
            <span class="detail-value ${anomalyFieldSet.has('babyAgeDays') ? 'has-anomaly' : ''}">
              ${record.babyAgeDays !== null && record.babyAgeDays !== undefined ? record.babyAgeDays + ' 天' : '-'}
              ${anomalyFieldSet.has('babyAgeDays') ? '<span class="anomaly-badge">异常</span>' : ''}
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">照片数量</span>
            <span class="detail-value ${anomalyFieldSet.has('photoCount') ? 'has-anomaly' : ''}">
              ${record.photoCount || 0} 张
              ${anomalyFieldSet.has('photoCount') ? '<span class="anomaly-badge">异常</span>' : ''}
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">授权状态</span>
            <span class="detail-value">
              <span class="status-badge status-${record.status}">${getStatusText(record.status)}</span>
            </span>
          </div>
          <div class="detail-item full-width">
            <span class="detail-label">照片说明</span>
            <span class="detail-value">${record.photoDescription || '（无）'}</span>
          </div>
          <div class="detail-item full-width">
            <span class="detail-label">整改记录</span>
            <span class="detail-value">${record.rectification || '（无）'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">创建时间</span>
            <span class="detail-value">${formatTime(record.createdAt)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">最近更新</span>
            <span class="detail-value">${formatTime(record.updatedAt)}</span>
          </div>
        </div>
      </div>

      <div class="detail-card">
        <h3>⚠️ 数据异常记录（不污染正常数据，单独追踪）</h3>
        ${anomalies.length === 0
          ? '<p style="color:#909399;font-size:13px;">无异常记录</p>'
          : `<ul class="anomaly-list">
              ${anomalies.map(a => `
                <li class="anomaly-item ${a.type === 'boundary_value' ? 'warn' : ''}">
                  <div class="anomaly-head">
                    <span class="anomaly-field">字段：${a.field}</span>
                    <span class="anomaly-type">${getAnomalyTypeText(a.type)}</span>
                  </div>
                  <div class="anomaly-reason">${a.reason}</div>
                  <div class="anomaly-value">原始值：${a.value} · 关联版本：v${a.versionNo} · ${formatTime(a.createdAt)}</div>
                </li>
              `).join('')}
            </ul>`
        }
      </div>

      <div class="detail-card">
        <h3>📜 历史版本（共 ${versions.length} 个版本，倒序展示）</h3>
        <div class="timeline">
          ${versions.map(v => `
            <div class="timeline-item">
              <div class="timeline-dot op-${v.operationType}"></div>
              <div class="timeline-head">
                <div>
                  <span class="timeline-version">v${v.versionNo}</span>
                  <span class="timeline-op op-${v.operationType}">${getOpText(v.operationType)}</span>
                  ${v.operatorName ? `<span style="font-size:12px;color:#909399;margin-left:8px;">操作人：${v.operatorName}</span>` : ''}
                </div>
                <span class="timeline-time">${formatTime(v.createdAt)}</span>
              </div>
              <div class="timeline-body">
                ${v.previousStatus && v.previousStatus !== v.newStatus ? `
                  <div class="timeline-status-change">
                    <span class="status-badge status-${v.previousStatus}">${getStatusText(v.previousStatus)}</span>
                    <span class="arrow">→</span>
                    <span class="status-badge status-${v.newStatus}">${getStatusText(v.newStatus)}</span>
                    <span style="font-size:12px;color:#909399;margin-left:8px;">状态变更</span>
                  </div>
                ` : ''}
                <div class="timeline-snapshot">
                  <div class="timeline-snapshot-item">
                    <span class="timeline-snapshot-label">照片说明：</span>
                    <span class="timeline-snapshot-value">${v.snapshot?.photoDescription || '（无）'}</span>
                  </div>
                  <div class="timeline-snapshot-item">
                    <span class="timeline-snapshot-label">授权状态：</span>
                    <span class="timeline-snapshot-value">${getStatusText(v.snapshot?.status || '-')}</span>
                  </div>
                  <div class="timeline-snapshot-item">
                    <span class="timeline-snapshot-label">整改记录：</span>
                    <span class="timeline-snapshot-value">${v.snapshot?.rectification || '（无）'}</span>
                  </div>
                  <div class="timeline-snapshot-item">
                    <span class="timeline-snapshot-label">照片数量：</span>
                    <span class="timeline-snapshot-value">${v.snapshot?.photoCount || 0} 张</span>
                  </div>
                </div>
                ${v.remark ? `<div class="timeline-remark">💬 ${v.remark}</div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function resetForm() {
  document.getElementById('formTitle').textContent = '新增授权记录';
  document.getElementById('formRecordId').value = '';
  document.getElementById('authForm').reset();
}

function editRecord(id) {
  const record = currentRecords.find(r => r.id === id);
  if (!record) return;

  switchView('new');
  document.getElementById('formTitle').textContent = `补录/修改 - ${record.babyName}（创建新版本 v${(record.latestVersion || 0) + 1}）`;
  document.getElementById('formRecordId').value = record.id;
  document.getElementById('babyName').value = record.babyName || '';
  document.getElementById('guardianName').value = record.guardianName || '';
  document.getElementById('roomNo').value = record.roomNo || '';
  document.getElementById('babyAgeDays').value = record.babyAgeDays !== null && record.babyAgeDays !== undefined ? record.babyAgeDays : '';
  document.getElementById('photoCount').value = record.photoCount || '';
  document.getElementById('status').value = record.status || 'pending';
  document.getElementById('photoDescription').value = record.photoDescription || '';
  document.getElementById('rectification').value = record.rectification || '';
  document.getElementById('operatorName').value = record.operatorName || '';
  document.getElementById('isLateRecord').checked = false;
  document.getElementById('remark').value = '';
}

document.getElementById('authForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const recordId = document.getElementById('formRecordId').value;
  const payload = {
    babyName: document.getElementById('babyName').value.trim(),
    guardianName: document.getElementById('guardianName').value.trim(),
    roomNo: document.getElementById('roomNo').value.trim(),
    babyAgeDays: document.getElementById('babyAgeDays').value.trim(),
    photoCount: document.getElementById('photoCount').value.trim(),
    status: document.getElementById('status').value,
    photoDescription: document.getElementById('photoDescription').value.trim(),
    rectification: document.getElementById('rectification').value.trim(),
    operatorName: document.getElementById('operatorName').value.trim(),
    isLateRecord: document.getElementById('isLateRecord').checked,
    remark: document.getElementById('remark').value.trim()
  };

  try {
    const url = recordId ? `/api/records/${recordId}` : '/api/records';
    const method = recordId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (res.ok) {
      const action = recordId ? '补录成功' : '创建成功';
      let msg = `${action}，当前版本 v${data.versionNo}`;
      if (data.anomalies && data.anomalies.length > 0) {
        msg += `（检测到 ${data.anomalies.length} 条数据异常，已单独记录）`;
        showToast(msg, 'warn');
      } else {
        showToast(msg, 'success');
      }
      setTimeout(() => {
        if (recordId) {
          switchView('detail', recordId);
        } else {
          switchView('list');
        }
      }, 1000);
    } else {
      showToast(data.error || '保存失败', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('网络错误', 'error');
  }
});

document.getElementById('searchInput').addEventListener('input', renderRecords);

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const view = btn.dataset.view;
    if (view === 'detail' && currentDetail?.record?.id) {
      switchView('detail', currentDetail.record.id);
    } else if (view !== 'detail') {
      switchView(view);
    }
  });
});

switchView('list');
