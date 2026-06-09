import { useState } from 'react';
import { X, ZoomIn, Upload, User } from 'lucide-react';
import type { InspectionPhoto } from '@/types';
import { formatDateTime } from '@/utils/export';
import { cn } from '@/lib/utils';

interface PhotoGalleryProps {
  photos: InspectionPhoto[];
  title: string;
  showManualBadge?: boolean;
  onCompare?: (photo: InspectionPhoto) => void;
}

export const PhotoGallery = ({ photos, title, showManualBadge = false, onCompare }: PhotoGalleryProps) => {
  const [selectedPhoto, setSelectedPhoto] = useState<InspectionPhoto | null>(null);

  if (photos.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center">
        <Upload className="mx-auto h-8 w-8 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">暂无{title}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        {showManualBadge && <User className="h-4 w-4 text-amber-600" />}
        {title} ({photos.length})
      </h4>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className={cn(
              'group relative overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:border-blue-500 hover:shadow-md',
              photo.isManual && 'border-amber-400'
            )}
          >
            <div className="aspect-square overflow-hidden">
              <img
                src={photo.url}
                alt={photo.filename}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
              <button
                onClick={() => setSelectedPhoto(photo)}
                className="rounded-full bg-white/90 p-2 text-gray-700 shadow-lg transition-transform hover:scale-110"
              >
                <ZoomIn className="h-5 w-5" />
              </button>
              {onCompare && (
                <button
                  onClick={() => onCompare(photo)}
                  className="ml-2 rounded-full bg-amber-500/90 p-2 text-white shadow-lg transition-transform hover:scale-110"
                  title="用于对比"
                >
                  <span className="text-xs font-bold">对比</span>
                </button>
              )}
            </div>
            {photo.isManual && (
              <div className="absolute left-1 top-1 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                手工补录
              </div>
            )}
            <div className="p-2">
              <p className="truncate text-xs font-medium text-gray-700">{photo.filename}</p>
              <p className="mt-0.5 text-[10px] text-gray-500">
                {photo.uploader} · {formatDateTime(photo.uploadedAt)}
              </p>
              {photo.remark && (
                <p className="mt-1 text-[10px] text-gray-600 line-clamp-2">{photo.remark}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-lg bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.filename}
              className="max-h-[80vh] w-auto object-contain"
            />
            <div className="border-t border-gray-200 bg-gray-50 p-4">
              <p className="font-medium text-gray-800">{selectedPhoto.filename}</p>
              <p className="mt-1 text-sm text-gray-600">
                上传人: {selectedPhoto.uploader} · {formatDateTime(selectedPhoto.uploadedAt)}
              </p>
              {selectedPhoto.remark && (
                <p className="mt-2 text-sm text-gray-700">备注: {selectedPhoto.remark}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
