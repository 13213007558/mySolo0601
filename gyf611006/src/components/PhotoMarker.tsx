import React, { useRef } from 'react';
import { Camera, Upload, Trash2, Crosshair, Image as ImageIcon } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const PhotoMarker: React.FC = () => {
  const { leakSource, setLeakSourcePoint, setLeakSourcePhoto, clearLeakSource } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setLeakSourcePhoto(url, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imgRef.current) return;
    
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setLeakSourcePoint(x, y);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLImageElement>) => {
    if (!imgRef.current || e.touches.length !== 0) return;
    
    const touch = e.changedTouches[0];
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;
    
    setLeakSourcePoint(x, y);
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-dark-200 flex items-center gap-2">
          <Camera size={14} className="text-warning-400" />
          现场照片
        </h3>
        {leakSource.photoUrl && (
          <button
            onClick={clearLeakSource}
            className="text-xs text-danger-400 hover:text-danger-300 flex items-center gap-1"
          >
            <Trash2 size={12} />
            清除
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {!leakSource.photoUrl ? (
        <button
          onClick={triggerUpload}
          className="flex-1 min-h-[200px] border-2 border-dashed border-dark-600 rounded-lg flex flex-col items-center justify-center gap-3 hover:border-warning-500 hover:bg-dark-700/50 transition-all group"
        >
          <div className="w-16 h-16 rounded-full bg-dark-700 flex items-center justify-center group-hover:bg-dark-600 transition-colors">
            <Upload size={24} className="text-dark-400 group-hover:text-warning-400 transition-colors" />
          </div>
          <div className="text-center">
            <p className="text-sm text-dark-300">点击上传现场照片</p>
            <p className="text-xs text-dark-500 mt-1">支持拍照或从相册选择</p>
          </div>
        </button>
      ) : (
        <div className="relative flex-1 min-h-[200px] rounded-lg overflow-hidden bg-dark-900">
          <img
            ref={imgRef}
            src={leakSource.photoUrl}
            alt="现场照片"
            className="w-full h-full object-contain cursor-crosshair"
            onClick={handleImageClick}
            onTouchEnd={handleTouchEnd}
          />
          
          {leakSource.point && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                left: `${leakSource.point.x}%`,
                top: `${leakSource.point.y}%`,
              }}
            >
              <div className="relative">
                <div className="w-8 h-8 border-2 border-danger-500 rounded-full animate-ping absolute -top-4 -left-4 opacity-50" />
                <div className="w-8 h-8 border-2 border-danger-500 rounded-full flex items-center justify-center bg-danger-500/20 backdrop-blur-sm">
                  <Crosshair size={14} className="text-danger-400" />
                </div>
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 whitespace-nowrap">
                <span className="text-xs text-danger-400 font-mono bg-dark-900/80 px-1.5 py-0.5 rounded">
                  泄漏源
                </span>
              </div>
            </div>
          )}

          <div className="absolute bottom-2 left-2 text-xs text-dark-300 bg-dark-900/70 px-2 py-1 rounded flex items-center gap-1">
            <ImageIcon size={12} />
            {leakSource.photoName || '现场照片'}
          </div>

          {!leakSource.point && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs text-warning-400 bg-warning-500/20 px-2 py-1 rounded">
              点击照片标记泄漏源位置
            </div>
          )}
        </div>
      )}

      {leakSource.point && (
        <div className="mt-3 p-2.5 bg-dark-700/50 rounded-lg">
          <div className="flex items-center justify-between text-xs">
            <span className="text-dark-400">源点坐标</span>
            <span className="text-warning-400 font-mono">
              X: {leakSource.point.x.toFixed(1)}%, Y: {leakSource.point.y.toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
