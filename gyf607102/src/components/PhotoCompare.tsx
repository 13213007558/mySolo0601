import { X, ArrowLeftRight } from 'lucide-react';
import type { InspectionPhoto } from '@/types';
import { formatDateTime } from '@/utils/export';
import { cn } from '@/lib/utils';

interface PhotoCompareProps {
  beforePhoto: InspectionPhoto;
  afterPhoto: InspectionPhoto;
  onClose: () => void;
}

export const PhotoCompare = ({ beforePhoto, afterPhoto, onClose }: PhotoCompareProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-6xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <ArrowLeftRight className="h-5 w-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-gray-800">照片对比 - 补录前后差异</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
          <div className="space-y-3">
            <div className={cn(
              'rounded-lg p-3',
              beforePhoto.isManual ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'
            )}>
              <p className="text-sm font-medium text-gray-800">补录前</p>
              <p className="mt-1 text-xs text-gray-600">{beforePhoto.filename}</p>
              <p className="mt-1 text-xs text-gray-500">
                {beforePhoto.uploader} · {formatDateTime(beforePhoto.uploadedAt)}
              </p>
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-300">
              <img
                src={beforePhoto.url}
                alt={beforePhoto.filename}
                className="h-64 w-full object-cover"
              />
            </div>
            {beforePhoto.remark && (
              <div className="rounded-lg bg-gray-100 p-3 text-sm text-gray-700">
                <span className="font-medium">照片备注: </span>
                {beforePhoto.remark}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className={cn(
              'rounded-lg p-3',
              afterPhoto.isManual ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'
            )}>
              <p className="text-sm font-medium text-gray-800">补录后</p>
              <p className="mt-1 text-xs text-gray-600">{afterPhoto.filename}</p>
              <p className="mt-1 text-xs text-gray-500">
                {afterPhoto.uploader} · {formatDateTime(afterPhoto.uploadedAt)}
              </p>
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-300">
              <img
                src={afterPhoto.url}
                alt={afterPhoto.filename}
                className="h-64 w-full object-cover"
              />
            </div>
            {afterPhoto.remark && (
              <div className="rounded-lg bg-gray-100 p-3 text-sm text-gray-700">
                <span className="font-medium">照片备注: </span>
                {afterPhoto.remark}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 bg-amber-50 px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full bg-amber-500 text-center text-sm text-white">!</div>
            <div>
              <p className="text-sm font-medium text-amber-800">差异分析</p>
              <ul className="mt-1 space-y-1 text-xs text-amber-700">
                <li>• 左侧为原始抽检照片，右侧为叶师傅手工补录的更换后照片</li>
                <li>• 可明显看到熔丝已更换，外观恢复正常状态</li>
                <li>• 操作人、上传时间均有记录，确保操作可追溯</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
