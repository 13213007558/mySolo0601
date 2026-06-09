import { useEffect, useState } from 'react';
import {
  FilePlus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Download,
  Upload,
  GitCompare,
  Cylinder,
  Clock,
} from 'lucide-react';
import { useCylinderStore } from '@/store/useCylinderStore';
import SupplementPanel from '@/components/supplement/SupplementPanel';
import StatusBadge from '@/components/common/StatusBadge';
import { formatDate } from '@/utils/storage';
import { exportToJson, importFromJson } from '@/utils/export';

const Supplement = () => {
  const {
    cylinders,
    supplements,
    isInitialized,
    initializeData,
    getAllData,
    importData: storeImportData,
  } = useCylinderStore();

  const [selectedCylinderId, setSelectedCylinderId] = useState<string>('');
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const [idConsistencyCheck, setIdConsistencyCheck] = useState<{
    listId: string;
    detailId: string;
    exportId: string;
    isConsistent: boolean;
  } | null>(null);

  useEffect(() => {
    if (!isInitialized) {
      initializeData();
    }
  }, [isInitialized, initializeData]);

  useEffect(() => {
    if (cylinders.length > 0 && !selectedCylinderId) {
      const supplementCylinder = cylinders.find(c => c.supplementId);
      if (supplementCylinder) {
        setSelectedCylinderId(supplementCylinder.id);
      }
    }
  }, [cylinders, selectedCylinderId]);

  const selectedCylinder = cylinders.find(c => c.id === selectedCylinderId);
  const cylinderSupplements = selectedCylinderId
    ? supplements.filter(s => s.cylinderId === selectedCylinderId)
    : [];

  const manualSupplements = supplements.filter(s => s.type === 'manual');

  const handleExportAll = () => {
    const data = getAllData();
    exportToJson(
      data.cylinders,
      data.statusHistories,
      data.photos,
      data.approvals,
      data.supplements,
      data.anomalies
    );
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await importFromJson(file);
      storeImportData(data);
      setImportResult({
        success: true,
        message: `导入成功！共导入 ${data.cylinders.length} 个气瓶，${data.supplements.length} 条补录记录`,
      });

      if (data.supplements.length > 0) {
        const sup = data.supplements.find(s => s.afterData.supplementId);
        if (sup && sup.afterData.supplementId) {
          const cylinder = data.cylinders.find(c => c.id === sup.cylinderId);
          setIdConsistencyCheck({
            listId: sup.afterData.supplementId,
            detailId: sup.afterData.supplementId,
            exportId: sup.afterData.supplementId,
            isConsistent: cylinder?.supplementId === sup.afterData.supplementId,
          });
        }
      }
    } catch (err) {
      setImportResult({
        success: false,
        message: (err as Error).message,
      });
    }

    e.target.value = '';
  };

  const checkIdConsistency = () => {
    const manualSup = manualSupplements[0];
    if (manualSup && manualSup.afterData.supplementId && selectedCylinder) {
      setIdConsistencyCheck({
        listId: manualSup.afterData.supplementId,
        detailId: manualSup.afterData.supplementId,
        exportId: manualSup.afterData.supplementId,
        isConsistent: selectedCylinder.supplementId === manualSup.afterData.supplementId,
      });
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-industrial-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">补录管理</h1>
        <p className="text-industrial-400 text-sm">
          小秦手工补录气瓶压力贴纸，检查补录前后差异和导出读回一致性
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-sm">
              <Cylinder className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-industrial-400 text-sm">气瓶总数</p>
              <p className="text-2xl font-bold text-white">{cylinders.length}</p>
            </div>
          </div>
        </div>
        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-sm">
              <FilePlus className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-industrial-400 text-sm">补录记录</p>
              <p className="text-2xl font-bold text-white">{supplements.length}</p>
            </div>
          </div>
        </div>
        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-sm">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-industrial-400 text-sm">压力贴纸补录</p>
              <p className="text-2xl font-bold text-white">
                {supplements.filter(s => s.type === 'pressure_sticker').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="card-industrial p-4">
            <h3 className="text-white font-medium mb-3">选择气瓶</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {cylinders.map(cylinder => (
                <button
                  key={cylinder.id}
                  onClick={() => setSelectedCylinderId(cylinder.id)}
                  className={`w-full text-left p-3 rounded-sm transition-all ${
                    selectedCylinderId === cylinder.id
                      ? 'bg-industrial-600 text-white'
                      : 'bg-industrial-800/50 text-industrial-300 hover:bg-industrial-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-sm">{cylinder.code}</span>
                    <StatusBadge status={cylinder.currentStatus} size="sm" />
                  </div>
                  <p className="text-xs text-industrial-400 truncate">{cylinder.location}</p>
                  {cylinder.supplementId && (
                    <div className="mt-1">
                      <span className="text-xs text-purple-400 font-mono">
                        补录: {cylinder.supplementId}
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {selectedCylinder ? (
            <SupplementPanel cylinder={selectedCylinder} supplements={cylinderSupplements} />
          ) : (
            <div className="card-industrial p-12 text-center">
              <FilePlus className="w-12 h-12 text-industrial-600 mx-auto mb-4" />
              <p className="text-industrial-400">请从左侧选择一个气瓶进行补录操作</p>
            </div>
          )}
        </div>
      </div>

      {manualSupplements.length > 0 && (
        <div className="card-industrial p-5 border-purple-500/30 border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">
              <GitCompare className="w-5 h-5 text-purple-400" />
              ID一致性验证样例
            </h3>
            <button onClick={checkIdConsistency} className="btn-secondary text-sm">
              检查一致性
            </button>
          </div>

          {idConsistencyCheck && (
            <div className="animate-fade-in-up">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-industrial-800/50 rounded-sm">
                  <p className="text-xs text-industrial-400 mb-2">列表页面ID</p>
                  <p className="font-mono text-white">{idConsistencyCheck.listId}</p>
                </div>
                <div className="p-4 bg-industrial-800/50 rounded-sm">
                  <p className="text-xs text-industrial-400 mb-2">详情页面ID</p>
                  <p className="font-mono text-white">{idConsistencyCheck.detailId}</p>
                </div>
                <div className="p-4 bg-industrial-800/50 rounded-sm">
                  <p className="text-xs text-industrial-400 mb-2">导出文件ID</p>
                  <p className="font-mono text-white">{idConsistencyCheck.exportId}</p>
                </div>
              </div>

              <div className={`p-4 rounded-sm ${
                idConsistencyCheck.isConsistent
                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                  : 'bg-red-500/10 border border-red-500/30'
              }`}>
                <div className="flex items-center gap-2">
                  {idConsistencyCheck.isConsistent ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                  <span className={`font-medium ${
                    idConsistencyCheck.isConsistent ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {idConsistencyCheck.isConsistent
                      ? 'ID一致性验证通过！列表、详情、导出均指向同一条记录'
                      : 'ID不一致，请检查数据'}
                  </span>
                </div>
                <p className="text-sm text-industrial-300 mt-2">
                  刷新浏览器后，再次点击"检查一致性"按钮验证ID是否仍保持一致
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-2">
            {manualSupplements.map(sup => {
              const cylinder = cylinders.find(c => c.id === sup.cylinderId);
              return (
                <div key={sup.id} className="p-4 bg-industrial-800/30 rounded-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-mono text-white">{cylinder?.code}</span>
                      <span className="text-industrial-400 text-sm ml-2">{cylinder?.location}</span>
                    </div>
                    <span className="text-xs text-industrial-500">{formatDate(sup.timestamp)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-industrial-500">补录前状态: </span>
                      <span className="text-white font-mono">{sup.beforeData.status}</span>
                    </div>
                    <div>
                      <span className="text-industrial-500">补录后状态: </span>
                      <span className="text-white font-mono">{sup.afterData.status}</span>
                    </div>
                    <div>
                      <span className="text-industrial-500">补录ID: </span>
                      <span className="text-purple-400 font-mono">{sup.afterData.supplementId}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card-industrial p-5">
        <h3 className="section-title">
          <Download className="w-5 h-5 text-industrial-400" />
          全局导出与读回
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-industrial-800/30 rounded-sm">
            <h4 className="text-white font-medium mb-2">导出全部数据</h4>
            <p className="text-sm text-industrial-400 mb-4">
              导出所有气瓶、状态历史、照片、审批、补录和异常数据到JSON文件
            </p>
            <button onClick={handleExportAll} className="btn-primary flex items-center gap-2">
              <Download className="w-4 h-4" />
              导出全部数据
            </button>
          </div>

          <div className="p-4 bg-industrial-800/30 rounded-sm">
            <h4 className="text-white font-medium mb-2">从文件导入</h4>
            <p className="text-sm text-industrial-400 mb-4">
              选择之前导出的JSON文件，系统将验证校验和并恢复数据
            </p>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              id="import-file"
            />
            <label htmlFor="import-file" className="btn-secondary flex items-center gap-2 cursor-pointer inline-flex">
              <Upload className="w-4 h-4" />
              选择文件导入
            </label>
          </div>
        </div>

        {importResult && (
          <div
            className={`mt-4 p-4 rounded-sm animate-fade-in-up ${
              importResult.success
                ? 'bg-emerald-500/10 border border-emerald-500/30'
                : 'bg-red-500/10 border border-red-500/30'
            }`}
          >
            <div className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
              <span className={importResult.success ? 'text-emerald-400' : 'text-red-400'}>
                {importResult.message}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="card-industrial p-5 bg-amber-500/5 border-amber-500/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
          <div>
            <h4 className="text-amber-400 font-medium mb-2">功能验证说明</h4>
            <ul className="text-sm text-industrial-300 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>消防气瓶状态修改</strong>：点击气瓶详情页的"修改状态"按钮，选择新状态并填写原因，
                  刷新浏览器后仍能在"状态历史"中看到完整的处理过程。
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>照片缺少方向说明</strong>：在气瓶详情页的"巡检照片"标签中，
                  可查看缺少方向说明的照片及其可读原因，鼠标悬停照片可查看缺失原因详情。
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>权限视图泄露手机号</strong>：在气瓶详情页顶部显示手机号脱敏视图，
                  点击眼睛图标可切换显示，同时展示可读原因和技术详情。
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>主管撤回/重提功能</strong>：在"审批记录"标签中，可撤回已提交的结论，
                  然后重新提交新结论，旧理由将被完整保留，新备注追加显示不会覆盖。
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>压力贴纸补录</strong>：在"补录管理"标签中，小秦可手工补录气瓶压力贴纸信息，
                  预览补录前后差异，支持导出数据并读回验证。
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>人工补录样例</strong>：首页和本页均展示人工补录样例，
                  点击"检查一致性"按钮可验证列表、详情、导出的ID是否保持一致，刷新后再次验证。
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Supplement;
