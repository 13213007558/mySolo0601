import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import ExpenseCard from '../components/ExpenseCard';
import { ROLE_INFO } from '../../shared/types';
import {
  Wallet,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Download,
  Eye,
  EyeOff,
  FilePlus2,
} from 'lucide-react';
import { useState } from 'react';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    currentRole,
    currentUserName,
    getStatistics,
    getFilteredRecords,
    exportRecords,
  } = useAppStore();

  const [exportPrivacy, setExportPrivacy] = useState(false);

  const role = currentRole || 'parent';
  const info = ROLE_INFO[role];
  const stats = getStatistics();
  const records = getFilteredRecords();

  const statItems =
    role === 'elder'
      ? [
          {
            label: '本月待付',
            value: `¥${Math.round(stats.balanceAmount)}`,
            icon: <Wallet className="w-5 h-5" />,
            color: 'from-orange-400 to-warm-orange',
          },
          {
            label: '到期提醒',
            value: stats.pendingCount,
            icon: <Clock className="w-5 h-5" />,
            color: 'from-amber-400 to-orange-400',
          },
          {
            label: '逾期笔数',
            value: stats.overdueCount,
            icon: <AlertTriangle className="w-5 h-5" />,
            color: 'from-rose-400 to-warm-rose',
          },
        ]
      : [
          {
            label: '累计总额',
            value: `¥${stats.totalAmount.toFixed(0)}`,
            icon: <Wallet className="w-5 h-5" />,
            color: 'from-orange-400 to-warm-orange',
          },
          {
            label: '待核销',
            value: stats.pendingCount,
            icon: <Clock className="w-5 h-5" />,
            color: 'from-amber-400 to-orange-400',
          },
          {
            label: '已核销',
            value: stats.verifiedCount,
            icon: <CheckCircle2 className="w-5 h-5" />,
            color: 'from-emerald-400 to-teal-500',
          },
          {
            label: '逾期',
            value: stats.overdueCount,
            icon: <AlertTriangle className="w-5 h-5" />,
            color: 'from-rose-400 to-warm-rose',
          },
        ];

  const helloText = {
    elder: '今天宝宝的花销都在这了，您看看摘要就好～',
    parent: '所有费用明细都在这里，随时可以查看核销进度。',
    nanny: '按步骤处理每一笔，月底再也不会余额突变啦！',
    admin: '全量数据和审计日志都可以随时查阅。',
  }[role];

  return (
    <div className="min-h-screen pb-16">
      <div className="container mx-auto px-4 pt-6 md:pt-8">
        <div className="mb-6 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`w-11 h-11 rounded-xl ${info.color} flex items-center justify-center text-xl`}
            >
              {info.avatar}
            </div>
            <div>
              <h2 className="font-display text-2xl text-gray-800">
                您好，{currentUserName} 👋
              </h2>
              <p className="text-sm text-gray-500">{helloText}</p>
            </div>
          </div>
        </div>

        <div
          className={`grid gap-4 mb-6 ${
            role === 'elder'
              ? 'grid-cols-1 sm:grid-cols-3'
              : 'grid-cols-2 sm:grid-cols-4'
          }`}
        >
          {statItems.map((item, i) => (
            <div
              key={item.label}
              style={{ animationDelay: `${i * 60}ms` }}
              className="card animate-fade-in-up !p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">{item.label}</span>
                <div
                  className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} text-white flex items-center justify-center shadow-sm`}
                >
                  {item.icon}
                </div>
              </div>
              <div className="font-display text-2xl text-gray-800">
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {role !== 'elder' && (
          <div className="flex items-center justify-between mb-5 animate-fade-in-up animate-delay-100">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-xl text-gray-800">
                {role === 'nanny' ? '待处理提醒' : '费用记录'}
              </h3>
              <span className="tag bg-cream-100 text-gray-600 border border-cream-200">
                共 {records.length} 条
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {role !== 'nanny' && (
                <>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cream-200 bg-cream-50 hover:bg-cream-100 cursor-pointer text-sm text-gray-600 transition-all">
                    {exportPrivacy ? (
                      <Eye className="w-4 h-4 text-warm-rose" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={exportPrivacy}
                      onChange={(e) => setExportPrivacy(e.target.checked)}
                    />
                    {exportPrivacy ? '含手机号(有审计)' : '不含隐私'}
                  </label>
                  <button
                    onClick={() => exportRecords(exportPrivacy)}
                    className="btn-secondary !py-1.5 !px-3 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    导出CSV
                  </button>
                </>
              )}
              {(role === 'nanny' || role === 'parent' || role === 'admin') && (
                <button
                  onClick={() => navigate('/supplement')}
                  className="btn-primary !py-1.5 !px-3 text-sm"
                >
                  <FilePlus2 className="w-4 h-4" />
                  手工补录
                </button>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {records.length === 0 ? (
            <div className="card text-center py-12 animate-fade-in">
              <div className="text-5xl mb-3">🍼</div>
              <p className="text-gray-500">暂无费用记录</p>
              {(role === 'nanny' || role === 'parent' || role === 'admin') && (
                <button
                  onClick={() => navigate('/supplement')}
                  className="btn-primary mt-4"
                >
                  <Plus className="w-4 h-4" />
                  添加第一笔记录
                </button>
              )}
            </div>
          ) : (
            records.map((r, i) => <ExpenseCard key={r.id} record={r} index={i} />)
          )}
        </div>
      </div>
    </div>
  );
}
