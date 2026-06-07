import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ChildrenView({ onRefresh }) {
  const [children, setChildren] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', gender: '', birth_date: '', guardian: '', phone: '', address: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => { axios.get('/api/children').then(r => setChildren(r.data)); }, []);

  const submit = async () => {
    setMsg('');
    if (!form.name) { setMsg('请输入姓名'); return; }
    try {
      await axios.post('/api/children', form);
      setShowAdd(false);
      setForm({ name: '', gender: '', birth_date: '', guardian: '', phone: '', address: '' });
      axios.get('/api/children').then(r => setChildren(r.data));
      onRefresh();
    } catch (err) {
      setMsg(err.response?.data?.error || err.message);
    }
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ color: '#303133' }}>👶 儿童档案管理</h2>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ 新增儿童</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>姓名</th>
              <th>性别</th>
              <th>出生日期</th>
              <th>监护人</th>
              <th>联系电话</th>
              <th>地址</th>
              <th>建档时间</th>
            </tr>
          </thead>
          <tbody>
            {children.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: 500 }}>{c.name}</td>
                <td>{c.gender || '-'}</td>
                <td>{c.birth_date || '-'}</td>
                <td>{c.guardian || '-'}</td>
                <td>{c.phone || '-'}</td>
                <td>{c.address || '-'}</td>
                <td style={{ fontSize: 12, color: '#909399' }}>{c.created_at}</td>
              </tr>
            ))}
            {children.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#909399' }}>暂无儿童档案，请先导入样例数据或手动添加</td></tr>}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="modal-mask" onClick={(e) => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div className="modal">
            <h3>＋ 新增儿童档案</h3>
            {msg && <div className="alert alert-danger">{msg}</div>}
            <div className="form-row">
              <div className="form-group"><label><span className="req">*</span> 姓名</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="form-group"><label>性别</label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="">请选择</option>
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>出生日期</label><input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} /></div>
              <div className="form-group"><label>监护人</label><input value={form.guardian} onChange={(e) => setForm({ ...form, guardian: e.target.value })} /></div>
            </div>
            <div className="form-group"><label>联系电话</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="form-group"><label>地址</label><textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="form-actions">
              <button className="btn btn-default" onClick={() => setShowAdd(false)}>取消</button>
              <button className="btn btn-primary" onClick={submit}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
