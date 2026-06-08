import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchRecord,
  checkIngredients,
  manualOverride,
  updateStatus,
  supplementRecord
} from '../api.js';
import socket from '../socket.js';
import SupplementModal from '../components/SupplementModal.jsx';

const STATUS_CLASS = {
  '待确认': 'status-pending',
  '正常': 'status-normal',
  '异常': 'status-abnormal',
  '人工改判': 'status-manual',
  '厨房备料中': 'status-preparing',
  '已完成': 'status-completed'
};

export default function RecordDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [showSupplement, setShowSupplement] = useState(false);
  const [showOverrideReason, setShowOverrideReason] = useState(false);
  const [overrideRemark, setOverrideRemark] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const data = await fetchRecord(id);
    setRecord(data);
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    const onUpdate = (payload) => {
      if (payload.record && payload.record.id === id) {
        setRecord(payload.record);
      }
    };
    socket.on('records:update', onUpdate);
    return () => socket.off('records:update', onUpdate);
  }, [id]);

  if (!record) return <div className="empty">加载中...</div>;

  const handleCheckIngredients = async () => {
    setLoading(true);
    try { await checkIngredients(id, '李店长'); }
    finally { setLoading(false); }
  };

  const handleManualOverride = async () => {
    setLoading(true);
    try {
      await manualOverride(id, '王店长', overrideRemark || '经人工复核确认无误，改判为正常处理');
      setShowOverrideReason(false);
      setOverrideRemark('');
    } finally { setLoading(false); }
  };

  const handleUpdateStatus = async (status, remark) => {
    setLoading(true);
    try { await updateStatus(id, status, '服务员小刘', remark); }
    finally { setLoading(false); }
  };

  const handleSupplement = async (supplementData) => {
    setLoading(true);
    try {
      await supplementRecord(id, '张服务员', supplementData);
      setShowSupplement(false);
    } finally { setLoading(false); }
  };

  const hasDiff = record.isSupplemented && record.originalData;

  return (
    <div>
      <button className="back-btn" onClick={() => navigate('/')}>
        ← 返回列表
      </button>

      <div className="detail-section">
        <div className="record-header">
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600 }}>
              {record.childName}
              {record.isSupplemented && <span className="supplement-badge">已补录</span>}
              {record.isBadData && <span className="supplement-badge" style={{ background: '#fee2e2', color: '#991b1b' }}>坏数据已隔离</span>}
            </h2>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              {record.tableNo} · {record.age}岁 · 家长：{record.parentName}
            </div>
          </div>
          <span className={`status-badge ${STATUS_CLASS[record.status] || ''}`} style={{ fontSize: 14 }}>
            {record.status}
          </span>
        </div>
      </div>

      {record.isBadData && (
        <div className="detail-section">
          <div className="discrepancy-info">
            <strong>隔离原因：</strong>{record.badDataReason}
          </div>
          <div className="note-warn">
            此记录为坏数据，已被隔离，不会出现在正常列表、导出和统计中
          </div>
        </div>
      )}

      {!record.isBadData && (
        <>
          <div className="detail-section">
            <h3>过敏与禁忌</h3>
            <div className="info-row">
              <span className="info-label">过敏食物</span>
              <span className="info-value">
                {record.allergies.length > 0
                  ? record.allergies.map((a, i) => <span key={i} className="tag tag-allergy" style={{ marginRight: 6 }}>{a}</span>)
                  : '无'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">饮食禁忌</span>
              <span className="info-value">
                {record.taboos.length > 0
                  ? record.taboos.map((t, i) => <span key={i} className="tag tag-taboo" style={{ marginRight: 6 }}>{t}</span>)
                  : '无'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">特别说明</span>
              <span className="info-value">{record.specialNote || '无'}</span>
            </div>
            {record.supplementNote && (
              <div className="info-row">
                <span className="info-label">补录备注</span>
                <span className="info-value">
                  <span className="tag tag-supplement">{record.supplementNote}</span>
                </span>
              </div>
            )}
          </div>

          {hasDiff && (
            <div className="detail-section">
              <h3>补录前后差异</h3>
              <div className="diff-block">
                <div className="diff-row">
                  <span className="diff-label">过敏食物：</span>
                  <span>
                    {record.originalData.allergies.map((a, i) => <span key={`o${i}`} className="diff-old">{a}</span>)}
                    →
                    {record.allergies.map((a, i) => <span key={`n${i}`} className="diff-new" style={{ marginLeft: 4 }}>{a}</span>)}
                  </span>
                </div>
                <div className="diff-row">
                  <span className="diff-label">饮食禁忌：</span>
                  <span>
                    {record.originalData.taboos.map((t, i) => <span key={`o${i}`} className="diff-old">{t}</span>)}
                    →
                    {record.taboos.map((t, i) => <span key={`n${i}`} className="diff-new" style={{ marginLeft: 4 }}>{t}</span>)}
                  </span>
                </div>
                <div className="diff-row">
                  <span className="diff-label">特别说明：</span>
                  <span>
                    <span className="diff-old">{record.originalData.specialNote || '(空)'}</span>
                    →
                    <span className="diff-new" style={{ marginLeft: 4 }}>{record.specialNote || '(空)'}</span>
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
                  补录时间：{new Date(record.supplementedAt).toLocaleString('zh-CN')} · 补录人：{record.supplementedBy}
                </div>
              </div>
            </div>
          )}

          <div className="detail-section">
            <h3>三日食材表</h3>
            {record.threeDayIngredients.map((day, idx) => (
              <div
                key={idx}
                className={`ingredient-day ${day.hasConflict ? 'conflict' : ''} ${day.checked ? 'checked' : ''}`}
              >
                <div className="day-title">
                  <span>第{idx + 1}天 · {day.date}</span>
                  <span style={{ fontSize: 12, color: day.checked ? '#059669' : '#9ca3af' }}>
                    {day.checked ? '✓ 已核对' : '○ 待核对'}
                  </span>
                </div>
                {day.items.length === 0 ? (
                  <div style={{ color: '#dc2626', fontSize: 13 }}>⚠ 材料缺页：当日食材清单为空</div>
                ) : (
                  <div className="ingredient-items">
                    {day.items.map((item, i) => (
                      <span
                        key={i}
                        className={`ingredient-item ${day.hasConflict && record.allergies.some(a => item.includes(a)) ? 'conflict' : ''}`}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                )}
                {day.conflictNote && <div className="conflict-note">⚠ {day.conflictNote}</div>}
              </div>
            ))}

            <div className="btn-group" style={{ marginTop: 12 }}>
              <button className="btn btn-primary" onClick={handleCheckIngredients} disabled={loading}>
                {loading ? '处理中...' : '店长确认三日食材表'}
              </button>
              {record.status === '异常' && (
                <button className="btn btn-warning" onClick={() => setShowOverrideReason(true)}>
                  人工改判
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setShowSupplement(true)}>
                手工补录信息
              </button>
            </div>
          </div>

          {record.issues && record.issues.length > 0 && (
            <div className="detail-section">
              <h3>问题详情</h3>
              {record.issues.map((issue, i) => (
                <div key={i} className="issue-item">
                  <div className="issue-type">{issue.type}</div>
                  <div className="issue-detail">{issue.detail}</div>
                </div>
              ))}
            </div>
          )}

          {record.exportAudit && (
            <div className="detail-section">
              <h3>导出审核信息</h3>
              <div className="info-row">
                <span className="info-label">导出时间</span>
                <span className="info-value">{new Date(record.exportAudit.exportedAt).toLocaleString('zh-CN')}</span>
              </div>
              <div className="info-row">
                <span className="info-label">页面条数</span>
                <span className="info-value">{record.exportAudit.pageCount} 条</span>
              </div>
              <div className="info-row">
                <span className="info-label">实际导出</span>
                <span className="info-value">{record.exportAudit.exportedItems} 条</span>
              </div>
              {record.exportAudit.hasDiscrepancy && (
                <div className="discrepancy-info" style={{ marginTop: 8 }}>
                  <strong>导出不一致原因：</strong>{record.exportAudit.discrepancyReason}
                </div>
              )}
            </div>
          )}

          <div className="detail-section">
            <h3>现场操作（手机端）</h3>
            <div className="btn-group">
              {record.status === '正常' && (
                <button className="btn btn-success" onClick={() => handleUpdateStatus('厨房备料中', '服务员手机端点击开始备料')} disabled={loading}>
                  开始备料
                </button>
              )}
              {record.status === '厨房备料中' && (
                <button className="btn btn-primary" onClick={() => handleUpdateStatus('已完成', '厨房完成备料并出餐')} disabled={loading}>
                  出餐完成
                </button>
              )}
              {record.status === '待确认' && (
                <button className="btn btn-warning" onClick={handleCheckIngredients} disabled={loading}>
                  确认食材
                </button>
              )}
            </div>
            <div className="note-warn" style={{ marginTop: 12 }}>
              服务员在手机端操作后，厨房和后场屏幕上的状态会实时同步更新
            </div>
          </div>
        </>
      )}

      <div className="detail-section">
        <h3>状态变更历史</h3>
        {record.statusHistory.map((h, i) => (
          <div key={i} className="history-item">
            <div className="history-time">{new Date(h.time).toLocaleString('zh-CN')}</div>
            <div className="history-status">
              {h.status}
              {h.supplemented && <span className="supplement-badge">补录</span>}
            </div>
            <div className="history-remark">{h.operator} · {h.remark}</div>
          </div>
        ))}
      </div>

      {showSupplement && (
        <SupplementModal
          record={record}
          onClose={() => setShowSupplement(false)}
          onSubmit={handleSupplement}
        />
      )}

      {showOverrideReason && (
        <div className="modal-backdrop" onClick={() => setShowOverrideReason(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>人工改判确认</h2>
            <div className="form-group">
              <label>改判说明</label>
              <textarea
                className="form-textarea"
                value={overrideRemark}
                onChange={e => setOverrideRemark(e.target.value)}
                placeholder="请填写改判原因，例如：经与家长二次确认，食材可正常食用"
              />
            </div>
            <div className="btn-group">
              <button className="btn btn-secondary" onClick={() => setShowOverrideReason(false)}>取消</button>
              <button className="btn btn-warning" onClick={handleManualOverride} disabled={loading}>
                确认改判
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
