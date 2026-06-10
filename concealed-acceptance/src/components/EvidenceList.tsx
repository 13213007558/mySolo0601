import React from 'react';
import { FileText, Image, MessageSquare, X } from 'lucide-react';
import type { Evidence, EvidenceType } from '@/types';
import { EVIDENCE_TYPE_LABELS } from '@/types';
import { formatDateTimeChinese } from '@/utils/date';

interface EvidenceListProps {
  evidence: Evidence[];
  onRemove?: (evidenceId: string) => void;
  onAdd?: (type: EvidenceType, file: File, dataUrl: string) => void;
  canEdit?: boolean;
}

const getEvidenceIcon = (type: EvidenceType) => {
  switch (type) {
    case 'ACCEPTANCE_FORM':
      return FileText;
    case 'SITE_PHOTO':
      return Image;
    case 'SUPPLEMENT_NOTE':
      return MessageSquare;
    default:
      return FileText;
  }
};

const getEvidenceColor = (type: EvidenceType) => {
  switch (type) {
    case 'ACCEPTANCE_FORM':
      return 'text-blue-600 bg-blue-50';
    case 'SITE_PHOTO':
      return 'text-green-600 bg-green-50';
    case 'SUPPLEMENT_NOTE':
      return 'text-purple-600 bg-purple-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export const EvidenceList: React.FC<EvidenceListProps> = ({ evidence, onRemove, onAdd, canEdit = false }) => {
  const handleFileUpload = (type: EvidenceType) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAdd) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        onAdd(type, file, dataUrl);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const requiredTypes: EvidenceType[] = ['ACCEPTANCE_FORM', 'SITE_PHOTO'];
  const hasType = (type: EvidenceType) => evidence.some((e) => e.type === type);

  return (
    <div className="space-y-3">
      {evidence.length === 0 && !canEdit && (
        <div className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
          暂无证据材料
        </div>
      )}

      {evidence.map((item) => {
        const Icon = getEvidenceIcon(item.type);
        const colorClass = getEvidenceColor(item.type);
        return (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
          >
            <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded">
                  {EVIDENCE_TYPE_LABELS[item.type]}
                </span>
                <span className="text-sm font-medium text-gray-900 truncate">{item.name}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {item.uploadedBy} · {formatDateTimeChinese(item.uploadTime)}
              </p>
            </div>
            {item.dataUrl.startsWith('data:image') && (
              <img
                src={item.dataUrl}
                alt={item.name}
                className="w-12 h-12 rounded object-cover flex-shrink-0"
              />
            )}
            {canEdit && onRemove && (
              <button
                onClick={() => onRemove(item.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })}

      {canEdit && onAdd && (
        <div className="grid grid-cols-4 gap-2">
          {requiredTypes.map((type) => {
            const Icon = getEvidenceIcon(type);
            const hasThisType = hasType(type);
            return (
              <label
                key={type}
                className={`flex flex-col items-center justify-center p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                  ${hasThisType
                    ? 'border-green-300 bg-green-50 text-green-600'
                    : 'border-gray-300 hover:border-concealed-orange hover:bg-orange-50 text-gray-500'}`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{EVIDENCE_TYPE_LABELS[type]}</span>
                <span className="text-xs text-gray-400 mt-0.5">
                  {hasThisType ? '已上传' : '点击上传'}
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileUpload(type)}
                />
              </label>
            );
          })}
          <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-400 hover:bg-purple-50 text-gray-500 transition-colors">
            <MessageSquare className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">补签说明</span>
            <span className="text-xs text-gray-400 mt-0.5">可选</span>
            <input
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileUpload('SUPPLEMENT_NOTE')}
            />
          </label>
        </div>
      )}
    </div>
  );
};
