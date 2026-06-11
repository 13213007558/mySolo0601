import { useAppStore } from '@/store/useAppStore';
import { convertElevation } from '@/utils/slopeCalc';
import { Edit3, AlertCircle, PlusCircle } from 'lucide-react';
import { updateMeasurePoint, getMeasurePointsByZone } from '@/db';
import { useState } from 'react';

export default function MeasureGrid() {
  const { zones, selectedZoneId, measurePoints, unitMode, setMeasurePoints } = useAppStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const zone = zones.find((z) => z.id === selectedZoneId);
  if (!zone) return null;

  const pointMap = new Map<string, typeof measurePoints[0]>();
  measurePoints.forEach((p) => pointMap.set(`${p.row}-${p.col}`, p));

  const handleEdit = (pointId: string, currentElev: number | null) => {
    const displayVal = currentElev !== null ? convertElevation(currentElev, unitMode) : '';
    setEditValue(displayVal);
    setEditingId(pointId);
  };

  const handleSave = async (pointId: string) => {
    const numVal = parseFloat(editValue);
    if (isNaN(numVal)) {
      setEditingId(null);
      return;
    }
    const mmVal = unitMode === 'cm' ? numVal * 10 : numVal;
    await updateMeasurePoint(pointId, Math.round(mmVal));
    const updated = await getMeasurePointsByZone(zone.id);
    setMeasurePoints(updated);
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, pointId: string) => {
    if (e.key === 'Enter') handleSave(pointId);
    if (e.key === 'Escape') setEditingId(null);
  };

  return (
    <div className="bg-white rounded-xl border border-steel-200 shadow-sm">
      <div className="px-5 py-3 border-b border-steel-200 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-navy-500 uppercase tracking-wider">测点高程网格</h2>
          <p className="text-xs text-steel-400 mt-0.5">
            网格间距 {zone.gridSpacingMm >= 1000 ? `${zone.gridSpacingMm / 1000}m` : `${zone.gridSpacingMm}mm`} · 点击数值编辑
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-steel-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning inline-block" /> 补录</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-steel-300 inline-block border border-dashed" /> 未录入</span>
        </div>
      </div>

      <div className="p-5 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-xs text-steel-400 font-medium p-2 text-left">行\\列</th>
              {Array.from({ length: zone.gridCols }, (_, i) => (
                <th key={i} className="text-xs text-steel-400 font-medium p-2 text-center">列{i + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: zone.gridRows }, (_, row) => (
              <tr key={row}>
                <td className="text-xs text-steel-400 font-medium p-2 text-left">行{row + 1}</td>
                {Array.from({ length: zone.gridCols }, (_, col) => {
                  const point = pointMap.get(`${row}-${col}`);
                  const isEditing = editingId === point?.id;
                  const isEmpty = !point || point.elevationMm === null;
                  const isSupplemented = point?.isSupplemented || false;

                  return (
                    <td key={col} className="p-1.5">
                      <div
                        className={`
                          relative rounded-lg border-2 p-3 text-center transition-all min-w-[100px]
                          ${isEmpty ? 'border-dashed border-steel-300 bg-steel-50' : ''}
                          ${isSupplemented && !isEmpty ? 'border-warning/50 bg-warning/5' : ''}
                          ${!isEmpty && !isSupplemented ? 'border-steel-200 bg-white hover:border-navy-300' : ''}
                        `}
                      >
                        {isEmpty ? (
                          <div className="py-2">
                            <AlertCircle className="w-4 h-4 text-steel-300 mx-auto mb-1" />
                            <span className="text-xs text-steel-400 block">{point?.label || '—'}</span>
                            <span className="text-xs text-steel-300">未录入</span>
                          </div>
                        ) : isEditing ? (
                          <div>
                            <span className="text-xs text-steel-400 block mb-1">{point!.label}</span>
                            <input
                              type="number"
                              step="0.1"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, point!.id)}
                              onBlur={() => handleSave(point!.id)}
                              autoFocus
                              className="w-full text-center font-mono text-sm bg-amber-50 border border-amber-300 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                            />
                            <span className="text-xs text-steel-400 mt-0.5 block">{unitMode}</span>
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer group"
                            onClick={() => handleEdit(point!.id, point!.elevationMm)}
                          >
                            <span className="text-xs text-steel-400 block">{point!.label}</span>
                            <span className="font-mono text-lg font-semibold text-navy-700 block mt-0.5">
                              {convertElevation(point!.elevationMm!, unitMode)}
                            </span>
                            <span className="text-xs text-steel-400">{unitMode}</span>
                            <Edit3 className="w-3 h-3 text-steel-300 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {isSupplemented && (
                              <span className="absolute top-1 left-1 text-[10px] bg-warning text-white px-1 py-0 rounded font-medium">
                                补录
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
