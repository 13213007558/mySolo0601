import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import {
  ChevronLeft,
  Upload,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { SAMPLE_RECORDS } from '../data/sampleData';

export default function ImportPage() {
  const navigate = useNavigate();
  const {
    currentRole,
    records,
    importSampleData,
    resetAllData,
    isInitialized,
  } = useAppStore();

  const [importResult, setImportResult] = useState<{
    added: number;
    skipped: number;
    duplicates: number;
    batchId: string;
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (currentRole !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <div className="card max-w-md mx-auto">
          <ShieldAlert className="w-12 h-12 text-warm-rose mx-auto mb-3" />
          <h3 className="font-display text-xl text-gray-800 mb-2">权限不足</h3>
          <p className="text-sm text-gray-500 mb-5">
            只有主管角色才能执行数据导入
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            返回提醒墙
          </button>
        </div>
      </div>
    );
  }

  const supplementSample = SAMPLE_RECORDS.find((r) => r.isSupplement);
  const supplementRecords = records.filter((r) => r.isSupplement);
  const duplicateKeys = new Set(
    records.map((r) => r.sampleKey).filter(Boolean) as string[],
  );

  const handleImport = () => {
    setImporting(true);
    setTimeout(() => {
      const result = importSampleData();
      setImportResult(result);
      setImporting(false);
    }, 600);
  };

  const handleReset = () => {
    resetAllData();
    setShowResetConfirm(false);
    setImportResult(null);
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  return (
    <div className="min-h-screen pb-16">
      <div className="container mx-auto px-4 pt-6 max-w-3xl">
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-ghost mb-5 -ml-2 text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          返回提醒墙
        </button>

        <div className="mb-6 animate-fade-in-up">
          <h2 className="font-display text-2xl text-gray-800 mb-1 flex items-center gap-2">
            <Upload className="w-6 h-6 text-sky-600" />
            样例数据导入
          </h2>
          <p className="text-sm text-gray-500">
            智能去重导入，重复导入不会产生多份有效记录
          </p>
        </div>

        <div className="card animate-scale-in mb-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">📦</span>
            </div>
            <div className="flex-1">
              <h3 className="font-display text-lg text-gray-800 mb-1">
                婴幼儿费用核销样例数据包
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                共 {SAMPLE_RECORDS.length} 条样例数据，包含奶粉、尿不湿、医疗、辅食等类别
                {supplementSample && '，其中含 1 条手工补录示例'}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="tag bg-emerald-50 text-emerald-600 border border-emerald-200">
                  智能去重
                </span>
                <span className="tag bg-amber-50 text-amber-600 border border-amber-200">
                  保留历史
                </span>
                <span className="tag bg-violet-50 text-violet-600 border border-violet-200">
                  批次追踪
                </span>
                {isInitialized && (
                  <span className="tag bg-cream-100 text-gray-600 border border-cream-200">
                    已初始化
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-cream-50 border border-cream-200 mb-5">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-gray-500 mb-1">样例总数</div>
                <div className="font-display text-xl text-gray-800">
                  {SAMPLE_RECORDS.length}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">当前已有</div>
                <div className="font-display text-xl text-sky-600">
                  {records.length}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">将被跳过</div>
                <div className="font-display text-xl text-amber-600">
                  {
                    SAMPLE_RECORDS.filter((r) =>
                      duplicateKeys.has(r.sampleKey || ''),
                    ).length
                  }
                </div>
              </div>
            </div>
          </div>

          {supplementSample && supplementRecords.length > 0 && (
            <div className="p-4 rounded-xl bg-violet-50 border border-violet-200 mb-5">
              <h4 className="font-medium text-violet-800 mb-2 flex items-center gap-1">
                ✨ 手工补录示例
              </h4>
              <p className="text-sm text-violet-700 mb-2">
                样例中包含一条手工补录数据，可对比查看补录前后的差异：
              </p>
              <div className="text-xs font-mono text-violet-600 bg-violet-100/50 rounded-lg p-3">
                <div>
                  类别：{supplementSample.category} · 金额：¥
                  {supplementSample.amount}
                </div>
                <div>商家：{supplementSample.merchant}</div>
                <div>补录原因：{supplementSample.supplementRemark}</div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleImport}
              disabled={importing}
              className="btn-primary"
            >
              {importing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  正在导入...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  {isInitialized ? '再次导入(智能去重)' : '导入样例数据'}
                </>
              )}
            </button>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="btn-danger"
            >
              <Trash2 className="w-4 h-4" />
              重置所有数据
            </button>
          </div>
        </div>

        {importResult && (
          <div className="card animate-scale-in border-2 border-emerald-200">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-display text-lg text-gray-800 mb-2">
                  导入完成！
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  批次号：
                  <span className="font-mono">{importResult.batchId}</span>
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-emerald-50 text-center">
                    <div className="text-xs text-emerald-600 mb-1">新增</div>
                    <div className="font-display text-xl text-emerald-700">
                      {importResult.added}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50 text-center">
                    <div className="text-xs text-amber-600 mb-1">重复跳过</div>
                    <div className="font-display text-xl text-amber-700">
                      {importResult.duplicates}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-sky-50 text-center">
                    <div className="text-xs text-sky-600 mb-1">当前总计</div>
                    <div className="font-display text-xl text-sky-700">
                      {records.length}
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-emerald-700">
                    重复导入不会产生多份有效结果，旧记录完整保留，历史清晰可查。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
            <div className="card max-w-sm w-full animate-scale-in">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-warm-rose/10 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="w-5 h-5 text-warm-rose" />
                </div>
                <div>
                  <h3 className="font-display text-lg text-gray-800 mb-1">
                    确认重置所有数据？
                  </h3>
                  <p className="text-sm text-gray-500">
                    此操作将清空所有费用记录、审计日志和导入批次，不可恢复。
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="btn-ghost flex-1"
                >
                  取消
                </button>
                <button onClick={handleReset} className="btn-danger flex-1">
                  确认重置
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
