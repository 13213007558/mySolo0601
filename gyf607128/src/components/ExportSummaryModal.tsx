import { useState, useMemo } from 'react';
import { Modal, Card, Row, Col, Statistic, List, Tag, Space, Button, message } from 'antd';
import {
  Download,
  Copy,
  Mail,
  FileText,
  User,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { useLedgerStore } from '@/store/useLedgerStore';
import { generateExportSummary, exportToExcel, generateEmailBody } from '@/utils/exportUtils';
import { STATUS_TEXT_MAP } from '@/types';

interface ExportSummaryModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ExportSummaryModal({ open, onClose }: ExportSummaryModalProps) {
  const { ledgers, emissionFactorNote, currentUser } = useLedgerStore();
  const [exporting, setExporting] = useState(false);

  const summary = useMemo(
    () => generateExportSummary(ledgers, emissionFactorNote, currentUser),
    [ledgers, emissionFactorNote, currentUser]
  );

  const handleExport = () => {
    setExporting(true);
    try {
      const filename = exportToExcel(ledgers, emissionFactorNote, currentUser);
      message.success(`导出成功: ${filename}`);
      onClose();
    } catch (error) {
      message.error('导出失败');
    } finally {
      setExporting(false);
    }
  };

  const handleCopyEmail = () => {
    const emailBody = generateEmailBody(summary);
    navigator.clipboard.writeText(emailBody);
    message.success('邮件正文已复制到剪贴板');
  };

  const statusColorMap = {
    normal: '#52c41a',
    withdrawn: '#ff4d4f',
    pending: '#fa8c16',
  };

  return (
    <Modal
      title={
        <Space>
          <FileText size={20} className="text-teal-600" />
          <span className="font-semibold">导出摘要预览</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={900}
      footer={
        <Space>
          <Button icon={<Copy size={16} />} onClick={handleCopyEmail}>
            复制邮件正文
          </Button>
          <Button
            type="primary"
            icon={<Download size={16} />}
            loading={exporting}
            onClick={handleExport}
            className="bg-teal-600 hover:bg-teal-700"
          >
            导出Excel
          </Button>
        </Space>
      }
    >
      <div className="space-y-4">
        <Row gutter={16}>
          <Col span={6}>
            <Card className="text-center h-full">
              <Statistic
                title="总记录数"
                value={summary.totalCount}
                prefix={<FileText size={18} className="text-gray-400" />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="text-center h-full">
              <Statistic
                title="正常"
                value={summary.normalCount}
                prefix={<CheckCircle size={18} className="text-green-500" />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="text-center h-full">
              <Statistic
                title="已撤回"
                value={summary.withdrawnCount}
                prefix={<XCircle size={18} className="text-red-500" />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="text-center h-full border-orange-200">
              <Statistic
                title="待拍板"
                value={summary.pendingCount}
                prefix={<AlertTriangle size={18} className="text-orange-500" />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>

        <Card
          title={
            <Space>
              <User size={16} className="text-gray-500" />
              <span className="font-medium">撤回原因统计</span>
            </Space>
          }
          size="small"
        >
          <div className="flex flex-wrap gap-2">
            {summary.reasons.length > 0 ? (
              summary.reasons.map((item) => (
                <Tag key={item.reason} color="blue" className="text-sm px-3 py-1">
                  {item.reason}: <strong>{item.count}</strong>条
                </Tag>
              ))
            ) : (
              <span className="text-gray-400 text-sm">暂无撤回记录</span>
            )}
          </div>
        </Card>

        <Card
          title={
            <Space>
              <User size={16} className="text-gray-500" />
              <span className="font-medium">处理人统计</span>
            </Space>
          }
          size="small"
        >
          <div className="flex flex-wrap gap-2">
            {summary.handlers.length > 0 ? (
              summary.handlers.map((item) => (
                <Tag key={item.name} color="green" className="text-sm px-3 py-1">
                  {item.name}: <strong>{item.count}</strong>条
                </Tag>
              ))
            ) : (
              <span className="text-gray-400 text-sm">暂无处理记录</span>
            )}
          </div>
        </Card>

        {summary.pendingRecords.length > 0 && (
          <Card
            title={
              <Space>
                <AlertTriangle size={16} className="text-orange-500" />
                <span className="font-medium text-orange-600">待拍板记录（需资产负责人确认）</span>
              </Space>
            }
            size="small"
            className="border-orange-200"
          >
            <List
              size="small"
              dataSource={summary.pendingRecords}
              renderItem={(item) => (
                <List.Item
                  className="py-2 border-b border-orange-50"
                  actions={[
                    <Tag key="status" color="orange">
                      {STATUS_TEXT_MAP[item.status]}
                    </Tag>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span className="font-mono text-xs text-gray-500">{item.id}</span>
                        <span className="font-medium">{item.date}</span>
                        <span>{item.building}</span>
                      </Space>
                    }
                    description={
                      <Space className="text-sm">
                        <span className="text-teal-600">{item.carbonEmission.toFixed(2)} tCO₂</span>
                        <span className="text-gray-500">|</span>
                        <span>因子: {item.emissionFactor}</span>
                        <span className="text-gray-500">|</span>
                        <span>处理人: {item.handler}</span>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        )}

        {summary.emissionFactorNote && (
          <Card
            title={
              <Space>
                <AlertTriangle size={16} className="text-orange-500" />
                <span className="font-medium text-orange-600">韩工手工补录排放因子说明</span>
              </Space>
            }
            size="small"
            className="border-orange-200 bg-orange-50"
          >
            <div className="text-sm space-y-2">
              <p>
                <strong>因子名称：</strong>
                {summary.emissionFactorNote.factorName}
              </p>
              <p>
                <strong>数值变更：</strong>
                <span className="text-gray-500 line-through">
                  {summary.emissionFactorNote.oldValue}
                </span>
                <span className="mx-2">→</span>
                <span className="text-orange-600 font-bold">
                  {summary.emissionFactorNote.newValue}
                </span>
                <span className="text-orange-500 ml-2">
                  (+{(summary.emissionFactorNote.newValue - summary.emissionFactorNote.oldValue).toFixed(4)})
                </span>
              </p>
              <p>
                <strong>补录原因：</strong>
                {summary.emissionFactorNote.reason}
              </p>
              <p className="text-gray-500">
                <Space>
                  <User size={14} />
                  <span>补录人: {summary.emissionFactorNote.operator}</span>
                  <Clock size={14} />
                  <span>{summary.emissionFactorNote.entryTime}</span>
                </Space>
              </p>
            </div>
          </Card>
        )}

        <Card size="small" className="bg-gray-50">
          <Space className="text-sm text-gray-500">
            <Clock size={14} />
            <span>导出时间: {summary.exportTime}</span>
            <User size={14} />
            <span>导出人: {summary.exportBy}</span>
          </Space>
        </Card>
      </div>
    </Modal>
  );
}
