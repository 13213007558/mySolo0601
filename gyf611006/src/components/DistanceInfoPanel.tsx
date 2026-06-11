import React from 'react';
import { Ruler, Wind, ArrowUp, ArrowDown, ArrowRight, ArrowLeft, Target } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const DistanceInfoPanel: React.FC = () => {
  const { diamond, getCorrectedDistances, getValidationResult } = useAppStore();
  const corrected = getCorrectedDistances();
  const validation = getValidationResult();

  const directionItems = [
    { key: 'north', label: '北向', icon: ArrowUp, color: 'text-blue-400' },
    { key: 'south', label: '南向', icon: ArrowDown, color: 'text-orange-400' },
    { key: 'east', label: '东向', icon: ArrowRight, color: 'text-green-400' },
    { key: 'west', label: '西向', icon: ArrowLeft, color: 'text-purple-400' },
  ] as const;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-dark-200 flex items-center gap-2 mb-3">
          <Ruler size={14} className="text-warning-400" />
          原始测量距离
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {directionItems.map(({ key, label, icon: Icon, color }) => (
            <div
              key={key}
              className="bg-dark-700/50 rounded-lg p-3"
            >
              <div className="flex items-center gap-1.5 text-xs text-dark-400 mb-1">
                <Icon size={12} className={color} />
                <span>{label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-mono font-bold text-dark-100">
                  {diamond.distances[key]}
                </span>
                <span className="text-xs text-dark-500">m</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs bg-dark-700/30 px-3 py-2 rounded">
          <span className="text-dark-400">平均距离</span>
          <span className="font-mono text-dark-200">
            {diamond.distances.average} m
          </span>
        </div>
      </div>

      <div className="pt-3 border-t border-dark-700">
        <h3 className="text-sm font-medium text-dark-200 flex items-center gap-2 mb-3">
          <Wind size={14} className="text-blue-400" />
          风向修正后距离
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {directionItems.map(({ key, label, icon: Icon }) => (
            <div
              key={key}
              className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20"
            >
              <div className="flex items-center gap-1.5 text-xs text-blue-400/70 mb-1">
                <Icon size={12} />
                <span>{label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-mono font-bold text-blue-400">
                  {corrected[key]}
                </span>
                <span className="text-xs text-blue-400/50">m</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-xs bg-blue-500/10 px-3 py-2 rounded border border-blue-500/20">
            <span className="text-blue-400/70">平均修正距离</span>
            <span className="font-mono text-blue-400 font-medium">
              {corrected.average} m
            </span>
          </div>
          <div className={`flex items-center justify-between text-xs px-3 py-2 rounded border ${
            validation.actualMinDistance >= validation.minRequiredDistance
              ? 'bg-safety-500/10 border-safety-500/30'
              : 'bg-danger-500/10 border-danger-500/30'
          }`}>
            <span className={`flex items-center gap-1.5 ${
              validation.actualMinDistance >= validation.minRequiredDistance
                ? 'text-safety-400'
                : 'text-danger-400'
            }`}>
              <Target size={12} />
              最小距离
            </span>
            <span className={`font-mono font-medium ${
              validation.actualMinDistance >= validation.minRequiredDistance
                ? 'text-safety-400'
                : 'text-danger-400'
            }`}>
              {corrected.min} / {validation.minRequiredDistance} m
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
