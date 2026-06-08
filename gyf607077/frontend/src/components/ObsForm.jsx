import React, { useState } from 'react';
import { api } from '../api';

export default function ObsForm({ onClose, onSaved }) {
  const [form, setForm] = useState({
    baby_name: '',
    sleep_date: new Date().toISOString().slice(0, 10),
    start_time: '',
    end_time: '',
    sleep_quality: '',
    environment: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form.baby_name || !form.sleep_date || !form.start_time) {
      setError('宝宝姓名、睡眠日期、开始时间 必填');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.createObs(form);
      onSaved && onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="detail-panel" style={{ border: '2px dashed #1677ff' }}>
      <h3>📝 录入睡眠观察记录</h3>
      {error && <div className="notice notice-error" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="form-row">
        <div><label>宝宝姓名 *</label><input value={form.baby_name} onChange={(e) => setForm({ ...form, baby_name: e.target.value })} placeholder="如:豆豆" /></div>
        <div><label>睡眠日期 *</label><input type="date" value={form.sleep_date} onChange={(e) => setForm({ ...form, sleep_date: e.target.value })} /></div>
        <div><label>开始时间 *</label><input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div>
        <div><label>结束时间</label><input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} /></div>
      </div>
      <div className="form-row">
        <div>
          <label>睡眠质量</label>
          <select value={form.sleep_quality} onChange={(e) => setForm({ ...form, sleep_quality: e.target.value })}>
            <option value="">请选择</option>
            <option value="good">😊 良好</option>
            <option value="normal">🙂 一般</option>
            <option value="poor">😟 较差</option>
          </select>
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label>睡眠环境</label>
          <input value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })} placeholder="如:卧室安静,温度26度,开空调" />
        </div>
      </div>
      <div className="form-row">
        <div style={{ gridColumn: '1 / -1' }}>
          <label>观察备注</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="例如:中途夜醒1次,喂奶后继续睡;有轻微咳嗽等" />
        </div>
      </div>
      <div className="btn-group">
        <button className="btn btn-primary" disabled={saving} onClick={save}>{saving ? '保存中...' : '保存草稿'}</button>
        <button className="btn" onClick={onClose}>取消</button>
      </div>
    </div>
  );
}
