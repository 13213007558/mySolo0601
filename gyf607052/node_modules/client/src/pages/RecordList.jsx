import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchRecords, exportRecords } from '../api.js';
import socket from '../socket.js';
import CreateModal from '../components/CreateModal.jsx';

const STATUS_ORDER = ['待确认', '正常', '异常', '人工改判', '厨房备料中', '已完成'];
const STATUS_CLASS = {
  '待确认': 'status-pending',
  '正常': 'status-normal',
  '异常': 'status-abnormal',
  '人工改判': 'status-manual',
  '厨房备料中': 'status-preparing',
  '已完成': 'status-completed'
};

export default function RecordList() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [showBad, setShowBad] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadRecords = async () => {
    const data = await fetchRecords(showBad);
    setRecords(data);
  };

  useEffect(() => {
    loadRecords();
  }, [showBad]);

  useEffect(() => {
    const onUpdate = (payload) => {
      if (payload.type === 'create') {
        setRecords(prev => [payload.record, ...prev.filter(r => r.id !== payload.record.id)]);
      } else if (payload.type === 'update') {
        setRecords(prev => prev.map(r => r.id === payload.record.id ? payload.record : r));
      }
    };
    socket.on('records:update', onUpdate);
    return () => socket.off('records:update', onUpdate);
  }, []);

  const filteredRecords = activeTab === 'all'
    ? records.filter(r => !r.isBadData)
    : activeTab === 'bad'
      ? records.filter(r => r.isBadData)
      : records.filter(r => r.status === activeTab && !r.isBadData);

  const abnormalCount = records.filter(r => r.status === '异常' && !r.isBadData).length;
  const pendingCount = records.filter(r => r.status === '待确认' && !r.isBadData).length;
  const badCount = records.filter(r => r.isBadData).length;

  const handleExport = async () => {
    setExporting(true);
    try {
      const ids = records.filter(r => !r.isBadData).map(r => r.id);
      const summary = await exportRecords(ids);
      console.log('导出数据', summary);
      navigate('/export');
    } finally {
      setExporting(false);
    }
  };

  const tabs = [
    { key: 'all', label: '全部' },
    { key: '待确认', label: '待确认', count: pendingCount },
    { key: '异常', label: '异常', count: abnormalCount },
    { key: '正常', label: '正常' },
    { key: '人工改判', label: '人工改判' },
    { key: '厨房备料中', label: '厨房备料' }
  ];

  return (
    <div>
      <div className="tabs">
        {tabs.map(tab => (
          <div
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.count > 0 && <span className="badge-count">{tab.count}</span>}
          </div>
        ))}
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ flex: 1, minWidth: 120 }}>
          + 新建记录
        </button>
        <button className="btn btn-secondary" onClick={handleExport} disabled={exporting} style={{ flex: 1, minWidth: 120 }}>
          {exporting ? '导出中...' : '导出摘要'}
        </button>
        <button
          className="btn"
          style={{ flex: 1, minWidth: 120, background: showBad ? '#fee2e2' : '#f3f4f6', color: showBad ? '#991b1b' : '#374151' }}
          onClick={() => setShowBad(!showBad)}
        >
          {showBad ? '隐藏' : '查看'}坏数据 {badCount > 0 && <span className="badge-count">{badCount}</span>}
        </button>
      </div>

      {activeTab === 'bad' && (
        <div className="note-warn" style={{ margin: '0 16px 12px' }}>
          以下为已隔离的坏数据，不会出现在正常列表和导出中
        </div>
      )}

      <div className="record-list">
        {filteredRecords.length === 0 ? (
          <div className="empty">暂无记录</div>
        ) : (
          filteredRecords.map(record => (
            <div
              key={record.id}
              className="record-card"
              onClick={() => navigate(`/record/${record.id}`)}
              style={record.isBadData ? { opacity: 0.6, borderStyle: 'dashed' } : {}}
            >
              <div className="record-header">
                <div>
                  <div className="record-title">
                    {record.childName}
                    {record.isSupplemented && <span className="supplement-badge">已补录</span>}
                    {record.isBadData && <span className="supplement-badge" style={{ background: '#fee2e2', color: '#991b1b' }}>坏数据</span>}
                  </div>
                  <div className="record-meta">
                    {record.tableNo} · {record.age}岁 · {record.parentName}
                  </div>
                </div>
                <span className={`status-badge ${STATUS_CLASS[record.status] || ''}`}>{record.status}</span>
              </div>

              {record.isBadData && (
                <div className="issue-item">
                  <div className="issue-type">隔离原因</div>
                  <div className="issue-detail">{record.badDataReason}</div>
                </div>
              )}

              {record.issues && record.issues.length > 0 && (
                <div className="issue-item">
                  <div className="issue-type">{record.issues[0].type}</div>
                  <div className="issue-detail">{record.issues[0].detail}</div>
                </div>
              )}

              <div className="allergy-tags">
                {record.allergies.map((a, i) => (
                  <span key={i} className="tag tag-allergy">过敏：{a}</span>
                ))}
                {record.taboos.map((t, i) => (
                  <span key={i} className="tag tag-taboo">禁忌：{t}</span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadRecords(); }}
        />
      )}
    </div>
  );
}
