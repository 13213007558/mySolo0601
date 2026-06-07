import React, { useState, useEffect, useMemo } from 'react';
import RecordCard from '../components/RecordCard.jsx';
import Modal from '../components/Modal.jsx';
import {
  fetchRecords, fetchClassSummary, handleRecord, revertRecord, addRemark,
  batchHandle, downloadExport, createManualRecord, fetchBabies, getContext
} from '../api.js';
import {
  DisinfectionRecord, Baby, RecordStatus, STATUS_LABELS, ITEM_TYPE_LABELS
} from '../../shared/types.js';

type Page =
  | { name: 'wall' }
  | { name: 'class'; className: string }
  | { name: 'baby'; babyId: string };

export default function ReminderWall({
  onNavigate, showToast
}: {
  onNavigate: (p: Page) => void;
  showToast: (t: 'success' | 'error' | 'warn', m: string) => void;
}) {
  const [records, setRecords] = useState<DisinfectionRecord[]>([]);
  const [babies, setBabies] = useState<Baby[]>([]);
  const [classSummary, setClassSummary] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showManualModal, setShowManualModal] = useState(false);
  const [showHandleModal, setShowHandleModal] = useState<DisinfectionRecord | null>(null);
  const [showRemarkModal, setShowRemarkModal] = useState<DisinfectionRecord | null>(null);
  const [showRevertModal, setShowRevertModal] = useState<DisinfectionRecord | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const ctx = getContext();
  const canHandle = ctx.role === 'consultant' || ctx.role === 'supervisor' || ctx.role === 'admin';
  const canRevert = ctx.role === 'supervisor' || ctx.role === 'admin';

  async function loadData() {
    setLoading(true);
    try {
      const [rRes, sRes] = await Promise.all([fetchRecords(), fetchClassSummary()]);
      if (rRes.success) { setRecords(rRes.data!.records); setBabies(rRes.data!.babies); }
      if (sRes.success) setClassSummary(sRes.data as any);
    } finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  const classes = useMemo(() => Array.from(new Set(records.map(r => r.className))), [records]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (classFilter !== 'all' && r.className !== classFilter) return false;
      return true;
    }).sort((a, b) => {
      const order = { abnormal: 0, processing: 1, pending: 2, reverted: 3, processed: 4 };
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
      return b.expectedReturnTime - a.expectedReturnTime;
    });
  }, [records, statusFilter, classFilter]);

  const stats = useMemo(() => {
    const s: any = { total: records.length, abnormal: 0, processing: 0, processed: 0 };
    for (const r of records) {
      if (r.status in s) s[r.status] = (s[r.status] || 0) + 1;
      else s[r.status] = 1;
    }
    s.abnormal = s.abnormal || 0;
    s.processing = s.processing || 0;
    s.processed = s.processed || 0;
    return s;
  }, [records]);

  function toggleSelect(id: string) {
    const n = new Set(selectedIds);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelectedIds(n);
  }

  async function doHandle(record: DisinfectionRecord, data: any) {
    const res = await handleRecord(record.id, data);
    if (res.success) {
      showToast('success', '处理成功，班级页/宝宝详情已同步');
      setShowHandleModal(null);
      if (res.data) setClassSummary(res.data.classSummary);
      loadData();
    } else {
      showToast('error', res.error || '处理失败');
    }
  }

  async function doRevert(record: DisinfectionRecord, reason: string) {
    const res = await revertRecord(record.id, reason);
    if (res.success) {
      showToast('success', '状态已回退，审计日志保留供主管复查');
      setShowRevertModal(null);
      if (res.data) setClassSummary(res.data.classSummary);
      loadData();
    } else {
      showToast('error', res.error || '回退失败');
    }
  }

  async function doAddRemark(record: DisinfectionRecord, content: string) {
    const res = await addRemark(record.id, content);
    if (res.success) {
      showToast('success', '备注已添加，原承诺仍保留在历史中');
      setShowRemarkModal(null);
      loadData();
    } else {
      showToast('error', res.error || '添加失败');
    }
  }

  async function doBatch(data: any) {
    const items = Array.from(selectedIds).map(id => ({ id, ...data }));
    const res = await batchHandle(items);
    if (res.success) {
      showToast('success', '批量处理全部成功');
    } else if (res.partialSuccess) {
      showToast('warn', `${res.message || '部分成功'}：成功 ${res.partialSuccess.succeeded.length}，失败 ${res.partialSuccess.failed.length}`);
    } else {
      showToast('error', res.error || '批量处理失败');
    }
    setShowBatchModal(false);
    setSelectedIds(new Set());
    if (res.data) setClassSummary(res.data.classSummary);
    loadData();
  }

  async function doManual(data: any) {
    const res = await createManualRecord(data);
    if (res.success) {
      showToast('success', '手工补录成功，已加入清单（带斜纹背景）');
      setShowManualModal(false);
      if (res.data) setClassSummary(res.data.classSummary);
      loadData();
    } else {
      showToast('error', res.error || '补录失败');
    }
  }

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card total"><div className="num">{stats.total}</div><div className="label">总记录</div></div>
        <div className="stat-card abnormal"><div className="num">{stats.abnormal}</div><div className="label">异常</div></div>
        <div className="stat-card processing"><div className="num">{stats.processing}</div><div className="label">处理中</div></div>
        <div className="stat-card processed"><div className="num">{stats.processed}</div><div className="label">已处理</div></div>
      </div>

      <div className="class-tabs">
        <div
          className={`class-tab ${classFilter === 'all' ? 'active' : ''}`}
          onClick={() => setClassFilter('all')}
        >
          全部班级
          {classFilter === 'all' && stats.abnormal > 0 && <span className="count">{stats.abnormal}</span>}
        </div>
        {classSummary.map(c => (
          <div
            key={c.className}
            className={`class-tab ${classFilter === c.className ? 'active' : ''}`}
            onClick={() => { setClassFilter(c.className); onNavigate({ name: 'class', className: c.className }); }}
          >
            {c.className}
            {(c.statusCount.abnormal || 0) > 0 && <span className="count">{c.statusCount.abnormal}</span>}
          </div>
        ))}
      </div>

      <div className="toolbar">
        <select className="filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">全部状态</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="btn" onClick={() => setShowManualModal(true)}>+ 手工补录</button>
        <button
          className="btn btn-primary"
          disabled={selectedIds.size === 0}
          onClick={() => setShowBatchModal(true)}
        >
          批量处理 {selectedIds.size > 0 && `(${selectedIds.size})`}
        </button>
        <button className="btn btn-success" onClick={() => { downloadExport(); showToast('success', '正在导出，请查收下载文件'); }}>
          📥 导出Excel
        </button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: '#6b7280', alignSelf: 'center' }}>
          共 {filteredRecords.length} 条记录
          {selectedIds.size > 0 && <span style={{ marginLeft: 8 }}>已选 {selectedIds.size}</span>}
        </span>
      </div>

      {loading ? (
        <div className="empty-state">加载中...</div>
      ) : filteredRecords.length === 0 ? (
        <div className="empty-state">暂无记录</div>
      ) : (
        filteredRecords.map(r => (
          <div key={r.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <input
              type="checkbox"
              style={{ marginTop: 18 }}
              checked={selectedIds.has(r.id)}
              onChange={() => toggleSelect(r.id)}
            />
            <div style={{ flex: 1 }}>
              <RecordCard
                record={r}
                onViewBaby={id => onNavigate({ name: 'baby', babyId: id })}
                onViewDetail={() => onNavigate({ name: 'baby', babyId: r.babyId })}
                onHandle={setShowHandleModal}
                onRevert={setShowRevertModal}
                onAddRemark={setShowRemarkModal}
                canRevert={canRevert}
                canHandle={canHandle}
              />
            </div>
          </div>
        ))
      )}

      {showHandleModal && (
        <HandleModal
          record={showHandleModal}
          onClose={() => setShowHandleModal(null)}
          onSubmit={data => doHandle(showHandleModal, data)}
        />
      )}
      {showRemarkModal && (
        <RemarkModal
          record={showRemarkModal}
          onClose={() => setShowRemarkModal(null)}
          onSubmit={c => doAddRemark(showRemarkModal, c)}
        />
      )}
      {showRevertModal && (
        <RevertModal
          record={showRevertModal}
          onClose={() => setShowRevertModal(null)}
          onSubmit={r => doRevert(showRevertModal, r)}
        />
      )}
      {showBatchModal && (
        <BatchModal
          count={selectedIds.size}
          onClose={() => setShowBatchModal(false)}
          onSubmit={doBatch}
        />
      )}
      {showManualModal && (
        <ManualEntryModal
          babies={babies}
          onClose={() => setShowManualModal(false)}
          onSubmit={doManual}
        />
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
        <textarea
          placeholder="详细说明处理方式和结果"
          value={handleResult}
          onChange={e => setHandleResult(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>家长临时改口备注（可选）</label>
        <textarea
          placeholder="若家长临时改变说法，可在此补充，原承诺将保留在历史记录中不会被抹掉"
          value={supplementRemark}
          onChange={e => setSupplementRemark(e.target.value)}
        />
        <div className="form-hint">💡 最初承诺不会被覆盖，始终保留在备注历史中供主管复查</div>
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
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label>最初承诺（不会被修改）</label>
          <div style={{ padding: 10, background: '#eef2ff', borderRadius: 6, fontSize: 13, color: '#3730a3' }}>
            {original.content}
            <div style={{ fontSize: 11, color: '#6366f1', marginTop: 4 }}>
              — {original.operatorName} @ {new Date(original.timestamp).toLocaleString('zh-CN')}
            </div>
          </div>
        </div>
      )}
      <div className="form-group">
        <label className="form-required">补充备注内容</label>
        <textarea
          placeholder="填写家长临时改口的内容，例如：家长说昨天忘记带了，明天一定带来..."
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <div className="form-hint">💡 此条将标记为"家长改口补录"，与原承诺并列保存，不会覆盖</div>
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
        ⚠️ 状态回退后，完整审计日志将保留供主管复查，不会丢失任何操作痕迹。
      </div>
      <div className="form-group">
        <label>回退原因</label>
        <textarea
          placeholder="请填写回退原因，便于后续复查"
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
      </div>
    </Modal>
  );
}

function BatchModal({ count, onClose, onSubmit }: {
  count: number;
  onClose: () => void;
  onSubmit: (data: { status: RecordStatus; handleResult: string; supplementRemark?: string }) => void;
}) {
  const [status, setStatus] = useState<RecordStatus>('processed');
  const [handleResult, setHandleResult] = useState('');
  const [supplementRemark, setSupplementRemark] = useState('');
  return (
    <Modal title={`批量处理 ${count} 条记录`} onClose={onClose} footer={
      <>
        <button className="btn" onClick={onClose}>取消</button>
        <button className="btn btn-primary" onClick={() => onSubmit({ status, handleResult, supplementRemark: supplementRemark || undefined })}>开始批量处理</button>
      </>
    }>
      <div style={{ padding: 10, background: '#eff6ff', borderRadius: 6, fontSize: 13, color: '#1e40af', marginBottom: 14 }}>
        ℹ️ 遇到重复提交时允许部分成功，失败的条目将单独列出，不会影响其他成功的记录。
      </div>
      <div className="form-group">
        <label className="form-required">目标状态</label>
        <select value={status} onChange={e => setStatus(e.target.value as RecordStatus)}>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-required">统一处理结果</label>
        <textarea
          placeholder="所有选中记录将应用此处理结果"
          value={handleResult}
          onChange={e => setHandleResult(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>统一补充备注（可选）</label>
        <textarea value={supplementRemark} onChange={e => setSupplementRemark(e.target.value)} />
      </div>
    </Modal>
  );
}

function ManualEntryModal({ babies, onClose, onSubmit }: {
  babies: Baby[];
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const [babyId, setBabyId] = useState('');
  const [itemType, setItemType] = useState('bottle');
  const [itemName, setItemName] = useState('');
  const [expectedDate, setExpectedDate] = useState(() => {
    const d = new Date(Date.now() + 3 * 3600 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [originalCommitment, setOriginalCommitment] = useState('');
  const [status, setStatus] = useState<RecordStatus>('abnormal');

  return (
    <Modal title="手工补录记录" onClose={onClose} footer={
      <>
        <button className="btn" onClick={onClose}>取消</button>
        <button
          className="btn btn-primary"
          disabled={!babyId || !itemName || !expectedDate}
          onClick={() => onSubmit({
            babyId,
            itemType,
            itemName,
            expectedReturnTime: new Date(expectedDate).getTime(),
            status,
            originalCommitment: originalCommitment || undefined
          })}
        >
          保存补录
        </button>
      </>
    }>
      <div style={{ padding: 10, background: '#fef3c7', borderRadius: 6, fontSize: 12, color: '#92400e', marginBottom: 14 }}>
        📌 手工补录的记录会带有橙色斜纹背景，与扫码产生的记录明确区分，便于核查补录前后差异。
      </div>
      <div className="form-group">
        <label className="form-required">宝宝</label>
        <select value={babyId} onChange={e => setBabyId(e.target.value)}>
          <option value="">请选择</option>
          {babies.map(b => <option key={b.id} value={b.id}>{b.name}（{b.className}）</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-required">物品种类</label>
        <select value={itemType} onChange={e => setItemType(e.target.value)}>
          {Object.entries(ITEM_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-required">物品名称/描述</label>
        <input placeholder="例如：贝亲宽口径奶瓶" value={itemName} onChange={e => setItemName(e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-required">预计归还时间</label>
        <input type="datetime-local" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} />
      </div>
      <div className="form-group">
        <label>初始状态</label>
        <select value={status} onChange={e => setStatus(e.target.value as RecordStatus)}>
          {['pending', 'abnormal', 'processing'].map(s => <option key={s} value={s}>{STATUS_LABELS[s as RecordStatus]}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>家长最初承诺（可选）</label>
        <textarea
          placeholder="填写家长最初的承诺内容，后续若改口将以补录备注形式追加，不会覆盖本条"
          value={originalCommitment}
          onChange={e => setOriginalCommitment(e.target.value)}
        />
      </div>
    </Modal>
  );
}
