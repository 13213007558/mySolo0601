import { useState } from 'react';
import { LayoutDashboard, History } from 'lucide-react';
import Dashboard from '../../pages/Dashboard';
import HistoryPage from '../../pages/HistoryPage';

const TabNavigation = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');

  const tabs = [
    { id: 'dashboard' as const, label: '告警看板', icon: LayoutDashboard },
    { id: 'history' as const, label: '操作历史', icon: History },
  ];

  return (
    <div className="min-h-screen bg-industrial-bg">
      <div className="border-b border-industrial-border bg-industrial-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all border-b-2 -mb-px
                    ${isActive
                      ? 'text-primary border-primary bg-primary/5'
                      : 'text-industrial-muted border-transparent hover:text-industrial-text hover:bg-industrial-border/20'
                    }
                  `}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'history' && <HistoryPage />}
      </div>
    </div>
  );
};

export default TabNavigation;
