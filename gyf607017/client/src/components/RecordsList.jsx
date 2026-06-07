import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RecordForm from './RecordForm.jsx';

const STATUS_MAP = {
  draft: { label: '草稿', cls: 'tag-draft' },
  pending: { label: '待复核', cls: 'tag-pending' },
  rejected: { label: '已退回', cls: 'tag-rejected' },
  approved: { label: '已通过', cls: 'tag-approved' },
  closed: { label: '已归档', cls: 'tag-closed' }
};

export default function RecordsList({ currentUser, onSelect, onRefresh }) {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [r, e] = await Promise.all([
      axios.get('/api/records'),
      axios.get('/api/export/summary')
    ]);
    setRecords(r.data);
    setStats(e.data.stats);
  };

  const filtered = filter === 'all' ? records : records.filter(r => r.status === filter);

  return (
    <div>
      <div className="stats-row">
        <div className="stat-card"><div className="label">记录总数</div><div className="value">{stats?.total || 0}</div></div>
        <div className="stat-card warning"><div className="label">待复核</div><div className="value">{stats?.pending || 0}</div></div>
        <div className="stat-card danger"><div className="label">已退回</div><div className="value">{stats?.rejected || 0}</div></div>
        <div className="stat-card success"><div className="label">已通过</div><div className="value">{stats?.approved || 0}</div></div>
        <div className="stat-card muted"><div className="label">已归档</div><div className="value">{stats?.closed || 0}</div></div>
        <div className="stat-card danger"><div className="label">照片缺失（部分成功）</div><div className="value">{stats?.photo_missing || 0}</div><div className="sub">异常数据已纳入汇总但保留审计</div></div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['all','全部'],['draft','草稿'],['pending','待复核'],['rejected','已退回'],['approved','已通过'],['closed','已归档']].map(([v,l]) => (
              <button key={v} className={`btn btn-sm ${filter === v ? 'btn-primary' : 'btn-default'}`} onClick={() => setFilter(v)}>{l}</button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ 新增记录</button>
        </div>

        <table>
          <thead>
            <tr>
              <th>日期</th>
              <th>儿童姓名</th>
              <th>睡眠时长</th>
              <th>睡眠质量</th>
              <th>环境</th>
              <th>状态</th>
              <th>录入人</th>
              <th>最后更新</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id}>
                <td>{r.record_date}</td>
                <td>{r.child_name}{r.photo_missing ? <span className="tag tag-missing">⚠️照片缺失</span> : null}</td>
                <td>{r.sleep_duration ? `${r.sleep_duration}小时` : '-'}</td>
                <td>{r.sleep_quality || '-'}</td>
                <td>{r.environment || '-'}</td>
                <td><span className={`tag ${STATUS_MAP[r.status].cls}`}>{STATUS_MAP[r.status].label}</span></td>
                <td>{r.created_by}</td>
                <td style={{ fontSize: 12, color: '#909399' }}>{r.updated_at}</td>
                <td>
                  <button className="btn btn-sm btn-primary" onClick={() => onSelect(r.id)}>查看时间线</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#909399' }}>暂无记录</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <RecordForm
          mode="create"
          currentUser={currentUser}
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); fetchData(); onRefresh(); }}
        />
      )}
    </div>
  );
}
