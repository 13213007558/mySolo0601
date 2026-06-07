import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const STATUS_LABELS = {
  pending: '待对账',
  matched: '已核对',
  mismatched: '不一致',
  missing_material: '材料缺页',
  bad_data: '坏数据'
};

export default function ListPage() {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({ total: 0, stats: [] });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    babyName: '',
    includeBadData: false
  });
  const navigate = useNavigate();

  const fetchRecords = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.babyName) params.append('babyName', filters.babyName);
    if (filters.includeBadData) params.append('includeBadData', 'true');

    const recordsRes = await fetch(`/api/records?${params.toString()}`);
    const recordsData = await recordsRes.json();
    setRecords(recordsData.records);

    const statsRes = await fetch('/api/stats');
    const statsData = await statsRes.json();
    setStats(statsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchRecords();
  }, [filters]);

  const handleExport = () => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.babyName) params.append('babyName', filters.babyName);
    if (filters.includeBadData) params.append('includeBadData', 'true');

    window.location.href = `/api/export?${params.toString()}`;
  };

  const getStatCount = (status) => {
    const found = stats.stats.find(s => s.status === status);
    return found ? found.count : 0;
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <>
      <div className="stats-bar">
        <div className="stat-card total">
          <div className="label">记录总数</div>
          <div className="value">{stats.total}</div>
        </div>
        <div className="stat-card pending">
          <div className="label">待对账</div>
          <div className="value">{getStatCount('pending')}</div>
        </div>
        <div className="stat-card matched">
          <div className="label">已核对</div>
          <div className="value">{getStatCount('matched')}</div>
        </div>
        <div className="stat-card mismatched">
          <div className="label">不一致/缺页</div>
          <div className="value">{getStatCount('mismatched') + getStatCount('missing_material')}</div>
        </div>
        <div className="stat-card baddata">
          <div className="label">坏数据</div>
          <div className="value">{stats.badCount}</div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <label>状态:</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
          >
            <option value="">全部</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>起始日期:</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
          />
        </div>
        <div className="filter-group">
          <label>截止日期:</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))}
          />
        </div>
        <div className="filter-group">
          <label>幼儿姓名:</label>
          <input
            type="text"
            placeholder="搜索姓名"
            value={filters.babyName}
            onChange={(e) => setFilters(f => ({ ...f, babyName: e.target.value }))}
          />
        </div>
        <label className="checkbox-inline">
          <input
            type="checkbox"
            checked={filters.includeBadData}
            onChange={(e) => setFilters(f => ({ ...f, includeBadData: e.target.checked }))}
          />
          包含坏数据
        </label>
        <div style={{ flex: 1 }} />
        <button className="btn" onClick={fetchRecords}>刷新</button>
        <button className="btn btn-primary" onClick={handleExport}>
          导出门岗对账表
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>日期</th>
              <th>幼儿姓名</th>
              <th>家长</th>
              <th>班级</th>
              <th>群留言(ml)</th>
              <th>纸质单(ml)</th>
              <th>差异(ml)</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan="9">
                  <div className="empty-state">暂无记录</div>
                </td>
              </tr>
            ) : records.map(r => (
              <tr key={r.id} className={r.is_bad_data ? 'bad-data-row' : ''}>
                <td>{r.record_date}</td>
                <td><strong>{r.baby_name}</strong></td>
                <td>{r.parent_name}</td>
                <td>{r.class_name}</td>
                <td>{r.source_chat_amount ?? '-'}</td>
                <td>{r.source_paper_amount ?? '-'}</td>
                <td>
                  {r.discrepancy !== null ? (
                    <span className={
                      r.discrepancy > 0 ? 'discrepancy-pos' :
                      r.discrepancy < 0 ? 'discrepancy-neg' : 'discrepancy-zero'
                    }>
                      {r.discrepancy > 0 ? '+' : ''}{r.discrepancy}
                    </span>
                  ) : '-'}
                </td>
                <td>
                  <span className={`status-tag status-${r.status}`}>
                    {r.status_label}
                  </span>
                </td>
                <td className="actions-cell">
                  <button className="link-btn" onClick={() => navigate(`/record/${r.id}`)}>
                    详情/复核
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
