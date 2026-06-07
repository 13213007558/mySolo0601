import React, { useState, useEffect } from 'react';
import RecordCard from '../components/RecordCard.jsx';
import Modal from '../components/Modal.jsx';
import {
  fetchClassSummary, handleRecord, revertRecord, addRemark, downloadExport, getContext
} from '../api.js';
import { DisinfectionRecord, Baby, RecordStatus, STATUS_LABELS } from '../../shared/types.js';

type Page = { name: 'wall' } | { name: 'class'; className: string } | { name: 'baby'; babyId: string };

export default function ClassPage({
  className, onNavigate, showToast
}: {
  className: string;
  onNavigate: (p: Page) => void;
  showToast: (t: 'success' | 'error' | 'warn', m: string) => void;
}) {
  const [classData, setClassData] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showHandleModal, setShowHandleModal] = useState<DisinfectionRecord | null>(null);
  const [showRemarkModal, setShowRemarkModal] = useState<DisinfectionRecord | null>(null);
  const [showRevertModal, setShowRevertModal] = useState<DisinfectionRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const ctx = getContext();
  const canHandle = ctx.role === 'consultant' || ctx.role === 'supervisor' || ctx.role === 'admin';
  const canRevert = ctx.role === 'supervisor' || ctx.role === 'admin';

  async function loadData() {
    setLoading(true);
    const res = await fetchClassSummary();
    if (res.success) {
      const found = (res.data as any[]).find(c => c.className === className);
      setClassData(found || null);
    }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [className]);

  if (!classData) return <div className="empty-state">班级不存在</div>;

  const records: DisinfectionRecord[] = statusFilter === 'all'
    ? classData.records
    : classData.records.filter((r: DisinfectionRecord) => r.status === statusFilter);
  const babies: Baby[] = classData.babies;

  async function doHandle(record: DisinfectionRecord, data: any) {
    const res = await handleRecord(record.id, data);
    if (res.success) {
      showToast('success', '处理成功，宝宝详情和后台已同步');
      setShowHandleModal(null);
      loadData();
    } else {
      showToast('error', res.error || '处理失败');
    }
  }
  async function doRevert(record: DisinfectionRecord, reason: string) {
    const res = await revertRecord(record.id, reason);
    if (res.success) {
      showToast('success', '状态已回退，审计保留');
      setShowRevertModal(null);
      loadData();
    } else {
      showToast('error', res.error || '回退失败');
    }
  }
  async function doAddRemark(record: DisinfectionRecord, content: string) {
    const res = await addRemark(record.id, content);
    if (res.success) {
      showToast('success', '备注已添加');
      setShowRemarkModal(null);
      loadData();
    } else {
      showToast('error', res.error || '添加失败');
    }
  }

  return (
    <div>
      <div className="page-header">
        <span className="back-link" onClick={() => onNavigate({ name: 'wall' })}>← 返回提醒墙</span>
        <h2 style={{ fontSize: 18 }}>{className} · 班级页面</h2>
      </div>

      <div className="panel">
        <div className="panel-title">
          <span>班级状态概览</span>
          <button className="btn btn-sm btn-success" onClick={() => downloadExport()}>导出清单</button>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {Object.entries(classData.statusCount).map(([k, v]) => (
            <div key={k} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: k === 'abnormal' ? '#ef4444' : k === 'processed' ? '#10b981' : '#667eea' }}>
                {v as number}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{STATUS_LABELS[k as RecordStatus]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">班级宝宝名单（{babies.length}）</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {babies.map((b: Baby) => (
            <div
              key={b.id}
              style={{
                padding: '8px 14px', background: '#f0f9ff', border: '1px solid #bae6fd',
                borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#0369a1'
              }}
              onClick={() => onNavigate({ name: 'baby', babyId: b.id })}
            >
              👶 {b.name}
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                家长：{b.guardianName} · {b.guardianPhone}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="toolbar">
        <select className="filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">全部状态</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: '#6b7280', alignSelf: 'center' }}>共 {records.length} 条记录</span>
      </div>

      {loading ? (
        <div className="empty-state">加载中...</div>
      ) : records.length === 0 ? (
        <div className="empty-state">该班级暂无记录</div>
      ) : (
        records.map(r => (
          <RecordCard
            key={r.id}
            record={r}
            onViewBaby={id => onNavigate({ name: 'baby', babyId: id })}
            onViewDetail={() => onNavigate({ name: 'baby', babyId: r.babyId })}
            onHandle={setShowHandleModal}
            onRevert={setShowRevertModal}
            onAddRemark={setShowRemarkModal}
            canRevert={canRevert}
            canHandle={canHandle}
          />
        ))
      )}

      {showHandleModal && (
        <HandleModal record={showHandleModal} onClose={() => setShowHandleModal(null)} onSubmit={data => doHandle(showHandleModal, data)} />
      )}
      {showRemarkModal && (
        <RemarkModal record={showRemarkModal} onClose={() => setShowRemarkModal(null)} onSubmit={c => doAddRemark(showRemarkModal, c)} />
      )}
      {showRevertModal && (
        <RevertModal record={showRevertModal} onClose={() => setShowRevertModal(null)} onSubmit={r => doRevert(showRevertModal, r)} />
      )}
    </div>
  );
}

function HandleModal({ record, onClose, onSubmit }: {
  record: DisinfectionRecord;
  onClose: () => void;
  onSubmit: (data: { status: RecordStatus; handleResult: string; supplementRemark?: string }) => void;
}) {
  const [status, setStatus] = useState<RecordStatus>('processed');
  const [handleResult, setHandleResult] = useState('');
  const [supplementRemark, setSupplementRemark] = useState('');
  const allowed: RecordStatus[] = (() => {
    switch (record.status) {
      case 'pending': return ['abnormal', 'processing'];
      case 'abnormal': return ['processing', 'processed', 'reverted'];
      case 'processing': return ['processed', 'reverted', 'abnormal'];
      case 'processed': return ['reverted'];
      case 'reverted': return ['processing', 'abnormal'];
    }
  })();
  return (
    <Modal title="处理异常记录" onClose={onClose} footer={
      <>
        <button className="btn" onClick={onClose}>取消</button>
        <button className="btn btn-primary" onClick={() => onSubmit({ status, handleResult, supplementRemark: supplementRemark || undefined })}>确认处理</button>
      </>
    }>
      <div className="form-group">
        <label className="form-required">处理后状态</label>
        <select value={status} onChange={e => setStatus(e.target.value as RecordStatus)}>
          {allowed.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-required">处理结果</label>
        <textarea value={handleResult} onChange={e => setHandleResult(e.target.value)} />
      </div>
      <div className="form-group">
        <label>家长临时改口备注（可选）</label>
        <textarea value={supplementRemark} onChange={e => setSupplementRemark(e.target.value)} />
      </div>
    </Modal>
  );
}

function RemarkModal({ record, onClose, onSubmit }: {
  record: DisinfectionRecord;
  onClose: () => void;
  onSubmit: (content: string) => void;
}) {
  const [content, setContent] = useState('');
  const original = record.remarks.find(r => r.source === 'original_commitment');
  return (
    <Modal title="补充备注（家长临时改口）" onClose={onClose} footer={
      <>
        <button className="btn" onClick={onClose}>取消</button>
        <button className="btn btn-primary" disabled={!content.trim()} onClick={() => onSubmit(content.trim())}>保存备注</button>
      </>
    }>
      {original && (
        <div className="form-group">
          <label>最初承诺（不会被修改）</label>
          <div style={{ padding: 10, background: '#eef2ff', borderRadius: 6, fontSize: 13, color: '#3730a3' }}>
            {original.content}
          </div>
        </div>
      )}
      <div className="form-group">
        <label className="form-required">补充备注内容</label>
        <textarea value={content} onChange={e => setContent(e.target.value)} />
      </div>
    </Modal>
  );
}

function RevertModal({ record, onClose, onSubmit }: {
  record: DisinfectionRecord;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <Modal title="主管状态回退" onClose={onClose} footer={
      <>
        <button className="btn" onClick={onClose}>取消</button>
        <button className="btn btn-warn" onClick={() => onSubmit(reason)}>确认回退</button>
      </>
    }>
      <div style={{ padding: 10, background: '#fef3c7', borderRadius: 6, fontSize: 13, color: '#92400e', marginBottom: 14 }}>
        ⚠️ 回退后完整审计日志保留，不会丢失任何操作痕迹
      </div>
      <div className="form-group">
        <label>回退原因</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)} />
      </div>
    </Modal>
  );
}
