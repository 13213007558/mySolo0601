import { useState } from 'react';
import { formatSize } from '../utils/sizeParser';
import RepairApplicationModal from './RepairApplicationModal';

export default function HoleCard({ hole, onEdit, onDelete, onAddRepair, onReview, onReapply }) {
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [repairMode, setRepairMode] = useState('apply');
  const [selectedApp, setSelectedApp] = useState(null);
  const [showPhotos, setShowPhotos] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const issueTypeMap = {
    normal: { label: '正常', color: 'success' },
    missing: { label: '缺洞', color: 'error' },
    deviation: { label: '偏位', color: 'warning' }
  };

  const repairStatusMap = {
    pending: { label: '待审核', color: 'warning' },
    approved: { label: '已批准', color: 'success' },
    rejected: { label: '已退回', color: 'error' }
  };

  const latestRepairApp = hole.repairApplications && hole.repairApplications.length > 0
    ? hole.repairApplications[hole.repairApplications.length - 1]
    : null;

  const handleAddRepair = () => {
    if (latestRepairApp && latestRepairApp.status === 'rejected') {
      setRepairMode('reapply');
    } else {
      setRepairMode('apply');
    }
    setShowRepairModal(true);
  };

  const handleViewRepair = (app) => {
    setSelectedApp(app);
    setRepairMode('view');
    setShowRepairModal(true);
  };

  const handleReviewRepair = (app) => {
    setSelectedApp(app);
    setRepairMode('review');
    setShowRepairModal(true);
  };

  const handleRepairSubmit = (data) => {
    if (repairMode === 'apply') {
      onAddRepair && onAddRepair(hole.id, data);
    } else if (repairMode === 'review' && selectedApp) {
      onReview && onReview(hole.id, selectedApp.id, data);
    } else if (repairMode === 'reapply') {
      onReapply && onReapply(hole.id, data);
    }
    setShowRepairModal(false);
    setSelectedApp(null);
  };

  const issueInfo = issueTypeMap[hole.issueType] || issueTypeMap.normal;
  const repairInfo = latestRepairApp ? repairStatusMap[latestRepairApp.status] : null;

  return (
    <div className={`hole-card issue-${issueInfo.color}`}>
      <div className="card-header">
        <div className="hole-code">{hole.code}</div>
        <div className="hole-tags">
          <span className={`tag tag-${issueInfo.color}`}>{issueInfo.label}</span>
          {repairInfo && (
            <span className={`tag tag-${repairInfo.color}`}>
              补开：{repairInfo.label}
            </span>
          )}
          {hole.isProblem && (
            <span className="tag tag-problem">问题清单</span>
          )}
        </div>
      </div>

      <div className="card-body">
        <div className="info-row">
          <span className="label">楼层：</span>
          <span className="value">{hole.floor}</span>
        </div>
        <div className="info-row">
          <span className="label">轴线：</span>
          <span className="value">{hole.axis}</span>
        </div>
        <div className="info-row">
          <span className="label">专业：</span>
          <span className="value">{hole.profession}</span>
        </div>
        <div className="info-row">
          <span className="label">尺寸：</span>
          <span className="value">
            {hole.size?.valid
              ? formatSize(hole.size)
              : <span className="text-error">{hole.sizeRaw}（解析失败）</span>}
          </span>
        </div>
        {hole.description && (
          <div className="info-row description">
            <span className="label">描述：</span>
            <span className="value">{hole.description}</span>
          </div>
        )}

        {hole.photos && hole.photos.length > 0 && (
          <div className="photo-section">
            <div className="photo-section-header" onClick={() => setShowPhotos(!showPhotos)}>
              <span>照片 ({hole.photos.length}张)</span>
              <span className="toggle-icon">{showPhotos ? '▲' : '▼'}</span>
            </div>
            {showPhotos && (
              <div className="photo-thumbs">
                {hole.photos.map((photo, idx) => (
                  <img
                    key={idx}
                    src={photo}
                    alt={`照片${idx + 1}`}
                    className="photo-thumb"
                    onClick={() => setPreviewPhoto(photo)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {hole.repairApplications && hole.repairApplications.length > 0 && (
          <div className="repair-history">
            <div className="repair-history-header">
              <span>补开申请记录 ({hole.repairApplications.length}条)</span>
            </div>
            <div className="repair-list">
              {hole.repairApplications.map((app, idx) => (
                <div
                  key={app.id}
                  className={`repair-item status-${repairStatusMap[app.status]?.color || 'default'}`}
                  onClick={() => handleViewRepair(app)}
                >
                  <span className="repair-index">第{idx + 1}次</span>
                  <span className={`repair-status status-${repairStatusMap[app.status]?.color || 'default'}`}>
                    {repairStatusMap[app.status]?.label || app.status}
                  </span>
                  <span className="repair-date">
                    {new Date(app.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card-footer">
        <button className="btn btn-sm btn-secondary" onClick={() => onEdit && onEdit(hole)}>
          编辑
        </button>
        {hole.issueType !== 'normal' && (
          <button
            className="btn btn-sm btn-primary"
            onClick={handleAddRepair}
          >
            {latestRepairApp?.status === 'rejected' ? '重新申请' : '申请补开'}
          </button>
        )}
        {latestRepairApp && latestRepairApp.status === 'pending' && (
          <button
            className="btn btn-sm btn-success"
            onClick={() => handleReviewRepair(latestRepairApp)}
          >
            审核
          </button>
        )}
        <button
          className="btn btn-sm btn-danger"
          onClick={() => {
            if (confirm('确定要删除这条记录吗？')) {
              onDelete && onDelete(hole.id);
            }
          }}
        >
          删除
        </button>
      </div>

      {showRepairModal && (
        <RepairApplicationModal
          hole={hole}
          mode={repairMode}
          application={selectedApp}
          onSubmit={handleRepairSubmit}
          onClose={() => {
            setShowRepairModal(false);
            setSelectedApp(null);
          }}
        />
      )}

      {previewPhoto && (
        <div className="photo-preview-modal" onClick={() => setPreviewPhoto(null)}>
          <img src={previewPhoto} alt="预览" className="preview-image" />
          <button className="preview-close" onClick={() => setPreviewPhoto(null)}>×</button>
        </div>
      )}
    </div>
  );
}
