import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FilePlus, Download, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge } from '@/components/StatusBadge';
import { BabyCard } from '@/components/BabyCard';
import { StatsBar } from '@/components/StatsBar';
import type { RecordStatus } from '@/types';
import { statusLabelMap } from '@/types';

const FILTER_OPTIONS: Array<RecordStatus | 'all' | 'supplemented'> = [
  'all',
  'normal',
  'abnormal',
  'pending',
  'overridden_normal',
  'overridden_abnormal',
  'supplemented',
];

export default function Home() {
  const navigate = useNavigate();
  const {
    records,
    filter,
    searchKeyword,
    setFilter,
    setSearchKeyword,
    revalidateAll,
  } = useAppStore();

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filter === 'supplemented') return r.isSupplemented;
      if (filter !== 'all' && r.status !== filter) return false;
      if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        if (!r.name.toLowerCase().includes(kw) && !r.allergyHistory.toLowerCase().includes(kw)) {
          return false;
        }
      }
      return true;
    });
  }, [records, filter, searchKeyword]);

  return (
    <div className="min-h-screen pb-16">
      <div className="container max-w-6xl px-4 md:px-6 py-6">
        <StatsBar />

        <div className="bg-white rounded-2xl shadow-soft p-5 mb-6 animate-fade-in">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setFilter(opt)}
                  className={`filter-chip ${
                    filter === opt ? 'filter-chip-active' : 'filter-chip-inactive'
                  }`}
                >
                  {statusLabelMap[opt]}
                  <span className="ml-1 opacity-70">
                    {opt === 'all'
                      ? records.length
                      : opt === 'supplemented'
                      ? records.filter((r) => r.isSupplemented).length
                      : records.filter((r) => r.status === opt).length}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="搜索宝宝姓名或过敏史..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-cream/50 border border-ink/10 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:bg-white transition-all"
                />
              </div>
              <button onClick={revalidateAll} className="btn-secondary flex items-center gap-1.5">
                <RefreshCw size={14} />
                重新校验
              </button>
              <button
                onClick={() => navigate('/supplement')}
                className="btn-warm flex items-center gap-1.5"
              >
                <FilePlus size={14} />
                手工补录
              </button>
              <button
                onClick={() => navigate('/export')}
                className="btn-primary flex items-center gap-1.5"
              >
                <Download size={14} />
                导出摘要
              </button>
            </div>
          </div>
        </div>

        <div className="mb-4 text-sm text-gray-500 flex items-center gap-2">
          <span>共筛选出</span>
          <span className="font-semibold text-ink">{filteredRecords.length}</span>
          <span>条记录</span>
          {searchKeyword && (
            <button
              onClick={() => setSearchKeyword('')}
              className="ml-2 text-status-supplemented hover:underline"
            >
              清除搜索
            </button>
          )}
        </div>

        {filteredRecords.length === 0 ? (
          <div className="info-card text-center py-16 animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-cream flex items-center justify-center mb-4">
              <Search size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500">未找到匹配的记录</p>
            <button onClick={() => { setFilter('all'); setSearchKeyword(''); }} className="btn-secondary mt-4">
              查看全部记录
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredRecords.map((r, i) => (
              <BabyCard key={r.id} record={r} index={i} />
            ))}
          </div>
        )}

        <div className="mt-8 bg-white/60 rounded-xl p-4 text-xs text-gray-500 border border-cream-dark animate-fade-in-slow">
          <p className="font-medium text-ink mb-2">📝 样例说明（启动即可走通三条路径）</p>
          <ul className="space-y-1 list-disc list-inside">
            <li><StatusBadge status="normal" size="sm" showIcon={false} /> 正常路径：宝宝A（鸡蛋过敏无匹配）、宝宝B（坚果过敏无匹配）</li>
            <li><StatusBadge status="abnormal" size="sm" showIcon={false} /> 异常路径：宝宝C（牛奶·单位混用 ml vs g）、宝宝D（芒果·边界值 0g vs 1g）</li>
            <li><StatusBadge status="pending" size="sm" showIcon={false} /> 人工改判路径：宝宝E（海鲜·虾粉 0.1g 可耐受，可进入详情改判）</li>
            <li>补录路径：点击右上角「手工补录」添加宝宝F（小麦过敏），观察补录前后差异</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
