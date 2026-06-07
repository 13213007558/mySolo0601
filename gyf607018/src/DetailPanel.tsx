import React, { useState } from 'react';
import { useApp } from './store';
import { RecordFormModal, ReviewModal } from './modals';
import { FollowUpRecord } from './types';

const fieldLabelMap: Record<string, string> = {
  'parentVisible.infantName': '婴幼儿姓名',
  'parentVisible.gender': '性别',
  'parentVisible.birthDate': '出生日期',
  'parentVisible.guardianName': '监护人姓名',
  'parentVisible.guardianPhone': '联系电话',
  'parentVisible.vaccineName': '疫苗名称',
  'parentVisible.vaccineBatch': '疫苗批号',
  'parentVisible.vaccinationDate': '接种日期',
  'parentVisible.vaccinationSite': '接种单位',
  'parentVisible.nextFollowUpDate': '下次随访日期',
  'parentVisible.publicRemarks': '公开备注',
  'internal.medicalRecordNo': '档案编号',
  'internal.nurseId': '护士ID',
  'internal.nurseName': '接种护士',
  'internal.internalNotes': '内部备注',
  'internal.abnormalSymptoms': '异常症状',
  'internal.contraindications': '禁忌症',
  'status': '记录状态',
  'reviewResult': '复核结果',
  'reviewComments': '复核意见',
  'isManualEntry': '是否手工补录',
};

const actionLabelMap: Record<string, string> = {
  create: '创建',
  update: '修改',
  review: '复核',
  reject: '驳回',
  manual_entry: '手工补录',
  export: '导出',
};

function labelFor(field: string) {
  return fieldLabelMap[field] || field;
}

function formatVal(v: string | null) {
  if (v === null || v === undefined || v === '') return '（空）';
  try {
    const arr = JSON.parse(v);
    if (Array.isArray(arr)) return arr.join('；') || '（空）';
  } catch {}
  if (v === 'male') return '男';
  if (v === 'female') return '女';
  if (v === 'true') return '是';
  if (v === 'false') return '否';
  if (v === 'draft') return '草稿';
  if (v === 'pending_review') return '待复核';
  if (v === 'reviewed') return '已复核';
  if (v === 'rejected') return '已驳回';
  if (v === 'pass') return '通过';
  if (v === 'fail') return '驳回';
  return v;
}

export function DetailPanel() {
  const { state, getRecordById, getAuditLogsForRecord, selectRecord } = useApp();
  const selected = state.selectedRecordId ? getRecordById(state.selectedRecordId) : undefined;
  const [editRecord, setEditRecord] = useState<FollowUpRecord | null>(null);
  const [reviewRecord, setReviewRecord] = useState<FollowUpRecord | null>(null);

  if (!selected) {
    return (
      <div className="detail-panel">
        <div className="panel-header">
          <h2>记录详情</h2>
        </div>
        <div className="detail-empty">请在左侧选择一条记录查看详情</div>
      </div>
    );
  }

  const audits = getAuditLogsForRecord(selected.id);
  const hasAnomaly = selected.anomalies.length > 0 || (state.lastExportCountMismatch && state.exportHistory[0]?.recordCountInPage !== state.exportHistory[0]?.recordCountExported);

  return (
    <div className="detail-panel">
      <div className="panel-header">
        <h2>
          记录详情
          {selected.isManualEntry && <span className="badge-manual">补录</span>}
          {selected.dataQuality === 'missing_pages' && <span className="missing-badge">缺页</span>}
        </h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setEditRecord(selected)}>修改</button>
          {selected.status === 'pending_review' && (
            <button className="success" onClick={() => setReviewRecord(selected)}>复核</button>
          )}
          <button onClick={() => selectRecord(null)}>关闭</button>
        </div>
      </div>

      <div className="detail-body">
        {hasAnomaly && (
          <div className="section">
            <div className="section-title anomaly">⚠ 异常与原因说明</div>
            <div className="section-body">
              {selected.anomalies.map((a, i) => (
                <div key={i} className="anomaly-item">
                  <div className="anomaly-title">
                    {a.type === 'missing_pages' && '📄 材料缺页'}
                    {a.type === 'data_corruption' && '⚠️ 数据异常'}
                    {a.type === 'export_mismatch' && '📊 导出不一致'}
                    {a.type === 'other' && '⚠ 其他异常'}
                    {' — '}{a.description}
                  </div>
                  <div className="anomaly-detail">{a.detail}</div>
                  <div className="anomaly-meta">报告人：{a.reportedBy} · {a.reportedAt}</div>
                </div>
              ))}
              {state.lastExportCountMismatch && state.exportHistory[0] && (
                <div className="anomaly-item">
                  <div className="anomaly-title">📊 导出数量与页面不一致</div>
                  <div className="anomaly-detail">
                    页面显示 {state.lastExportCountMismatch.pageCount} 条记录，实际导出 {state.lastExportCountMismatch.exportedCount} 条。
                    <br />
                    原因：{state.lastExportCountMismatch.reason}
                  </div>
                  <div className="anomaly-meta">导出批次：{state.lastExportCountMismatch.exportId}</div>
                </div>
              )}
              {selected.dataQuality !== 'normal' && selected.anomalies.length === 0 && (
                <div className="anomaly-item">
                  <div className="anomaly-title">数据质量：{selected.dataQuality === 'missing_pages' ? '材料缺页' : '数据异常'}</div>
                  <div className="anomaly-detail">此条记录已被标记，不会污染下游正常数据。请在补全材料后重新提交。</div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="section">
          <div className="section-title">
            👨‍👩‍👧 家长可见信息
            <span style={{ fontSize: 11, fontWeight: 'normal', color: '#27854a' }}>（对外可展示）</span>
          </div>
          <div className="section-body">
            <div className="info-grid">
              <div className="label">婴幼儿姓名</div><div className="value">{selected.parentVisible.infantName}</div>
              <div className="label">性别</div><div className="value">{selected.parentVisible.gender === 'male' ? '男' : '女'}</div>
              <div className="label">出生日期</div><div className="value">{selected.parentVisible.birthDate}</div>
              <div className="label">监护人</div><div className="value">{selected.parentVisible.guardianName}</div>
              <div className="label">联系电话</div><div className="value">{selected.parentVisible.guardianPhone}</div>
              <div className="label">疫苗名称</div><div className="value">{selected.parentVisible.vaccineName}</div>
              <div className="label">疫苗批号</div><div className="value" style={{ fontFamily: 'Menlo, monospace' }}>{selected.parentVisible.vaccineBatch}</div>
              <div className="label">接种日期</div><div className="value">{selected.parentVisible.vaccinationDate}</div>
              <div className="label">接种单位</div><div className="value">{selected.parentVisible.vaccinationSite}</div>
              <div className="label">下次随访</div><div className="value">{selected.parentVisible.nextFollowUpDate || '—'}</div>
              <div className="label">公开备注</div><div className="value">{selected.parentVisible.publicRemarks || '—'}</div>
            </div>
          </div>
        </div>

        <div className="section">
          <div className="section-title internal">
            🔒 内部信息
            <span style={{ fontSize: 11, fontWeight: 'normal' }}>（家长不可见）</span>
          </div>
          <div className="section-body">
            <div className="info-grid">
              <div className="label">档案编号</div><div className="value">{selected.internal.medicalRecordNo}</div>
              <div className="label">接种护士</div><div className="value">{selected.internal.nurseName}</div>
              <div className="label">异常症状</div><div className="value">{selected.internal.abnormalSymptoms.length ? selected.internal.abnormalSymptoms.join('；') : '无'}</div>
              <div className="label">禁忌症</div><div className="value">{selected.internal.contraindications.length ? selected.internal.contraindications.join('；') : '无'}</div>
              <div className="label">内部备注</div><div className="value" style={{ whiteSpace: 'pre-wrap' }}>{selected.internal.internalNotes || '—'}</div>
              <div className="label">记录状态</div><div className="value">
                <span className={`status-tag ${selected.status}`}>
                  {selected.status === 'draft' && '草稿'}
                  {selected.status === 'pending_review' && '待复核'}
                  {selected.status === 'reviewed' && '已复核'}
                  {selected.status === 'rejected' && '已驳回'}
                </span>
              </div>
              {selected.reviewedBy && (
                <>
                  <div className="label">复核人</div><div className="value">{selected.reviewedBy}</div>
                  <div className="label">复核时间</div><div className="value">{selected.reviewedAt}</div>
                  <div className="label">复核结果</div><div className="value">{selected.reviewResult === 'pass' ? '通过 ✅' : '驳回 ❌'}</div>
                  <div className="label">复核意见</div><div className="value">{selected.reviewComments || '—'}</div>
                </>
              )}
              <div className="label">录入人</div><div className="value">{selected.createdBy} · {selected.createdAt}</div>
              <div className="label">最后修改</div><div className="value">{selected.updatedBy} · {selected.updatedAt}</div>
              <div className="label">数据质量</div><div className="value">
                <span className={`quality-tag ${selected.dataQuality}`}>
                  {selected.dataQuality === 'normal' && '正常'}
                  {selected.dataQuality === 'missing_pages' && '材料缺页'}
                  {selected.dataQuality === 'corrupted' && '数据异常'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {selected.isManualEntry && (
          <div className="section">
            <div className="section-title" style={{ background: '#fff3e0', color: '#8a4a00' }}>
              📝 手工补录说明
            </div>
            <div className="section-body">
              <div className="diff-box">
                <div className="diff-title">补录前后差异摘要</div>
                <div style={{ color: '#666', lineHeight: 1.8 }}>
                  补录前：系统中无此婴幼儿（{selected.parentVisible.infantName}）的 {selected.parentVisible.vaccineName} 接种记录（批号 {selected.parentVisible.vaccineBatch}）。
                  <br />
                  补录后：已登记接种日期 {selected.parentVisible.vaccinationDate}，接种单位 {selected.parentVisible.vaccinationSite}。
                  <br />
                  数据来源：{selected.internal.internalNotes || '纸质档案'}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="section">
          <div className="section-title audit">
            📋 审计历史（共 {audits.length} 条）
            <span style={{ fontSize: 11, fontWeight: 'normal' }}>（保健老师审计可见）</span>
          </div>
          <div className="section-body">
            {audits.length === 0 ? (
              <div style={{ color: '#999', fontSize: 12 }}>暂无操作记录</div>
            ) : (
              audits.map(a => (
                <div key={a.id} className="audit-item">
                  <div className="audit-head">
                    <span>
                      <span className="audit-action">{actionLabelMap[a.action] || a.action}</span>
                      {' · '}{a.operatorName}
                    </span>
                    <span>{a.timestamp}</span>
                  </div>
                  <div className="audit-changes">
                    {a.changes.length === 0 && <span style={{ color: '#888' }}>（无字段变更）</span>}
                    {a.changes.map((c, i) => (
                      <div key={i} className="change-row">
                        <span style={{ color: '#666' }}>{labelFor(c.field)}：</span>
                        {c.oldValue !== null && <span className="old">{formatVal(c.oldValue)}</span>}
                        {c.oldValue !== null && c.newValue !== null && <span style={{ color: '#888' }}> → </span>}
                        {c.newValue !== null && <span className="new">{formatVal(c.newValue)}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {editRecord && <RecordFormModal record={editRecord} onClose={() => setEditRecord(null)} />}
      {reviewRecord && <ReviewModal record={reviewRecord} onClose={() => setReviewRecord(null)} />}
    </div>
  );
}
