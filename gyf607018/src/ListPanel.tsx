import React, { useState } from 'react';
import { useApp } from './store';
import { RecordFormModal, ReviewModal } from './modals';
import { FollowUpRecord, FilterParams } from './types';

const statusLabel: Record<string, string> = {
  draft: '草稿',
  pending_review: '待复核',
  reviewed: '已复核',
  rejected: '已驳回',
};

const qualityLabel: Record<string, string> = {
  normal: '正常',
  corrupted: '数据异常',
  missing_pages: '材料缺页',
};

export function ListPanel() {
  const { state, getFilteredRecords, setFilters, selectRecord, exportRecords } = useApp();
  const records = getFilteredRecords();

  const [showAdd, setShowAdd] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [editRecord, setEditRecord] = useState<FollowUpRecord | null>(null);
  const [reviewRecord, setReviewRecord] = useState<FollowUpRecord | null>(null);

  const f = state.currentFilters;
  function updateFilter<K extends keyof FilterParams>(key: K, val: FilterParams[K]) {
    setFilters({ ...f, [key]: val });
  }

  function handleExport() {
    const { csv, meta } = exportRecords();
    if (meta.recordCountInPage !== meta.recordCountExported) {
      if (!confirm(`页面显示 ${meta.recordCountInPage} 条记录，实际导出 ${meta.recordCountExported} 条。存在异常记录被自动排除，是否继续导出？`)) {
        return;
      }
    }
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `儿保随访记录_${meta.exportedAt.replace(/[-: ]/g, '')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="list-panel">
      <div className="panel-header">
        <h2>随访记录列表</h2>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="搜索姓名/监护人/批号/档案号"
          value={f.keyword}
          onChange={e => updateFilter('keyword', e.target.value)}
        />
        <select value={f.status} onChange={e => updateFilter('status', e.target.value as FilterParams['status'])}>
          <option value="all">全部状态</option>
          <option value="draft">草稿</option>
          <option value="pending_review">待复核</option>
          <option value="reviewed">已复核</option>
          <option value="rejected">已驳回</option>
        </select>
        <select value={f.dataQuality} onChange={e => updateFilter('dataQuality', e.target.value as FilterParams['dataQuality'])}>
          <option value="all">全部数据质量</option>
          <option value="normal">正常</option>
          <option value="missing_pages">材料缺页</option>
          <option value="corrupted">数据异常</option>
        </select>
        <label>
          补录
          <select
            value={f.isManualEntry === null ? 'all' : String(f.isManualEntry)}
            onChange={e => {
              const v = e.target.value;
              updateFilter('isManualEntry', v === 'all' ? null : v === 'true');
            }}
          >
            <option value="all">全部</option>
            <option value="true">仅补录</option>
            <option value="false">仅正常录入</option>
          </select>
        </label>
        <label>
          已复核
          <select
            value={f.reviewed === null ? 'all' : String(f.reviewed)}
            onChange={e => {
              const v = e.target.value;
              updateFilter('reviewed', v === 'all' ? null : v === 'true');
            }}
          >
            <option value="all">全部</option>
            <option value="true">已复核</option>
            <option value="false">未复核</option>
          </select>
        </label>
        <label>
          从
          <input type="date" value={f.startDate} onChange={e => updateFilter('startDate', e.target.value)} />
        </label>
        <label>
          至
          <input type="date" value={f.endDate} onChange={e => updateFilter('endDate', e.target.value)} />
        </label>
      </div>

      {state.lastExportCountMismatch && (
        <div className="export-mismatch-banner">
          ⚠ 上次导出（{state.lastExportCountMismatch.exportId}）：页面 {state.lastExportCountMismatch.pageCount} 条 vs 导出 {state.lastExportCountMismatch.exportedCount} 条 —— {state.lastExportCountMismatch.reason}
        </div>
      )}

      <div className="toolbar">
        <span className="count-badge">共 {records.length} 条记录</span>
        <button onClick={() => setShowAdd(true)}>+ 新增</button>
        <button onClick={() => setShowManualAdd(true)}>+ 手工补录</button>
        <button className="primary" onClick={handleExport}>导出 CSV</button>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>婴幼儿</th>
              <th>疫苗</th>
              <th>批号</th>
              <th>接种日期</th>
              <th>状态</th>
              <th>质量</th>
              <th>复核</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: '#999', padding: 30 }}>暂无匹配记录</td>
              </tr>
            )}
            {records.map(r => {
              const selected = state.selectedRecordId === r.id;
              const rowClass = [
                selected ? 'selected' : '',
                r.isManualEntry ? 'manual' : '',
                r.dataQuality !== 'normal' ? 'corrupted' : '',
              ].join(' ').trim();
              return (
                <tr key={r.id} className={rowClass || undefined} onClick={() => selectRecord(r.id)}>
                  <td>
                    {r.parentVisible.infantName}
                    {r.isManualEntry && <span className="badge-manual">补录</span>}
                    {r.dataQuality === 'missing_pages' && <span className="missing-badge">缺页</span>}
                  </td>
                  <td>{r.parentVisible.vaccineName}</td>
                  <td style={{ fontFamily: 'Menlo, monospace', fontSize: 11 }}>{r.parentVisible.vaccineBatch}</td>
                  <td>{r.parentVisible.vaccinationDate}</td>
                  <td><span className={`status-tag ${r.status}`}>{statusLabel[r.status]}</span></td>
                  <td><span className={`quality-tag ${r.dataQuality}`}>{qualityLabel[r.dataQuality]}</span></td>
                  <td>{r.reviewedBy ? `${r.reviewedBy} ${r.reviewedAt?.slice(5, 16)}` : '—'}</td>
                  <td>
                    <div className="row-actions" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setEditRecord(r)}>修改</button>
                      {r.status === 'pending_review' && (
                        <button className="success" onClick={() => setReviewRecord(r)}>复核</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showAdd && <RecordFormModal record={null} isManual={false} onClose={() => setShowAdd(false)} />}
      {showManualAdd && <RecordFormModal record={null} isManual={true} onClose={() => setShowManualAdd(false)} />}
      {editRecord && <RecordFormModal record={editRecord} onClose={() => setEditRecord(null)} />}
      {reviewRecord && <ReviewModal record={reviewRecord} onClose={() => setReviewRecord(null)} />}
    </div>
  );
}
