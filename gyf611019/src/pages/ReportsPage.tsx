import { useState } from 'react';
import { InspectionItem } from '../types';
import { formatPrice } from '../api';

interface Props {
  items: InspectionItem[];
}

export default function ReportsPage({ items }: Props) {
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [exported, setExported] = useState(false);

  const completed = items.filter((i) => i.status === 'completed' || i.status === 'pending_review');
  const scrapCount = completed.filter((i) => i.analysis?.suggestion === 'scrap').length;
  const regenerateCount = completed.filter((i) => i.analysis?.suggestion === 'regenerate').length;
  const pendingCount = completed.filter((i) => i.analysis?.suggestion === 'pending').length;
  const avgScore =
    completed.length > 0
      ? completed.reduce((s, i) => s + (i.analysis?.score || 0), 0) / completed.length
      : 0;

  const sellerMap = new Map<string, { name: string; count: number; disputed: number }>();
  completed.forEach((item) => {
    const key = item.record.sellerId || item.record.sellerName || 'unknown';
    const existing = sellerMap.get(key) || {
      name: item.record.sellerName || key,
      count: 0,
      disputed: 0
    };
    existing.count++;
    if (item.analysis?.suggestion === 'scrap' || item.analysis?.suggestion === 'pending') {
      existing.disputed++;
    }
    sellerMap.set(key, existing);
  });

  const sellerStats = Array.from(sellerMap.values()).sort((a, b) => b.disputed - a.disputed);
  const totalDisputed = sellerStats.reduce((s, v) => s + v.disputed, 0);

  const handleExport = () => {
    setExported(true);
    const report = {
      title: '黑胶槽纹争议鉴定报告',
      dateRange: `${startDate} 至 ${endDate}`,
      generatedAt: new Date().toLocaleString('zh-CN'),
      summary: {
        totalRecords: items.length,
        analyzed: completed.length,
        regenerateCount,
        scrapCount,
        pendingCount,
        disputedCount: totalDisputed,
        averageScore: avgScore.toFixed(1)
      },
      sellerDisputes: sellerStats,
      records: completed.map((i) => ({
        recordNo: i.record.recordNo,
        title: i.record.recordTitle,
        seller: i.record.sellerName,
        score: i.analysis?.score,
        suggestion: i.analysis?.suggestion,
        originalPrice: i.record.originalPrice,
        finalPrice: i.finalPrice
      }))
    };

    const csvRows = [
      ['唱片编号', '名称', '卖家', '磨损分', '建议', '原价', '建议价'],
      ...completed.map((i) => [
        i.record.recordNo,
        i.record.recordTitle,
        i.record.sellerName,
        String(i.analysis?.score || ''),
        i.analysis?.suggestion === 'regenerate'
          ? '再生'
          : i.analysis?.suggestion === 'scrap'
          ? '报废'
          : '待定',
        String(i.record.originalPrice),
        String(i.finalPrice.toFixed(2))
      ])
    ];

    const csv = csvRows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([JSON.stringify(report, null, 2) + '\n\n--- CSV ---\n' + csv], {
      type: 'text/plain'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dispute-report-${startDate}-${endDate}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setTimeout(() => setExported(false), 3000);
  };

  return (
    <div>
      <div className="page-header">
        <h2>📊 争议报告</h2>
        <p>市集争议报告一键导出，包含磨损统计、卖家争议排名和定价数据</p>
      </div>

      <div className="card">
        <div className="form-row" style={{ alignItems: 'center' }}>
          <div className="form-group" style={{ maxWidth: 200 }}>
            <label>起始日期</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="form-group" style={{ maxWidth: 200 }}>
            <label>结束日期</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary"
              onClick={handleExport}
              disabled={exported}
              style={{ alignSelf: 'flex-end' }}
            >
              {exported ? '✓ 已导出' : '📥 一键导出报告'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div>
          <div className="card">
            <div className="card-title">总体统计</div>
            <div className="form-row">
              <div className="form-group">
                <label>鉴定总数</label>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{items.length}</div>
              </div>
              <div className="form-group">
                <label>平均磨损分</label>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: avgScore >= 70 ? '#4ade80' : avgScore >= 40 ? '#facc15' : '#f87171'
                  }}
                >
                  {avgScore.toFixed(1)}
                </div>
              </div>
            </div>
            <div className="form-row" style={{ marginTop: 8 }}>
              <div className="form-group">
                <label>
                  <span className="status-badge status-regenerate">再生</span> 数量
                </label>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#4ade80' }}>
                  {regenerateCount}
                </div>
              </div>
              <div className="form-group">
                <label>
                  <span className="status-badge status-scrap">报废</span> 数量
                </label>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#f87171' }}>{scrapCount}</div>
              </div>
              <div className="form-group">
                <label>
                  <span className="status-badge status-pending">待定</span> 数量
                </label>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#facc15' }}>
                  {pendingCount}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">争议分布</div>
            <div style={{ padding: 16, background: '#0f172a', borderRadius: 6 }}>
              <svg width="100%" height="180" viewBox="0 0 400 180">
                <defs>
                  <linearGradient id="barG" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#60a5fa" />
                  </linearGradient>
                </defs>
                {(() => {
                  const total = Math.max(completed.length, 1);
                  const bars = [
                    { label: '再生', value: regenerateCount, color: '#4ade80' },
                    { label: '报废', value: scrapCount, color: '#f87171' },
                    { label: '待定', value: pendingCount, color: '#facc15' }
                  ];
                  return bars.map((b, i) => {
                    const h = (b.value / total) * 140;
                    const x = 50 + i * 110;
                    return (
                      <g key={b.label}>
                        <rect
                          x={x}
                          y={160 - h}
                          width="60"
                          height={h}
                          rx="4"
                          fill={b.color}
                          opacity={0.8}
                        />
                        <text x={x + 30} y={160 - h - 6} textAnchor="middle" fill="#e2e8f0" fontSize="14" fontWeight="600">
                          {b.value}
                        </text>
                        <text x={x + 30} y={178} textAnchor="middle" fill="#94a3b8" fontSize="12">
                          {b.label}
                        </text>
                      </g>
                    );
                  });
                })()}
              </svg>
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-title">卖家争议排名</div>
            {sellerStats.length === 0 ? (
              <div className="placeholder">暂无数据</div>
            ) : (
              sellerStats.map((s, i) => (
                <div
                  key={s.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 10,
                    borderBottom: '1px solid #334155'
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      background: i === 0 ? '#dc2626' : i === 1 ? '#f97316' : i === 2 ? '#eab308' : '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                      鉴定 {s.count} 件 · 争议 {s.disputed} 件
                    </div>
                  </div>
                  <div style={{ width: 120, height: 8, background: '#0f172a', borderRadius: 4, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${(s.disputed / Math.max(...sellerStats.map((x) => x.disputed), 1)) * 100}%`,
                        height: '100%',
                        background: s.disputed > 2 ? '#f87171' : '#facc15'
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="card">
            <div className="card-title">定价影响分析</div>
            {completed.length === 0 ? (
              <div className="placeholder">暂无数据</div>
            ) : (
              completed.slice(0, 5).map((i) => (
                <div
                  key={i.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 8,
                    marginBottom: 4,
                    background: '#0f172a',
                    borderRadius: 4
                  }}
                >
                  <div style={{ flex: 1, fontSize: 12 }}>
                    <div style={{ fontFamily: 'monospace' }}>{i.record.recordNo}</div>
                    <div style={{ color: '#94a3b8', fontSize: 11 }}>{i.record.recordTitle}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'line-through' }}>
                    {formatPrice(i.record.originalPrice)}
                  </div>
                  <div style={{ color: '#94a3b8' }}>→</div>
                  <div style={{ fontWeight: 600, color: '#3b82f6' }}>
                    {formatPrice(i.finalPrice)}
                  </div>
                  <div
                    className={`status-badge ${
                      i.analysis?.suggestion === 'scrap'
                        ? 'status-scrap'
                        : i.analysis?.suggestion === 'regenerate'
                        ? 'status-regenerate'
                        : 'status-pending'
                    }`}
                    style={{ fontSize: 10 }}
                  >
                    {i.analysis?.score || '-'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
