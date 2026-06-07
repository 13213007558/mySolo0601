import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RecordForm from './RecordForm.jsx';

const STATUS_MAP = {
  draft: { label: '草稿', cls: 'tag-draft' },
  pending: { label: '待复核', cls: 'tag-pending' },
  rejected: { label: '已退回', cls: 'tag-rejected' },
  approved: { label: '已通过', cls: 'tag-approved' },
  closed: { label: '已归档', cls: 'tag-closed' }
};

const EVENT_TYPE_LABELS = {
  create: '录入',
  update: '修改',
  submit: '提交复核',
  approve: '复核通过',
  reject: '退回补充',
  close: '关闭归档'
};

export default function RecordDetail({ recordId, currentUser, onBack, onRefresh }) {
  const [record, setRecord] = useState(null);
  const [timeline, setTimeline] = useState({ events: [], audits: [] });
  const [showEdit, setShowEdit] = useState(false);
  const [rejectRemark, setRejectRemark] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchData = async () => {
    const [r, t] = await Promise.all([
      axios.get(`/api/records/${recordId}`),
      axios.get(`/api/records/${recordId}/timeline`)
    ]);
    setRecord(r.data);
    setTimeline(t.data);
  };

  useEffect(() => { fetchData(); }, [recordId]);

  if (!record) return <div style={{ padding: 40, textAlign: 'center' }}>加载中...</div>;

  const canEdit = ['draft', 'rejected'].includes(record.status);
  const canSubmit = ['draft', 'rejected'].includes(record.status);
  const canApprove = record.status === 'pending';
  const canReject = record.status === 'pending';
  const canClose = record.status === 'approved';

  const doAction = async (action, extra = {}) => {
    setMsg('');
    try {
      await axios.post(`/api/records/${recordId}/${action}`, { operator: currentUser, ...extra });
      setMsg(`✅ ${EVENT_TYPE_LABELS[action] || '操作'}成功`);
      fetchData();
      onRefresh();
      setTimeout(() => setMsg(''), 2500);
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.error || err.message));
    }
  };

  const parseJSON = (s) => {
    if (!s) return null;
    try { return JSON.parse(s); } catch (e) { return s; }
  };

  return (
    <div>
      {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-danger'}`}>{msg}</div>}

      <div className="timeline-wrap">
        <div className="record-detail">
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h2 style={{ marginBottom: 8, color: '#303133' }}>
                  {record.child_name}
                  {record.photo_missing && <span className="tag tag-missing" style={{ marginLeft: 10 }}>⚠️ 照片缺失（部分成功，已留审计）</span>}
                </h2>
                <div style={{ color: '#909399', fontSize: 13 }}>
                  {record.gender} | {record.birth_date} | 监护人：{record.guardian} | 电话：{record.phone}
                </div>
              </div>
              <span className={`tag ${STATUS_MAP[record.status].cls}`} style={{ fontSize: 14, padding: '4px 14px' }}>
                {STATUS_MAP[record.status].label}
              </span>
            </div>

            <div className="field-list">
              <div className="field-item"><div className="fl">记录日期</div><div className="fv">{record.record_date}</div></div>
              <div className="field-item"><div className="fl">睡眠时长</div><div className="fv">{record.sleep_duration ? `${record.sleep_duration} 小时` : '-'}</div></div>
              <div className="field-item"><div className="fl">入睡时间</div><div className="fv">{record.sleep_start || '-'}</div></div>
              <div className="field-item"><div className="fl">起床时间</div><div className="fv">{record.sleep_end || '-'}</div></div>
              <div className="field-item"><div className="fl">睡眠质量</div><div className="fv">{record.sleep_quality || '-'}</div></div>
              <div className="field-item"><div className="fl">环境情况</div><div className="fv">{record.environment || '-'}</div></div>
              <div className="field-item"><div className="fl">录入人</div><div className="fv">{record.created_by}</div></div>
              <div className="field-item"><div className="fl">录入时间</div><div className="fv">{record.created_at}</div></div>
              <div className="field-item" style={{ gridColumn: '1 / -1' }}>
                <div className="fl">备注</div>
                <div className="fv">{record.notes || '（无）'}</div>
              </div>
              {record.photo_path && (
                <div className="field-item" style={{ gridColumn: '1 / -1' }}>
                  <div className="fl">观察照片</div>
                  <div className="fv"><img src={record.photo_path} style={{ maxHeight: 180, borderRadius: 6 }} alt="观察照片" /></div>
                </div>
              )}
            </div>

            <div className="form-actions" style={{ border: 'none', padding: 0, marginTop: 20 }}>
              <button className="btn btn-default" onClick={onBack}>← 返回列表</button>
              <div style={{ flex: 1 }} />
              {canEdit && <button className="btn btn-warning" onClick={() => setShowEdit(true)}>✏️ 修改记录</button>}
              {canSubmit && <button className="btn btn-primary" onClick={() => doAction('submit')}>📤 提交复核</button>}
              {canApprove && <button className="btn btn-success" onClick={() => doAction('approve')}>✅ 复核通过</button>}
              {canReject && <button className="btn btn-danger" onClick={() => setShowReject(true)}>↩️ 退回补充</button>}
              {canClose && <button className="btn btn-primary" onClick={() => doAction('close')}>📦 关闭归档</button>}
            </div>
          </div>

          <div className="card audit-section">
            <h4>📋 审计留痕（旧值、操作人、复核时间）</h4>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 140 }}>操作时间</th>
                  <th style={{ width: 90 }}>操作类型</th>
                  <th>变更内容</th>
                  <th style={{ width: 100 }}>操作人</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                {timeline.audits.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20, color: '#909399' }}>暂无审计记录</td></tr>}
                {timeline.audits.map(a => {
                  const oldV = parseJSON(a.old_value);
                  const newV = parseJSON(a.new_value);
                  return (
                    <tr key={a.id}>
                      <td style={{ fontSize: 12, color: '#909399' }}>{a.created_at}</td>
                      <td><span className={`tag tag-${a.action === 'status_change' ? 'pending' : a.action === 'create' ? 'approved' : 'warning'}`}>
                        {{ create: '创建', update: '修改', status_change: '状态' }[a.action] || a.action}
                      </span></td>
                      <td>
                        {(oldV || newV) && (
                          <div className="diff-box">
                            {Object.keys(newV || oldV || {}).map(k => (
                              <div key={k} className="diff-row">
                                <span className="field">{k}:</span>
                                <span className="old">{oldV && oldV[k] !== undefined ? JSON.stringify(oldV[k]) : '-'}</span>
                                <span>→</span>
                                <span className="new">{newV && newV[k] !== undefined ? JSON.stringify(newV[k]) : '-'}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>{a.operator}</td>
                      <td style={{ color: a.remark?.includes('部分') || a.remark?.includes('异常') ? '#f56c6c' : '#606266', fontSize: 12 }}>{a.remark || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="timeline-panel">
          <div className="card">
            <h4 style={{ marginBottom: 14 }}>🕐 处理时间线</h4>
            <div className="timeline">
              {timeline.events.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: '#909399' }}>暂无事件</div>}
              {timeline.events.map(ev => (
                <div key={ev.id} className="timeline-item">
                  <div className={`timeline-dot ${ev.event_type}`}></div>
                  <div className="timeline-content">
                    <div className="type">{EVENT_TYPE_LABELS[ev.event_type] || ev.event_type}</div>
                    <div className="detail">{ev.event_detail}</div>
                    <div className="meta">
                      <span>{ev.operator}</span>
                      <span>{ev.created_at}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, fontSize: 12, color: '#909399', paddingTop: 12, borderTop: '1px solid #ebeef5' }}>
              💡 刷新页面后时间线和审计记录仍会保留，所有修改都会留下旧值和操作人
            </div>
          </div>
        </div>
      </div>

      {showEdit && (
        <RecordForm
          mode="edit"
          record={record}
          currentUser={currentUser}
          onClose={() => setShowEdit(false)}
          onSuccess={() => { setShowEdit(false); fetchData(); onRefresh(); }}
        />
      )}

      {showReject && (
        <div className="modal-mask" onClick={(e) => { if (e.target === e.currentTarget) setShowReject(false); }}>
          <div className="modal">
            <h3>↩️ 退回补充</h3>
            <div className="form-group">
              <label>退回原因（护士端可见）</label>
              <textarea value={rejectRemark} onChange={(e) => setRejectRemark(e.target.value)} placeholder="请说明需要补充的内容" />
            </div>
            <div className="form-actions">
              <button className="btn btn-default" onClick={() => setShowReject(false)}>取消</button>
              <button className="btn btn-danger" onClick={() => { doAction('reject', { remark: rejectRemark }); setShowReject(false); setRejectRemark(''); }}>确认退回</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
