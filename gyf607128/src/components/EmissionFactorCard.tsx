import { useState } from 'react';
import { Card, Space, Button, Tag, Divider, Row, Col, Statistic, message, Upload, Modal } from 'antd';
import {
  FileText,
  Download,
  Upload as UploadIcon,
  User,
  Clock,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useLedgerStore } from '@/store/useLedgerStore';
import { exportToExcel, readExcelFile } from '@/utils/exportUtils';
import type { UploadProps } from 'antd';

export default function EmissionFactorCard() {
  const { emissionFactorNote, ledgers, currentUser, importLedgers } = useLedgerStore();
  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const [compareData, setCompareData] = useState<
    { id: string; date: string; building: string; oldValue: number; newValue: number; diff: number }[]
  >([]);

  const handleExport = () => {
    if (!emissionFactorNote) return;
    const filename = exportToExcel(ledgers, emissionFactorNote, currentUser);
    message.success(`导出成功: ${filename}`);
  };

  const handleShowDiff = () => {
    const manualEntries = ledgers.filter((l) => l.isManualEntry);
    const diffs = manualEntries.map((l) => ({
      id: l.id,
      date: l.date,
      building: l.building,
      oldValue: l.originalCarbonEmission,
      newValue: l.carbonEmission,
      diff: l.carbonEmission - l.originalCarbonEmission,
    }));
    setCompareData(diffs);
    setDiffModalOpen(true);
  };

  const uploadProps: UploadProps = {
    accept: '.xlsx,.xls',
    showUploadList: false,
    beforeUpload: async (file) => {
      try {
        const importedLedgers = await readExcelFile(file as File);
        importLedgers(importedLedgers);
        message.success(`成功导入 ${importedLedgers.length} 条记录`);
      } catch (error) {
        message.error(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
      return false;
    },
  };

  if (!emissionFactorNote) return null;

  const diff = emissionFactorNote.newValue - emissionFactorNote.oldValue;
  const diffPercent = ((diff / emissionFactorNote.oldValue) * 100).toFixed(2);
  const affectedCount = ledgers.filter((l) => l.isManualEntry).length;
  const totalDiff = ledgers
    .filter((l) => l.isManualEntry)
    .reduce((sum, l) => sum + (l.carbonEmission - l.originalCarbonEmission), 0);

  return (
    <>
      <Card
        className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200"
        title={
          <Space>
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertTriangle size={16} className="text-orange-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-800">韩工手工补录排放因子说明</div>
              <div className="text-xs text-gray-500">用于检查补录前后差异和导出读回</div>
            </div>
          </Space>
        }
        extra={
          <Tag color="orange" className="text-sm">
            重要通知
          </Tag>
        }
      >
        <Row gutter={16} className="mb-4">
          <Col span={8}>
            <Statistic
              title="排放因子旧值"
              value={emissionFactorNote.oldValue}
              precision={4}
              prefix={<FileText size={16} className="text-gray-400" />}
              valueStyle={{ fontSize: '18px', color: '#64748b' }}
            />
          </Col>
          <Col span={8} className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">→</span>
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                <ArrowRight size={20} className="text-white" />
              </div>
              <span className="text-gray-400">→</span>
            </div>
          </Col>
          <Col span={8}>
            <Statistic
              title="排放因子新值"
              value={emissionFactorNote.newValue}
              precision={4}
              prefix={<CheckCircle2 size={16} className="text-orange-500" />}
              valueStyle={{ fontSize: '18px', color: '#f97316' }}
            />
          </Col>
        </Row>

        <div className="bg-white rounded-lg p-4 mb-4 border border-orange-100">
          <div className="flex items-start gap-2 mb-3">
            <BookOpen size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-gray-700 mb-1">补录原因</div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {emissionFactorNote.reason}
              </p>
            </div>
          </div>
          <Divider className="my-3" />
          <div className="flex items-center justify-between text-sm">
            <Space>
              <User size={14} className="text-gray-400" />
              <span className="text-gray-600">操作人: {emissionFactorNote.operator}</span>
            </Space>
            <Space>
              <Clock size={14} className="text-gray-400" />
              <span className="text-gray-600">{emissionFactorNote.entryTime}</span>
            </Space>
          </div>
          <div className="mt-2 text-sm text-gray-500 flex items-center gap-1">
            <FileText size={14} />
            <span>数据来源: {emissionFactorNote.source}</span>
          </div>
        </div>

        <Row gutter={12} className="mb-4">
          <Col span={8}>
            <div className="bg-white rounded-lg p-3 text-center border border-gray-100">
              <div className="text-2xl font-bold text-orange-600">+{diff.toFixed(4)}</div>
              <div className="text-xs text-gray-500 mt-1">因子差值</div>
            </div>
          </Col>
          <Col span={8}>
            <div className="bg-white rounded-lg p-3 text-center border border-gray-100">
              <div className="text-2xl font-bold text-orange-600">+{diffPercent}%</div>
              <div className="text-xs text-gray-500 mt-1">调整幅度</div>
            </div>
          </Col>
          <Col span={8}>
            <div className="bg-white rounded-lg p-3 text-center border border-gray-100">
              <div className="text-2xl font-bold text-orange-600">{affectedCount}</div>
              <div className="text-xs text-gray-500 mt-1">影响记录数</div>
            </div>
          </Col>
        </Row>

        <div className="bg-orange-100 rounded-lg p-3 mb-4">
          <div className="text-sm text-orange-800">
            <span className="font-medium">累计排放调整: </span>
            <span className="font-bold">+{totalDiff.toFixed(2)} tCO₂</span>
            <span className="text-xs ml-2">
              (所有韩工补录记录的排放量差值总和)
            </span>
          </div>
        </div>

        <Space wrap>
          <Button
            type="primary"
            icon={<Download size={16} />}
            onClick={handleExport}
            className="bg-orange-500 hover:bg-orange-600 border-orange-500"
          >
            导出Excel（含补录说明）
          </Button>
          <Upload {...uploadProps}>
            <Button icon={<UploadIcon size={16} />}>导入读回</Button>
          </Upload>
          <Button onClick={handleShowDiff}>查看补录前后差异</Button>
        </Space>
      </Card>

      <Modal
        title="韩工补录前后差异对比"
        open={diffModalOpen}
        onCancel={() => setDiffModalOpen(false)}
        footer={null}
        width={800}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-2">台账ID</th>
                <th className="text-left p-2">日期</th>
                <th className="text-left p-2">楼宇</th>
                <th className="text-right p-2">原始排放量</th>
                <th className="text-right p-2">补录后排放量</th>
                <th className="text-right p-2">差值</th>
              </tr>
            </thead>
            <tbody>
              {compareData.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-orange-50">
                  <td className="p-2 font-mono text-xs text-gray-500">{row.id}</td>
                  <td className="p-2">{row.date}</td>
                  <td className="p-2">{row.building}</td>
                  <td className="p-2 text-right text-gray-500">{row.oldValue.toFixed(2)}</td>
                  <td className="p-2 text-right font-medium text-orange-600">
                    {row.newValue.toFixed(2)}
                  </td>
                  <td className="p-2 text-right font-bold text-orange-600">
                    +{row.diff.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-orange-50 font-bold">
                <td colSpan={5} className="p-2 text-right">
                  合计调整量:
                </td>
                <td className="p-2 text-right text-orange-600">
                  +{compareData.reduce((sum, r) => sum + r.diff, 0).toFixed(2)} tCO₂
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Modal>
    </>
  );
}
