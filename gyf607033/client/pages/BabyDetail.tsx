import React, { useState, useEffect } from 'react';
import RecordCard from '../components/RecordCard.jsx';
import Modal from '../components/Modal.jsx';
import {
  fetchBabyDetail, fetchRecordDetail, handleRecord, revertRecord, addRemark, getContext
} from '../api.js';
import { Baby, DisinfectionRecord, ScanRecord, AuditLog, RecordStatus, STATUS_LABELS } from '../../shared/types.js';

type Page = { name: 'wall' } | { name: 'class'; className: string } | { name: 'baby'; babyId: string };

export default function BabyDetail({
  babyId, onNavigate, showToast
}: {
  babyId: string;
  onNavigate: (p: Page) => void;
  showToast: (t: 'success' | 'error' | 'warn', m: string) => void;
}) {
  const [baby, setBaby] = useState<Baby | null>(null);
  const [records, setRecords] = useState<DisinfectionRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<{
    record: DisinfectionRecord; scans: ScanRecord[]; audits: AuditLog[];
  } | null>(null);
  const [showHandleModal, setShowHandleModal] = useState<DisinfectionRecord | null>(null);
  const [showRemarkModal, setShowRemarkModal] = useState<DisinfectionRecord | null>(null);
  const [showRevertModal, setShowRevertModal] = useState<DisinfectionRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const ctx = getContext();
  const canHandle = ctx.role === 'consultant' || ctx.role === 'supervisor' || ctx.role === 'admin';
  const canRevert = ctx.role === 'supervisor' || ctx.role === 'admin';
  const canSeeAudit = ctx.role === 'supervisor' || ctx.role === 'admin';

  async function loadData() {
    setLoading(true);
    const res = await fetchBabyDetail(babyId);
    if (res.success) {
      setBaby(res.data!.baby);
      setRecords(res.data!.records);
    }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [babyId]);

  async function viewDetail(id: string) {
    const res = await fetchRecordDetail(id);
    if (res.success) {
      setSelectedRecord(res.data as any);
    }
  }

  async function doHandle(record: DisinfectionRecord, data: any) {
    const res = await handleRecord(record.id, data);
    if (res.success) {
      showToast('success', '处理成功，提醒墙/班级页/后台接口已同步');
      setShowHandleModal(null);
      if (selectedRecord && selectedRecord.record.id === record.id) viewDetail(record.id);
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

  if (!baby) return <div className="empty-state">{loading ? '加载中...' : '宝宝不存在'}</div>;

  return (
    <div>
      <div className="page-header">
        <span className="back-link" onClick={() => onNavigate({ name: 'wall' })}>← 返回提醒墙</span>
        {baby && (
          <span className="back-link" style={{ marginLeft: 8 }} onClick={() => onNavigate({ name: 'class', className: baby.className })}>
            → 进入{baby.className}
          </span>
        )}
      </div>

      <div className="baby-header">
        <div className="name">👶 {baby.name}</div>
        <div className="sub">
          班级：{baby.className} · 家长：{baby.guardianName} · 联系电话：{baby.guardianPhone}
        </div>
        {baby.dateOfBirth && (
          <div className="sub" style={{ marginTop: 4 }}>
            出生日期：{baby.dateOfBirth}
            {baby.allergies && ` · 过敏史：${baby.allergies}`}
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-title">
          <span>家长与宝宝信息（按角色脱敏展示）</span>
          <span style={{ fontSize: 11, color: '#6b7280' }}>当前角色：{ctx.role}</span>
        </div>
        <div className="info-row"><span className="label">家长姓名</span><span className="value">{baby.guardianName}</span></div>
        <div className="info-row"><span className="label">联系电话</span><span className="value">{baby.guardianPhone}</span></div>
        {baby.guardianIdNo && <div className="info-row"><span className="label">身份证号</span><span className="value">{baby.guardianIdNo}</span></div>}
        {baby.dateOfBirth && <div className="info-row"><span className="label">宝宝生日</span><span className="value">{baby.dateOfBirth}</span></div>}
        {baby.allergies && <div className="info-row"><span className="label">过敏信息</span><span className="value">{baby.allergies}</span></div>}
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 10, paddingTop: 10, borderTop: '1px dashed #e5e7eb' }}>
          ℹ️ 隐私字段在前端、后端 JSON、日志和导出文件中均按角色处理。门店同事(store_staff)仅能看到脱敏后的电话，身份证号仅管理员可见。
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">该宝宝的所有消毒用品记录（{records.length}）</div>
        {records.length === 0 ? (
          <div className="empty-state">暂无记录</div>
        ) : (
          records.map(r => (
            <RecordCard
              key={r.id}
              record={r}
              onViewBaby={() => {}}
              onViewDetail={() => viewDetail(r.id)}
              onHandle={setShowHandleModal}
              onRevert={setShowRevertModal}
              onAddRemark={setShowRemarkModal}
              canRevert={canRevert}
              canHandle={canHandle}
            />
          ))
        )}
      </div>

      {selectedRecord && (
        <DetailModal
          data={selectedRecord}
          canSeeAudit={canSeeAudit}
          onClose={() => setSelectedRecord(null)}
        />
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

function DetailModal({ data, canSeeAudit, onClose }: {
  data: { record: DisinfectionRecord; scans: ScanRecord[]; audits: AuditLog[] };
  canSeeAudit: boolean;
  onClose: () => void;
}) {
  return (
    <Modal title={`完整记录 · ${data.record.babyName} - ${data.record.itemName}`} onClose={onClose} width={560}>
      <div className="info-row"><span className="label">状态</span><span className="value"><span className={`status-tag ${data.record.status}`}>{STATUS_LABELS[data.record.status]}</span></span></div>
      <div className="info-row"><span className="label">处理人</span><span className="value">{data.record.processorName || '—'}</span></div>
      <div className="info-row"><span className="label">处理时间</span><span className="value">{data.record.processTime ? new Date(data.record.processTime).toLocaleString('zh-CN') : '—'}</span></div>

      <div className="panel-title" style={{ marginTop: 14 }}>借还扫码记录</div>
      {data.scans.length === 0 ? (
        <div style={{ fontSize: 12, color: '#9ca3af', padding: '6px 0' }}>无扫码记录（可能为手工补录）</div>
      ) : (
        <div className="timeline">
          {data.scans.sort((a, b) => a.timestamp - b.timestamp).map(s => (
            <div key={s.id} className="timeline-item">
              <div className="timeline-time">{new Date(s.timestamp).toLocaleString('zh-CN')}</div>
              <div className="timeline-content">
                <span className="op">{s.type === 'borrow' ? '📤 借出扫码' : '📥 归还扫码'}</span>
                <span className="action">
                  {' '}· 操作人：<strong>{s.operatorName || '未知'}</strong>
                  {s.operatorId ? ` (ID: ${s.operatorId})` : ''}
                  {' '}· 设备：{s.deviceCode}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="panel-title" style={{ marginTop: 14 }}>备注历史（最初承诺不会被覆盖）</div>
      {data.record.remarks.length === 0 ? (
        <div style={{ fontSize: 12, color: '#9ca3af', padding: '6px 0' }}>暂无备注</div>
      ) : (
        data.record.remarks.map(r => (
          <div key={r.id} className={`remark-item ${r.source}`}>
            <div className="remark-content">
              <span className="remark-source">
                {r.source === 'original_commitment' ? '最初承诺' : r.source === 'supplement' ? '家长改口补录' : '状态变更'}
              </span>
              <div style={{ marginTop: 3 }}>{r.content}</div>
            </div>
            <div className="remark-meta">{r.operatorName}<br />{new Date(r.timestamp).toLocaleString('zh-CN')}</div>
          </div>
        ))
      )}

      {canSeeAudit && (
        <>
          <div className="panel-title" style={{ marginTop: 14 }}>
            操作审计日志（仅主管/管理员可见）
          </div>
          {data.audits.length === 0 ? (
            <div style={{ fontSize: 12, color: '#9ca3af', padding: '6px 0' }}>无审计记录</div>
          ) : (
            <div className="audit-list">
              {data.audits.map(a => (
                <div key={a.id} className="audit-item">
                  <div><span className="audit-time">{new Date(a.timestamp).toLocaleString('zh-CN')}</span></div>
                  <div>
                    <span className="audit-op">{a.operatorName}</span>
                    <span style={{ color: '#9ca3af' }}> ({a.operatorRole})</span>
                    <span className="audit-action"> · {a.action}</span>
                    {a.oldStatus && a.newStatus && (
                      <span style={{ marginLeft: 6 }}>
                        <span className="diff-tag old">{STATUS_LABELS[a.oldStatus]}</span>
                        <span style={{ color: '#9ca3af' }}> → </span>
                        <span className="diff-tag new">{STATUS_LABELS[a.newStatus]}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Modal>
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
          <div style={{ padding: 10, background: '#eef2ff', borderRadius: 6, fontSize: 13, color: '#3730a3' }}>{original.content}</div>
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
        ⚠️ 回退后完整审计日志保留供主管复查，不会丢失任何操作痕迹
      </div>
      <div className="form-group">
        <label>回退原因</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)} />
      </div>
    </Modal>
  );
}
