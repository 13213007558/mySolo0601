import { useState, useMemo } from 'react';
import { parseSize } from '../utils/sizeParser';
import PhotoUploader from './PhotoUploader';
import { floors, professions } from '../data/mockData';

export default function HoleForm({ hole, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(() => ({
    code: hole?.code || '',
    floor: hole?.floor || '',
    axis: hole?.axis || '',
    sizeRaw: hole?.sizeRaw || '',
    profession: hole?.profession || '',
    issueType: hole?.issueType || 'normal',
    description: hole?.description || '',
    photos: hole?.photos || []
  }));

  const sizePreview = useMemo(() => {
    if (!formData.sizeRaw) return null;
    return parseSize(formData.sizeRaw);
  }, [formData.sizeRaw]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const parsed = parseSize(formData.sizeRaw);
    const isProblem = !parsed.valid;

    const holeData = {
      ...formData,
      size: parsed,
      isProblem,
      problemReason: isProblem ? '尺寸解析失败' : null,
      repairApplications: hole?.repairApplications || [],
      status: hole?.status || null
    };

    onSubmit && onSubmit(holeData);
  };

  return (
    <form className="hole-form" onSubmit={handleSubmit}>
      <h3>{hole ? '编辑洞口' : '新增洞口'}</h3>

      <div className="form-row">
        <div className="form-group">
          <label>洞口编号 *</label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => handleChange('code', e.target.value)}
            placeholder="如：SD-001"
            required
          />
        </div>

        <div className="form-group">
          <label>楼层 *</label>
          <select
            value={formData.floor}
            onChange={(e) => handleChange('floor', e.target.value)}
            required
          >
            <option value="">请选择楼层</option>
            {floors.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>轴线位置 *</label>
          <input
            type="text"
            value={formData.axis}
            onChange={(e) => handleChange('axis', e.target.value)}
            placeholder="如：A轴/3轴"
            required
          />
        </div>

        <div className="form-group">
          <label>专业 *</label>
          <select
            value={formData.profession}
            onChange={(e) => handleChange('profession', e.target.value)}
            required
          >
            <option value="">请选择专业</option>
            {professions.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>洞口尺寸 *</label>
          <input
            type="text"
            value={formData.sizeRaw}
            onChange={(e) => handleChange('sizeRaw', e.target.value)}
            placeholder="如：200x300、200*300、宽五百毫米高四百毫米"
            className={sizePreview && !sizePreview.valid ? 'input-error' : ''}
            required
          />
          {sizePreview && (
            <div className={`size-preview ${sizePreview.valid ? 'valid' : 'invalid'}`}>
              {sizePreview.valid
                ? `解析结果：${sizePreview.width}×${sizePreview.height}mm`
                : `⚠ ${sizePreview.error}`}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>问题类型</label>
          <select
            value={formData.issueType}
            onChange={(e) => handleChange('issueType', e.target.value)}
          >
            <option value="normal">正常</option>
            <option value="missing">缺洞</option>
            <option value="deviation">偏位</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>问题描述</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="描述洞口情况、问题原因等"
          rows={3}
        />
      </div>

      <div className="form-group">
        <label>现场照片</label>
        <PhotoUploader
          photos={formData.photos}
          onChange={(photos) => handleChange('photos', photos)}
          maxPhotos={5}
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          取消
        </button>
        <button type="submit" className="btn btn-primary">
          {hole ? '保存修改' : '添加洞口'}
        </button>
      </div>
    </form>
  );
}
