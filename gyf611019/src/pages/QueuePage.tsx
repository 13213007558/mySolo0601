import { useState } from 'react';
import { InspectionItem } from '../types';
import { formatPrice, calculatePricing, saveInspection, analyzeWear } from '../api';

interface Props {
  items: InspectionItem[];
  setItems: React.Dispatch<React.SetStateAction<InspectionItem[]>>;
}

export default function QueuePage({ items, setItems }: Props) {
  const [filter, setFilter] = useState<'all' | 'queue' | 'analyzing' | 'pending_review' | 'completed'>('all');

  const filtered = items.filter((i) => filter === 'all' || i.status === filter);

  const statusLabel: Record<string, string> = {
    queue: '排队中',
    analyzing: '分析中',
    pending_review: '待复核',
    completed: '已完成'
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;
    let updated: InspectionItem[] = [];
    setItems((prev) => {
      const arr = [...prev];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      updated = arr.map((it, i) => ({ ...it, position: i }));
      return updated;
    });
    try {
      for (const it of updated.slice(Math.max(0, index - 1), index + 1)) {
        await saveInspection(it);
      }
    } catch (e) {
      console.error('persist order failed:', e);
    }
  };

  const moveDown = async (index: number) => {
    if (index === items.length - 1) return;
    let updated: InspectionItem[] = [];
    setItems((prev) => {
      const arr = [...prev];
      [arr[index + 1], arr[index]] = [arr[index], arr[index + 1]];
      updated = arr.map((it, i) => ({ ...it, position: i }));
      return updated;
    });
    try {
      for (const it of updated.slice(index, index + 2)) {
        await saveInspection(it);
      }
    } catch (e) {
      console.error('persist order failed:', e);
    }
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const [processing, setProcessing] = useState(false);

  const processNext = async () => {
    if (processing) return;
    const first = items.find((it) => it.status === 'queue');
    if (!first) return;
    setProcessing(true);
    try {
      const imageData = first.image?.imageData;
      let analysis = first.analysis;
      if (!analysis) {
        if (imageData) {
          analysis = await analyzeWear(imageData, 'standard');
        } else {
          analysis = {
            score: Math.round(50 + Math.random() * 40),
            grooveDepthLoss: Math.round(20 + Math.random() * 50),
            scratchDensity: Math.round(Math.random() * 100),
            noiseLevel: Math.round(Math.random() * 100),
            suggestion: (['regenerate', 'scrap', 'pending'] as const)[Math.floor(Math.random() * 3)],
            needsReview: Math.random() > 0.5,
            confidence: Math.round(75 + Math.random() * 20)
          };
        }
      }
      const finalPrice = calculatePricing(first.record.originalPrice, analysis.score);
      const status = analysis.needsReview ? 'pending_review' : 'completed';
      const updated: InspectionItem = { ...first, analysis, finalPrice, status };
      setItems((prev) => prev.map((it) => (it.id === first.id ? updated : it)));
      await saveInspection(updated);
    } catch (err) {
      console.error('processNext failed:', err);
    } finally {
      setProcessing(false);
    }
  };

  const pendingCount = items.filter((i) => i.status === 'queue').length;
  const reviewCount = items.filter((i) => i.status === 'pending_review').length;

  return (
    <div>
      <div className="page-header">
        <h2>📋 鉴定队列</h2>
        <p>批量鉴定按序处理，支持手动调整顺序和状态管理</p>
      </div>

      <div className="card">
        <div className="form-row" style={{ alignItems: 'center' }}>
          <div className="form-group" style={{ maxWidth: 200 }}>
            <label>状态筛选</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
              <option value="all">全部 ({items.length})</option>
              <option value="queue">排队中 ({pendingCount})</option>
              <option value="analyzing">分析中</option>
              <option value="pending_review">待复核 ({reviewCount})</option>
              <option value="completed">已完成</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={processNext} disabled={pendingCount === 0 || processing}>
              {processing ? '⏳ 处理中...' : '▶ 处理下一个'}
            </button>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8' }}>
            队列总数: {items.length} | 待处理: {pendingCount} | 待复核: {reviewCount}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: 50 }}>序号</th>
              <th>唱片编号</th>
              <th>唱片名称</th>
              <th>卖家</th>
              <th>状态</th>
              <th>磨损分</th>
              <th>原始价</th>
              <th>建议价</th>
              <th style={{ width: 160 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="placeholder">暂无记录</div>
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id}>
                  <td>{item.position + 1}</td>
                  <td style={{ fontFamily: 'monospace' }}>{item.record.recordNo}</td>
                  <td>{item.record.recordTitle || '-'}</td>
                  <td>{item.record.sellerName || item.record.sellerId}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        item.status === 'completed'
                          ? item.analysis?.suggestion === 'scrap'
                            ? 'status-scrap'
                            : 'status-regenerate'
                          : item.status === 'pending_review'
                          ? 'status-review'
                          : 'status-pending'
                      }`}
                    >
                      {item.analysis && item.status === 'completed'
                        ? item.analysis.suggestion === 'regenerate'
                          ? '再生'
                          : item.analysis.suggestion === 'scrap'
                          ? '报废'
                          : '待定'
                        : statusLabel[item.status]}
                    </span>
                  </td>
                  <td>
                    {item.analysis ? (
                      <span
                        style={{
                          fontWeight: 600,
                          color:
                            item.analysis.score >= 70
                              ? '#4ade80'
                              : item.analysis.score >= 40
                              ? '#facc15'
                              : '#f87171'
                        }}
                      >
                        {item.analysis.score}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>{formatPrice(item.record.originalPrice)}</td>
                  <td style={{ fontWeight: 600, color: '#3b82f6' }}>
                    {formatPrice(item.finalPrice)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: 11 }}
                        onClick={() => moveUp(item.position)}
                        disabled={item.position === 0}
                      >
                        ↑
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: 11 }}
                        onClick={() => moveDown(item.position)}
                        disabled={item.position === items.length - 1}
                      >
                        ↓
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '4px 8px', fontSize: 11 }}
                        onClick={() => removeItem(item.id)}
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
