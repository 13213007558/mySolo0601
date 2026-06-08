import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet, Download, Eye, ArrowRight, Clock, User, Search
} from 'lucide-react';
import { Button, Input, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCheckStore } from '../store/useCheckStore';
import { getAllExportRecords, buildExportData } from '../services/exportService';
import {
  ExportRecord,
  StatusChangeTrace,
  RecordStatus,
  CheckRecord
} from '../types';
import { StatusBadge } from '../components/StatusBadge';

const ExportManage: React.FC = () => {
  const navigate = useNavigate();
  const {
    checkRecords,
    babies,
    temperatureRecords,
    leaveNotes,
    exportRecords,
    initData,
    getBabyById
  } = useCheckStore();

  const [exports, setExports] = useState<ExportRecord[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedExport, setSelectedExport] = useState<ExportRecord | null>(null);

  useEffect(() => {
    initData();
    setExports(getAllExportRecords());
  }, [initData]);

  const handleExportAll = async () => {
    try {
      const exportId = await exportRecords();
      message.success('导出成功，Excel文件已下载');
      setExports(getAllExportRecords());
      const newExport = getAllExportRecords().find(e => e.id === exportId);
      if (newExport) {
        setSelectedExport(newExport);
      }
    } catch (error) {
      message.error('导出失败');
    }
  };

  const handleTraceBack = (recordId: string) => {
    const record = checkRecords.find(r => r.id === recordId);
    if (record) {
      navigate(`/baby/${record.babyId}`);
    } else {
      message.warning('未找到对应记录');
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (status: RecordStatus) => {
    const map: Record<RecordStatus, string> = {
      [RecordStatus.PENDING]: '待处理',
      [RecordStatus.REJECTED]: '已拒绝',
      [RecordStatus.REISSUED]: '已补发',
      [RecordStatus.MANUAL]: '手工补录'
    };
    return map[status];
  };

  const allChanges: StatusChangeTrace[] = exports.flatMap(e => e.statusChanges);

  const columns: ColumnsType<StatusChangeTrace> = [
    {
      title: '记录ID',
      dataIndex: 'recordId',
      key: 'recordId',
      width: 120,
      render: (id: string) => (
        <code className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
          {id}
        </code>
      )
    },
    {
      title: '宝宝姓名',
      key: 'babyName',
      width: 100,
      render: (_, trace) => {
        const record = checkRecords.find(r => r.id === trace.recordId);
        const baby = record ? getBabyById(record.babyId) : undefined;
        return baby?.name || '未知';
      }
    },
    {
      title: '状态变更',
      key: 'statusChange',
      width: 240,
      render: (_, trace) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={trace.oldStatus} />
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <StatusBadge status={trace.newStatus} />
        </div>
      )
    },
    {
      title: '变更原因',
      dataIndex: 'remark',
      key: 'remark',
      className: 'max-w-xs',
      render: (text: string) => (
        <span className="text-sm text-slate-700">{text}</span>
      )
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      width: 100,
      render: (text: string) => (
        <span className="text-sm text-slate-600">{text}</span>
      )
    },
    {
      title: '变更时间',
      dataIndex: 'changeTime',
      key: 'changeTime',
      width: 160,
      render: (iso: string) => (
        <span className="text-sm text-slate-500">{formatDate(iso)}</span>
      )
    },
    {
      title: '反查详情',
      key: 'action',
      width: 100,
      render: (_, trace) => (
        <Button
          type="link"
          icon={<Eye className="w-4 h-4" />}
          onClick={() => handleTraceBack(trace.recordId)}
          className="text-blue-600"
        >
          反查
        </Button>
      )
    }
  ];

  const filteredChanges = allChanges.filter(change => {
    if (!searchText) return true;
    const record = checkRecords.find(r => r.id === change.recordId);
    const baby = record ? getBabyById(record.babyId) : undefined;
    return (
      change.recordId.toLowerCase().includes(searchText.toLowerCase()) ||
      baby?.name.toLowerCase().includes(searchText.toLowerCase()) ||
      change.remark.toLowerCase().includes(searchText.toLowerCase())
    );
  });

  // 导出数据预览
  const previewData = selectedExport
    ? buildExportData(
        checkRecords.filter(r => selectedExport.recordIds.includes(r.id)),
        babies,
        temperatureRecords,
        leaveNotes,
        selectedExport.statusChanges
      )
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-2xl font-bold text-slate-800"
            style={{ fontFamily: '"Noto Serif SC", serif' }}
          >
            导出管理
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            财务同事可从导出表反查到宝宝详情，查看状态变化痕迹
          </p>
        </div>

        <Button
          type="primary"
          icon={<Download className="w-4 h-4" />}
          onClick={handleExportAll}
          className="h-10 px-4 bg-gradient-to-r from-rose-500 to-orange-500 border-none hover:from-rose-600 hover:to-orange-600"
        >
          导出全部数据
        </Button>
      </div>

      {/* 导出记录列表 */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-rose-500" />
          导出历史记录
        </h3>

        <div className="space-y-3">
          {exports.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>暂无导出记录</p>
            </div>
          ) : (
            exports.map(exp => (
              <div
                key={exp.id}
                onClick={() => setSelectedExport(
                  selectedExport?.id === exp.id ? null : exp
                )}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  selectedExport?.id === exp.id
                    ? 'border-rose-300 bg-rose-50 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-100 to-orange-100 rounded-xl flex items-center justify-center">
                      <FileSpreadsheet className="w-6 h-6 text-rose-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">
                        晨检复核记录_{new Date(exp.exportTime).toISOString().slice(0, 10)}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(exp.exportTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {exp.operator}
                        </span>
                        <span className="text-slate-400">
                          共 {exp.recordIds.length} 条记录
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {exp.statusChanges.length > 0 && (
                      <Tag color="orange">
                        含 {exp.statusChanges.length} 条状态变更
                      </Tag>
                    )}
                    <Button
                      type="primary"
                      size="small"
                      icon={<Download className="w-3.5 h-3.5" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        exportRecords(exp.recordIds);
                      }}
                    >
                      重新下载
                    </Button>
                  </div>
                </div>

                {selectedExport?.id === exp.id && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">
                      导出数据预览（前5行）
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-50">
                            {Object.keys(previewData[0] || {}).slice(0, 8).map(key => (
                              <th key={key} className="px-2 py-2 text-left font-medium text-slate-600">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.slice(0, 5).map((row, idx) => (
                            <tr key={idx} className="border-t border-slate-100">
                              {Object.entries(row).slice(0, 8).map(([key, value]) => (
                                <td
                                  key={key}
                                  className={`px-2 py-2 ${
                                    key === '状态变更历史' &&
                                    String(value).includes('→')
                                      ? 'bg-amber-50 text-amber-700'
                                      : key === '记录状态' && value === '已补发'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'text-slate-600'
                                  }`}
                                >
                                  {String(value).slice(0, 30)}
                                  {String(value).length > 30 ? '...' : ''}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      完整导出的Excel包含"状态变更历史"列，可清晰看到"拒绝→已补发"等所有状态变化痕迹
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 状态变化痕迹列表 */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            状态变化痕迹
            <Tag color="red">样例：record-004 包含"拒绝→已补发"完整流程</Tag>
          </h3>

          <Input
            placeholder="搜索记录ID、宝宝姓名、变更原因..."
            prefix={<Search className="w-4 h-4 text-slate-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-72"
            allowClear
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredChanges}
          rowKey={(record) => `${record.recordId}-${record.changeTime}`}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 条状态变更记录`
          }}
          scroll={{ x: 900 }}
        />

        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">🔍 财务反查功能说明</h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>从导出的Excel中找到有疑问的记录，复制"记录ID"</li>
            <li>在系统中搜索记录ID或宝宝姓名</li>
            <li>点击"反查"按钮即可跳转至宝宝详情页</li>
            <li>在详情页可查看：体温枪原始记录照片、请假条照片、完整审计日志</li>
          </ol>
        </div>
      </div>

      <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
        <h4 className="font-semibold text-amber-800 mb-2">💡 导出数据说明</h4>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• <strong>状态变更历史列</strong>：导出的Excel包含完整的状态变更时间线，可清晰看到"拒绝→已补发"等所有状态变化</li>
          <li>• <strong>样例数据</strong>：record-004（赵小美）包含完整的"拒绝→已补发"流程痕迹</li>
          <li>• <strong>手工补录标记</strong>：record-006（刘小强）为手工补录记录，导出时会标记"是否手工补录"为"是"</li>
          <li>• <strong>脏数据标记</strong>：record-004（赵小美）标记为脏数据，导出时"数据状态"列为"脏数据"</li>
          <li>• <strong>空数据标记</strong>：record-007（陈小华）为空数据，导出时"数据状态"列为"空数据"</li>
        </ul>
      </div>
    </div>
  );
};

export default ExportManage;
