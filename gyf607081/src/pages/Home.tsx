import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, RefreshCw, Download } from 'lucide-react';
import { Button, message } from 'antd';
import { DataStatus } from '../types';
import { useCheckStore } from '../store/useCheckStore';
import { DataStatusCard } from '../components/DataStatusCard';
import { RecordTable } from '../components/RecordTable';

const Home: React.FC = () => {
  const {
    checkRecords,
    initData,
    simulateServiceRestart,
    exportRecords
  } = useCheckStore();

  const [activeFilter, setActiveFilter] = useState<DataStatus | null>(null);
  const [restartLoading, setRestartLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    initData();
  }, [initData]);

  const normalCount = checkRecords.filter(r => r.dataStatus === DataStatus.NORMAL).length;
  const dirtyCount = checkRecords.filter(r => r.dataStatus === DataStatus.DIRTY).length;
  const emptyCount = checkRecords.filter(r => r.dataStatus === DataStatus.EMPTY).length;

  const handleServiceRestart = async () => {
    setRestartLoading(true);
    try {
      const result = await simulateServiceRestart();
      message.success(
        `服务重启完成：成功 ${result.success.length} 条，失败 ${result.failed.length} 条`
      );
      if (result.failed.length > 0) {
        message.warning(
          `失败记录：${result.failed.map(f => f.recordId).join(', ')}`
        );
      }
    } catch (error) {
      message.error('服务重启失败');
    } finally {
      setRestartLoading(false);
    }
  };

  const handleExportAll = async () => {
    setExportLoading(true);
    try {
      await exportRecords();
      message.success('导出成功，Excel文件已下载');
    } catch (error) {
      message.error('导出失败');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-2xl font-bold text-slate-800"
            style={{ fontFamily: '"Noto Serif SC", serif' }}
          >
            晨检复核记录
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            共 {checkRecords.length} 条记录，支持财务反查、审计追溯
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={handleServiceRestart}
            loading={restartLoading}
            className="h-10 px-4"
          >
            模拟服务重启
          </Button>
          <Button
            type="primary"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExportAll}
            loading={exportLoading}
            className="h-10 px-4 bg-gradient-to-r from-rose-500 to-orange-500 border-none hover:from-rose-600 hover:to-orange-600"
          >
            导出全部
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DataStatusCard
          status={DataStatus.NORMAL}
          count={normalCount}
          onClick={() => setActiveFilter(
            activeFilter === DataStatus.NORMAL ? null : DataStatus.NORMAL
          )}
        />
        <DataStatusCard
          status={DataStatus.DIRTY}
          count={dirtyCount}
          onClick={() => setActiveFilter(
            activeFilter === DataStatus.DIRTY ? null : DataStatus.DIRTY
          )}
        />
        <DataStatusCard
          status={DataStatus.EMPTY}
          count={emptyCount}
          onClick={() => setActiveFilter(
            activeFilter === DataStatus.EMPTY ? null : DataStatus.EMPTY
          )}
        />
      </div>

      {activeFilter && (
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <span className="text-blue-700 font-medium">
              当前筛选：{activeFilter === DataStatus.NORMAL ? '正常数据' : activeFilter === DataStatus.DIRTY ? '脏数据' : '空数据'}
              （点击卡片可取消筛选）
            </span>
          </div>
          <Button
            size="small"
            onClick={() => setActiveFilter(null)}
          >
            清除筛选
          </Button>
        </div>
      )}

      <RecordTable filter={activeFilter || undefined} />

      <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
        <h4 className="font-semibold text-amber-800 mb-2">💡 使用提示</h4>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• <strong>财务反查</strong>：点击记录的"查看详情"按钮，可跳转至宝宝详情页查看原始体温枪记录和请假条照片</li>
          <li>• <strong>状态流转</strong>：点击"拒绝"或"补发"按钮可处理记录，所有状态变化都会永久保留审计痕迹</li>
          <li>• <strong>拒绝→已补发</strong>：点击循环箭头按钮可模拟完整流程，查看导出中的状态变化痕迹</li>
          <li>• <strong>手工补录</strong>：样例数据中包含一条手工补录记录（刘小强），可查看补录前后差异</li>
          <li>• <strong>服务重启</strong>：点击"模拟服务重启"可测试部分成功机制，失败数据会在审计日志中保留快照</li>
        </ul>
      </div>
    </div>
  );
};

export default Home;
