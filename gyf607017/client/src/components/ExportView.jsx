import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ExportView({ currentUser }) {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    axios.get('/api/export/summary').then(r => setSummary(r.data));
  }, []);

  if (!summary) return <div style={{ padding: 40, textAlign: 'center' }}>加载中...</div>;

  const download = (url, name) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
  };

  const abnormalAudits = summary.audits.filter(a =>
    (a.remark || '').includes('部分') || (a.remark || '').includes('异常')
  );

  return (
    <div>
      <div className="card">
        <h2 style={{ marginBottom: 8, color: '#303133' }}>📊 数据汇总 & 导出</h2>
        <div className="summary-box">{summary.stats.summary}</div>
        <div className="export-row">
          <button className="btn btn-primary" onClick={() => download('/api/export/csv', 'sleep_records.csv')}>
            📥 导出观察记录 CSV
          </button>
          <button className="btn btn-warning" onClick={() => download('/api/export/audit/csv', 'audit_log.csv')}>
            🔍 导出审计日志 CSV
          </button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 14, color: '#303133' }}>⚠️ 异常 / 部分成功记录审计（主管复查用）</h3>
        <div style={{ fontSize: 13, color: '#909399', marginBottom: 12 }}>
          以下记录被计入正常汇总，但存在异常情况（如照片缺失、部分成功等），主管可在此复查：
        </div>
        {abnormalAudits.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: '#909399' }}>暂无异常记录 ✅</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>时间</th>
                <th>儿童</th>
                <th>操作</th>
                <th>异常说明</th>
                <th>操作人</th>
                <th>旧值 → 新值</th>
              </tr>
            </thead>
            <tbody>
              {abnormalAudits.map(a => (
                <tr key={a.id}>
                  <td style={{ fontSize: 12, color: '#909399' }}>{a.created_at}</td>
                  <td>{a['儿童姓名']}</td>
                  <td><span className="tag tag-warning">{a['操作类型']}</span></td>
                  <td style={{ color: '#f56c6c' }}>{a.remark}</td>
                  <td>{a.operator}</td>
                  <td style={{ fontSize: 12 }}>
                    {a.old_value && <div style={{ color: '#f56c6c' }}>旧：{a.old_value}</div>}
                    {a.new_value && <div style={{ color: '#67c23a' }}>新：{a.new_value}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 14, color: '#303133' }}>📋 完整审计日志</h3>
        <table>
          <thead>
            <tr>
              <th style={{ width: 140 }}>时间</th>
              <th>儿童</th>
              <th>操作类型</th>
              <th>操作人</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {summary.audits.map(a => (
              <tr key={a.id}>
                <td style={{ fontSize: 12, color: '#909399' }}>{a.created_at}</td>
                <td>{a['儿童姓名']}</td>
                <td>{a['操作类型']}</td>
                <td>{a.operator}</td>
                <td style={{ fontSize: 12, color: (a.remark || '').includes('部分') || (a.remark || '').includes('异常') ? '#f56c6c' : '#606266' }}>{a.remark || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
