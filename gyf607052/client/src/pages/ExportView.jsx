import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { exportRecords, fetchRecords } from '../api.js';

export default function ExportView() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const load = async () => {
      const records = await fetchRecords(false);
      const ids = records.map(r => r.id);
      const data = await exportRecords(ids);
      setSummary(data);
    };
    load();
  }, []);

  const handleCopyText = () => {
    if (!summary) return;
    const lines = [];
    lines.push(`【婴幼儿辅食禁忌交接摘要】`);
    lines.push(`生成时间：${summary.generatedAt}`);
    lines.push(`有效记录数：${summary.totalRecords} 条`);
    lines.push(summary.hasDiscrepancy ? `⚠ ${summary.discrepancyReason}` : '');
    lines.push('');
    summary.records.forEach((r, i) => {
      lines.push(`--- 第${i + 1}条 ---`);
      lines.push(`桌号：${r['桌号']}  儿童：${r['儿童姓名']}（${r['年龄']}）  家长：${r['家长']}`);
      lines.push(`当前状态：${r['当前状态']}${r['是否补录'] === '是' ? '（已补录）' : ''}`);
      lines.push(`过敏食物：${r['过敏食物']}`);
      lines.push(`饮食禁忌：${r['饮食禁忌']}`);
      if (r['特别说明'] && r['特别说明'] !== '无') lines.push(`特别说明：${r['特别说明']}`);
      if (r['补录内容']) lines.push(`补录内容：${r['补录内容']}`);
      lines.push(`三日食材：${r['三日食材状态']}`);
      if (r['问题说明'] !== '无') lines.push(`问题说明：${r['问题说明']}`);
      lines.push('');
    });
    lines.push(summary.operatorNote);
    const text = lines.join('\n');
    navigator.clipboard?.writeText(text);
    alert('已复制到剪贴板，可直接转发给同事');
  };

  if (!summary) return <div className="empty">正在生成导出摘要...</div>;

  return (
    <div>
      <button className="back-btn" onClick={() => navigate('/')}>
        ← 返回列表
      </button>
      <div className="detail-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ borderBottom: 'none' }}>导出摘要（可直接转发同事）</h3>
          <button className="btn btn-primary" onClick={handleCopyText}>复制纯文本</button>
        </div>
      </div>

      <div className="export-summary">
        <div className="export-meta">
          <div>生成时间：{summary.generatedAt}</div>
          <div>有效记录数：{summary.totalRecords} 条</div>
          {summary.hasDiscrepancy && (
            <div className="discrepancy-info" style={{ marginTop: 8 }}>
              ⚠ {summary.discrepancyReason}
            </div>
          )}
          <div style={{ marginTop: 6, color: '#4f46e5', fontWeight: 500 }}>
            {summary.operatorNote}
          </div>
        </div>

        {summary.records.map((r, i) => (
          <div key={i} className="export-record">
            <h4>
              {r['桌号']} · {r['儿童姓名']}（{r['年龄']}）
              <span className={`status-badge ${
                r['当前状态'] === '正常' ? 'status-normal' :
                r['当前状态'] === '异常' ? 'status-abnormal' :
                r['当前状态'] === '待确认' ? 'status-pending' :
                r['当前状态'] === '人工改判' ? 'status-manual' :
                r['当前状态'] === '厨房备料中' ? 'status-preparing' : 'status-completed'
              }`} style={{ marginLeft: 8 }}>
                {r['当前状态']}
              </span>
              {r['是否补录'] === '是' && <span className="supplement-badge">已补录</span>}
            </h4>
            <div className="export-field"><span className="export-field-label">家长：</span>{r['家长']}</div>
            <div className="export-field"><span className="export-field-label">过敏食物：</span>{r['过敏食物']}</div>
            <div className="export-field"><span className="export-field-label">饮食禁忌：</span>{r['饮食禁忌']}</div>
            {r['特别说明'] !== '无' && (
              <div className="export-field"><span className="export-field-label">特别说明：</span>{r['特别说明']}</div>
            )}
            {r['补录内容'] && (
              <div className="export-field"><span className="export-field-label">补录内容：</span>
                <span style={{ color: '#1e40af' }}>{r['补录内容']}</span>
              </div>
            )}
            <div className="export-field"><span className="export-field-label">三日食材：</span>{r['三日食材状态']}</div>
            {r['问题说明'] !== '无' && (
              <div className="export-field"><span className="export-field-label">问题说明：</span>
                <span style={{ color: '#991b1b' }}>{r['问题说明']}</span>
              </div>
            )}
            <div className="export-field"><span className="export-field-label">最后更新：</span>
              {new Date(r['最后更新']).toLocaleString('zh-CN')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
