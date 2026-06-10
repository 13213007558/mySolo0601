import { useState } from 'react';

export default function RepairApplicationModal({ hole, mode = 'apply', application, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    reason: mode === 'apply' ? '' : (application?.reason || ''),
    applicant: mode === 'apply' ? '' : (application?.applicant || ''),
    comment: '',
    supplemental: ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (mode === 'apply') {
      onSubmit && onSubmit({
        reason: formData.reason,
        applicant: formData.applicant
      });
    } else if (mode === 'review') {
      onSubmit && onSubmit({
        status: formData.comment ? 'rejected' : 'approved',
        comment: formData.comment
      });
    } else if (mode === 'reapply') {
      onSubmit && onSubmit({
        reason: formData.reason,
        applicant: formData.applicant,
        supplemental: formData.supplemental
      });
    }
  };

  const handleApprove = () => {
    onSubmit && onSubmit({ status: 'approved', comment: '' });
  };

  const handleReject = () => {
    if (!formData.comment.trim()) {
      alert('请填写退回原因');
      return;
    }
    onSubmit && onSubmit({ status: 'rejected', comment: formData.comment });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content repair-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {mode === 'apply' && '申请补开'}
            {mode === 'review' && '审核补开申请'}
            {mode === 'reapply' && '重新申请补开'}
            {mode === 'view' && '补开申请详情'}
          </h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="hole-info">
            <p><strong>洞口编号：</strong>{hole?.code}</p>
            <p><strong>楼层/轴线：</strong>{hole?.floor} {hole?.axis}</p>
            <p><strong>专业：</strong>{hole?.profession}</p>
          </div>

          {mode === 'view' && application && (
            <div className="application-detail">
              <h4>申请信息</h4>
              <p><strong>申请人：</strong>{application.applicant}</p>
              <p><strong>申请时间：</strong>{formatDate(application.createdAt)}</p>
              <p><strong>申请原因：</strong>{application.reason}</p>
              <p><strong>当前状态：</strong>
                <span className={`status-badge status-${getStatusColor(application.status)}`}>
                  {getStatusLabel(application.status)}
                </span>
              </p>

              {application.supplemental && (
                <div className="supplemental-info">
                  <p><strong>补充材料：</strong>{application.supplemental}</p>
                  <p><strong>补充时间：</strong>{formatDate(application.supplementedAt)}</p>
                </div>
              )}

              {application.reviewComment && (
                <div className="review-info">
                  <p><strong>审核意见：</strong>{application.reviewComment}</p>
                  <p><strong>审核人：</strong>{application.reviewedBy}</p>
                  <p><strong>审核时间：</strong>{formatDate(application.reviewedAt)}</p>
                </div>
              )}
            </div>
          )}

          {mode === 'apply' && (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>申请人 *</label>
                <input
                  type="text"
                  value={formData.applicant}
                  onChange={(e) => handleChange('applicant', e.target.value)}
                  placeholder="请输入申请人姓名"
                  required
                />
              </div>
              <div className="form-group">
                <label>申请原因 *</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => handleChange('reason', e.target.value)}
                  placeholder="请说明补开原因、洞口位置等详情"
                  rows={4}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={onClose}>取消</button>
                <button type="submit" className="btn btn-primary">提交申请</button>
              </div>
            </form>
          )}

          {mode === 'reapply' && (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>申请人 *</label>
                <input
                  type="text"
                  value={formData.applicant}
                  onChange={(e) => handleChange('applicant', e.target.value)}
                  placeholder="请输入申请人姓名"
                  required
                />
              </div>
              <div className="form-group">
                <label>申请原因 *</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => handleChange('reason', e.target.value)}
                  placeholder="请说明补开原因"
                  rows={3}
                  required
                />
              </div>
              <div className="form-group">
                <label>补充材料说明</label>
                <textarea
                  value={formData.supplemental}
                  onChange={(e) => handleChange('supplemental', e.target.value)}
                  placeholder="请描述补充了哪些材料（图纸、照片等）"
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={onClose}>取消</button>
                <button type="submit" className="btn btn-primary">重新提交</button>
              </div>
            </form>
          )}

          {mode === 'review' && application && (
            <div className="review-form">
              <div className="application-detail">
                <p><strong>申请人：</strong>{application.applicant}</p>
                <p><strong>申请时间：</strong>{formatDate(application.createdAt)}</p>
                <p><strong>申请原因：</strong>{application.reason}</p>
              </div>
              <div className="form-group">
                <label>审核意见（退回时必填）</label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => handleChange('comment', e.target.value)}
                  placeholder="如退回，请填写退回原因"
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={onClose}>取消</button>
                <button type="button" className="btn btn-success" onClick={handleApprove}>批准</button>
                <button type="button" className="btn btn-danger" onClick={handleReject}>退回</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN');
}

function getStatusLabel(status) {
  const map = {
    pending: '待审核',
    approved: '已批准',
    rejected: '已退回'
  };
  return map[status] || status;
}

function getStatusColor(status) {
  const map = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error'
  };
  return map[status] || 'default';
}
