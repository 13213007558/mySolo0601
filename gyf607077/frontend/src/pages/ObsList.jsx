import React, { useEffect, useState } from 'react';
import { api, downloadExport } from '../api';
import ObsForm from '../components/ObsForm.jsx';

export default function ObsList({ user, onSelect }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [batchIds, setBatchIds] = useState([]);
  const [notice, setNotice] = useState(null);

  const canCreate = user.permissions.includes('create');
  const canExport = user.permissions.includes('export');
  const isElder = user.role === 'elder';

  async function reload() {
    setLoading(true);
    try {
      const data = await api.listObs();
      setList(data);
    } catch (e) {
      setNotice({ type: 'error', msg: e.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

  const filtered = list.filter(o =>
    !filter || o.status === filter || (o.baby_name || '').includes(filter)
  );

  function toggleBatch(id) {
    setBatchIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleBatchSubmit() {
    if (batchIds.length === 0) return;
    try {
      const r = await api.batchSubmit(batchIds);
      if (r.failed.length) {
        setNotice({ type: 'warn', msg: `部分成功: ${r.successCount} 条成功, ${r.failedCount} 条失败。失败项: ` + r.failed.map(f => `#${f.id}(${f.error})`).join(', ') });
      } else {
        setNotice({ type: 'success', msg: `批量提交成功,共 ${r.successCount} 条` });
      }
      setBatchIds([]);
      reload();
    } catch (e) {
      setNotice({ type: 'error', msg: e.message });
    }
  }

  function handleExport() {
    downloadExport('/export/observations' + (filter ? '?status=' + filter : ''));
  }

  if (isElder) {
    return (
      <div>
        <div className="notice notice-info">👵 您好,这里只显示宝宝睡眠的简要摘要,便于您快速了解情况。</div>
        {loading ? <div className="empty">加载中...</div> :
          filtered.length === 0 ? <div className="empty">暂无记录</div> :
          filtered.map(o => (
            <div key={o.id} className="elder-card">
              <div className="title">{o.summary || (o.baby_name + ' ' + o.sleep_date)}</div>
              <div className="sub">记录人: {o.creator_name} · {o.created_at} · 状态: {o.status_label}</div>
            </div>
          ))
        }
      </div>
    );
  }

  return (
    <div>
      {notice && (
        <div className={'notice notice-' + notice.type}>
          {notice.msg}
          <button style={{ float: 'right', border: 'none', background: 'transparent', cursor: 'pointer' }} onClick={() => setNotice(null)}>✕</button>
        </div>
      )}

      <div className="toolbar">
        <div className="filters">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="submitted">已提交待复核</option>
            <option value="returned">已退回补充</option>
            <option value="archived">已关闭归档</option>
          </select>
          <span style={{ color: '#888', fontSize: 13 }}>共 {filtered.length} 条</span>
        </div>
        <div className="btn-group">
          {batchIds.length > 0 && (
            <button className="btn btn-primary" onClick={handleBatchSubmit}>
              批量提交({batchIds.length})
            </button>
          )}
          {canExport && <button className="btn" onClick={handleExport}>导出CSV</button>}
          {canCreate && <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ 新建记录</button>}
        </div>
      </div>

      {showForm && (
        <ObsForm
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); reload(); }}
        />
      )}

      {loading ? <div className="empty">加载中...</div> :
        filtered.length === 0 ? <div className="empty">暂无记录</div> : (
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 40 }}></th>
              <th>ID</th>
              <th>宝宝</th>
              <th>睡眠日期</th>
              <th>时间段</th>
              <th>质量</th>
              <th>状态</th>
              <th>录入人</th>
              <th>更新时间</th>
              <th style={{ width: 120 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id}>
                <td>
                  {o.status === 'draft' && (
                    <input type="checkbox" checked={batchIds.includes(o.id)} onChange={() => toggleBatch(o.id)} />
                  )}
                </td>
                <td>#{o.id}</td>
                <td>{o.baby_name}</td>
                <td>{o.sleep_date}</td>
                <td>{o.start_time}{o.end_time ? ' ~ ' + o.end_time : ''}</td>
                <td>{o.sleep_quality === 'good' ? '😊 良好' : o.sleep_quality === 'poor' ? '😟 较差' : o.sleep_quality === 'normal' ? '🙂 一般' : '-'}</td>
                <td><span className={'status-tag status-' + o.status}>{o.status_label}</span></td>
                <td>{o.creator_name}</td>
                <td style={{ fontSize: 12 }}>{o.updated_at}</td>
                <td>
                  <button className="btn" onClick={() => onSelect(o.id)}>查看</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
