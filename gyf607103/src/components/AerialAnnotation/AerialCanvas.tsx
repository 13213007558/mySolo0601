import React, { useState, useRef, useEffect } from 'react';
import { useShadowStore } from '@/store/useShadowStore';
import { calculateAnnotationImpact, compareAnnotations, formatDiffValue, getDiffColorClass } from '@/utils/diffCalculator';
import { generateId } from '@/utils/mockData';
import type { AnnotationShape, AerialAnnotation } from '@/types';
import { Square, Trash2, Move, Download, Upload, Eye, EyeOff, Save, Info } from 'lucide-react';
import { exportToJSON, downloadFile, importFromJSON, readFileAsText } from '@/utils/importExport';

const COLOR_OPTIONS = [
  { color: '#ef4444', label: '严重遮挡' },
  { color: '#f59e0b', label: '中等遮挡' },
  { color: '#10b981', label: '轻微遮挡' },
  { color: '#3b82f6', label: '临时遮挡' },
  { color: '#8b5cf6', label: '计划施工' },
];

export const AerialCanvas: React.FC = () => {
  const { annotations, addAnnotation, updateAnnotation, deleteAnnotation, currentUser, records } = useShadowStore();
  const canvasRef = useRef<SVGSVGElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].color);
  const [shapeLabel, setShapeLabel] = useState('');
  const [shapeShadowHours, setShapeShadowHours] = useState(1);
  const [currentAnnotation, setCurrentAnnotation] = useState<AerialAnnotation | null>(null);
  const [showBeforeAfter, setShowBeforeAfter] = useState(true);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const latestAnnotation = annotations[annotations.length - 1];
  const previousAnnotation = annotations.length > 1 ? annotations[annotations.length - 2] : null;

  useEffect(() => {
    if (latestAnnotation) {
      setCurrentAnnotation(latestAnnotation);
    }
  }, [latestAnnotation]);

  const getSVGPoint = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = canvasRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const point = getSVGPoint(e);
    setIsDrawing(true);
    setDrawStart(point);
    setCurrentRect({ x: point.x, y: point.y, width: 0, height: 0 });
    setSelectedShapeId(null);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || !drawStart) return;
    const point = getSVGPoint(e);
    setCurrentRect({
      x: Math.min(drawStart.x, point.x),
      y: Math.min(drawStart.y, point.y),
      width: Math.abs(point.x - drawStart.x),
      height: Math.abs(point.y - drawStart.y),
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentRect || !currentAnnotation) return;
    
    if (currentRect.width > 10 && currentRect.height > 10) {
      const newShape: AnnotationShape = {
        id: generateId(),
        type: 'rect',
        x: Math.round(currentRect.x),
        y: Math.round(currentRect.y),
        width: Math.round(currentRect.width),
        height: Math.round(currentRect.height),
        color: selectedColor,
        label: shapeLabel || COLOR_OPTIONS.find(c => c.color === selectedColor)?.label || '遮挡区',
        shadowHours: shapeShadowHours,
      };

      const updatedShapes = [...currentAnnotation.shapes, newShape];
      const impact = calculateAnnotationImpact({ ...currentAnnotation, shapes: updatedShapes });

      updateAnnotation(currentAnnotation.id, {
        shapes: updatedShapes,
        estimatedShadowImpact: impact.estimatedEfficiencyLoss,
      });
    }

    setIsDrawing(false);
    setDrawStart(null);
    setCurrentRect(null);
  };

  const handleShapeClick = (shapeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedShapeId(shapeId === selectedShapeId ? null : shapeId);
  };

  const handleDeleteShape = () => {
    if (!selectedShapeId || !currentAnnotation) return;
    const updatedShapes = currentAnnotation.shapes.filter(s => s.id !== selectedShapeId);
    const impact = calculateAnnotationImpact({ ...currentAnnotation, shapes: updatedShapes });
    
    updateAnnotation(currentAnnotation.id, {
      shapes: updatedShapes,
      estimatedShadowImpact: impact.estimatedEfficiencyLoss,
    });
    setSelectedShapeId(null);
  };

  const handleCreateNew = () => {
    const roofRecords = records.filter(r => !r.isDeleted);
    const roofId = roofRecords.length > 0 ? roofRecords[0].roofId : 'RF-001';
    
    addAnnotation({
      roofId,
      recordedBy: currentUser === '值班员' ? '阿敏' : currentUser,
      recordedAt: new Date().toISOString(),
      shapes: [],
      estimatedShadowImpact: 0,
      notes: '',
    });
  };

  const handleExport = () => {
    if (!currentAnnotation) return;
    const dateStr = new Date().toISOString().split('T')[0];
    const result = exportToJSON(records, [currentAnnotation], 'modified', currentAnnotation.recordedBy);
    downloadFile(result.data, `航拍补录_${currentAnnotation.roofId}_${dateStr}.json`, 'application/json');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await readFileAsText(file);
      const result = importFromJSON(content);
      
      if (!result.success) {
        setImportError(result.errors.join('\n'));
        return;
      }

      if (result.data?.annotations && result.data.annotations.length > 0) {
        const imported = result.data.annotations[0];
        const comparison = compareAnnotations(latestAnnotation || null, imported);
        
        const confirmMsg = `导入校验通过！\n\n变更摘要：\n- 新增遮挡框：${comparison.addedShapes.length}个\n- 删除遮挡框：${comparison.removedShapes.length}个\n- 修改遮挡框：${comparison.modifiedShapes.length}个\n- 阴影时长变化：${formatDiffValue(comparison.totalShadowHoursChange)}小时\n- 效率影响变化：${formatDiffValue(comparison.efficiencyImpactChange)}%\n\n是否应用此导入？`;
        
        if (confirm(confirmMsg)) {
          if (result.data.records.length > 0) {
            useShadowStore.getState().importData(result.data.records, result.data.annotations);
          } else {
            result.data.annotations.forEach(a => {
              addAnnotation({
                roofId: a.roofId,
                recordedBy: a.recordedBy,
                recordedAt: a.recordedAt,
                shapes: a.shapes,
                estimatedShadowImpact: a.estimatedShadowImpact,
                notes: a.notes,
              });
            });
          }
          alert('导入成功！');
        }
      } else {
        setImportError('文件中没有找到航拍补录数据');
      }
    } catch (err) {
      setImportError(`导入失败：${err instanceof Error ? err.message : String(err)}`);
    } finally {
      e.target.value = '';
      setTimeout(() => setImportError(null), 5000);
    }
  };

  const handleUpdateShape = (field: keyof AnnotationShape, value: string | number) => {
    if (!selectedShapeId || !currentAnnotation) return;
    const updatedShapes = currentAnnotation.shapes.map(s =>
      s.id === selectedShapeId ? { ...s, [field]: value } : s
    );
    const impact = calculateAnnotationImpact({ ...currentAnnotation, shapes: updatedShapes });
    
    updateAnnotation(currentAnnotation.id, {
      shapes: updatedShapes,
      estimatedShadowImpact: impact.estimatedEfficiencyLoss,
    });
  };

  const selectedShape = currentAnnotation?.shapes.find(s => s.id === selectedShapeId);
  const impact = currentAnnotation ? calculateAnnotationImpact(currentAnnotation) : null;
  const comparison = previousAnnotation && currentAnnotation 
    ? compareAnnotations(previousAnnotation, currentAnnotation)
    : null;

  const roofRecords = records.filter(r => !r.isDeleted && currentAnnotation && r.roofId === currentAnnotation.roofId);
  const avgEfficiency = roofRecords.length > 0
    ? Math.round(roofRecords.reduce((s, r) => s + r.powerEfficiency, 0) / roofRecords.length * 10) / 10
    : 0;

  return (
    <div className="grid grid-cols-3 gap-4 h-full">
      <div className="col-span-2 flex flex-col gap-4">
        <div className="bg-white rounded-lg border-2 border-primary-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-primary-800">屋顶航拍遮挡补录</h3>
              {currentAnnotation && (
                <span className="text-xs text-gray-500">
                  {currentAnnotation.roofId} · 补录人：{currentAnnotation.recordedBy}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border-2 border-primary-200 rounded hover:bg-primary-50 transition-colors"
              >
                <Square size={14} />
                新建补录
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border-2 border-primary-200 rounded hover:bg-primary-50 transition-colors"
              >
                <Upload size={14} />
                导入
              </button>
              <button
                onClick={handleExport}
                disabled={!currentAnnotation}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                <Download size={14} />
                导出
              </button>
            </div>
          </div>

          {importError && (
            <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded text-sm text-danger-700">
              {importError}
            </div>
          )}

          <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">遮挡颜色：</span>
              {COLOR_OPTIONS.map(opt => (
                <button
                  key={opt.color}
                  onClick={() => setSelectedColor(opt.color)}
                  className={`w-6 h-6 rounded transition-transform ${selectedColor === opt.color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                  style={{ backgroundColor: opt.color }}
                  title={opt.label}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">标签：</span>
              <input
                type="text"
                value={shapeLabel}
                onChange={(e) => setShapeLabel(e.target.value)}
                placeholder="遮挡区域名称"
                className="px-2 py-1 text-sm border border-gray-200 rounded w-32 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">预估阴影(h)：</span>
              <input
                type="number"
                value={shapeShadowHours}
                onChange={(e) => setShapeShadowHours(parseFloat(e.target.value) || 0)}
                min="0"
                max="24"
                step="0.1"
                className="px-2 py-1 text-sm border border-gray-200 rounded w-20 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
            </div>
            <div className="flex items-center gap-2 ml-auto text-xs text-gray-400">
              <Move size={12} />
              在画布上拖拽绘制遮挡框
            </div>
          </div>

          <div className="relative border-2 border-dashed border-gray-200 rounded-lg overflow-hidden bg-gradient-to-br from-primary-50/50 to-success-50/50">
            <svg
              ref={canvasRef}
              width="100%"
              height="400"
              className="cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
                </pattern>
                <linearGradient id="roofGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f0f9eb" />
                  <stop offset="100%" stopColor="#dcfce7" />
                </linearGradient>
              </defs>
              
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              <rect x="50" y="40" width="500" height="320" rx="4" fill="url(#roofGradient)" stroke="#86efac" strokeWidth="2" />
              <text x="300" y="30" textAnchor="middle" className="text-xs" fill="#166534" fontSize="12" fontWeight="600">
                研发中心A座屋顶平面图 (RF-001)
              </text>
              
              <rect x="80" y="70" width="120" height="80" rx="2" fill="#bbf7d0" stroke="#4ade80" strokeWidth="1" />
              <text x="140" y="115" textAnchor="middle" fill="#166534" fontSize="10">光伏阵列A区</text>
              
              <rect x="220" y="70" width="120" height="80" rx="2" fill="#bbf7d0" stroke="#4ade80" strokeWidth="1" />
              <text x="280" y="115" textAnchor="middle" fill="#166534" fontSize="10">光伏阵列B区</text>
              
              <rect x="360" y="70" width="150" height="80" rx="2" fill="#bbf7d0" stroke="#4ade80" strokeWidth="1" />
              <text x="435" y="115" textAnchor="middle" fill="#166534" fontSize="10">光伏阵列C区</text>
              
              <rect x="80" y="170" width="200" height="100" rx="2" fill="#bbf7d0" stroke="#4ade80" strokeWidth="1" />
              <text x="180" y="225" textAnchor="middle" fill="#166534" fontSize="10">光伏阵列D区</text>
              
              <rect x="300" y="170" width="210" height="100" rx="2" fill="#bbf7d0" stroke="#4ade80" strokeWidth="1" />
              <text x="405" y="225" textAnchor="middle" fill="#166534" fontSize="10">光伏阵列E区</text>
              
              <rect x="80" y="290" width="430" height="50" rx="2" fill="#e0e7ff" stroke="#818cf8" strokeWidth="1" strokeDasharray="4 2" />
              <text x="295" y="320" textAnchor="middle" fill="#4338ca" fontSize="10">维修通道</text>

              {currentAnnotation?.shapes.map(shape => (
                <g key={shape.id} onClick={(e) => handleShapeClick(shape.id, e)}>
                  <rect
                    x={shape.x}
                    y={shape.y}
                    width={shape.width}
                    height={shape.height}
                    fill={shape.color}
                    fillOpacity={selectedShapeId === shape.id ? 0.5 : 0.3}
                    stroke={shape.color}
                    strokeWidth={selectedShapeId === shape.id ? 3 : 2}
                    rx="2"
                    className="cursor-pointer transition-all"
                  />
                  <text
                    x={shape.x + shape.width / 2}
                    y={shape.y + shape.height / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="10"
                    fontWeight="600"
                    className="pointer-events-none"
                  >
                    {shape.label}
                  </text>
                  <text
                    x={shape.x + shape.width / 2}
                    y={shape.y + shape.height / 2 + 14}
                    textAnchor="middle"
                    fill="white"
                    fontSize="9"
                    className="pointer-events-none opacity-80"
                  >
                    {shape.shadowHours}h
                  </text>
                </g>
              ))}

              {currentRect && (
                <rect
                  x={currentRect.x}
                  y={currentRect.y}
                  width={currentRect.width}
                  height={currentRect.height}
                  fill={selectedColor}
                  fillOpacity="0.2"
                  stroke={selectedColor}
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  rx="2"
                />
              )}
            </svg>

            {currentAnnotation?.shapes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-gray-400">
                  <Move size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">拖拽鼠标绘制遮挡区域</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {showBeforeAfter && comparison && (
          <div className="bg-white rounded-lg border-2 border-primary-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-primary-800 flex items-center gap-2">
                <Info size={16} />
                补录前后差异对比
              </h4>
              <button
                onClick={() => setShowBeforeAfter(false)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                <EyeOff size={14} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-xs text-gray-500 mb-1">新增遮挡框</div>
                <div className="text-xl font-bold text-success-600 font-mono">+{comparison.addedShapes.length}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-xs text-gray-500 mb-1">删除遮挡框</div>
                <div className="text-xl font-bold text-danger-600 font-mono">-{comparison.removedShapes.length}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-xs text-gray-500 mb-1">阴影时长变化</div>
                <div className={`text-xl font-bold font-mono ${getDiffColorClass(comparison.totalShadowHoursChange, false)}`}>
                  {formatDiffValue(comparison.totalShadowHoursChange)}h
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-xs text-gray-500 mb-1">效率影响变化</div>
                <div className={`text-xl font-bold font-mono ${getDiffColorClass(comparison.efficiencyImpactChange, true)}`}>
                  {formatDiffValue(comparison.efficiencyImpactChange)}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-lg border-2 border-primary-100 p-4">
          <h4 className="font-semibold text-primary-800 mb-3">补录信息</h4>
          {currentAnnotation ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">屋顶ID</label>
                <input
                  type="text"
                  value={currentAnnotation.roofId}
                  onChange={(e) => updateAnnotation(currentAnnotation.id, { roofId: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">补录人</label>
                <div className="px-2 py-1.5 text-sm bg-gray-50 rounded text-gray-600 font-mono">
                  {currentAnnotation.recordedBy}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">补录时间</label>
                <div className="px-2 py-1.5 text-sm bg-gray-50 rounded text-gray-600 font-mono">
                  {new Date(currentAnnotation.recordedAt).toLocaleString('zh-CN')}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">备注说明</label>
                <textarea
                  value={currentAnnotation.notes || ''}
                  onChange={(e) => updateAnnotation(currentAnnotation.id, { notes: e.target.value })}
                  placeholder="输入补录说明..."
                  rows={3}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-400 resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              点击"新建补录"开始
            </div>
          )}
        </div>

        {selectedShape && (
          <div className="bg-white rounded-lg border-2 border-warning-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-warning-800">选中遮挡框</h4>
              <button
                onClick={handleDeleteShape}
                className="p-1 text-danger-500 hover:bg-danger-50 rounded"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-16">颜色</span>
                <div className="flex gap-1">
                  {COLOR_OPTIONS.map(opt => (
                    <button
                      key={opt.color}
                      onClick={() => handleUpdateShape('color', opt.color)}
                      className={`w-5 h-5 rounded ${selectedShape.color === opt.color ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                      style={{ backgroundColor: opt.color }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">标签</label>
                <input
                  type="text"
                  value={selectedShape.label}
                  onChange={(e) => handleUpdateShape('label', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">预估阴影时长 (小时)</label>
                <input
                  type="number"
                  value={selectedShape.shadowHours}
                  onChange={(e) => handleUpdateShape('shadowHours', parseFloat(e.target.value) || 0)}
                  step="0.1"
                  min="0"
                  className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
              </div>
              <div className="text-xs text-gray-400 font-mono pt-2 border-t border-gray-100">
                位置: ({selectedShape.x}, {selectedShape.y}) · 尺寸: {selectedShape.width}×{selectedShape.height}
              </div>
            </div>
          </div>
        )}

        {impact && currentAnnotation && (
          <div className="bg-white rounded-lg border-2 border-success-100 p-4">
            <h4 className="font-semibold text-success-800 mb-3">影响分析</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">遮挡区域数量</span>
                <span className="font-mono font-semibold text-lg">{currentAnnotation.shapes.length} 个</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">总阴影时长</span>
                <span className="font-mono font-semibold text-lg text-warning-600">{impact.totalShadowHours} h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">预估效率损失</span>
                <span className="font-mono font-semibold text-lg text-danger-600">-{impact.estimatedEfficiencyLoss}%</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="text-sm text-gray-600">修正后效率</span>
                <span className="font-mono font-semibold text-lg text-primary-600">
                  {Math.max(0, avgEfficiency - impact.estimatedEfficiencyLoss).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {impact && (
          <div className="bg-white rounded-lg border-2 border-primary-100 p-4">
            <h4 className="font-semibold text-primary-800 mb-3">遮挡明细</h4>
            <div className="space-y-2 max-h-48 overflow-auto">
              {impact.shapeBreakdown.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 truncate flex-1">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-gray-700">{item.shadowHours}h</span>
                    <span className="text-xs text-gray-400 w-12 text-right">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
