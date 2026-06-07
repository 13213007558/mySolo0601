import React, { useState } from 'react';
import axios from 'axios';

export default function RecordForm({ mode, record, currentUser, onClose, onSuccess }) {
  const [children, setChildren] = React.useState([]);
  const [form, setForm] = useState({
    child_id: record?.child_id || '',
    record_date: record?.record_date || new Date().toISOString().split('T')[0],
    sleep_start: record?.sleep_start || '',
    sleep_end: record?.sleep_end || '',
    sleep_duration: record?.sleep_duration || '',
    sleep_quality: record?.sleep_quality || '',
    environment: record?.environment || '',
    notes: record?.notes || ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoProvided, setPhotoProvided] = useState(record?.photo_path ? true : false);
  const [allowPartial, setAllowPartial] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [warnMsg, setWarnMsg] = useState('');

  React.useEffect(() => {
    axios.get('/api/children').then(r => setChildren(r.data));
  }, []);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError('');
    setWarnMsg('');
    if (!form.child_id) { setError('请选择儿童'); return; }
    if (!form.record_date) { setError('请选择记录日期'); return; }

    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.keys(form).forEach(k => fd.append(k, form[k]));
      if (photoFile) fd.append('photo', photoFile);
      fd.append('created_by', currentUser);
      fd.append('operator', currentUser);
      fd.append('photo_provided', photoProvided);
      fd.append('allow_partial', allowPartial);

      let resp;
      if (mode === 'create') {
        resp = await axios.post('/api/records', fd);
        if (resp.data.partial_success) {
          setWarnMsg('✅ 记录已部分保存（照片缺失）。异常情况已计入审计记录，方便主管复查。');
          setTimeout(() => onSuccess && onSuccess(resp.data), 1500);
          return;
        }
      } else {
        resp = await axios.put(`/api/records/${record.id}`, fd);
      }
      onSuccess && onSuccess(resp.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      if (err.response?.data?.partial_success === false) {
        setWarnMsg('💡 提示：如果照片暂时无法上传，可勾选"允许部分成功（照片缺失留痕）"后重试。');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-mask" onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}>
      <div className="modal">
        <h3>{mode === 'create' ? '＋ 新增睡眠观察记录' : '✏️ 修改记录'}</h3>

        {error && <div className="alert alert-danger">{error}</div>}
        {warnMsg && <div className="alert alert-warning">{warnMsg}</div>}

        <div className="checkbox-row">
          <input type="checkbox" id="photoProvided" checked={photoProvided} onChange={(e) => setPhotoProvided(e.target.checked)} />
          <label htmlFor="photoProvided">我将上传现场观察照片</label>
        </div>

        {photoProvided && (
          <>
            <div className="form-group">
              <label>观察照片 {record?.photo_path && <span style={{ color: '#909399', fontSize: 12 }}>（已有照片，不选则保留原照片）</span>}</label>
              <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} />
            </div>
            {record?.photo_path && (
              <div style={{ marginBottom: 12 }}>
                <img src={record.photo_path} style={{ maxHeight: 100, borderRadius: 6 }} alt="当前照片" />
              </div>
            )}
            <div className="checkbox-row" style={{ background: '#fef0f0' }}>
              <input type="checkbox" id="allowPartial" checked={allowPartial} onChange={(e) => setAllowPartial(e.target.checked)} />
              <label htmlFor="allowPartial" style={{ color: '#f56c6c' }}>⚠️ 允许部分成功（照片缺失时仍保存，计入异常审计，主管可复查）</label>
            </div>
          </>
        )}

        <div className="form-row">
          <div className="form-group">
            <label><span className="req">*</span> 儿童姓名</label>
            <select value={form.child_id} onChange={(e) => update('child_id', e.target.value)}>
              <option value="">请选择</option>
              {children.map(c => <option key={c.id} value={c.id}>{c.name}（{c.gender || '-'} / {c.birth_date || '-'}）</option>)}
            </select>
          </div>
          <div className="form-group">
            <label><span className="req">*</span> 记录日期</label>
            <input type="date" value={form.record_date} onChange={(e) => update('record_date', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>入睡时间</label>
            <input type="time" value={form.sleep_start} onChange={(e) => update('sleep_start', e.target.value)} />
          </div>
          <div className="form-group">
            <label>起床时间</label>
            <input type="time" value={form.sleep_end} onChange={(e) => update('sleep_end', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>睡眠时长（小时）</label>
            <input type="number" step="0.25" value={form.sleep_duration} onChange={(e) => update('sleep_duration', e.target.value)} placeholder="例如 2.5" />
          </div>
          <div className="form-group">
            <label>睡眠质量</label>
            <select value={form.sleep_quality} onChange={(e) => update('sleep_quality', e.target.value)}>
              <option value="">请选择</option>
              <option value="良好">良好</option>
              <option value="一般">一般</option>
              <option value="较差">较差</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>环境情况</label>
          <select value={form.environment} onChange={(e) => update('environment', e.target.value)}>
            <option value="">请选择</option>
            <option value="安静">安静</option>
            <option value="较吵">较吵</option>
            <option value="吵闹">吵闹</option>
          </select>
        </div>

        <div className="form-group">
          <label>备注</label>
          <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="其他观察情况或需要说明的问题"></textarea>
        </div>

        <div className="form-actions">
          <button className="btn btn-default" onClick={onClose} disabled={submitting}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? '提交中...' : (mode === 'create' ? '保存并提交复核' : '保存修改')}
          </button>
        </div>
      </div>
    </div>
  );
}
