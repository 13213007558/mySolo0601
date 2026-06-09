import React from 'react';
import {
  FileX,
  AlertTriangle,
  RefreshCw,
  UploadCloud,
  Database,
  Loader2,
} from 'lucide-react';
import { useBracketStore } from '@/store/useBracketStore';
import { useDataImport } from '@/hooks/useDataImport';

interface StatusFeedbackProps {
  status: 'empty' | 'all_problem' | 'state_lost' | 'only_problem' | 'loading';
}

export const StatusFeedback: React.FC<StatusFeedbackProps> = ({ status }) => {
  const loadMockData = useBracketStore((state) => state.loadMockData);
  const restoreFromBackup = useBracketStore((state) => state.restoreFromBackup);
  const { isImporting, fileInputRef, handleFileSelect, handleFileChange, handleDragOver, handleDrop } = useDataImport();

  const configs = {
    empty: {
      icon: <FileX className="w-16 h-16 text-slate-400" />,
      title: '暂无数据',
      description: '请导入客服回访表开始对账工作，或加载示例数据预览功能',
      primaryAction: { label: '导入 CSV 文件', onClick: handleFileSelect },
      secondaryAction: { label: '加载示例数据', onClick: loadMockData },
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      textColor: 'text-slate-600',
    },
    all_problem: {
      icon: <AlertTriangle className="w-16 h-16 text-orange-500" />,
      title: '本次导入全部为问题记录',
      description: '共发现 N 条数据存在问题，已全部移至右侧问题区处理。请逐一核实后标记为已解决。',
      primaryAction: null,
      secondaryAction: null,
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-700',
    },
    state_lost: {
      icon: <RefreshCw className="w-16 h-16 text-amber-500 animate-spin" />,
      title: '检测到页面刷新，本地状态可能已丢失',
      description: '您之前的筛选条件仍然保留，但数据可能需要重新加载。您可以选择恢复上次会话或重新导入数据。',
      primaryAction: { label: '恢复上次会话', onClick: restoreFromBackup },
      secondaryAction: { label: '重新导入数据', onClick: handleFileSelect },
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-700',
    },
    only_problem: {
      icon: <UploadCloud className="w-16 h-16 text-orange-500" />,
      title: '本次导入无正常记录',
      description: '所有导入数据均存在问题，已全部移至问题区处理。正常记录区当前为空，请在问题区处理完成后数据将自动移入。',
      primaryAction: null,
      secondaryAction: { label: '查看问题记录', onClick: () => {} },
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-700',
    },
    loading: {
      icon: <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />,
      title: '正在加载数据...',
      description: '请稍候，正在处理您的数据',
      primaryAction: null,
      secondaryAction: null,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
    },
  };

  const config = configs[status];

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`min-h-[400px] flex items-center justify-center p-8 ${status === 'empty' ? 'cursor-pointer' : ''}`}
    >
      <div
        className={`max-w-lg w-full p-8 rounded-xl border-2 ${config.bgColor} ${config.borderColor} ${config.textColor} text-center transition-all duration-500 hover:shadow-lg`}
      >
        <div className="mb-4 flex justify-center">
          <div className="animate-bounce-slow">{config.icon}</div>
        </div>
        <h3 className="text-xl font-bold mb-3 font-mono tracking-wide">{config.title}</h3>
        <p className="text-sm mb-6 leading-relaxed opacity-90">{config.description}</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {config.primaryAction && (
            <button
              onClick={config.primaryAction.onClick}
              disabled={isImporting}
              className="px-6 py-3 bg-slate-800 text-white rounded font-mono text-sm font-medium border-2 border-slate-800 hover:bg-slate-700 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  导入中...
                </span>
              ) : (
                <>
                  <Database className="w-4 h-4 inline mr-2" />
                  {config.primaryAction.label}
                </>
              )}
            </button>
          )}
          {config.secondaryAction && (
            <button
              onClick={config.secondaryAction.onClick}
              className="px-6 py-3 bg-transparent rounded font-mono text-sm font-medium border-2 border-current hover:bg-white hover:bg-opacity-30 transition-all"
            >
              {config.secondaryAction.label}
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileChange}
          className="hidden"
        />

        {status === 'empty' && (
          <p className="mt-6 text-xs opacity-60">
            支持拖拽 CSV/TXT 文件到此区域上传
          </p>
        )}
      </div>
    </div>
  );
};
