import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  FileQuestion,
  ArrowRight,
  AlertCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ERROR_TYPE_LABELS } from '../../shared/types';

type Scenario = 'normal' | 'dirty' | 'empty';

const scenarioOptions: { key: Scenario; label: string; desc: string; icon: any }[] = [
  { key: 'normal', label: '正常数据', desc: '所有记录完整有效', icon: CheckCircle },
  { key: 'dirty', label: '含脏数据（试跑）', desc: '模拟坏行不拖累正常宝宝', icon: AlertTriangle },
  { key: 'empty', label: '空数据', desc: '模拟没有有效数据的情况', icon: FileQuestion },
];

export default function ImportDashboard() {
  const navigate = useNavigate();
  const { importResult, triggerImport, setImportResult, uploadFile } = useAppStore();
  const [scenario, setScenario] = useState<Scenario>('dirty');
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [expandedDirty, setExpandedDirty] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useState<HTMLInputElement | null>(null)[0];

  const handleImport = async () => {
    setLoading(true);
    await triggerImport(scenario);
    setLoading(false);
  };

  const processFile = async (file: File) => {
    if (!file) return;
    const validTypes = ['.csv', '.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    if (!validTypes.some(t => fileName.endsWith(t))) {
      alert('仅支持 CSV、Excel (.xlsx/.xls) 格式的文件');
      return;
    }
    setSelectedFile(file);
    setLoading(true);
    await uploadFile(file);
    setLoading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (e.target) e.target.value = '';
  };

  const triggerFilePicker = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    };
    input.click();
  };

  const handleReset = () => {
    setImportResult(null);
  };

  const StatCard = ({
    label,
    value,
    icon: Icon,
    bg,
    text,
    dot,
  }: {
    label: string;
    value: number;
    icon: any;
    bg: string;
    text: string;
    dot: string;
  }) => (
    <div className={`card card-hover border-l-4 ${dot}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className={`text-3xl font-display font-bold mt-1 ${text}`}>{value}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${text}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Upload className="w-6 h-6 text-brand-500" />
            数据导入看板
          </h2>
          <p className="text-gray-500 mt-1">上传夜班体温枪导出表，系统自动解析并标记异常</p>
        </div>
        {importResult?.successRows && importResult.successRows > 0 && (
          <button
            onClick={() => navigate('/review')}
            className="btn-primary flex items-center gap-2"
          >
            前往复核墙
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {!importResult ? (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div
              className={`card border-2 border-dashed transition-all duration-300 cursor-pointer ${
                isDragging
                  ? 'border-brand-500 bg-brand-50 scale-[1.01]'
                  : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) processFile(file);
              }}
              onClick={triggerFilePicker}
            >
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-5 transition-all ${
                  isDragging ? 'bg-brand-500 scale-110' : 'bg-brand-100'
                }`}>
                  <FileSpreadsheet className={`w-10 h-10 ${isDragging ? 'text-white' : 'text-brand-500'}`} />
                </div>
                <h3 className="font-display text-xl font-semibold text-gray-900 mb-2">
                  {isDragging ? '释放即可开始导入' : '拖拽导出表到此处，或点击上传'}
                </h3>
                <p className="text-gray-500 text-sm max-w-md">
                  支持 CSV / Excel 格式的体温枪导出表，系统将自动逐行解析，并对异常数据标记错误原因
                </p>
                <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-xs text-gray-600">
                  <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                  解析遇到坏行不会中断，正常数据照常入库
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-display text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-brand-500" />
              选择试跑场景
            </h3>
            <div className="space-y-3">
              {scenarioOptions.map((opt) => {
                const Icon = opt.icon;
                const active = scenario === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setScenario(opt.key)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      active
                        ? 'border-brand-500 bg-brand-50 shadow-sm'
                        : 'border-gray-100 bg-gray-50 hover:border-brand-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        active ? 'bg-brand-500 text-white' : 'bg-white border border-gray-200 text-gray-500'
                      }`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <p className={`font-medium text-sm ${active ? 'text-brand-700' : 'text-gray-800'}`}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleImport}
              disabled={loading}
              className="btn-primary w-full mt-5 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  解析中...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  模拟导入
                </>
              )}
            </button>

            <p className="text-xs text-gray-400 mt-3 text-center leading-relaxed">
              提示：先选"含脏数据"试跑，验证坏行不会拖累正常宝宝
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-xl font-bold text-gray-900">导入结果</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                共解析 {importResult.totalRows} 行
                {importResult.partialSuccess && (
                  <span className="ml-2 inline-flex items-center gap-1 text-orange-600 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    部分成功
                  </span>
                )}
                {importResult.successRows === importResult.totalRows && importResult.totalRows > 0 && (
                  <span className="ml-2 inline-flex items-center gap-1 text-green-600 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    全部成功
                  </span>
                )}
                {importResult.emptyRows === importResult.totalRows && (
                  <span className="ml-2 inline-flex items-center gap-1 text-gray-600 font-medium">
                    <FileQuestion className="w-3.5 h-3.5" />
                    无有效数据
                  </span>
                )}
              </p>
            </div>
            <button onClick={handleReset} className="btn-secondary flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              重新导入
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="成功解析"
              value={importResult.successRows}
              icon={CheckCircle}
              bg="bg-green-100"
              text="text-green-700"
              dot="border-l-health-normal"
            />
            <StatCard
              label="脏数据"
              value={importResult.dirtyRows}
              icon={AlertTriangle}
              bg="bg-orange-100"
              text="text-orange-700"
              dot="border-l-health-pending"
            />
            <StatCard
              label="空行"
              value={importResult.emptyRows}
              icon={FileQuestion}
              bg="bg-gray-100"
              text="text-gray-600"
              dot="border-l-gray-300"
            />
            <StatCard
              label="已入库"
              value={importResult.importedRecords.length}
              icon={Sparkles}
              bg="bg-brand-100"
              text="text-brand-700"
              dot="border-l-brand-500"
            />
          </div>

          {importResult.emptyRows === importResult.totalRows ? (
            <div className="card border-2 border-dashed border-gray-200">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <FileQuestion className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="font-display text-lg font-semibold text-gray-700 mb-1">未检测到有效数据</h4>
                <p className="text-sm text-gray-500 max-w-md">
                  上传的文件中没有可解析的晨检记录，请检查文件格式或确认是否选择了正确的导出表。
                </p>
              </div>
            </div>
          ) : importResult.dirtyRowDetails.length > 0 ? (
            <div className="card overflow-hidden">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedDirty(!expandedDirty)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">异常行详情</h4>
                    <p className="text-xs text-gray-500">
                      共 {importResult.dirtyRowDetails.length} 条异常记录，已自动跳过，不影响正常数据入库
                    </p>
                  </div>
                </div>
                {expandedDirty ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>

              {expandedDirty && (
                <div className="mt-4 border-t border-gray-100 pt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500">
                        <th className="py-2 px-3 font-medium">行号</th>
                        <th className="py-2 px-3 font-medium">错误类型</th>
                        <th className="py-2 px-3 font-medium">错误描述</th>
                        <th className="py-2 px-3 font-medium">原始数据</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.dirtyRowDetails.map((row, idx) => (
                        <tr
                          key={idx}
                          className="border-t border-gray-50 hover:bg-orange-50/40 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-mono text-xs text-gray-500">#{row.rowNumber}</td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                              <AlertTriangle className="w-3 h-3" />
                              {ERROR_TYPE_LABELS[row.errorType]}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-gray-700">{row.errorMessage}</td>
                          <td className="py-2.5 px-3">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                              {Object.keys(row.rowData).length > 0
                                ? JSON.stringify(row.rowData)
                                : '(空行)'}
                            </code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}

          {importResult.importedRecords.length > 0 && (
            <div className="card">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                已成功入库的宝宝记录（{importResult.importedRecords.length} 条）
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {importResult.importedRecords.slice(0, 10).map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => navigate(`/review`)}
                    className="p-3 rounded-xl bg-gradient-to-br from-green-50 to-white border border-green-100 cursor-pointer hover:border-green-300 hover:shadow-sm transition-all"
                  >
                    <p className="text-sm font-medium text-gray-800">记录 #{rec.id.slice(-4)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{rec.date}</p>
                    <p className="text-xs text-green-700 mt-1 font-medium">✓ 已入库</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
