import React, { useState } from 'react';
import { History, ArrowRight, FileText, User, Calendar, Tag, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Edit3, RefreshCw } from 'lucide-react';
import type { VersionHistory } from '@/types';
import { useInspectionStore } from '@/store/useInspectionStore';
import { useAuthStore } from '@/store/useAuthStore';

interface VersionTimelineProps {
  versionHistory: VersionHistory[];
  showSensitiveContent?: boolean;
}

export const VersionTimeline: React.FC<VersionTimelineProps> = ({
  versionHistory,
  showSensitiveContent = false,
}) => {
  const [expanded, setExpanded] = useState(true);
  const { highlightedVersionId, setHighlightedVersion } = useInspectionStore();
  const { canViewSensitiveData } = useAuthStore();
  
  const canSeeDetails = showSensitiveContent || canViewSensitiveData();
  
  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case '撤回原因变更':
        return <Edit3 className="w-4 h-4" />;
      case '状态变更':
        return <RefreshCw className="w-4 h-4" />;
      case '补录':
        return <CheckCircle className="w-4 h-4" />;
      case '报价版本更新':
        return <Tag className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };
  
  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case '撤回原因变更':
        return 'bg-accent-orange text-white';
      case '状态变更':
        return 'bg-primary-500 text-white';
      case '补录':
        return 'bg-accent-gold text-white';
      case '报价版本更新':
        return 'bg-accent-green text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };
  
  const handleSourceClick = (sourceReference: string) => {
    const detailElement = document.getElementById('source-material-detail');
    if (detailElement) {
      detailElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      detailElement.classList.add('ring-2', 'ring-primary-400', 'ring-offset-2');
      setTimeout(() => {
        detailElement.classList.remove('ring-2', 'ring-primary-400', 'ring-offset-2');
      }, 3000);
    }
  };
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 bg-gradient-to-r from-primary-50 to-white hover:from-primary-100 transition-all duration-200 flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-primary-500" />
          <div className="text-left">
            <span className="font-semibold text-primary-700">
              版本历史记录
            </span>
            <span className="ml-2 text-sm text-gray-500">
              ({versionHistory.length}条记录)
            </span>
          </div>
          {versionHistory.some(vh => vh.changeType === '补录') && (
            <span className="badge supplemental-badge">
              含补录
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-primary-500 group-hover:scale-110 transition-transform" />
        ) : (
          <ChevronDown className="w-5 h-5 text-primary-500 group-hover:scale-110 transition-transform" />
        )}
      </button>
      
      {expanded && (
        <div className="p-4 animate-fade-in">
          {versionHistory.length > 0 ? (
            <div className="relative pl-8">
              <div className="timeline-line" />
              
              {versionHistory.map((version, index) => (
                <div
                  key={version.id}
                  id={`version-${version.id}`}
                  className={`relative mb-6 last:mb-0 transition-all duration-300 ${
                    highlightedVersionId === version.id
                      ? 'scale-[1.02]'
                      : ''
                  }`}
                  onClick={() => setHighlightedVersion(
                    highlightedVersionId === version.id ? null : version.id
                  )}
                >
                  <div
                    className={`timeline-dot ${getChangeTypeColor(version.changeType)} ${
                      highlightedVersionId === version.id ? 'scale-150' : ''
                    } transition-transform`}
                    style={{ top: '1.5rem' }}
                  />
                  
                  <div
                    className={`card p-4 cursor-pointer transition-all duration-300 ${
                      highlightedVersionId === version.id
                        ? 'ring-2 ring-primary-400 ring-offset-2 bg-primary-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getChangeTypeColor(version.changeType)}`}
                        >
                          {getChangeTypeIcon(version.changeType)}
                          {version.changeType}
                        </span>
                        <span className="text-xs font-mono text-gray-500">
                          {version.versionNumber}
                        </span>
                      </div>
                      
                      {version.previousWithdrawReason && version.withdrawReason !== version.previousWithdrawReason && (
                        <span className="badge bg-accent-orange/10 text-accent-orange border border-accent-orange/30">
                          内容已覆盖
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">操作人:</span>
                        <span className="font-medium text-gray-800">{version.changedBy}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">时间:</span>
                        <span className="font-medium text-gray-800">{version.changedAt}</span>
                      </div>
                      
                      {canSeeDetails && (
                        <>
                          {version.previousWithdrawReason && (
                            <div className="mt-3 p-3 bg-gray-100 rounded-lg border border-gray-200">
                              <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                原始撤回理由（已被覆盖）:
                              </div>
                              <p className="text-sm text-gray-500 line-through">
                                {version.previousWithdrawReason}
                              </p>
                            </div>
                          )}
                          
                          <div className="mt-2 p-3 bg-primary-50 rounded-lg border border-primary-200">
                            <div className="text-xs text-primary-600 mb-1 flex items-center gap-1">
                              <ArrowRight className="w-3.5 h-3.5" />
                              当前撤回理由:
                            </div>
                            <p className="text-sm font-medium text-primary-800">
                              {version.withdrawReason}
                            </p>
                          </div>
                          
                          <div
                            className="mt-2 flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 cursor-pointer group"
                            onClick={e => {
                              e.stopPropagation();
                              handleSourceClick(version.sourceMaterialReference);
                            }}
                          >
                            <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span className="underline decoration-dotted underline-offset-2">
                              查看原始材料: {version.sourceMaterialReference}
                            </span>
                          </div>
                        </>
                      )}
                      
                      {!canSeeDetails && (
                        <div className="mt-2 p-3 bg-gray-100 rounded-lg">
                          <p className="text-sm text-gray-400 desensitized">
                            撤回原因详情需要管理员权限查看
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>暂无版本历史记录</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
