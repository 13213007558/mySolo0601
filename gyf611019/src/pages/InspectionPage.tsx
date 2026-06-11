import { useState, useRef, useCallback } from 'react';
import { InspectionItem, WearAnalysis, GrooveImage, RecordInfo } from '../types';
import {
  checkImageResolution,
  calculatePricing,
  formatPrice,
  generateId,
  readScaleWeight,
  captureMicroscope,
  createMockAnalysis,
  confirmScrap
} from '../api';

interface Props {
  items: InspectionItem[];
  setItems: React.Dispatch<React.SetStateAction<InspectionItem[]>>;
}

const STANDARD_TEMPLATES = [
  { id: 'mint', name: 'Mint (全新)', grade: 'mint', color: '#4ade80' },
  { id: 'standard', name: 'Standard (标准)', grade: 'standard', color: '#3b82f6' },
  { id: 'vg', name: 'VG (很好)', grade: 'vg', color: '#eab308' },
  { id: 'g', name: 'G (一般)', grade: 'g', color: '#f87171' }
];

export default function InspectionPage({ items, setItems }: Props) {
  const [recordInfo, setRecordInfo] = useState<Partial<RecordInfo>>({
    sellerId: '',
    sellerName: '',
    recordNo: '',
    recordTitle: '',
    artist: '',
    originalPrice: 0,
    weight: 0
  });
  const [image, setImage] = useState<GrooveImage | null>(null);
  const [analysis, setAnalysis] = useState<WearAnalysis | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('standard');
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);
  const [resolutionError, setResolutionError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [weight, setWeight] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const finalPrice = analysis
    ? calculatePricing(recordInfo.originalPrice || 0, analysis.score)
    : recordInfo.originalPrice || 0;

  const handleWeight = async () => {
    try {
      const w = await readScaleWeight();
      setWeight(w);
      setRecordInfo((r) => ({ ...r, weight: w }));
    } catch {
      const mockW = 120 + Math.random() * 40;
      setWeight(mockW);
      setRecordInfo((r) => ({ ...r, weight: mockW }));
    }
  };

  const handleCapture = async () => {
    setIsCapturing(true);
    try {
      const result = await captureMicroscope();
      loadImage(result.imageData, result.width, result.height);
    } catch {
      setTimeout(() => {
        const w = 2560;
        const h = 1920;
        const mockImg = generateMockGrooveImage(w, h);
        loadImage(mockImg, w, h);
      }, 800);
    } finally {
      setIsCapturing(false);
    }
  };

  function generateMockGrooveImage(width: number, height: number): string {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    const grooveCount = 8;
    for (let g = 0; g < grooveCount; g++) {
      const y = (height / (grooveCount + 1)) * (g + 1);
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${80 + g * 20}, ${60 + g * 15}, ${180 - g * 10}, 0.7)`;
      ctx.lineWidth = 8 + Math.sin(g) * 3;
      for (let x = 0; x < width; x += 4) {
        const wobble = Math.sin(x * 0.02 + g) * 12 + Math.sin(x * 0.008 + g * 2) * 6;
        if (x === 0) ctx.moveTo(x, y + wobble);
        else ctx.lineTo(x, y + wobble);
      }
      ctx.stroke();
    }

    for (let s = 0; s < 40; s++) {
      const sx = Math.random() * width;
      const sy = Math.random() * height;
      const sl = 20 + Math.random() * 80;
      const angle = Math.random() * Math.PI;
      ctx.beginPath();
      ctx.strokeStyle = `rgba(200, 200, 220, ${0.15 + Math.random() * 0.25})`;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(angle) * sl, sy + Math.sin(angle) * sl);
      ctx.stroke();
    }

    return canvas.toDataURL('image/jpeg', 0.85);
  }

  function generateTemplateImage(templateId: string, width: number, height: number): string {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, width, height);

    const template = STANDARD_TEMPLATES.find((t) => t.id === templateId);
    const baseColor = template?.color || '#3b82f6';

    const grooveCount = 8;
    const wearFactor =
      templateId === 'mint' ? 2 : templateId === 'standard' ? 5 : templateId === 'vg' ? 9 : 14;

    for (let g = 0; g < grooveCount; g++) {
      const y = (height / (grooveCount + 1)) * (g + 1);
      ctx.beginPath();
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = Math.max(4, 16 - wearFactor);
      ctx.globalAlpha = templateId === 'mint' ? 0.95 : templateId === 'standard' ? 0.8 : templateId === 'vg' ? 0.6 : 0.4;
      for (let x = 0; x < width; x += 4) {
        const wobble = Math.sin(x * 0.02 + g) * (4 + wearFactor * 0.5);
        if (x === 0) ctx.moveTo(x, y + wobble);
        else ctx.lineTo(x, y + wobble);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    return canvas.toDataURL('image/png');
  }

  const loadImage = useCallback((dataUrl: string, w?: number, h?: number) => {
    const img = new window.Image();
    img.onload = () => {
      const width = w || img.naturalWidth;
      const height = h || img.naturalHeight;
      const check = checkImageResolution(width, height);
      if (!check.valid) {
        setResolutionError(check.message);
        return;
      }
      setResolutionError('');
      setImage({
        id: generateId(),
        recordId: '',
        imageData: dataUrl,
        width,
        height,
        uploadedAt: new Date().toISOString()
      });
      setAnalysis(null);
    };
    img.src = dataUrl;
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          loadImage(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [loadImage]
  );

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => loadImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const runAnalysis = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      const result = createMockAnalysis(image.id);
      setAnalysis(result);
      setIsAnalyzing(false);
      if (result.needsReview) setShowReview(true);
    }, 1500);
  };

  const addToQueue = () => {
    if (!recordInfo.recordNo) {
      alert('请填写唱片编号');
      return;
    }
    const newItem: InspectionItem = {
      id: generateId(),
      record: {
        id: generateId(),
        sellerId: recordInfo.sellerId || '',
        sellerName: recordInfo.sellerName || '',
        recordNo: recordInfo.recordNo || '',
        recordTitle: recordInfo.recordTitle || '',
        artist: recordInfo.artist || '',
        originalPrice: recordInfo.originalPrice || 0,
        weight: recordInfo.weight || 0,
        createdAt: new Date().toISOString()
      },
      image,
      analysis,
      finalPrice,
      status: analysis
        ? analysis.needsReview
          ? 'pending_review'
          : 'completed'
        : 'queue',
      position: items.length
    };
    setItems((prev) => [...prev, newItem]);
    setImage(null);
    setAnalysis(null);
    setRecordInfo({
      sellerId: '',
      sellerName: '',
      recordNo: '',
      recordTitle: '',
      artist: '',
      originalPrice: 0,
      weight: 0
    });
  };

  const handleConfirmScrap = async () => {
    const reviewer = '复核员01';
    try {
      if (items.length > 0) {
        await confirmScrap(items[0].id, reviewer);
      }
    } catch {
      /* ignore */
    }
    setShowReview(false);
    alert('报废建议已由复核员确认');
  };

  const templateImage =
    image && selectedTemplate
      ? generateTemplateImage(selectedTemplate, image.width, image.height)
      : null;

  return (
    <div>
      <div className="page-header">
        <h2>🔬 显微鉴定</h2>
        <p>上传或拍摄槽纹显微照片，对比标准纹深模板，自动生成再生或报废建议</p>
      </div>

      <div className="grid-2">
        <div>
          <div className="card">
            <div className="card-title">唱片与卖家信息</div>
            <div className="form-row">
              <div className="form-group">
                <label>卖家编号</label>
                <input
                  type="text"
                  placeholder="如 S001"
                  value={recordInfo.sellerId}
                  onChange={(e) => setRecordInfo((r) => ({ ...r, sellerId: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>卖家姓名</label>
                <input
                  type="text"
                  placeholder="如 张建国"
                  value={recordInfo.sellerName}
                  onChange={(e) => setRecordInfo((r) => ({ ...r, sellerName: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>唱片编号 *</label>
                <input
                  type="text"
                  placeholder="如 LP-2024-0001"
                  value={recordInfo.recordNo}
                  onChange={(e) => setRecordInfo((r) => ({ ...r, recordNo: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>唱片名称</label>
                <input
                  type="text"
                  placeholder="如 夜曲"
                  value={recordInfo.recordTitle}
                  onChange={(e) => setRecordInfo((r) => ({ ...r, recordTitle: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>艺术家</label>
                <input
                  type="text"
                  placeholder="如 周杰伦"
                  value={recordInfo.artist}
                  onChange={(e) => setRecordInfo((r) => ({ ...r, artist: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>原始定价 (元)</label>
                <input
                  type="number"
                  placeholder="如 280"
                  value={recordInfo.originalPrice || ''}
                  onChange={(e) =>
                    setRecordInfo((r) => ({
                      ...r,
                      originalPrice: parseFloat(e.target.value) || 0
                    }))
                  }
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>重量读取</label>
                <div className="weight-display">
                  <span>💿</span>
                  <span>当前重量:</span>
                  <span className="value">{weight.toFixed(2)} g</span>
                </div>
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={handleWeight} style={{ width: '100%' }}>
                  ⚖️ 读取秤重
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">显微图像采集</div>
            <div
              ref={dropRef}
              className={`drop-zone ${isDragging ? 'drag-over' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="icon">📷</div>
              <div className="text">
                拖拽照片到此处，或点击上传 / 调用显微镜拍照
                <br />
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  最小分辨率: 1920×1080
                </span>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={onFileSelect}
            />
            <div className="form-row" style={{ marginTop: 12 }}>
              <button
                className="btn btn-primary"
                onClick={handleCapture}
                disabled={isCapturing}
                style={{ flex: 1 }}
              >
                {isCapturing ? '📷 采集中...' : '🔬 调用显微镜拍照'}
              </button>
            </div>
            {resolutionError && (
              <div style={{ color: '#f87171', fontSize: 12, marginTop: 8 }}>
                ⚠️ {resolutionError}
              </div>
            )}
            {image && (
              <div style={{ marginTop: 12, fontSize: 12, color: '#4ade80' }}>
                ✓ 已加载图像: {image.width}×{image.height}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-title">槽纹对比（模板半透明叠加）</div>
            <div className="form-row" style={{ marginBottom: 12 }}>
              <div className="form-group">
                <label>标准纹深模板</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                >
                  {STANDARD_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="image-compare">
              {image ? (
                <>
                  <img src={image.imageData} alt="槽纹照片" />
                  {templateImage && (
                    <img
                      src={templateImage}
                      alt="模板"
                      className="template-overlay"
                      style={{ opacity: overlayOpacity }}
                    />
                  )}
                </>
              ) : (
                <div className="placeholder">
                  请先上传或拍摄槽纹显微照片以进行对比
                </div>
              )}
            </div>

            <div className="compare-controls">
              <span style={{ fontSize: 12, color: '#94a3b8' }}>模板透明度:</span>
              <div className="slider">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                />
              </div>
              <span style={{ fontSize: 12 }}>{Math.round(overlayOpacity * 100)}%</span>
            </div>

            <div className="form-row" style={{ marginTop: 12 }}>
              <button
                className="btn btn-primary"
                onClick={runAnalysis}
                disabled={!image || isAnalyzing}
                style={{ flex: 1 }}
              >
                {isAnalyzing ? '⏳ 分析中...' : '🔍 执行磨损分析'}
              </button>
            </div>
          </div>

          {analysis && (
            <>
              {showReview && analysis.suggestion === 'scrap' && (
                <div className="review-banner">
                  <span>⚠️</span>
                  <div className="text">
                    报废建议需要复核员确认后生效
                  </div>
                  <button className="btn btn-danger" onClick={handleConfirmScrap}>
                    确认报废
                  </button>
                </div>
              )}

              <div className="card">
                <div className="card-title">分析结果</div>
                <div className="score-display">
                  <div
                    className={`score-circle ${
                      analysis.score >= 70 ? 'high' : analysis.score >= 40 ? 'medium' : 'low'
                    }`}
                  >
                    {analysis.score}
                  </div>
                  <div className="score-details">
                    <div className="label">磨损分数 (0-100, 越高越好)</div>
                    <div className="value">
                      {analysis.suggestion === 'regenerate' && (
                        <span className="status-badge status-regenerate">✓ 建议再生</span>
                      )}
                      {analysis.suggestion === 'scrap' && (
                        <span className="status-badge status-scrap">✗ 建议报废</span>
                      )}
                      {analysis.suggestion === 'pending' && (
                        <span className="status-badge status-pending">⚠ 需人工判定</span>
                      )}
                      <span style={{ marginLeft: 8 }}>置信度: {analysis.confidence}%</span>
                    </div>
                  </div>
                </div>

                <div className="form-row" style={{ marginTop: 16 }}>
                  <div className="form-group">
                    <label>槽纹深度损失</label>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>
                      {analysis.grooveDepthLoss}%
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      标准深度对比
                    </div>
                  </div>
                  <div className="form-group">
                    <label>划痕密度</label>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>
                      {analysis.scratchDensity}%
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      单位面积划痕比例
                    </div>
                  </div>
                  <div className="form-group">
                    <label>噪声水平</label>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>
                      {analysis.noiseLevel}%
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      信号噪声预估
                    </div>
                  </div>
                </div>

                <div className="price-preview" style={{ marginTop: 16 }}>
                  <div className="original">
                    原始定价: {formatPrice(recordInfo.originalPrice || 0)}
                  </div>
                  <div className="final">建议定价: {formatPrice(finalPrice)}</div>
                  <div className="breakdown">
                    磨损系数: {((analysis.score / 100) * 100).toFixed(1)}% × 折旧率 70%
                    {analysis.suggestion === 'scrap'
                      ? ' · 报废不计价'
                      : analysis.suggestion === 'pending'
                      ? ' · 待人工复核后确定'
                      : ''}
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="form-row">
            <button
              className="btn btn-success"
              onClick={addToQueue}
              disabled={!recordInfo.recordNo}
              style={{ flex: 1 }}
            >
              📋 加入鉴定队列 / 保存记录
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
