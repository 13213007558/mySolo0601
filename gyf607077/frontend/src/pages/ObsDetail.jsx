import React, { useEffect, useState } from 'react';
import { api, downloadExport } from '../api';

export default function ObsDetail({ id, user, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('timeline');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [comment, setComment] = useState('');
  const [notice, setNotice] = useState(null);
  const [rollbackStatus, setRollbackStatus] = useState('');
  const [rollbackReason, setRollbackReason] = useState('');
  const [showRollback, setShowRollback] = useState(false);

  const canAudit = user.permissions.includes('audit:view');
  const isElder = user.role === 'elder';

  async function reload() {
    setLoading(true);
    try {
      const d = await api.getObs(id);
      setData(d);
      setForm(d.observation);
    } catch (e) {
      setNotice({ type: 'error', msg: e.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, [id]);

  if (loading || !data) return <div className="empty">加载中...</div>;

  const obs = data.observation;
  const canEdit = (obs.created_by === user.id && user.permissions.includes('update:own')) || user.permissions.includes('update:all');
  const canSubmit = obs.status === 'draft' || obs.status === 'returned';
  const canReturn = obs.status === 'submitted' && (user.role === 'supervisor' || user.role === 'parent');
  const canArchive = (obs.status === 'submitted' || obs.status === 'returned') && (user.role === 'supervisor' || user.role === 'parent');

  async function saveEdit() {
    try {
      await api.updateObs(id, form);
      setEditing(false);
      setNotice({ type: 'success', msg: '保存成功' });
      reload();
    } catch (e) {
      setNotice({ type: 'error', msg: e.message });
    }
  }

  async function doAction(action) {
    try {
      if (action === 'submit') await api.submitObs(id, comment);
      if (action === 'return') await api.returnObs(id, comment);
      if (action === 'archive') await api.archiveObs(id, comment);
      setComment('');
      setNotice({ type: 'success', msg: '操作成功' });
      reload();
    } catch (e) {
      setNotice({ type: 'error', msg: e.message });
    }
  }

  async function doRollback() {
    if (!rollbackStatus) return;
    try {
      await api.rollbackObs(id, rollbackStatus, '状态回退', rollbackReason || '管理员操作');
      setShowRollback(false);
      setRollbackStatus('');
      setRollbackReason('');
      setNotice({ type: 'success', msg: '状态回退成功,审计日志已记录' });
      reload();
    } catch (e) {
      setNotice({ type: 'error', msg: e.message });
    }
  }

  return (
    <div>
      {notice && (
        <div className={'notice notice-' + notice.type}>
          {notice.msg}
          <button style={{ float: 'right', border: 'none', background: 'transparent', cursor: 'pointer' }} onClick={() => setNotice(null)}>✕</button>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <button className="btn" onClick={onBack}>← 返回列表</button>
        {canAudit && (
          <button className="btn" style={{ marginLeft: 8, float: 'right' }} onClick={() => downloadExport('/export/observations/' + id + '/timeline')}>导出时间线</button>
        )}
      </div>

      <div className="detail-panel">
        <h3>
          睡眠记录 #{obs.id} - {obs.baby_name} {obs.sleep_date}
          <span className={'status-tag status-' + obs.status} style={{ marginLeft: 12 }}>{obs.status_label}</span>
          {!isElder && <span style={{ marginLeft: 12, fontSize: 12, color: '#999' }}>版本 v{obs.version} · 录入人 {obs.creator_name}</span>}
        </h3>

        {!editing ? (
          <div className="detail-grid">
            <div className="detail-item"><label>宝宝姓名</label><div className="value">{obs.baby_name}</div></div>
            <div className="detail-item"><label>睡眠日期</label><div className="value">{obs.sleep_date}</div></div>
            <div className="detail-item"><label>开始时间</label><div className="value">{obs.start_time}</div></div>
            <div className="detail-item"><label>结束时间</label><div className="value">{obs.end_time || '-'}</div></div>
            {!isElder && (
              <>
                <div className="detail-item"><label>睡眠质量</label><div className="value">{obs.sleep_quality === 'good' ? '良好' : obs.sleep_quality === 'poor' ? '较差' : obs.sleep_quality === 'normal' ? '一般' : '-'}</div></div>
                <div className="detail-item"><label>环境</label><div className="value">{obs.environment || '-'}</div></div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}><label>备注</label><div className="value">{obs.notes || '-'}</div></div>
              </>
            )}
          </div>
        ) : (
          <div>
            <div className="form-row">
              <div><label>宝宝姓名</label><input value={form.baby_name || ''} onChange={(e) => setForm({ ...form, baby_name: e.target.value })} /></div>
              <div><label>睡眠日期</label><input type="date" value={form.sleep_date || ''} onChange={(e) => setForm({ ...form, sleep_date: e.target.value })} /></div>
              <div><label>开始时间</label><input type="time" value={form.start_time || ''} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div>
              <div><label>结束时间</label><input type="time" value={form.end_time || ''} onChange={(e) => setForm({ ...form, end_time: e.target.value })} /></div>
            </div>
            <div className="form-row">
              <div><label>睡眠质量</label>
                <select value={form.sleep_quality || ''} onChange={(e) => setForm({ ...form, sleep_quality: e.target.value })}>
                  <option value="">请选择</option>
                  <option value="good">良好</option>
                  <option value="normal">一般</option>
                  <option value="poor">较差</option>
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}><label>环境</label><input value={form.environment || ''} onChange={(e) => setForm({ ...form, environment: e.target.value })} placeholder="如:卧室安静,温度26度" /></div>
            </div>
            <div className="form-row">
              <div style={{ gridColumn: '1 / -1' }}><label>备注</label><textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <div className="btn-group">
              <button className="btn btn-primary" onClick={saveEdit}>保存</button>
              <button className="btn" onClick={() => { setEditing(false); setForm(obs); }}>取消</button>
            </div>
          </div>
        )}

        {!isElder && !editing && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #f0f0f0' }}>
            <div className="btn-group">
              {canEdit && obs.status !== 'archived' && <button className="btn" onClick={() => setEditing(true)}>编辑</button>}
              {canSubmit && <button className="btn btn-primary" onClick={() => doAction('submit')}>提交复核</button>}
              {canReturn && <button className="btn btn-warn" onClick={() => { if (prompt('退回原因(可选)', '') !== null) { setComment(prompt() || '请补充材料'); doAction('return'); } }}>退回补充</button>}
              {canArchive && <button className="btn btn-success" onClick={() => doAction('archive')}>关闭归档</button>}
              {canAudit && <button className="btn btn-danger" onClick={() => setShowRollback(true)}>状态回退(审计)</button>}
            </div>

            {showRollback && (
              <div style={{ marginTop: 16, padding: 16, background: '#fff7e6', borderRadius: 6, border: '1px solid #ffd591' }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>⚠️ 状态回退将记录到审计日志</div>
                <div className="form-row" style={{ marginBottom: 12 }}>
                  <div>
                    <label>目标状态</label>
                    <select value={rollbackStatus} onChange={(e) => setRollbackStatus(e.target.value)}>
                      <option value="">请选择</option>
                      {obs.status === 'submitted' && <option value="draft">草稿</option>}
                      {obs.status === 'returned' && (<><option value="draft">草稿</option><option value="submitted">已提交</option></>)}
                      {obs.status === 'archived' && (<><option value="draft">草稿</option><option value="submitted">已提交</option><option value="returned">已退回</option></>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label>回退原因(审计记录)</label>
                    <input value={rollbackReason} onChange={(e) => setRollbackReason(e.target.value)} placeholder="主管复查说明" />
                  </div>
                </div>
                <div className="btn-group">
                  <button className="btn btn-danger" onClick={doRollback}>确认回退</button>
                  <button className="btn" onClick={() => setShowRollback(false)}>取消</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="detail-panel">
        <div className="tabs">
          <div className={'tab ' + (tab === 'timeline' ? 'active' : '')} onClick={() => setTab('timeline')}>🕒 时间线 / 留痕</div>
          {canAudit && data.audits && (
            <div className={'tab ' + (tab === 'audit' ? 'active' : '')} onClick={() => setTab('audit')}>
              🔍 审计日志 ({data.audits.length})
            </div>
          )}
        </div>

        {tab === 'timeline' && (
          <div className="timeline">
            {data.timeline.map(t => (
              <div key={t.id} className={'timeline-item ' + t.action}>
                <div className="t-head">{t.created_at} · {t.actor_name}{t.actor_role_label ? '(' + t.actor_role_label + ')' : ''}</div>
                <div className="t-title">
                  {t.action_label || t.action}
                  {t.from_status && t.to_status && t.from_status !== t.to_status && (
                    <span style={{ fontSize: 12, color: '#888', marginLeft: 8, fontWeight: 400 }}>
                      {t.from_status} → {t.to_status}
                    </span>
                  )}
                </div>
                {t.comment && <div className="t-body">💬 {t.comment}</div>}
                {t.fields_changed && t.fields_changed.length > 0 && (
                  <div className="t-body">📝 修改字段: {t.fields_changed.join(', ')}</div>
                )}
                {t.metadata && t.metadata.success && (
                  <div className="t-body">✅ 部分成功: {t.metadata.success.length} 条成功, {t.metadata.failed.length} 条失败</div>
                )}
                {t.metadata && t.metadata.reason && (
                  <div className="t-body">📋 原因: {t.metadata.reason}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'audit' && data.audits && (
          <div className="audit-list">
            {data.audits.length === 0 ? <div className="empty">暂无审计记录</div> :
              data.audits.map(a => (
                <div key={a.id} className="audit-item">
                  <div className="a-head">{a.created_at} · {a.user_name}({a.user_role}) {a.ip ? '· IP:' + a.ip : ''}</div>
                  <div className="a-action">{a.action}</div>
                  {a.old_value && <pre>← {JSON.stringify(a.old_value, null, 0)}</pre>}
                  {a.new_value && <pre>→ {JSON.stringify(a.new_value, null, 0)}</pre>}
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}
