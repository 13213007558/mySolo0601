import { useState } from 'react';
import { X, FileText, Upload, Calendar, User, CheckCircle, AlertTriangle, Link2 } from 'lucide-react';
import { useValveStore } from '@/store/valveStore';
import { useViewStore } from '@/store/viewStore';
import type { Contract } from '@/types';

export default function ContractPanel() {
  const { contracts, records, showContractPanel, toggleContractPanel, addContract, getUnmatchedContracts, getRecordsWithoutContract } = useValveStore();
  const { currentRole } = useViewStore();
  const [showUpload, setShowUpload] = useState(false);
  const [newContract, setNewContract] = useState({
    contractNo: '',
    contractDate: new Date().toISOString().split('T')[0],
    fileName: '',
    uploader: currentRole === 'operator' ? '值班员' : '主管',
  });

  const unmatchedContracts = getUnmatchedContracts();
  const recordsWithoutContract = getRecordsWithoutContract();

  const handleUpload = () => {
    if (!newContract.contractNo || !newContract.fileName) {
      alert('请填写完整信息');
      return;
    }

    addContract({
      contractNo: newContract.contractNo,
      contractDate: newContract.contractDate,
      fileName: newContract.fileName,
      fileUrl: `/mock/${newContract.contractNo}.pdf`,
      uploader: newContract.uploader,
    });

    setNewContract({
      contractNo: '',
      contractDate: new Date().toISOString().split('T')[0],
      fileName: '',
      uploader: currentRole === 'operator' ? '值班员' : '主管',
    });
    setShowUpload(false);
  };

  const handleFileSelect = () => {
    const fakeFiles = [
      '余热回收合同_2025.pdf',
      '锅炉维护协议.pdf',
      '能源管理合同.pdf',
      '设备采购合同.pdf',
      '安全检测报告.pdf',
      '维保服务合同.pdf',
    ];
    const randomFile = fakeFiles[Math.floor(Math.random() * fakeFiles.length)];
    setNewContract(prev => ({ ...prev, fileName: randomFile }));
  };

  if (!showContractPanel) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 z-50 animate-slide-in flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-primary-500 text-white">
        <h3 className="font-semibold flex items-center gap-2">
          <FileText size={18} />
          合同扫描件管理
        </h3>
        <button
          onClick={toggleContractPanel}
          className="p-1 hover:bg-white/20 rounded transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-500">{contracts.length}</p>
                <p className="text-xs text-gray-500">合同总数</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-industrial-orange">{unmatchedContracts.length}</p>
                <p className="text-xs text-gray-500">待关联</p>
              </div>
            </div>
          </div>

          {recordsWithoutContract.length > 0 && (
            <div className="bg-industrial-orange/5 border border-industrial-orange/20 rounded-lg p-3">
              <p className="text-xs font-medium text-industrial-orange flex items-center gap-1 mb-2">
                <AlertTriangle size={14} />
                有 {recordsWithoutContract.length} 条记录未关联合同
              </p>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {recordsWithoutContract.slice(0, 5).map(r => (
                  <div key={r.id} className="text-xs text-gray-600 flex items-center justify-between">
                    <span className="font-mono">{r.valveNo}</span>
                    <span className="text-gray-400">{r.recordDate}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentRole === 'operator' && (
            <div>
              {!showUpload ? (
                <button
                  onClick={() => setShowUpload(true)}
                  className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50 transition-all flex items-center justify-center gap-2"
                >
                  <Upload size={18} />
                  上传新合同
                </button>
              ) : (
                <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">新增合同</span>
                    <button
                      onClick={() => setShowUpload(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">合同编号</label>
                    <input
                      type="text"
                      value={newContract.contractNo}
                      onChange={(e) => setNewContract(prev => ({ ...prev, contractNo: e.target.value }))}
                      placeholder="如 HT-2025-0601"
                      className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-primary-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      <Calendar size={12} className="inline mr-1" />
                      合同日期
                    </label>
                    <input
                      type="date"
                      value={newContract.contractDate}
                      onChange={(e) => setNewContract(prev => ({ ...prev, contractDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-primary-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">文件</label>
                    <button
                      onClick={handleFileSelect}
                      className="w-full px-3 py-2 border-2 border-dashed border-gray-200 rounded text-sm text-gray-500 hover:border-primary-400 hover:text-primary-500 transition-colors text-left"
                    >
                      {newContract.fileName || '点击选择文件...'}
                    </button>
                  </div>

                  <button
                    onClick={handleUpload}
                    className="w-full py-2 bg-primary-500 text-white rounded text-sm font-medium hover:bg-primary-600 transition-colors"
                  >
                    确认上传
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Link2 size={14} />
              全部合同 ({contracts.length})
            </h4>
            {contracts.map(contract => {
              const matched = records.some(r => r.contractId === contract.id);
              const matchedRecords = records.filter(r => r.contractId === contract.id);
              const hasDateMismatch = matchedRecords.some(r => r.recordDate !== contract.contractDate);

              return (
                <div
                  key={contract.id}
                  className={`border rounded-lg p-3 transition-colors ${
                    hasDateMismatch
                      ? 'border-industrial-orange/30 bg-industrial-orange/5'
                      : matched
                      ? 'border-industrial-green/30 bg-industrial-green/5'
                      : 'border-gray-200 hover:border-primary-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className={matched ? 'text-industrial-green' : 'text-gray-400'} />
                        <span className="font-mono text-sm font-medium text-gray-800">
                          {contract.contractNo}
                        </span>
                        {hasDateMismatch && (
                          <span className="text-[10px] bg-industrial-orange/20 text-industrial-orange px-1.5 py-0.5 rounded">
                            日期不匹配
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate" title={contract.fileName}>
                        {contract.fileName}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          {contract.contractDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <User size={10} />
                          {contract.uploader}
                        </span>
                      </div>
                      {matched && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">
                            已关联 {matchedRecords.length} 条记录:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {matchedRecords.map(r => (
                              <span
                                key={r.id}
                                className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                  r.recordDate === contract.contractDate
                                    ? 'bg-industrial-green/10 text-industrial-green'
                                    : 'bg-industrial-orange/10 text-industrial-orange'
                                }`}
                              >
                                {r.valveNo}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {matched ? (
                      <CheckCircle size={16} className="text-industrial-green" />
                    ) : (
                      <span className="text-xs text-industrial-orange bg-industrial-orange/10 px-2 py-0.5 rounded">
                        待关联
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
