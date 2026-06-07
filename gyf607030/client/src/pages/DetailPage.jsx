import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

const STATUS_OPTIONS = [
  { value: 'pending', label: '待对账', desc: '等待处理' },
  { value: 'matched', label: '已核对', desc: '两源一致' },
  { value: 'mismatched', label: '不一致', desc: '群留言与纸质单不符' },
  { value: 'missing_material', label: '材料缺页', desc: '交接单不完整' },
  { value: 'bad_data', label: '坏数据', desc: '异常数据隔离' }
];

const STATUS_LABELS = {
  pending: '待对账',
  matched: '已核对',
  mismatched: '不一致',
  missing_material: '材料缺页',
  bad_data: '坏数据'
};

export default function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [notes, setNotes] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [reviewStatus, setReviewStatus] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [reviewPromise, setReviewPromise] = useState('');

  const [newNote, setNewNote] = useState('');
  const [isParentCorrection, setIsParentCorrection] = useState(false);

  const [badDataReason, setBadDataReason] = useState('');
  const [exportReason, setExportReason] = useState('');

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const detailRes = await fetch(`/api/records/${id}`);
      if (!detailRes.ok) throw new Error('记录不存在');
      const detailData = await detailRes.json();
      setRecord(detailData.record);
      setHistory(detailData.history);
      setNotes(detailData.notes);
      setReviewStatus(detailData.record.status);
      setReviewPromise(detailData.record.original_promise || '');

      const usersRes = await fetch('/api/users');
      const usersData = await usersRes.json();
      setUsers(usersData.users);
      setCurrentUserId(usersData.currentUserId);
    } catch (e) {
      alert(e.message);
      navigate('/');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleReview = async () => {
    if (!reviewStatus) {
      alert('请选择对账状态');
      return;
    }
    if (reviewStatus === record.status && !reviewNote && !reviewPromise) {
      alert('状态未变更，请填写备注或修改承诺');
      return;
    }
    const body = { status: reviewStatus, change_note: reviewNote };
    if (reviewPromise && reviewPromise !== record.original_promise) {
      body.new_promise = reviewPromise;
    }
    const res = await fetch(`/api/records/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      alert('复核已保存');
      setReviewNote('');
      fetchDetail();
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      alert('请填写备注内容');
      return;
    }
    const res = await fetch(`/api/records/${id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: newNote,
        is_parent_correction: isParentCorrection
      })
    });
    if (res.ok) {
      setNewNote('');
      setIsParentCorrection(false);
      fetchDetail();
    }
  };

  const handleFlagBad = async () => {
    if (!badDataReason.trim()) {
      alert('请填写坏数据原因');
      return;
    }
    const res = await fetch(`/api/records/${id}/flag-bad`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bad_data_reason: badDataReason.trim(),
        export_count_reason: exportReason.trim() || null
      })
    });
    if (res.ok) {
      alert('已标记为坏数据');
      setBadDataReason('');
      setExportReason('');
      fetchDetail();
    }
  };

  const handleUnflagBad = async () => {
    if (!confirm('确定要恢复该记录为正常数据吗？')) return;
    const res = await fetch(`/api/records/${id}/unflag-bad`, {
      method: 'PUT'
    });
    if (res.ok) {
      alert('已恢复为正常数据');
      fetchDetail();
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }
  if (!record) return null;

  const currentUser = users.find(u => u.id === currentUserId);

  return (
    <>
      <Link to="/" className="back-link">← 返回列表</Link>

      <div className="page-title-row">
        <h2>
          {record.baby_name} 的奶量对账记录
          <span style={{ marginLeft: 12 }} className={`status-tag status-${record.status}`}>
            {record.status_label}
          </span>
          {record.is_bad_data ? (
            <span style={{ marginLeft: 8 }} className="status-tag status-bad_data">
              坏数据隔离
            </span>
          ) : null}
        </h2>
        <div>
          {currentUser && (
            <span style={{ color: '#86909c', fontSize: 13, marginRight: 16 }}>
              当前处理人：<strong style={{ color: '#1f2329' }}>{currentUser.name}</strong>
              ({currentUser.role === 'consultant' ? '顾问' : '门岗'})
            </span>
          )}
        </div>
      </div>

      <div className="detail-page">
        <div className="detail-main">
          <div className="card">
            <div className="card-header">
              <h3>基础信息</h3>
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">幼儿姓名</span>
                  <span className="value">{record.baby_name}</span>
                </div>
                <div className="info-item">
                  <span className="label">家长姓名</span>
                  <span className="value">{record.parent_name}</span>
                </div>
                <div className="info-item">
                  <span className="label">联系电话</span>
                  <span className="value">{record.parent_phone || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="label">所在班级</span>
                  <span className="value">{record.class_name || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="label">记录日期</span>
                  <span className="value">{record.record_date}</span>
                </div>
                <div className="info-item">
                  <span className="label">当前状态</span>
                  <span className="value">
                    <span className={`status-tag status-${record.status}`}>
                      {record.status_label}
                    </span>
                  </span>
                </div>
              </div>

              <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid #f2f3f5' }}>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">家长群留言奶量</span>
                    <span className="value" style={{ color: record.source_chat_amount === null ? '#86909c' : '#1f2329' }}>
                      {record.source_chat_amount !== null ? `${record.source_chat_amount} ml` : '未填写'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">纸质交接单奶量</span>
                    <span className="value" style={{ color: record.source_paper_amount === null ? '#86909c' : '#1f2329' }}>
                      {record.source_paper_amount !== null ? `${record.source_paper_amount} ml` : '未填写'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">两源差异</span>
                    <span className="value">
                      {record.discrepancy !== null ? (
                        <span className={
                          record.discrepancy > 0 ? 'discrepancy-pos' :
                          record.discrepancy < 0 ? 'discrepancy-neg' : 'discrepancy-zero'
                        }>
                          {record.discrepancy > 0 ? '多 ' : record.discrepancy < 0 ? '少 ' : ''}
                          {Math.abs(record.discrepancy)} ml
                        </span>
                      ) : '-'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">原始承诺（保留不被覆盖）</span>
                    <span className="value">{record.original_promise || '-'}</span>
                  </div>
                </div>
              </div>

              {record.is_bad_data && (
                <div className="warn-box danger">
                  <div className="warn-title">⚠️ 坏数据标记</div>
                  <div className="warn-content">{record.bad_data_reason || '未说明原因'}</div>
                </div>
              )}

              {record.material_pages_expected && record.material_pages < record.material_pages_expected && (
                <div className="warn-box">
                  <div className="warn-title">📄 材料缺页</div>
                  <div className="warn-content">
                    实际 {record.material_pages} 页 / 应有 {record.material_pages_expected} 页，
                    缺少 {record.material_pages_expected - record.material_pages} 页
                  </div>
                </div>
              )}

              {record.export_count_mismatch && (
                <div className="warn-box info">
                  <div className="warn-title">📊 导出数量与页面不一致</div>
                  <div className="warn-content">{record.export_count_reason || '未说明原因'}</div>
                </div>
              )}

              {record.reconciliation_note && !record.is_bad_data && (
                <div className="warn-box info">
                  <div className="warn-title">💬 对账备注</div>
                  <div className="warn-content">{record.reconciliation_note}</div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>状态变更历史</h3>
            </div>
            <div className="card-body">
              {history.length === 0 ? (
                <div className="empty-state">暂无变更记录</div>
              ) : (
                <div className="history-list">
                  {history.map(h => (
                    <div key={h.id} className={`history-item ${h.new_promise ? 'promise-change' : 'status-change'}`}>
                      <div className="history-meta">
                        <span>{h.changed_at}</span>
                        <span>{h.changed_by_name}</span>
                        {h.new_promise && h.old_promise !== h.new_promise && (
                          <span className="tag">承诺变更</span>
                        )}
                      </div>
                      <div className="history-content">
                        状态：
                        <span className="status-tag status-pending">{STATUS_LABELS[h.old_status] || '初始'}</span>
                        →
                        <span className={`status-tag status-${h.new_status}`}>{STATUS_LABELS[h.new_status]}</span>
                        {h.change_note && <div style={{ marginTop: 6 }}>说明：{h.change_note}</div>}
                        {h.new_promise && h.old_promise !== h.new_promise && (
                          <div style={{ marginTop: 6 }}>
                            <span className="promise-old">{h.old_promise}</span>
                            {' → '}
                            <span className="promise-new">{h.new_promise}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>备注记录</h3>
            </div>
            <div className="card-body">
              {notes.length === 0 ? (
                <div className="empty-state">暂无备注</div>
              ) : (
                <div className="notes-list">
                  {notes.map(n => (
                    <div key={n.id} className={`note-item ${n.is_parent_correction ? 'parent-correction' : ''}`}>
                      <div className="note-meta">
                        <span>{n.created_at}</span>
                        <span>{n.author_name}</span>
                        {n.is_parent_correction && (
                          <span className="tag parent-tag">家长改口</span>
                        )}
                      </div>
                      <div className="note-content">{n.content}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="note-input-area">
                <div className="section-title" style={{ fontWeight: 600, fontSize: 13, color: '#4e5969' }}>
                  添加备注
                </div>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="输入备注内容..."
                />
                <label className="checkbox-inline" style={{ alignSelf: 'flex-start' }}>
                  <input
                    type="checkbox"
                    checked={isParentCorrection}
                    onChange={(e) => setIsParentCorrection(e.target.checked)}
                  />
                  这是家长临时改口的记录
                </label>
                <div className="form-actions">
                  <button className="btn btn-primary" onClick={handleAddNote}>保存备注</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="detail-side">
          <div className="card">
            <div className="card-header">
              <h3>复核面板</h3>
            </div>
            <div className="card-body">
              <div className="review-panel">
                <div>
                  <div className="section-title">对账状态</div>
                  <div className="status-options">
                    {STATUS_OPTIONS.map(opt => (
                      <div
                        key={opt.value}
                        className={`status-option status-${opt.value} ${reviewStatus === opt.value ? 'selected' : ''}`}
                        onClick={() => setReviewStatus(opt.value)}
                      >
                        <div style={{ fontWeight: 500 }}>{opt.label}</div>
                        <div style={{ fontSize: 11, marginTop: 2, opacity: 0.7 }}>{opt.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="section-title">修改承诺奶量（可选，原承诺会保留在历史中）</div>
                  <input
                    type="text"
                    value={reviewPromise}
                    onChange={(e) => setReviewPromise(e.target.value)}
                    placeholder="如：每日3次，每次180ml"
                  />
                </div>

                <div>
                  <div className="section-title">复核说明</div>
                  <textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="说明对账结论、不一致原因、处理措施等..."
                  />
                </div>

                <div className="form-actions">
                  <button className="btn btn-primary" onClick={handleReview}>保存复核结果</button>
                </div>
              </div>
            </div>
          </div>

          {!record.is_bad_data ? (
            <div className="card">
              <div className="card-header">
                <h3>坏数据管理</h3>
              </div>
              <div className="card-body">
                <div className="review-panel">
                  <div>
                    <div className="section-title">标记为坏数据（将与正常记录隔离）</div>
                    <input
                      type="text"
                      value={badDataReason}
                      onChange={(e) => setBadDataReason(e.target.value)}
                      placeholder="坏数据原因（必填）"
                      style={{ marginBottom: 8 }}
                    />
                    <input
                      type="text"
                      value={exportReason}
                      onChange={(e) => setExportReason(e.target.value)}
                      placeholder="导出数量不一致说明（可选）"
                    />
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-danger" onClick={handleFlagBad}>标记为坏数据</button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <h3>坏数据恢复</h3>
              </div>
              <div className="card-body">
                <p style={{ fontSize: 13, color: '#4e5969', marginBottom: 12 }}>
                  该记录已被标记为坏数据。若确认数据无误，可恢复为正常记录重新对账。
                </p>
                <div className="form-actions">
                  <button className="btn btn-warning" onClick={handleUnflagBad}>恢复为正常数据</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
