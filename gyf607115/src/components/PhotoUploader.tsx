import { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, X, ZoomIn } from 'lucide-react';
import { cn } from '../lib/utils';

interface PhotoUploaderProps {
  value?: string;
  onChange?: (url: string) => void;
  className?: string;
  label?: string;
}

export function PhotoUploader({ value, onChange, className, label }: PhotoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onChange?.(result);
      };
      reader.readAsDataURL(file);
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.('');
    },
    [onChange]
  );

  if (value) {
    return (
      <div className={cn('relative group', className)}>
        <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
          <img
            src={value}
            alt="BMS屏幕拍照"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="bg-white/90 rounded-full p-2 shadow-lg hover:bg-white transition-colors"
            >
              <ZoomIn className="h-5 w-5 text-slate-700" />
            </button>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 shadow-lg hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
          >
            <X className="h-4 w-4 text-red-600" />
          </button>
          {label && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <span className="text-xs text-white font-medium">{label}</span>
            </div>
          )}
        </div>

        {showPreview && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPreview(false)}
          >
            <img
              src={value}
              alt="预览"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              className="absolute top-4 right-4 text-white hover:text-slate-300 transition-colors"
              onClick={() => setShowPreview(false)}
            >
              <X className="h-8 w-8" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative rounded-lg border-2 border-dashed transition-all cursor-pointer',
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50',
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => document.getElementById('photo-upload')?.click()}
    >
      <input
        id="photo-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors',
            isDragging ? 'bg-blue-100' : 'bg-slate-100'
          )}
        >
          {isDragging ? (
            <ImageIcon className="h-8 w-8 text-blue-600" />
          ) : (
            <Upload className="h-8 w-8 text-slate-400" />
          )}
        </div>
        <p className="text-sm font-medium text-slate-700">
          {isDragging ? '松开以上传图片' : '点击或拖拽上传BMS屏幕拍照'}
        </p>
        <p className="mt-1 text-xs text-slate-500">支持 JPG、PNG 格式，单张不超过 10MB</p>
      </div>
    </div>
  );
}
