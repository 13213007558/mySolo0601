import { useState } from 'react';
import { Modal, Form, Select, Input, Space, Alert, Tag, List } from 'antd';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useLedgerStore } from '@/store/useLedgerStore';
import type { CarbonLedger } from '@/types';

const { TextArea } = Input;
const { Option } = Select;

interface BatchOperationModalProps {
  open: boolean;
  onClose: () => void;
  operationType: 'withdraw' | 'modify';
}

const WITHDRAW_REASONS = [
  '数据异常',
  '仪表故障',
  '抄表错误',
  '排放因子变更',
  '重复录入',
  '待核实',
  '领导要求',
  '系统问题',
];

export default function BatchOperationModal({
  open,
  onClose,
  operationType,
}: BatchOperationModalProps) {
  const { ledgers, batchWithdraw, batchModifyEmission, currentUser } = useLedgerStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const selectedLedgers = ledgers.filter((l) => l.selected);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const ids = selectedLedgers.map((l) => l.id);

      if (operationType === 'withdraw') {
        batchWithdraw(ids, values.reason);
      } else {
        batchModifyEmission(ids, values.emissionFactor, Number(values.carbonEmission));
      }

      setLoading(false);
      onClose();
      form.resetFields();
    } catch (error) {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
    form.resetFields();
  };

  return (
    <Modal
      title={
        <Space>
          <AlertTriangle size={20} className="text-orange-500" />
          <span className="font-semibold">
            {operationType === 'withdraw' ? '批量撤回' : '批量修改排放因子'}
          </span>
        </Space>
      }
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      okText="确认执行"
      cancelText="取消"
      confirmLoading={loading}
      width={600}
      okButtonProps={{
        danger: operationType === 'withdraw',
      }}
    >
      <Alert
        message={
          <Space>
            <AlertTriangle size={16} className="text-orange-500" />
            <span className="font-medium">
              此操作不可回滚，将永久影响 {selectedLedgers.length} 条记录
            </span>
          </Space>
        }
        description="操作完成后，原始值将保留在复盘页面供追溯，但无法恢复。请谨慎操作。"
        type="warning"
        showIcon
        className="mb-4"
      />

      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-2">
          已选择 <strong className="text-orange-600">{selectedLedgers.length}</strong> 条记录：
        </div>
        <div className="max-h-32 overflow-y-auto bg-gray-50 rounded-lg p-3">
          <List
            size="small"
            dataSource={selectedLedgers}
            renderItem={(item: CarbonLedger) => (
              <List.Item className="py-1">
                <Space>
                  <span className="font-mono text-xs text-gray-500">{item.id}</span>
                  <span>{item.date}</span>
                  <span className="text-gray-600">{item.building}</span>
                  <span className="text-teal-700">{item.carbonEmission.toFixed(2)} tCO₂</span>
                </Space>
              </List.Item>
            )}
          />
        </div>
      </div>

      <Form form={form} layout="vertical">
        {operationType === 'withdraw' ? (
          <>
            <Form.Item
              name="reason"
              label="撤回原因"
              rules={[{ required: true, message: '请选择或输入撤回原因' }]}
            >
              <Select
                placeholder="请选择撤回原因"
                allowClear
                mode="tags"
                maxTagCount={1}
                style={{ width: '100%' }}
              >
                {WITHDRAW_REASONS.map((reason) => (
                  <Option key={reason} value={reason}>
                    {reason}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="值班员白话提示">
              <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
                系统将根据撤回原因自动生成白话提示，例如：
                <br />
                <span className="text-blue-600">
                  "该记录数据超出正常波动范围，已撤回等待核实"
                </span>
              </div>
            </Form.Item>
          </>
        ) : (
          <>
            <Form.Item
              name="emissionFactor"
              label="新排放因子"
              rules={[{ required: true, message: '请输入排放因子' }]}
            >
              <Input placeholder="例如: 0.6101" addonAfter="tCO₂/kWh" />
            </Form.Item>
            <Form.Item
              name="carbonEmission"
              label="碳排放量(tCO₂)"
              rules={[{ required: true, message: '请输入碳排放量' }]}
            >
              <Input placeholder="请输入新的碳排放量" type="number" step="0.01" />
            </Form.Item>
            <Alert
              message={
                <Space>
                  <CheckCircle size={16} className="text-green-500" />
                  <span>将由韩工执行手工补录操作</span>
                </Space>
              }
              type="success"
              showIcon
            />
          </>
        )}

        <Form.Item label="操作人" name="operator" initialValue={currentUser}>
          <Input disabled />
        </Form.Item>
      </Form>

      <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
        <Space className="text-red-600 text-sm">
          <AlertTriangle size={16} />
          <span>
            <strong>重要提示：</strong>
            批量操作执行后不可回滚，原始值将保留在复盘页面。
          </span>
        </Space>
      </div>
    </Modal>
  );
}
