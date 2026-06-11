import { useState } from 'react';

const TEMPLATES = [
  {
    id: 'mint',
    name: 'Mint (全新)',
    grade: 'mint' as const,
    description: '槽纹深度完好，无划痕，无噪声',
    depthLoss: '< 5%',
    scratchDensity: '< 5%',
    color: '#4ade80'
  },
  {
    id: 'standard',
    name: 'Standard (标准)',
    grade: 'standard' as const,
    description: '标准参考级，轻微使用痕迹',
    depthLoss: '5-15%',
    scratchDensity: '5-15%',
    color: '#3b82f6'
  },
  {
    id: 'vg',
    name: 'VG (很好)',
    grade: 'vg' as const,
    description: '可接受的磨损，不影响播放',
    depthLoss: '15-35%',
    scratchDensity: '15-30%',
    color: '#eab308'
  },
  {
    id: 'g',
    name: 'G (一般)',
    grade: 'g' as const,
    description: '明显磨损，部分段落噪声',
    depthLoss: '35-60%',
    scratchDensity: '30-60%',
    color: '#f87171'
  },
  {
    id: 'poor',
    name: 'Poor (差)',
    grade: 'g' as const,
    description: '严重磨损，建议报废',
    depthLoss: '> 60%',
    scratchDensity: '> 60%',
    color: '#dc2626'
  }
];

export default function TemplatesPage() {
  const [selected, setSelected] = useState('standard');

  return (
    <div>
      <div className="page-header">
        <h2>📐 纹深模板库</h2>
        <p>标准纹深模板用于半透明叠加对照，量化磨损评分</p>
      </div>

      <div className="grid-2">
        <div>
          <div className="card">
            <div className="card-title">模板列表</div>
            {TEMPLATES.map((t) => (
              <div
                key={t.id}
                style={{
                  padding: 12,
                  border: `2px solid ${selected === t.id ? t.color : '#334155'}`,
                  borderRadius: 6,
                  marginBottom: 8,
                  cursor: 'pointer',
                  background: selected === t.id ? `${t.color}15` : '#0f172a'
                }}
                onClick={() => setSelected(t.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      background: t.color
                    }}
                  />
                  <span style={{ fontWeight: 600 }}>{t.name}</span>
                  {selected === t.id && (
                    <span style={{ fontSize: 11, color: t.color, marginLeft: 'auto' }}>
                      已选中
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, marginLeft: 20 }}>
                  {t.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-title">
              模板规格 - {TEMPLATES.find((t) => t.id === selected)?.name}
            </div>
            {(() => {
              const t = TEMPLATES.find((x) => x.id === selected);
              if (!t) return null;
              return (
                <div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>槽纹深度损失阈值</label>
                      <div style={{ fontSize: 18, fontWeight: 600, color: t.color }}>
                        {t.depthLoss}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>划痕密度阈值</label>
                      <div style={{ fontSize: 18, fontWeight: 600, color: t.color }}>
                        {t.scratchDensity}
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>等级描述</label>
                    <div style={{ fontSize: 13, padding: 10, background: '#0f172a', borderRadius: 6 }}>
                      {t.description}
                    </div>
                  </div>
                  <div className="form-group" style={{ marginTop: 16 }}>
                    <label>模板预览波形</label>
                    <div
                      style={{
                        height: 160,
                        background: '#0f172a',
                        borderRadius: 6,
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <svg width="100%" height="100%" viewBox="0 0 400 160">
                        {[0, 1, 2, 3, 4].map((g) => {
                          const y = 25 + g * 30;
                          const amplitude =
                            t.id === 'mint' ? 4 : t.id === 'standard' ? 7 : t.id === 'vg' ? 11 : 16;
                          return (
                            <g key={g}>
                              <path
                                d={`M 0 ${y} Q 50 ${y - amplitude} 100 ${y} T 200 ${y} T 300 ${y} T 400 ${y}`}
                                fill="none"
                                stroke={t.color}
                                strokeWidth={t.id === 'poor' ? 2 : 4}
                                opacity={t.id === 'mint' ? 0.95 : t.id === 'standard' ? 0.8 : t.id === 'vg' ? 0.6 : 0.35}
                              />
                              {t.id !== 'mint' &&
                                t.id !== 'standard' &&
                                Array.from({ length: t.id === 'vg' ? 3 : 7 }).map((_, s) => (
                                  <line
                                    key={s}
                                    x1={30 + s * 60 + Math.random() * 30}
                                    y1={y - 10}
                                    x2={40 + s * 60 + Math.random() * 30}
                                    y2={y + 10}
                                    stroke="#94a3b8"
                                    strokeWidth={1}
                                    opacity={0.4}
                                  />
                                ))}
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  </div>
                  <div style={{ marginTop: 16, fontSize: 12, color: '#94a3b8' }}>
                    * 模板图像以半透明方式叠加在显微照片上，用于对比槽纹深度和磨损程度
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
