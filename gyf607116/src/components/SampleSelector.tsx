import React from 'react';
import { X, Check, Database, AlertCircle, Trash2, UserPlus } from 'lucide-react';
import { useRecordStore } from '../store/useRecordStore';
import { sampleDescriptions } from '../data/samples';
import type { SampleType } from '../types';

export const SampleSelector: React.FC = () => {
  const { isSampleSelectorOpen, setSampleSelectorOpen, loadSample, addAlert } = useRecordStore();

  if (!isSampleSelectorOpen) {
    return null;
  }

  const samples: { type: SampleType; icon: React.ElementType; color: string }[] = [
    { type: 'normal', icon: Check, color: 'emerald' },
    { type: 'abnormal', icon: AlertCircle, color: 'orange' },
    { type: 'linjie', icon: UserPlus, color: 'violet' },
    { type: 'empty', icon: Trash2, color: 'gray' }
  ];

  const handleLoad = (type: SampleType) => {
    loadSample(type);
    setSampleSelectorOpen(false);
    
    const desc = sampleDescriptions[type];
    addAlert({
      type: 'success',
      message: desc.name + ' 已加载',
      plainText: `${desc.name} 已加载完成。${desc.description}`
    });
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; hover: string; icon: string }> = {
      emerald: {
        bg: 'bg-emerald-900/30',
        border: 'border-emerald-700 hover:border-emerald-500',
        hover: 'hover:bg-emerald-900/50',
        icon: 'text-emerald-400'
      },
      orange: {
        bg: 'bg-orange-900/30',
        border: 'border-orange-700 hover:border-orange-500',
        hover: 'hover:bg-orange-900/50',
        icon: 'text-orange-400'
      },
      violet: {
        bg: 'bg-violet-900/30',
        border: 'border-violet-700 hover:border-violet-500',
        hover: 'hover:bg-violet-900/50',
        icon: 'text-violet-400'
      },
      gray: {
        bg: 'bg-gray-800/50',
        border: 'border-gray-600 hover:border-gray-400',
        hover: 'hover:bg-gray-700/50',
        icon: 'text-gray-400'
      }
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl card-panel animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b border-bgdark-700">
          <div className="flex items-center gap-3">
            <Database size={20} className="text-primary-400" />
            <h2 className="text-lg font-semibold text-white">加载内置样例数据</h2>
          </div>
          <button
            onClick={() => setSampleSelectorOpen(false)}
            className="p-2 text-gray-400 hover:text-white hover:bg-bgdark-700 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-400 mb-6 text-sm">
            选择一个样例数据来体验不同场景下的复核台功能。无需导入外部文件即可测试。
          </p>

          <div className="grid gap-4">
            {samples.map(({ type, icon: Icon, color }) => {
              const classes = getColorClasses(color);
              const desc = sampleDescriptions[type];
              
              return (
                <button
                  key={type}
                  onClick={() => handleLoad(type)}
                  className={`w-full p-4 text-left border-2 rounded ${classes.bg} ${classes.border} ${classes.hover} transition-all duration-150 active:scale-[0.99]`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded ${classes.bg} ${classes.icon}`}>
                      <Icon size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{desc.name}</h3>
                      <p className="text-sm text-gray-400">{desc.description}</p>
                    </div>
                    <ChevronRight size={20} className="text-gray-500" />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-primary-900/30 border border-primary-700 rounded text-sm">
            <p className="text-primary-300">
              💡 <strong>提示：</strong>样例数据会追加到现有数据中。如需完全替换，请先选择"清空数据"。
              所有数据仅存储在您的浏览器本地，不会上传到任何服务器。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
