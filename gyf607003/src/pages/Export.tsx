import { useEffect, useState } from 'react';
import { Download, FileSpreadsheet, Shield, Check, Eye } from 'lucide-react';
import { appStore } from '@/store/app';
import { USER_ROLE_LABEL } from '@shared/types';

const CATEGORY_LABEL: Record<string, string> = {
  record: '消毒记录',
  baby: '宝宝信息（隐私）',
  exception: '异常信息',
};

export default function ExportPage() {
  const { exportConfig, fetchExportConfig, generateExport, selectedRole } = appStore();
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [previewData, setPreviewData] = useState<Record<string, string>[]>([]);

  useEffect(() => {
    if (!exportConfig) fetchExportConfig();
  }, [exportConfig, fetchExportConfig]);

  useEffect(() => {
    if (exportConfig) {
      setSelectedFields(exportConfig.fields.map((f) => f.key));
    }
  }, [exportConfig]);

  useEffect(() => {
    if (!exportConfig) return;
    const sample: Record<string, string> = {};
    for (const f of exportConfig.fields) {
      if (!selectedFields.includes(f.key)) continue;
      if (f.key === 'operateTime') sample[f.key] = new Date().toLocaleString('zh-CN');
      else if (f.key === 'babyName') sample[f.key] = '小明';
      else if (f.key === 'className') sample[f.key] = '小班';
      else if (f.key === 'itemType') sample[f.key] = '奶瓶';
      else if (f.key === 'itemName') sample[f.key] = '贝亲奶瓶240ml';
      else if (f.key === 'status') sample[f.key] = '已消毒';
      else if (f.key === 'isManual') sample[f.key] = '否';
      else if (f.key === 'operatorName') sample[f.key] = '张消毒';
      else if (f.key === 'parentPhone') sample[f.key] = selectedRole === 'supervisor' || selectedRole === 'admin' ? '13812340001' : '138****0001';
      else if (f.key === 'parentIdCard') sample[f.key] = selectedRole === 'supervisor' || selectedRole === 'admin' ? '110101202001010011' : '1101**********0011';
      else if (f.key === 'homeAddress') sample[f.key] = selectedRole === 'supervisor' || selectedRole === 'admin' ? '北京市朝阳区建国路88号院1号楼1001室' : '北京市朝阳区建国路***';
      else if (f.key === 'exceptionType') sample[f.key] = '未清洁再次发放';
      else if (f.key === 'exceptionReason') sample[f.key] = '奶瓶未消毒被误放入发放区';
      else if (f.key === 'handleMeasure') sample[f.key] = '重新消毒并记录';
      else sample[f.key] = `[${f.label}]`;
    }
    setPreviewData([sample, sample, sample]);
  }, [selectedFields, exportConfig, selectedRole]);

  function toggleField(key: string) {
    setSelectedFields((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  const categories = exportConfig
    ? Array.from(new Set(exportConfig.fields.map((f) => f.category))) as string[]
    : [] as string[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif-sc text-2xl font-bold text-gray-800">数据导出</h2>
          <p className="text-sm text-gray-500 mt-1">
            按角色过滤隐私字段，当前：<span className="font-semibold text-primary">{USER_ROLE_LABEL[selectedRole]}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            <h3 className="font-serif-sc text-lg font-bold text-gray-800">导出配置</h3>
          </div>

          <div className="p-5 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">导出格式</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFormat('csv')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
                    format === 'csv' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" /> CSV (Excel 兼容)
                </button>
                <button
                  onClick={() => setFormat('json')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
                    format === 'json' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" /> JSON
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">选择导出字段</label>
                <div className="flex gap-2 text-xs">
                  <button onClick={() => setSelectedFields(exportConfig?.fields.map((f) => f.key) || [])} className="text-primary hover:underline">
                    全选
                  </button>
                  <span className="text-gray-300">|</span>
                  <button onClick={() => setSelectedFields([])} className="text-gray-500 hover:underline">
                    清空
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {categories.map((cat) => (
                  <div key={cat}>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2 pb-1 border-b border-gray-100">
                      {CATEGORY_LABEL[cat] || cat}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {exportConfig?.fields.filter((f) => f.category === cat).map((f) => {
                        const checked = selectedFields.includes(f.key);
                        return (
                          <label
                            key={f.key}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition ${
                              checked
                                ? 'border-primary bg-primary-50 text-primary'
                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                              checked ? 'bg-primary border-primary' : 'border-gray-300'
                            }`}>
                              {checked && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleField(f.key)}
                              className="sr-only"
                            />
                            <span className="text-sm">{f.label}</span>
                            {f.privacy && (
                              <span className="ml-auto px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-semibold border border-amber-200 flex items-center gap-0.5">
                                <Shield className="w-2.5 h-2.5" /> 隐私
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`rounded-lg p-4 border ${
              selectedRole === 'supervisor' || selectedRole === 'admin'
                ? 'bg-green-50 border-green-200'
                : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-start gap-2">
                <Shield className={`w-5 h-5 mt-0.5 ${
                  selectedRole === 'supervisor' || selectedRole === 'admin' ? 'text-green-600' : 'text-amber-600'
                }`} />
                <div className="text-xs">
                  <p className={`font-semibold ${
                    selectedRole === 'supervisor' || selectedRole === 'admin' ? 'text-green-800' : 'text-amber-800'
                  }`}>
                    当前角色：{USER_ROLE_LABEL[selectedRole]}
                  </p>
                  <p className={selectedRole === 'supervisor' || selectedRole === 'admin' ? 'text-green-700' : 'text-amber-700'}>
                    {selectedRole === 'supervisor' || selectedRole === 'admin'
                      ? '可查看和导出完整隐私字段（家长电话、身份证、家庭地址）。'
                      : '导出时隐私字段将自动脱敏（如 138****0001），此规则在后端强制执行。'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => generateExport(selectedFields, format)}
              disabled={selectedFields.length === 0}
              className="w-full py-3 rounded-lg font-semibold bg-primary text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              导出 {selectedFields.length} 个字段
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            <h3 className="font-serif-sc text-lg font-bold text-gray-800">导出预览（3 行样例）</h3>
          </div>
          <div className="p-5">
            {selectedFields.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                请选择要导出的字段
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {selectedFields.map((k) => {
                        const f = exportConfig?.fields.find((x) => x.key === k);
                        return (
                          <th key={k} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">
                            {f?.label}
                            {f?.privacy && <span className="ml-1 text-amber-600">*</span>}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {previewData.map((row, i) => (
                      <tr key={i} className={i === 2 ? 'bg-yellow-50' : ''}>
                        {selectedFields.map((k) => (
                          <td key={k} className="px-3 py-2 text-gray-700 whitespace-nowrap font-mono">
                            {row[k] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-[11px] text-gray-500 mt-3">
              黄色高亮行：展示了按当前角色处理后的隐私字段效果。无论前端如何配置，后端导出接口会根据当前登录用户角色强制应用脱敏规则。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
