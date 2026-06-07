import React from 'react';
import { DisinfectionRecord, STATUS_LABELS, ITEM_TYPE_LABELS, RemarkHistory } from '../../shared/types.js';

function formatTime(ts?: number) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(ts?: number) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('zh-CN');
}

export default function RecordCard({
  record, onViewBaby, onViewDetail, onHandle, onRevert, onAddRemark, canRevert, canHandle
}: {
  record: DisinfectionRecord;
  onViewBaby: (id: string) => void;
  onViewDetail: (id: string) => void;
  onHandle: (record: DisinfectionRecord) => void;
  onRevert: (record: DisinfectionRecord) => void;
  onAddRemark: (record: DisinfectionRecord) => void;
  canRevert: boolean;
  canHandle: boolean;
}) {
  const originalCommitment = record.remarks.find(r => r.source === 'original_commitment');
  const supplements = record.remarks.filter(r => r.source === 'supplement');

  return (
    <div className={`record-card status-${record.status} ${record.isManualEntry ? 'manual-entry' : ''}`}>
      <div className="record-header">
        <div className="record-title">
          {record.babyName} · {ITEM_TYPE_LABELS[record.itemType]} - {record.itemName}
          {record.isManualEntry && <span className="manual-tag">手工补录</span>}
        </div>
        <span className={`status-tag ${record.status}`}>{STATUS_LABELS[record.status]}</span>
      </div>

      <div className="record-meta">
        <div><span className="label">班级：</span>{record.className}</div>
        <div><span className="label">借出：</span>{formatTime(record.borrowTime)}</div>
        <div><span className="label">应还：</span>{formatTime(record.expectedReturnTime)}</div>
        <div><span className="label">归还：</span>{formatTime(record.returnTime)}</div>
        {record.processorName && (
          <div className="processor-info">处理人：{record.processorName} @ {formatTime(record.processTime)}</div>
        )}
      </div>

      {record.abnormalReason && (
        <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 6 }}>
          ⚠️ 异常原因：{record.abnormalReason}
        </div>
      )}
      {record.handleResult && (
        <div style={{ fontSize: 13, color: '#059669', marginBottom: 6 }}>
          ✓ 处理结果：{record.handleResult}
        </div>
      )}

      <div className="remarks-section">
        <div className="remarks-title">
          备注与承诺（共 {record.remarks.length} 条）
          {supplements.length > 0 && (
            <span style={{ marginLeft: 8, color: '#d97706', fontWeight: 400 }}>
              · 含 {supplements.length} 条家长临时改口补录
            </span>
          )}
        </div>
        {record.remarks.length === 0 ? (
          <div style={{ fontSize: 12, color: '#9ca3af' }}>暂无备注</div>
        ) : (
          <div>
            {originalCommitment && (
              <div className="remark-item original">
                <div className="remark-content">
                  <span className="remark-source">最初承诺</span>
                  <div style={{ marginTop: 3 }}>{originalCommitment.content}</div>
                </div>
                <div className="remark-meta">
                  {originalCommitment.operatorName}<br />
                  {formatTime(originalCommitment.timestamp)}
                </div>
              </div>
            )}
            {supplements.slice().reverse().map(r => (
              <div className="remark-item supplement" key={r.id}>
                <div className="remark-content">
                  <span className="remark-source">家长改口补录</span>
                  <div style={{ marginTop: 3 }}>{r.content}</div>
                </div>
                <div className="remark-meta">
                  {r.operatorName}<br />
                  {formatTime(r.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="record-actions">
        <button className="btn btn-sm" onClick={() => onViewBaby(record.babyId)}>宝宝详情</button>
        <button className="btn btn-sm" onClick={() => onViewDetail(record.id)}>完整记录/审计</button>
        <button className="btn btn-sm" onClick={() => onAddRemark(record)}>补录备注</button>
        {canHandle && (
          <button className="btn btn-sm btn-primary" onClick={() => onHandle(record)}>处理异常</button>
        )}
        {canRevert && record.status === 'processed' && (
          <button className="btn btn-sm btn-warn" onClick={() => onRevert(record)}>主管回退</button>
        )}
      </div>
    </div>
  );
}
