import React, { useState } from 'react';

export default function SupplementModal({ record, onClose, onSubmit }) {
  const [allergies, setAllergies] = useState(record.allergies.join('、'));
  const [taboos, setTaboos] = useState(record.taboos.join('、'));
  const [specialNote, setSpecialNote] = useState(record.specialNote);
  const [supplementNote, setSupplementNote] = useState('');

  const handleSubmit = () => {
    const supplementData = {
      allergies: allergies ? allergies.split(/[、,，]/).map(s => s.trim()).filter(Boolean) : [],
      taboos: taboos ? taboos.split(/[、,，]/).map(s => s.trim()).filter(Boolean) : [],
      specialNote,
      supplementNote
    };
    onSubmit(supplementData);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>手工补录信息</h2>
        <div className="note-warn">
          补录后会保留原始数据，可在详情页查看补录前后差异
        </div>

        <div className="form-group">
          <label>过敏食物（用顿号或逗号分隔）</label>
          <input
            className="form-input"
            value={allergies}
            onChange={e => setAllergies(e.target.value)}
            placeholder="例如：花生、鸡蛋、芒果"
          />
        </div>
        <div className="form-group">
          <label>饮食禁忌（用顿号或逗号分隔）</label>
          <input
            className="form-input"
            value={taboos}
            onChange={e => setTaboos(e.target.value)}
            placeholder="例如：海鲜、坚果类"
          />
        </div>
        <div className="form-group">
          <label>特别说明</label>
          <textarea
            className="form-textarea"
            value={specialNote}
            onChange={e => setSpecialNote(e.target.value)}
            placeholder="其他需要说明的情况"
          />
        </div>
        <div className="form-group">
          <label>补录备注 <span style={{ color: '#ef4444' }}>*</span></label>
          <textarea
            className="form-textarea"
            value={supplementNote}
            onChange={e => setSupplementNote(e.target.value)}
            placeholder="请简要描述补录原因，例如：家长现场补充对芒果也过敏"
          />
        </div>

        <div className="btn-group">
          <button className="btn btn-secondary" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit}>确认补录</button>
        </div>
      </div>
    </div>
  );
}
