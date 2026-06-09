import { useState } from 'react';
import { Camera, Upload, FileSpreadsheet, Eye, Clock, User, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ParkingSpot } from '../../types';
import { cn, formatDateTime } from '../../utils/helpers';
import ScreenshotGallery from './ScreenshotGallery';
import ValueComparison from './ValueComparison';
import ManualEntryModal from '../Modals/ManualEntryModal';

interface ExpandablePanelProps {
  spot: ParkingSpot;
  isExpanded: boolean;
}

const ExpandablePanel = ({ spot, isExpanded }: ExpandablePanelProps) => {
  const [activeTab, setActiveTab] = useState<'screenshots' | 'comparison' | 'history'>('screenshots');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [selectedScreenshotIndex, setSelectedScreenshotIndex] = useState(spot.screenshots.length - 1);

  const tabs = [
    { id: 'screenshots' as const, label: '车位截图', icon: Camera },
    { id: 'comparison' as const, label: '数据对比', icon: FileSpreadsheet },
    { id: 'history' as const, label: '变更历史', icon: Clock },
  ];

  const currentScreenshot = spot.screenshots[selectedScreenshotIndex];

  const prevScreenshot = () => {
    setSelectedScreenshotIndex((prev) => Math.max(0, prev - 1));
  };

  const nextScreenshot = () => {
    setSelectedScreenshotIndex((prev) => Math.min(spot.screenshots.length - 1, prev + 1));
  };

  return (
    <div className={cn(
      'expandable-content border-t border-industrial-border',
      isExpanded ? 'expanded' : 'collapsed'
    )}>
      <div className="p-4 bg-industrial-bg/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-sm',
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-industrial-muted hover:text-industrial-text hover:bg-industrial-border/30'
                  )}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowManualEntry(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Upload size={16} />
            手工补录
          </button>
        </div>

        {activeTab === 'screenshots' && (
          <div className="space-y-4">
            <div className="relative">
              <div className="aspect-video bg-industrial-card rounded-sm overflow-hidden relative">
                {currentScreenshot ? (
                  <>
                    <img
                      src={currentScreenshot.url}
                      alt={`车位${spot.spotNumber}截图`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            'px-2 py-0.5 text-xs font-medium rounded-sm',
                            currentScreenshot.source === 'manual'
                              ? 'bg-primary text-white'
                              : 'bg-industrial-border text-industrial-text'
                          )}>
                            {currentScreenshot.source === 'manual' ? '手工补录' : '系统自动'}
                          </span>
                          <span className="text-xs text-white/80">
                            {formatDateTime(currentScreenshot.timestamp)}
                          </span>
                        </div>
                        {currentScreenshot.uploadedBy && (
                          <div className="flex items-center gap-1 text-xs text-white/80">
                            <User size={12} />
                            {currentScreenshot.uploadedBy}
                          </div>
                        )}
                      </div>
                      {currentScreenshot.remark && (
                        <div className="mt-2 text-sm text-white/90 bg-black/30 p-2 rounded-sm">
                          <Eye size={14} className="inline mr-1" />
                          {currentScreenshot.remark}
                        </div>
                      )}
                    </div>

                    {spot.screenshots.length > 1 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); prevScreenshot(); }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-sm transition-all"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); nextScreenshot(); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-sm transition-all"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-industrial-muted">
                    <Camera size={48} className="opacity-30" />
                  </div>
                )}
              </div>

              {spot.screenshots.length > 1 && (
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1">
                  {spot.screenshots.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); setSelectedScreenshotIndex(idx); }}
                      className={cn(
                        'w-2 h-2 rounded-full transition-all',
                        idx === selectedScreenshotIndex
                          ? 'bg-white scale-125'
                          : 'bg-white/40 hover:bg-white/60'
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            <ScreenshotGallery
              screenshots={spot.screenshots}
              selectedIndex={selectedScreenshotIndex}
              onSelect={setSelectedScreenshotIndex}
            />
          </div>
        )}

        {activeTab === 'comparison' && (
          <ValueComparison spot={spot} />
        )}

        {activeTab === 'history' && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {spot.screenshots.slice().reverse().map((ss, idx) => (
              <div key={ss.id} className="card-industrial p-3 flex items-center gap-3">
                <img
                  src={ss.url}
                  alt=""
                  className="w-20 h-14 object-cover rounded-sm"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      'px-2 py-0.5 text-xs font-medium rounded-sm',
                      ss.source === 'manual'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-industrial-border text-industrial-muted'
                    )}>
                      {ss.source === 'manual' ? '手工补录' : '系统截图'}
                    </span>
                    <span className="text-xs text-industrial-muted">
                      {formatDateTime(ss.timestamp)}
                    </span>
                  </div>
                  {ss.uploadedBy && (
                    <div className="text-xs text-industrial-muted flex items-center gap-1">
                      <User size={12} />
                      {ss.uploadedBy}
                    </div>
                  )}
                  {ss.remark && (
                    <div className="text-sm text-industrial-text mt-1">{ss.remark}</div>
                  )}
                </div>
                <div className="text-xs text-industrial-muted font-mono-nums">
                  #{spot.screenshots.length - idx}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showManualEntry && (
        <ManualEntryModal
          spot={spot}
          onClose={() => setShowManualEntry(false)}
        />
      )}
    </div>
  );
};

export default ExpandablePanel;
