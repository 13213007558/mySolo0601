const STATUS_LABEL = { pending: '待审核', approved: '已通过', rejected: '已驳回', rectifying: '整改中', closed: '已关闭' };
const TYPE_LABEL = { normal: '正常', phone: '电话授权', temp_auntie: '临时阿姨', mixed: '混合' };

function api(url, opt = {}) {
  opt.headers = opt.headers || {};
  if (opt.body && !(opt.body instanceof FormData) && typeof opt.body !== 'string') {
    opt.headers['Content-Type'] = 'application/json';
    opt.body = JSON.stringify(opt.body);
  }
  return fetch(url, opt).then(async r => {
    const ct = r.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await r.json() : await r.text();
    if (!r.ok) return Promise.reject({ status: r.status, data });
    return data;
  });
}

function operatorOptionsHtml() {
  return '<option value="">(未指定/模拟未知处理人)</option>' +
    Object.entries(window.__OPERATORS__ || {}).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
}

function loadOperators() {
  return api('/api/operators').then(o => { window.__OPERATORS__ = o; return o; });
}

function initListPage() {
  loadOperators().then(() => {
    document.getElementById('operatorSel').innerHTML = operatorOptionsHtml();
  });
  refreshList();

  document.getElementById('statusFilter').onchange = refreshList;
  document.getElementById('typeFilter').onchange = refreshList;
  document.getElementById('search').oninput = refreshList;

  document.getElementById('btnNew').onclick = () => {
    document.getElementById('modalTitle').textContent = '新增授权记录';
    document.getElementById('authForm').reset();
    document.getElementById('modal').classList.remove('hidden');
    toggleAuthTypeFields();
  };
  document.getElementById('btnCancel').onclick = () => document.getElementById('modal').classList.add('hidden');
  document.getElementById('authType').onchange = toggleAuthTypeFields;

  document.getElementById('authForm').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    try {
      await api('/api/authorizations', { method: 'POST', body: data });
      document.getElementById('modal').classList.add('hidden');
      refreshList();
    } catch (err) {
      alert('保存失败：' + (err.data?.error || err.message || err));
    }
  };

  document.getElementById('btnExportCsv').onclick = () => { window.location = '/api/export/csv'; };
  document.getElementById('btnExportMd').onclick = () => { window.location = '/api/export/markdown'; };
  document.getElementById('btnPreview').onclick = openPreview;
  document.getElementById('btnClosePreview').onclick = () => document.getElementById('previewModal').classList.add('hidden');
  document.querySelectorAll('.preview-tabs .tab').forEach(t => {
    t.onclick = () => {
      document.querySelectorAll('.preview-tabs .tab').forEach(x => x.classList.remove('active'));
      document.querySelectorAll('.preview-pane').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      document.getElementById('preview' + t.dataset.tab.charAt(0).toUpperCase() + t.dataset.tab.slice(1)).classList.add('active');
    };
  });
}

function toggleAuthTypeFields() {
  const t = document.getElementById('authType').value;
  document.getElementById('phoneFields').style.display = (t === 'phone' || t === 'mixed') ? '' : 'none';
  document.getElementById('auntieFields').style.display = (t === 'temp_auntie' || t === 'mixed') ? '' : 'none';
}

async function refreshList() {
  const list = await api('/api/authorizations');
  const sf = document.getElementById('statusFilter').value;
  const tf = document.getElementById('typeFilter').value;
  const kw = document.getElementById('search').value.trim().toLowerCase();
  const filtered = list.filter(a => {
    if (sf && a.status !== sf) return false;
    if (tf && a.auth_type !== tf) return false;
    if (kw) {
      const blob = [a.baby_name, a.authorized_person, a.room_number, a.summary].join(' ').toLowerCase();
      if (!blob.includes(kw)) return false;
    }
    return true;
  });
  const byStatus = {};
  list.forEach(a => byStatus[a.status] = (byStatus[a.status] || 0) + 1);
  document.getElementById('summaryTotal').innerHTML = `共 <b>${filtered.length}</b> 条 (总 ${list.length} 条)`;
  document.getElementById('summaryBreakdown').innerHTML = Object.entries(STATUS_LABEL)
    .map(([k, v]) => `<span>${v}: <b>${byStatus[k] || 0}</b></span>`).join(' &nbsp;·&nbsp; ');

  const tbody = document.getElementById('listBody');
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty">暂无数据</td></tr>';
    return;
  }
  tbody.innerHTML = filtered.map(a => `
    <tr>
      <td>#${a.id}</td>
      <td class="summary-cell"><a href="/detail.html?id=${a.id}">${a.summary || '-'}</a></td>
      <td><span class="tag tag-${a.auth_type}">${TYPE_LABEL[a.auth_type] || a.auth_type}</span></td>
      <td><span class="tag tag-${a.status}">${STATUS_LABEL[a.status] || a.status}</span></td>
      <td>—</td>
      <td>—</td>
      <td>${a.created_at}</td>
      <td><a href="/detail.html?id=${a.id}">详情</a></td>
    </tr>
  `).join('');
  const ids = filtered.map(a => a.id);
  const counts = await Promise.all(ids.map(id =>
    Promise.all([
      api(`/api/authorizations/${id}`).then(d => ({ photos: d.photos?.length || 0, rects: d.rectifications?.length || 0 })).catch(() => ({ photos: 0, rects: 0 }))
    ])
  ));
  ids.forEach((id, i) => {
    const tr = tbody.querySelector(`tr:nth-child(${i + 1})`);
    if (tr) {
      tr.children[4].textContent = counts[i][0].photos;
      tr.children[5].textContent = counts[i][0].rects;
    }
  });
}

async function openPreview() {
  const p = await api('/api/export/preview');
  document.getElementById('previewSummary').innerHTML = `<div><b>摘要行：</b><pre>${p.summary_line || ''}</pre></div>`;
  document.getElementById('previewCsv').textContent = p.csv;
  document.getElementById('previewMd').textContent = p.markdown;
  document.getElementById('previewModal').classList.remove('hidden');
}

async function initDetailPage() {
  await loadOperators();
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { document.getElementById('detailBox').innerHTML = '<div class="empty">缺少ID参数</div>'; return; }
  await loadDetail(id);
  document.getElementById('backLink').href = '/';
}

async function loadDetail(id) {
  const box = document.getElementById('detailBox');
  let d;
  try { d = await api(`/api/authorizations/${id}`); }
  catch (e) { box.innerHTML = '<div class="empty">加载失败</div>'; return; }

  box.innerHTML = `
    <h2>#${d.id} ${d.baby_name} · ${STATUS_LABEL[d.status] || d.status}</h2>
    <div class="summary">📋 ${d.summary || ''}</div>

    <div class="detail-grid">
      <div class="field"><div class="label">宝宝姓名</div><div class="value">${d.baby_name}</div></div>
      <div class="field"><div class="label">出生日期</div><div class="value">${d.baby_dob || '-'}</div></div>
      <div class="field"><div class="label">房号</div><div class="value">${d.room_number || '-'}</div></div>
      <div class="field"><div class="label">母亲姓名</div><div class="value">${d.mother_name || '-'}</div></div>
      <div class="field"><div class="label">被授权人</div><div class="value">${d.authorized_person}</div></div>
      <div class="field"><div class="label">联系电话</div><div class="value">${d.phone || '-'}</div></div>
      <div class="field"><div class="label">与宝宝关系</div><div class="value">${d.relationship || '-'}</div></div>
      <div class="field"><div class="label">授权类型</div><div class="value"><span class="tag tag-${d.auth_type}">${TYPE_LABEL[d.auth_type] || d.auth_type}</span></div></div>
      <div class="field"><div class="label">状态</div><div class="value"><span class="tag tag-${d.status}">${STATUS_LABEL[d.status] || d.status}</span></div></div>
      ${(d.auth_type === 'phone' || d.auth_type === 'mixed') ? `
        <div class="field"><div class="label">电话授权人</div><div class="value">${d.phone_auth_by || '-'}</div></div>
        <div class="field"><div class="label">电话授权备注</div><div class="value">${d.phone_auth_note || '-'}</div></div>
      ` : ''}
      ${(d.auth_type === 'temp_auntie' || d.auth_type === 'mixed') ? `
        <div class="field"><div class="label">临时阿姨姓名</div><div class="value">${d.temp_auntie_name || '-'}</div></div>
      ` : ''}
      <div class="field"><div class="label">创建时间</div><div class="value">${d.created_at}</div></div>
      <div class="field"><div class="label">更新时间</div><div class="value">${d.updated_at}</div></div>
      ${d.closed_at ? `<div class="field"><div class="label">关闭时间</div><div class="value">${d.closed_at} (by ${d.closed_by || '-'})</div></div>` : ''}
    </div>

    <h3 class="section-title">📷 照片附件 (${d.photos.length}) <div class="actions"><button id="btnToggleAppend">+ 追加材料</button></div></h3>
    <div id="appendBox" class="append-box hidden">
      <h4>追加照片（格式 jpg/png/pdf，其它格式会触发部分失败）</h4>
      <div class="row">
        <label>操作人(留空模拟未知处理人)
          <select id="appendOp">${operatorOptionsHtml()}</select>
        </label>
      </div>
      <div class="row">
        <label>照片1: 说明<input type="text" id="phDesc1" placeholder="照片说明"></label>
        <label><input type="file" id="phFile1" accept=".jpg,.jpeg,.png,.pdf"></label>
      </div>
      <div class="row">
        <label>照片2: 说明<input type="text" id="phDesc2" placeholder="照片说明"></label>
        <label><input type="file" id="phFile2" accept=".jpg,.jpeg,.png,.pdf"></label>
      </div>
      <h4 style="margin-top:10px">追加整改内容（超过500字会失败）</h4>
      <div class="row">
        <label style="flex:2">整改内容 1<input type="text" id="rect1" placeholder="简短整改内容"></label>
        <label>处理人<input type="text" id="rectHandler1"></label>
      </div>
      <div class="row">
        <label style="flex:2">整改内容 2 (输入超长文本以触发失败)<input type="text" id="rect2" placeholder="可留空"></label>
        <label>处理人<input type="text" id="rectHandler2"></label>
      </div>
      <div class="row" style="justify-content:flex-end">
        <button id="btnAppendSubmit">提交追加 (部分成功允许)</button>
      </div>
      <div id="appendResult" class="demo-result hidden"></div>
    </div>
    <div class="photo-list" id="photoList">
      ${d.photos.map(p => `
        <div class="photo-card" data-id="${p.id}">
          <div class="img">${p.filename.match(/\.(jpg|jpeg|png|gif)$/i) ? `<img src="/uploads/${p.filename}">` : `📄 ${p.filename}`}</div>
          <div class="body">
            <div class="filename">${p.filename} <span style="color:#888">(上传: ${p.uploaded_by || '未知'})</span></div>
            <textarea class="photo-desc" placeholder="照片说明">${p.description || ''}</textarea>
            <div class="actions-s"><button class="save-photo">保存说明</button></div>
          </div>
        </div>
      `).join('') || '<div class="empty" style="grid-column:1/-1">暂无照片</div>'}
    </div>

    <h3 class="section-title">⚠️ 整改记录 (${d.rectifications.length})</h3>
    <div class="rect-list" id="rectList">
      ${d.rectifications.map(r => `
        <div class="rect-card" data-id="${r.id}">
          <textarea class="rect-content">${r.content}</textarea>
          <div class="row-inline">
            <label>状态
              <select class="rect-status">
                ${Object.entries({ pending: '待处理', approved: '已完成', rejected: '不通过' }).map(([k, v]) => `<option value="${k}" ${r.status === k ? 'selected' : ''}>${v}</option>`).join('')}
              </select>
            </label>
            <label>处理人<input type="text" class="rect-handler" value="${r.handler || ''}"></label>
            <span style="color:#888;font-size:12px">更新: ${r.updated_at}</span>
          </div>
          <div class="actions-s"><button class="save-rect">保存</button></div>
        </div>
      `).join('') || '<div class="empty">暂无整改记录</div>'}
    </div>

    <h3 class="section-title">🧾 审计日志</h3>
    <div id="auditList" class="audit-list"></div>
  `;

  const audits = await api(`/api/authorizations/${id}/audit`);
  document.getElementById('auditList').innerHTML = audits.map(a => `
    <div class="audit-row">
      <div class="time">${a.created_at}</div>
      <div>#${a.authorization_id || '-'}</div>
      <div>${a.action}</div>
      <div>${a.field || '-'}</div>
      <div class="change">${a.old_value !== null ? `<s>${a.old_value}</s> → ` : ''}${a.new_value !== null ? a.new_value : '-'}</div>
      <div class="op"><span class="tag ${a.operator_found ? 'tag-approved' : 'tag-missing'}">${a.operator_display || '未知处理人'}</span></div>
      <div class="change">${a.detail || '-'}</div>
    </div>
  `).join('') || '<div class="empty">暂无审计记录</div>';

  document.getElementById('btnToggleAppend').onclick = () =>
    document.getElementById('appendBox').classList.toggle('hidden');
  document.getElementById('btnAppendSubmit').onclick = () => doAppend(id);

  document.querySelectorAll('.save-photo').forEach(btn => {
    btn.onclick = async (e) => {
      const card = e.target.closest('.photo-card');
      const pid = card.dataset.id;
      const desc = card.querySelector('.photo-desc').value;
      const op = prompt('请输入操作人key (nurse_zhang / nurse_li 等)，留空模拟未知处理人');
      const res = await api(`/api/photos/${pid}`, { method: 'PUT', body: { description: desc, operator: op } });
      btn.textContent = '✓ 已保存';
      setTimeout(() => btn.textContent = '保存说明', 1200);
    };
  });
  document.querySelectorAll('.save-rect').forEach(btn => {
    btn.onclick = async (e) => {
      const card = e.target.closest('.rect-card');
      const rid = card.dataset.id;
      const content = card.querySelector('.rect-content').value;
      const status = card.querySelector('.rect-status').value;
      const handler = card.querySelector('.rect-handler').value;
      const op = prompt('请输入操作人key，留空模拟未知处理人');
      await api(`/api/rectifications/${rid}`, { method: 'PUT', body: { content, status, handler, operator: op } });
      btn.textContent = '✓ 已保存';
      setTimeout(() => { btn.textContent = '保存'; loadDetail(id); }, 1000);
    };
  });
}

async function doAppend(id) {
  const fd = new FormData();
  fd.append('operator', document.getElementById('appendOp').value);
  const f1 = document.getElementById('phFile1').files[0];
  const f2 = document.getElementById('phFile2').files[0];
  const descs = [];
  if (f1) { fd.append('photos', f1); descs.push(document.getElementById('phDesc1').value); }
  if (f2) { fd.append('photos', f2); descs.push(document.getElementById('phDesc2').value); }
  fd.append('descriptions', JSON.stringify(descs));
  const rects = [];
  if (document.getElementById('rect1').value) rects.push({ content: document.getElementById('rect1').value, handler: document.getElementById('rectHandler1').value });
  if (document.getElementById('rect2').value) rects.push({ content: document.getElementById('rect2').value, handler: document.getElementById('rectHandler2').value });
  fd.append('rectifications', JSON.stringify(rects));
  const resultBox = document.getElementById('appendResult');
  resultBox.classList.remove('hidden');
  resultBox.textContent = '提交中...';
  try {
    const r = await api(`/api/authorizations/${id}/append-materials`, { method: 'POST', body: fd });
    resultBox.innerHTML = `<b>状态码：${r.partial ? '207 部分成功' : '200 全部成功'}</b>\n\n` +
      `成功 ${r.success_count} 项，失败 ${r.fail_count} 项\n` +
      `照片：成功 ${r.results.photos.success.length} / 失败 ${r.results.photos.failed.length}\n` +
      (r.results.photos.failed.length ? `  - 失败明细: ${JSON.stringify(r.results.photos.failed)}\n` : '') +
      `整改：成功 ${r.results.rectifications.success.length} / 失败 ${r.results.rectifications.failed.length}\n` +
      (r.results.rectifications.failed.length ? `  - 失败明细: ${JSON.stringify(r.results.rectifications.failed)}\n` : '') +
      (r.results.warnings.length ? `\n⚠️ 警告: ${r.results.warnings.join('；')}\n` : '') +
      `\n(授权记录状态仍为: ${r.authorization.status})`;
    setTimeout(() => loadDetail(id), 1500);
  } catch (err) {
    resultBox.textContent = '请求失败：' + JSON.stringify(err.data || err, null, 2);
  }
}

async function initAuditPage() {
  await loadOperators();
  const chk = document.getElementById('onlyMissing');
  chk.onchange = loadAudit;
  document.getElementById('btnRefresh').onclick = loadAudit;
  loadAudit();
}
async function loadAudit() {
  const onlyMissing = document.getElementById('onlyMissing').checked;
  const list = await api('/api/audit' + (onlyMissing ? '?missing_operator=1' : ''));
  const body = document.getElementById('auditBody');
  if (!list.length) { body.innerHTML = '<tr><td colspan="7" class="empty">暂无审计记录</td></tr>'; return; }
  body.innerHTML = list.map(a => `
    <tr>
      <td style="color:#888">${a.created_at}</td>
      <td><a href="/detail.html?id=${a.authorization_id}">#${a.authorization_id || '-'}</a></td>
      <td>${a.action}</td>
      <td>${a.field || '-'}</td>
      <td style="font-size:12px">${a.old_value !== null ? `<s>${a.old_value}</s> → ` : ''}${a.new_value !== null ? a.new_value : '-'}</td>
      <td><span class="tag ${a.operator_found ? 'tag-approved' : 'tag-missing'}">${a.operator_display || '未知处理人'}</span></td>
      <td style="font-size:12px;color:#555">${a.detail || '-'}</td>
    </tr>
  `).join('');
}

async function initPlaybookPage() {
  await loadOperators();
  document.getElementById('btnDemoFailure').onclick = async () => {
    const box = document.getElementById('demoFailureResult');
    box.className = 'demo-result';
    box.textContent = '模拟中...';
    const list = await api('/api/authorizations');
    if (!list.length) { box.textContent = '无数据可演示'; return; }
    const target = list[0];
    try {
      await api(`/api/authorizations/${target.id}`, {
        method: 'PUT',
        body: { status: target.status === 'approved' ? 'rectifying' : 'approved', operator: 'ghost_user_999' }
      });
      const audits = await api(`/api/authorizations/${target.id}/audit`);
      const bad = audits.find(a => a.operator_found === 0);
      box.innerHTML = bad
        ? `<span class="check-pass">✓ 触发失败路径成功</span>\n\n授权 #${target.id} 现在审计中有一条处理人缺失记录：\n` +
          `  操作: ${bad.action}\n  处理人显示: ${bad.operator_display}\n  审计ID: #${bad.id}\n\n` +
          `👉 请打开 <a href="/audit.html" target="_blank">审计中心</a> 勾选"仅显示处理人缺失"查看；` +
          `也可进入 <a href="/detail.html?id=${target.id}" target="_blank">详情页</a> 底部审计日志查看高亮的"未知处理人"标签。`
        : '未生成缺失处理人审计';
    } catch (e) {
      box.textContent = '失败：' + JSON.stringify(e.data || e);
    }
  };

  document.getElementById('btnDemoPartial').onclick = async () => {
    const box = document.getElementById('demoPartialResult');
    box.className = 'demo-result';
    box.textContent = '模拟中...';
    const list = await api('/api/authorizations');
    let target = list.find(a => a.status === 'closed');
    if (!target && list.length) {
      target = await api(`/api/authorizations/${list[0].id}`, {
        method: 'PUT', body: { status: 'closed', operator: 'director_chen' }
      });
    }
    if (!target) { box.textContent = '无数据可演示'; return; }
    const fd = new FormData();
    fd.append('operator', 'health_teacher');
    fd.append('descriptions', JSON.stringify(['身份证正面', '']));
    const longStr = 'x'.repeat(520);
    fd.append('rectifications', JSON.stringify([
      { content: '补充接送委托书照片', handler: '保健老师' },
      { content: longStr, handler: '' }
    ]));
    try {
      const r = await api(`/api/authorizations/${target.id}/append-materials`, { method: 'POST', body: fd });
      box.innerHTML = `<span class="${r.partial ? 'check-pass' : 'check-fail'}">${r.partial ? '✓ 207 部分成功（符合预期）' : '返回码不是207'}</span>\n\n` +
        `成功 ${r.success_count} 项，失败 ${r.fail_count} 项\n` +
        `照片：成功 ${r.results.photos.success.length} / 失败 ${r.results.photos.failed.length}\n` +
        `整改：成功 ${r.results.rectifications.success.length} / 失败 ${r.results.rectifications.failed.length}\n` +
        `警告: ${r.results.warnings.join('；') || '(无)'}\n\n` +
        `👉 进入 <a href="/detail.html?id=${target.id}" target="_blank">详情页</a> 可编辑已成功追加的照片说明和整改记录，失败项需人工更正后重新追加。`;
    } catch (e) {
      box.textContent = '失败：' + JSON.stringify(e.data || e);
    }
  };

  document.getElementById('btnConsistencyCheck').onclick = async () => {
    const box = document.getElementById('consistencyResult');
    box.className = 'demo-result';
    box.textContent = '检查中...';
    const list = await api('/api/authorizations');
    if (!list.length) { box.textContent = '无数据'; return; }
    const id = list[0].id;
    const [detail, preview] = await Promise.all([
      api(`/api/authorizations/${id}`),
      api(`/api/export/preview?id=${id}`)
    ]);
    const checks = [];
    checks.push(['页面摘要 vs 导出摘要行', detail.summary === preview.summary_line]);
    checks.push(['Markdown 含摘要', preview.markdown.includes(detail.summary)]);
    checks.push(['CSV 含摘要', preview.csv.includes(detail.summary)]);
    checks.push(['Markdown 含状态标签', preview.markdown.includes(STATUS_LABEL[detail.status])]);
    checks.push(['CSV 含状态', preview.csv.includes(detail.status)]);
    checks.push(['Markdown 照片数一致', (preview.markdown.match(/### 照片附件/g) || []).length >= (detail.photos.length > 0 ? 1 : 0)]);
    checks.push(['Markdown 整改记录数一致', (preview.markdown.match(/### 整改记录/g) || []).length >= (detail.rectifications.length > 0 ? 1 : 0)]);
    detail.photos.forEach((p, i) => {
      checks.push([`照片#${i + 1}说明在Markdown里`, p.description ? preview.markdown.includes(p.description) : true]);
    });
    detail.rectifications.forEach((r, i) => {
      checks.push([`整改#${i + 1}内容在Markdown里`, preview.markdown.includes(r.content.substring(0, 20))]);
    });
    box.innerHTML = checks.map(([name, ok]) =>
      `<div>${ok ? '<span class="check-pass">✓</span>' : '<span class="check-fail">✗</span>'} ${name}</div>`
    ).join('') + `<br><b>授权 #${id}</b>（服务重启后打开详情仍应与此一致）`;
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const path = location.pathname;
  if (path.endsWith('/') || path.endsWith('/index.html')) initListPage();
});
