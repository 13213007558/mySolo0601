import React, { useState } from 'react';
import { 
  Diamond, 
  Wind, 
  Camera, 
  History, 
  MessageSquare,
  Info,
  Menu,
  X
} from 'lucide-react';
import { DiamondRuler } from '../components/DiamondRuler';
import { WindFan } from '../components/WindFan';
import { PhotoMarker } from '../components/PhotoMarker';
import { ModeSwitch } from '../components/ModeSwitch';
import { DistanceInfoPanel } from '../components/DistanceInfoPanel';
import { SubmitButton } from '../components/SubmitButton';
import { HistoryPanel } from '../components/HistoryPanel';
import { HistoryOverlay } from '../components/HistoryOverlay';
import { SmsPushPanel } from '../components/SmsPushPanel';
import { Watermark } from '../components/Watermark';
import { useAppStore } from '../store/useAppStore';

type TabType = 'wind' | 'photo' | 'history' | 'sms';

const IndexPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('wind');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const { showHistoryOverlay } = useAppStore();

  const tabs = [
    { key: 'wind', label: '风向', icon: Wind, color: 'text-blue-400' },
    { key: 'photo', label: '照片', icon: Camera, color: 'text-warning-400' },
    { key: 'history', label: '历史', icon: History, color: 'text-purple-400' },
    { key: 'sms', label: '推送', icon: MessageSquare, color: 'text-green-400' },
  ] as const;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'wind':
        return <WindFan />;
      case 'photo':
        return <PhotoMarker />;
      case 'history':
        return <HistoryPanel />;
      case 'sms':
        return <SmsPushPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-dark-900 text-dark-100 overflow-hidden">
      <Watermark />

      <header className="flex-shrink-0 border-b border-dark-700 bg-dark-800/80 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-warning-400 to-warning-600 flex items-center justify-center shadow-lg shadow-warning-500/30">
              <Diamond size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-dark-100">危化菱形测距端</h1>
              <p className="text-xs text-dark-500">化工园区泄漏应急测距工具</p>
            </div>
          </div>

          <div className="hidden md:block">
            <ModeSwitch />
          </div>

          <button
            className="md:hidden p-2 text-dark-400 hover:text-dark-200"
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
          >
            {showMobileSidebar ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <div className="md:hidden px-4 py-2 border-b border-dark-700">
        <ModeSwitch />
      </div>

      <main className="flex-1 flex overflow-hidden">
        <div className="hidden lg:flex flex-col w-72 border-r border-dark-700 bg-dark-800/50 p-4 overflow-y-auto">
          <DistanceInfoPanel />
          
          <div className="mt-6 pt-4 border-t border-dark-700">
            <SubmitButton />
          </div>

          <div className="mt-4 p-3 bg-dark-700/30 rounded-lg">
            <div className="flex items-start gap-2 text-xs text-dark-500">
              <Info size={12} className="flex-shrink-0 mt-0.5 text-dark-400" />
              <p>
                实盘模式数据将记录在案，演练模式数据仅供测试。
                请确保在实盘操作前校准设备。
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 relative bg-dark-900 overflow-hidden">
            <svg
              viewBox="0 0 600 600"
              className="absolute inset-0 w-full h-full"
              style={{ pointerEvents: 'none' }}
              preserveAspectRatio="xMidYMid meet"
            >
              {showHistoryOverlay && <HistoryOverlay width={600} height={600} />}
            </svg>
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full max-w-2xl aspect-square p-4">
                <DiamondRuler width={600} height={600} />
              </div>
            </div>

            <div className="absolute bottom-4 left-4 text-xs text-dark-500 bg-dark-800/80 px-2 py-1 rounded">
              比例尺: 1px = 5m
            </div>
          </div>

          <div className="lg:hidden flex border-t border-dark-700 bg-dark-800">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-3 flex flex-col items-center gap-1 text-xs transition-colors ${
                  activeTab === tab.key
                    ? `${tab.color} bg-dark-700/50`
                    : 'text-dark-500 hover:text-dark-300'
                }`}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div
          className={`hidden lg:flex flex-col w-80 border-l border-dark-700 bg-dark-800/50 p-4 overflow-y-auto`}
        >
          <div className="flex gap-1 mb-4 p-1 bg-dark-700/50 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === tab.key
                    ? `bg-dark-600 ${tab.color} shadow-sm`
                    : 'text-dark-400 hover:text-dark-200'
                }`}
              >
                <tab.icon size={13} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {renderTabContent()}
          </div>
        </div>

        {showMobileSidebar && (
          <div className="lg:hidden fixed inset-0 z-40 bg-dark-900/95 flex flex-col">
            <div className="p-4 border-b border-dark-700 flex items-center justify-between">
              <h2 className="font-medium text-dark-100">距离信息</h2>
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="p-1 text-dark-400 hover:text-dark-200"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <DistanceInfoPanel />
              <div className="mt-6 pt-4 border-t border-dark-700">
                <SubmitButton />
              </div>
            </div>
          </div>
        )}

        <div
          className={`lg:hidden fixed inset-x-0 bottom-0 z-30 bg-dark-800 border-t border-dark-700 transform transition-transform duration-300 ${
            showMobileSidebar ? 'translate-y-full' : 'translate-y-0'
          }`}
          style={{ maxHeight: '50%' }}
        >
          <div className="flex-1 overflow-y-auto p-4">
            {renderTabContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default IndexPage;

export const Head = () => (
  <>
    <title>危化菱形测距端 - 化工园区泄漏应急测距工具</title>
    <meta name="description" content="化工园区泄漏应急处置专业测距工具，支持菱形标签四向拖拽测距、风向扇形自动修正、违规距离禁止提交" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  </>
);
