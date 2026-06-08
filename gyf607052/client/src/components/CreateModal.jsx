import React, { useState } from 'react';
import { createRecord } from '../api.js';

export default function CreateModal({ onClose, onCreated }) {
  const [childName, setChildName] = useState('');
  const [age, setAge] = useState('');
  const [parentName, setParentName] = useState('');
  const [tableNo, setTableNo] = useState('');
  const [allergies, setAllergies] = useState('');
  const [taboos, setTaboos] = useState('');
  const [specialNote, setSpecialNote] = useState('');

  const handleSubmit = async () => {
    if (!childName || !age || !tableNo) {
      alert('请填写儿童姓名、年龄和桌号');
      return;
    }
    const data = {
      childName,
      age: parseInt(age) || 0,
      parentName,
      tableNo,
      allergies: allergies ? allergies.split(/[、,，]/).map(s => s.trim()).filter(Boolean) : [],
      taboos: taboos ? taboos.split(/[、,，]/).map(s => s.trim()).filter(Boolean) : [],
      specialNote,
      operator: '现场服务员'
    };
    await createRecord(data);
    onCreated();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>新建婴幼儿辅食禁忌记录</h2>

        <div className="form-group">
          <label>儿童姓名 <span style={{ color: '#ef4444' }}>*</span></label>
          <input
            className="form-input"
            value={childName}
            onChange={e => setChildName(e.target.value)}
            placeholder="请输入儿童姓名"
          />
        </div>
        <div className="form-group">
          <label>年龄（岁）<span style={{ color: '#ef4444' }}>*</span></label>
          <input
            className="form-input"
            type="number"
            min="0"
            max="12"
            value={age}
            onChange={e => setAge(e.target.value)}
            placeholder="例如：3"
          />
        </div>
        <div className="form-group">
          <label>家长姓名</label>
          <input
            className="form-input"
            value={parentName}
            onChange={e => setParentName(e.target.value)}
            placeholder="请输入家长姓名"
          />
        </div>
        <div className="form-group">
          <label>桌号 <span style={{ color: '#ef4444' }}>*</span></label>
          <input
            className="form-input"
            value={tableNo}
            onChange={e => setTableNo(e.target.value)}
            placeholder="例如：A12"
          />
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
            placeholder="其他需要说明的情况，例如：家长补充的额外过敏信息"
          />
        </div>

        <div className="btn-group">
          <button className="btn btn-secondary" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit}>提交录入</button>
        </div>
      </div>
    </div>
  );
}
