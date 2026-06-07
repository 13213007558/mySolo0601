import { useEffect, useState } from 'react';
import { Upload, UserPlus, Shield, Search, Filter, Baby as BabyIcon } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import StatusBanner from '../components/StatusBanner';
import BabyCard from '../components/BabyCard';
import BabyDetail from '../components/BabyDetail';
import ImportModal from '../components/ImportModal';
import ManualAddModal from '../components/ManualAddModal';
import AuditPage from '../components/AuditPage';
import type { ImportResult } from '../../shared/types';

type View = 'list' | 'detail' | 'audit';

export default function Home() {
  const { babies, status, selectedBabyId, importResult, fetchBabies, selectBaby, importRows, clearImportResult, addManualBaby } = useAppStore();
  const [view, setView] = useState<View>('list');
  const [showImport, setShowImport] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState<'all' | 'dirty' | 'manual'>('all');

  useEffect(() => {
    fetchBabies();
  }, [fetchBabies]);

  const dirtyCount = babies.filter(b => !b.phoneValid || b.temperatures.length === 0).length;

  const filtered = babies.filter(b => {
    if (keyword && !b.name.includes(keyword) && !b.phone.includes(keyword)) return false;
    if (filter === 'dirty' && !(!b.phoneValid || b.temperatures.length === 0)) return false;
    if (filter === 'manual' && !b.isManual) return false;
    return true;
  });

  const handleImport = async (rows: Parameters<typeof importRows>[0]): Promise<ImportResult | null> => {
    return await importRows(rows);
  };

  const handleBack = () => {
    setView('list');
    selectBaby(null);
  };

  const handleCardClick = (id: string) => {
    selectBaby(id);
    setView('detail');
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-paper-100/80 border-b border-ink-100">
        <div className="container py-4 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sage-600 flex items-center justify-center text-paper-50 shadow-paper">
              <BabyIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="h-display text-lg leading-tight">婴幼儿晨检复核回访册</h1>
              <p className="text-xs text-ink-500">试听顾问版 · 三楼婴儿房</p>
            </div>
          </div>
          <div className="flex-1" />
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              className="input !pl-9 w-64"
              placeholder="搜索姓名 / 手机号"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
            />
          </div>
          <button
            className={`btn-secondary ${view === 'audit' ? 'ring-2 ring-sage-400' : ''}`}
            onClick={() => setView(view === 'audit' ? 'list' : 'audit')}
          >
            <Shield className="w-4 h-4" />
            审计日志
          </button>
          <button className="btn-secondary" onClick={() => { setShowImport(true); clearImportResult(); }}>
            <Upload className="w-4 h-4" />
            导入导出表
          </button>
          <button className="btn-primary" onClick={() => setShowManual(true)}>
            <UserPlus className="w-4 h-4" />
            手工补录
          </button>
        </div>
      </header>

      <main className="container py-6">
        {view === 'audit' ? (
          <AuditPage onBack={handleBack} />
        ) : view === 'detail' && selectedBabyId ? (
          <BabyDetail babyId={selectedBabyId} onBack={handleBack} />
        ) : (
          <div className="space-y-5">
            <StatusBanner status={status} total={babies.length} dirtyCount={dirtyCount} />

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-ink-500" />
              <span className="text-sm text-ink-500 mr-1">筛选：</span>
              {[
                { key: 'all', label: '全部' },
                { key: 'dirty', label: '异常数据' },
                { key: 'manual', label: '手工补录' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key as any)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filter === f.key
                      ? 'bg-sage-600 text-paper-50'
                      : 'bg-paper-100 text-ink-600 hover:bg-paper-200 border border-ink-100'
                  }`}
                >
                  {f.label}
                  {f.key === 'all' && <span className="ml-1 opacity-60">({babies.length})</span>}
                  {f.key === 'dirty' && <span className="ml-1 opacity-60">({dirtyCount})</span>}
                  {f.key === 'manual' && <span className="ml-1 opacity-60">({babies.filter(b => b.isManual).length})</span>}
                </button>
              ))}
              <div className="flex-1" />
              <span className="text-sm text-ink-500">显示 {filtered.length} / {babies.length} 条</span>
            </div>

            {filtered.length === 0 ? (
              <div className="paper-card p-16 text-center">
                <BabyIcon className="w-12 h-12 text-ink-300 mx-auto mb-3" />
                <div className="text-lg font-medium text-ink-600 mb-1">
                  {babies.length === 0 ? '还没有数据' : '没有匹配的记录'}
                </div>
                <div className="text-sm text-ink-400">
                  点击右上角「导入导出表」或「手工补录」开始录入
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(baby => (
                  <BabyCard
                    key={baby.id}
                    baby={baby}
                    selected={baby.id === selectedBabyId}
                    onClick={() => handleCardClick(baby.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <ImportModal
        open={showImport}
        onClose={() => { setShowImport(false); clearImportResult(); fetchBabies(); }}
        onImport={handleImport}
        result={importResult}
      />
      <ManualAddModal
        open={showManual}
        onClose={() => { setShowManual(false); fetchBabies(); }}
        onSubmit={addManualBaby}
      />
    </div>
  );
}
