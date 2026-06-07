import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  User,
  VerificationRecord,
  STATUS_LABEL,
  ROLE_LABEL,
  VerificationStatus,
  PackageFlow,
} from '../types';
import {
  getVerificationRecordById,
  getFlowRecordLink,
  overrideRecordStatus,
  addRectification,
  updatePhotoDescription,
  handleDateReverseOrder,
} from '../store';

interface Props {
  user: User;
}

export default function RecordDetail({ user }: Props) {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<VerificationRecord | null>(null);
  const [flow, setFlow] = useState<PackageFlow | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState<VerificationStatus>('verified');
  const [overrideReason, setOverrideReason] = useState('');

  const [showRectModal, setShowRectModal] = useState(false);
  const [rectAction, setRectAction] = useState('');
  const [rectRemark, setRectRemark] = useState('');

  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [photoDesc, setPhotoDesc] = useState('');

  const [showDateOrderModal, setShowDateOrderModal] = useState(false);
  const [dateOrderCount, setDateOrderCount] = useState(0);
  const [dateOrderNote, setDateOrderNote] = useState('');

  useEffect(() => {
    const rec = getVerificationRecordById(id, user.role);
    setRecord(rec);
    if (rec) {
      const link = getFlowRecordLink(rec.packageFlowId, user.role);
      setFlow(link.flow);
    }
  }, [id, user, refreshKey]);

  if (!record) {
    return (
      <div>
        <button className="back-btn" onClick={() => navigate('/')}>
          ← 返回列表
        </button>
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div className="empty-icon">❓</div>
          <p>记录不存在或已失效</p>
        </div>
      </div>
    );
  }

  const refresh = () => setRefreshKey((k) => k + 1);

  const handleOverride = () => {
    if (!overrideReason.trim()) return alert('请输入新理由');
    const updated = overrideRecordStatus(
      record.id,
      overrideStatus,
      overrideReason,
      user,
    );
    if (updated) {
      alert('人工改判已完成，审计日志已保留所有历史变更。');
      setShowOverrideModal(false);
      setOverrideReason('');
      refresh();
    } else {
      alert('改判失败（主管才能改判');
    }
  };

  const handleRectSubmit = () => {
    if (!rectAction.trim() || !rectRemark.trim()) return alert('请填写完整');
    addRectification(record.id, rectAction, rectRemark, user);
    setShowRectModal(false);
    setRectAction('');
    setRectRemark('');
    refresh();
  };

  const handleSavePhotoDesc = (photoId: string) => {
    if (!photoDesc.trim()) return alert('请输入说明');
    updatePhotoDescription(record.id, photoId, photoDesc, user);
    setEditingPhotoId(null);
    setPhotoDesc('');
    refresh();
  };

  const handleDateOrderSubmit = () => {
    if (dateOrderCount <= 0) return alert('请输入有效次数');
    handleDateReverseOrder(
      record.id,
      dateOrderCount,
      dateOrderNote || '日期倒序处理',
      user,
    );
    setShowDateOrderModal(false);
    setDateOrderCount(0);
    setDateOrderNote('');
    refresh();
  };

  return (
    <div>
      <button className="back-btn" onClick={() => navigate('/')}>
        ← 返回列表
      </button>

      <div className="detail-page" style={{ marginTop: 16 }}>
        <div className="detail-header">
          <h2>
            {record.babyName} - {record.packageName}
            <span className={`status-badge ${record.status}`}>
              {STATUS_LABEL[record.status as VerificationStatus]}
            </span>
            <span className={`source-tag ${record.source}`}>
              {record.source === 'system_import' ? '系统导入' : '手工补录'}
            </span>
          </h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {record.dateOrderIssue && (
              <span className="alert-warning" style={{ margin: 0, padding: '6px 10px', borderRadius: 6, fontSize: 12 }}>
                ⚠ 存在日期倒序（部分成功）
              </span>
            )}
            {user.role === 'supervisor' && (
              <>
                <button
                  className="btn btn-warning btn-sm"
                  onClick={() => {
                    setOverrideStatus(record.status === 'rejected' ? 'verified' : 'manual_override');
                    setOverrideReason('');
                    setShowOverrideModal(true);
                  }}
                >
                  ✍ 人工改判
                </button>
                {!record.dateOrderIssue && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setDateOrderCount(record.actualSessions);
                      setShowDateOrderModal(true);
                    }}
                  >
                    🔀 处理日期倒序
                  </button>
                )}
              </>
            )}
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setRectAction('');
                setRectRemark('');
                setShowRectModal(true);
              }}
            >
              提交整改
            </button>
          </div>
        </div>

        <div className="detail-body">
          {record.dateOrderIssue && record.partialSuccessNote && (
            <div className="alert alert-warning">
              <span>⚠</span>
              <div>
                日期倒序说明：{record.partialSuccessNote}
              </div>
            </div>
          )}

          <div className="section">
            <div className="section-title">完整链路：课包流水 → 处理结果
              {user.role === 'supervisor' ? ' → 审计' : ''}
            </div>
            <div className="chain-flow">
              <div className="chain-step">
                <div className="step-num">1</div>
                <div className="step-title">课包流水</div>
                <div className="step-content">
                  {flow ? (
                    <>
                      <div>课包：{flow.packageName}</div>
                      <div>金额：¥{flow.amount.toLocaleString()}</div>
                      <div>日期：{flow.flowDate}</div>
                      <div>
                        次数：{flow.totalSessions}（剩余 {flow.remainingSessions}）</div>
                      <div>来源：{flow.source === 'system_import' ? '系统导入' : '手工补录'}</div>
                    </>
                  ) : (
                    <div>未关联流水</div>
                  )}
                </div>
              </div>
              <div className="chain-step">
                <div className="step-num">2</div>
                <div className="step-title">核销处理</div>
                <div className="step-content">
                  <div>状态：{STATUS_LABEL[record.status as VerificationStatus]}</div>
                  <div>实际次数：{record.actualSessions}</div>
                  <div>核销日期：{record.verifyDate}</div>
                  <div>处理理由：{record.reason}</div>
                  <div>照片：{record.photos.length} 张</div>
                  <div>整改：{record.rectifications.length} 条</div>
                </div>
              </div>
              {user.role === 'supervisor' && (
                <div className="chain-step">
                  <div className="step-num">3</div>
                  <div className="step-title">审计日志</div>
                  <div className="step-content">
                    <div>审计条数：{record.audits.length} 条</div>
                    <div>最后操作人：{record.audits[record.audits.length - 1]?.operatorName ?? '-'}</div>
                    <div>最后操作：{record.audits[record.audits.length - 1]?.action ?? '-'}</div>
                    <div>最后操作时间：{record.audits[record.audits.length - 1]?.timestamp ?? '-'}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="section">
            <div className="section-title">基础信息</div>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">宝宝姓名</div>
                <div className="info-value">{record.babyName}</div>
              </div>
              <div className="info-item">
                <div className="info-label">课包名称</div>
                <div className="info-value">{record.packageName}</div>
              </div>
              <div className="info-item">
                <div className="info-label">核销日期</div>
                <div className="info-value">{record.verifyDate}</div>
              </div>
              <div className="info-item">
                <div className="info-label">实际执行次数</div>
                <div className="info-value">{record.actualSessions}</div>
              </div>
              <div className="info-item">
                <div className="info-label">当前状态</div>
                <div className="info-value">
                  <span className={`status-badge ${record.status}`}>
                    {STATUS_LABEL[record.status as VerificationStatus]}
                  </span>
                </div>
              </div>
              <div className="info-item">
                <div className="info-label">数据来源</div>
                <div className="info-value">
                  <span className={`source-tag ${record.source}`}>
                    {record.source === 'system_import' ? '系统导入' : '手工补录'}
                  </span>
                </div>
              </div>
              <div className="info-item">
                <div className="info-label">处理理由</div>
                <div className="info-value">{record.reason}</div>
              </div>
              <div className="info-item">
                <div className="info-label">创建时间</div>
                <div className="info-value">{record.createdAt}</div>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-title">
              照片凭证（{record.photos.length} 张）- 服务重启后仍保留</div>
            <div className="photo-grid">
              {record.photos.map((p) => (
                <div className="photo-card" key={p.id}>
                  <img src={p.url} alt={p.description} />
                  <div className="photo-info">
                    {editingPhotoId === p.id ? (
                      <>
                        <input
                          className="photo-edit-input"
                          value={photoDesc}
                          onChange={(e) => setPhotoDesc(e.target.value)}
                          placeholder="请输入照片说明"
                        />
                        <div className="photo-actions">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleSavePhotoDesc(p.id)}>
                            保存
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setEditingPhotoId(null);
                              setPhotoDesc('');
                            }}
                          >
                            取消
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="photo-desc">{p.description}</div>
                        <div className="photo-meta">
                          {p.uploadedAt} · {p.uploadedBy}
                        </div>
                        <div className="photo-actions">
                          <button
                            className="link-btn"
                            onClick={() => {
                              setEditingPhotoId(p.id);
                              setPhotoDesc(p.description);
                            }}
                          >
                            编辑说明
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {record.rectifications.length > 0 && (
            <div className="section">
              <div className="section-title">
                整改记录（{record.rectifications.length} 条）- 服务重启后仍保留</div>
              <div className="timeline">
                {record.rectifications.map((r) => (
                  <div key={r.id} className="timeline-item rectification">
                    <div className="tl-time">{r.createdAt}</div>
                    <div className="tl-operator">
                      {r.operatorName}
                      <span
                        className={`badge badge-${r.operatorRole === 'supervisor' ? 'supervisor' : 'nurse'}`}
                        style={{ marginLeft: 6 }}
                      >
                        {ROLE_LABEL[r.operatorRole]}</span>
                    </div>
                    <div className="tl-action">{r.action}</div>
                    <div className="tl-diff">{r.remark}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {user.role === 'supervisor' && record.audits.length > 0 && (
            <div className="section">
              <div className="section-title">
                审计日志（{record.audits.length} 条）- 仅主管可见</div>
              <div className="history-banner">
                🔒 此区域仅护理员账号不可见。所有人工改判覆盖旧理由时，完整历史变更全部保留在此处，便于复查。
              </div>
              <div className="timeline">
                {record.audits.map((a) => (
                  <div key={a.id} className="timeline-item audit">
                    <div className="tl-time">{a.timestamp}</div>
                    <div className="tl-operator">
                      {a.operatorName}
                      <span
                        className={`badge badge-${a.operatorRole === 'supervisor' ? 'supervisor' : 'nurse'}`}
                        style={{ marginLeft: 6 }}
                      >
                        {ROLE_LABEL[a.operatorRole]}
                      </span>
                    </div>
                    <div className="tl-action">{a.action}</div>
                    {(a.oldValue || a.oldStatus) && (a.newValue || a.newStatus) && (
                      <div className="tl-diff">
                        {a.oldStatus && a.newStatus && (
                          <div>
                            状态：
                            <span className="old-val">
                              {STATUS_LABEL[a.oldStatus]}
                            </span>
                            {' → '}
                            <span className="new-val">
                              {STATUS_LABEL[a.newStatus]}
                            </span>
                          </div>
                        )}
                        {a.oldValue && a.newValue && (
                          <div>
                            理由/内容：
                            <span className="old-val">
                              {a.oldValue}
                            </span>
                            {' → '}
                            <span className="new-val">
                              {a.newValue}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showOverrideModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>人工改判（覆盖旧理由，旧审计保留</h3>
            <div className="form-group">
              <label>新状态</label>
              <select
                value={overrideStatus}
                onChange={(e) =>
                  setOverrideStatus(e.target.value as VerificationStatus)}
              >
                <option value="verified">已核销</option>
                <option value="rejected">已驳回</option>
                <option value="manual_override">人工改判</option>
                <option value="partially_verified">部分成功</option>
              </select>
            </div>
            <div className="form-group">
              <label>新处理理由（将覆盖当前理由（旧理由将保留在审计日志</label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="请输入新的处理理由"
              />
            </div>
            <div className="alert alert-info" style={{ marginTop: 0 }}>
              <span>ℹ️</span>
              <div>
                改判后旧状态和理由将覆盖当前内容，但旧理由变更历史将完整保留在审计日志中，供后续可回溯。
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowOverrideModal(false)}
              >
                取消
              </button>
              <button className="btn btn-primary" onClick={handleOverride}>
                确认改判
              </button>
            </div>
          </div>
        </div>
      )}

      {showRectModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>提交整改记录</h3>
            <div className="form-group">
              <label>整改动作</label>
              <input
                value={rectAction}
                onChange={(e) => setRectAction(e.target.value)}
                placeholder="例如：补充了照片、修正次数等"
              />
            </div>
            <div className="form-group">
              <label>整改说明</label>
              <textarea
                value={rectRemark}
                onChange={(e) => setRectRemark(e.target.value)}
                placeholder="请输入详细说明"
              />
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowRectModal(false)}
              >
                取消
              </button>
              <button className="btn btn-primary" onClick={handleRectSubmit}>
                提交
              </button>
            </div>
          </div>
        </div>
      )}

      {showDateOrderModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>处理日期倒序（允许部分成功</h3>
            <div className="form-group">
              <label>确认有效次数</label>
              <input
                type="number"
                value={dateOrderCount}
                onChange={(e) => setDateOrderCount(Number(e.target.value))}
                placeholder="请输入确认有效次数"
              />
            </div>
            <div className="form-group">
              <label>处理备注</label>
              <textarea
                value={dateOrderNote}
                onChange={(e) => setDateOrderNote(e.target.value)}
                placeholder="例如：已核对护理日志，确认其中X条记录真实有效"
              />
            </div>
            <div className="alert alert-info" style={{ marginTop: 0 }}>
              <span>ℹ️</span>
              <div>
                日期倒序场景下允许部分成功，不要求全部驳回。审计日志保留完整审计痕迹。
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDateOrderModal(false)}
              >
                取消
              </button>
              <button className="btn btn-primary" onClick={handleDateOrderSubmit}>
                确认部分成功
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
