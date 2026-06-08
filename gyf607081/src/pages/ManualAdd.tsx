import React, { useState, useEffect } from 'react';
import {
  PlusCircle, Baby, Thermometer, FileText, Upload, AlertTriangle,
  CheckCircle, ArrowLeft, Clock, User, Calendar, XCircle
} from 'lucide-react';
import { Button, Form, Input, Select, InputNumber, DatePicker, message, Steps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useCheckStore } from '../store/useCheckStore';
import { DataStatus } from '../types';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const ManualAdd: React.FC = () => {
  const navigate = useNavigate();
  const { babies, checkRecords, manualAddRecord, initData } = useCheckStore();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedBaby, setSelectedBaby] = useState<string | null>(null);
  const [previewBefore, setPreviewBefore] = useState<any>(null);
  const [previewAfter, setPreviewAfter] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    initData();
  }, [initData]);

  const emptyRecords = checkRecords.filter(
    r => r.dataStatus === DataStatus.EMPTY || !r.temperatureRecordId
  );

  const availableBabies = babies.filter(
    baby => !checkRecords.some(
      r => r.babyId === baby.id && r.temperatureRecordId
    ) || emptyRecords.some(r => r.babyId === baby.id)
  );

  const steps = [
    {
      title: '选择宝宝',
      description: '选择需要补录的宝宝'
    },
    {
      title: '填写体温信息',
      description: '输入体温枪记录数据'
    },
    {
      title: '确认补录差异',
      description: '查看补录前后数据对比'
    }
  ];

  const handleBabySelect = (babyId: string) => {
    setSelectedBaby(babyId);
    const existingRecord = checkRecords.find(
      r => r.babyId === babyId && r.dataStatus === DataStatus.EMPTY
    );

    if (existingRecord) {
      setPreviewBefore({
        数据状态: '空数据',
        体温记录: '无',
        处理状态: '待处理',
        备注: existingRecord.currentRemark || '无'
      });
    } else {
      setPreviewBefore({
        数据状态: '无记录',
        体温记录: '无',
        处理状态: '无',
        备注: '无'
      });
    }
  };

  const handleValuesChange = (changedValues: any, allValues: any) => {
    if (allValues.babyId) {
      setPreviewAfter({
        数据状态: '正常',
        体温记录: allValues.temperature ? `${allValues.temperature}℃` : '待填写',
        处理状态: '手工补录',
        备注: allValues.reason || '待填写',
        测量时间: allValues.measureTime
          ? allValues.measureTime.format('YYYY-MM-DD HH:mm')
          : '待填写',
        测量设备: allValues.measureDevice || '待填写',
        操作人: allValues.operator || '待填写'
      });
    }
  };

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      await manualAddRecord(
        values.babyId,
        {
          temperature: values.temperature,
          measureTime: values.measureTime.toISOString(),
          measureDevice: values.measureDevice,
          operator: values.operator,
          remark: values.remark
        },
        values.reason
      );

      message.success('手工补录成功！数据差异已记录');
      setTimeout(() => {
        navigate(`/baby/${values.babyId}`);
      }, 1500);
    } catch (error) {
      message.error('补录失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    try {
      if (currentStep === 0) {
        await form.validateFields(['babyId']);
      } else if (currentStep === 1) {
        await form.validateFields([
          'temperature',
          'measureTime',
          'measureDevice',
          'operator',
          'remark',
          'reason'
        ]);
      }
      setCurrentStep(currentStep + 1);
    } catch (error) {
      // Validation failed, ant-design shows errors
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回列表</span>
        </button>
        <div className="h-6 w-px bg-slate-200" />
        <div>
          <h2
            className="text-2xl font-bold text-slate-800"
            style={{ fontFamily: '"Noto Serif SC", serif' }}
          >
            手工补录
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            补录早高峰遗漏的体温记录，系统会自动记录补录前后差异
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <Steps
          current={currentStep}
          items={steps}
          className="mb-8"
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={handleValuesChange}
          initialValues={{
            measureTime: dayjs(),
            operator: '客服小王',
            measureDevice: '手工补录'
          }}
        >
          {currentStep === 0 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  样例说明
                </h4>
                <p className="text-sm text-purple-700">
                  样例数据中，<strong>陈小华（baby-005）</strong> 有一条空数据记录（record-007），
                  可以选择该宝宝进行补录，查看补录前后的差异对比。
                  另外 <strong>刘小强（baby-006）</strong> 已包含一条手工补录记录，可在详情页查看。
                </p>
              </div>

              <Form.Item
                name="babyId"
                label="选择宝宝"
                rules={[{ required: true, message: '请选择需要补录的宝宝' }]}
              >
                <Select
                  placeholder="请选择宝宝"
                  size="large"
                  onChange={handleBabySelect}
                  optionFilterProp="children"
                  showSearch
                >
                  {availableBabies.map(baby => {
                    const hasEmptyRecord = emptyRecords.some(
                      r => r.babyId === baby.id
                    );
                    return (
                      <Option key={baby.id} value={baby.id}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              src={baby.avatar}
                              alt={baby.name}
                              className="w-6 h-6 rounded-full"
                            />
                            <span className="font-medium">{baby.name}</span>
                            <span className="text-xs text-slate-400">
                              {baby.className} · {baby.age}岁
                            </span>
                          </div>
                          {hasEmptyRecord && (
                            <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                              有空数据
                            </span>
                          )}
                        </div>
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>

              {selectedBaby && previewBefore && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    当前数据状态（补录前）
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(previewBefore).map(([key, value]) => (
                      <div key={key} className="p-3 bg-white rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-500 mb-1">{key}</p>
                        <p className={`text-sm font-medium ${
                          String(value).includes('空') || String(value).includes('无')
                            ? 'text-red-600'
                            : 'text-slate-700'
                        }`}>
                          {value as string}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Form.Item
                  name="temperature"
                  label="体温（℃）"
                  rules={[
                    { required: true, message: '请输入体温' },
                    { type: 'number', min: 35, max: 42, message: '体温应在35-42℃之间' }
                  ]}
                >
                  <InputNumber
                    placeholder="请输入体温"
                    size="large"
                    className="w-full"
                    step={0.1}
                    precision={1}
                    prefix={<Thermometer className="w-4 h-4 text-slate-400" />}
                  />
                </Form.Item>

                <Form.Item
                  name="measureTime"
                  label="测量时间"
                  rules={[{ required: true, message: '请选择测量时间' }]}
                >
                  <DatePicker
                    showTime
                    placeholder="选择测量时间"
                    size="large"
                    className="w-full"
                    prefix={<Clock className="w-4 h-4 text-slate-400" />}
                  />
                </Form.Item>

                <Form.Item
                  name="measureDevice"
                  label="测量设备"
                  rules={[{ required: true, message: '请输入测量设备' }]}
                >
                  <Input
                    placeholder="例如：体温枪A-001"
                    size="large"
                    prefix={<Thermometer className="w-4 h-4 text-slate-400" />}
                  />
                </Form.Item>

                <Form.Item
                  name="operator"
                  label="操作人"
                  rules={[{ required: true, message: '请输入操作人' }]}
                >
                  <Input
                    placeholder="请输入操作人姓名"
                    size="large"
                    prefix={<User className="w-4 h-4 text-slate-400" />}
                  />
                </Form.Item>
              </div>

              <Form.Item
                name="remark"
                label="体温记录备注"
                rules={[{ required: true, message: '请输入备注' }]}
              >
                <TextArea
                  placeholder="例如：晨检体温正常，略有咳嗽"
                  rows={3}
                  showCount
                  maxLength={200}
                />
              </Form.Item>

              <Form.Item
                name="reason"
                label="补录原因"
                rules={[{ required: true, message: '请输入补录原因' }]}
              >
                <TextArea
                  placeholder="例如：早高峰体温枪排队，纸质记录后补录系统"
                  rows={3}
                  showCount
                  maxLength={200}
                />
              </Form.Item>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  请假条照片上传（可选）
                </h4>
                <p className="text-sm text-blue-700">
                  如有请假条照片，可在此上传。系统会自动保存到宝宝详情中供财务反查。
                </p>
                <div className="mt-3 border-2 border-dashed border-blue-300 rounded-xl p-8 text-center">
                  <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-sm text-blue-600">点击或拖拽上传照片</p>
                  <p className="text-xs text-blue-400 mt-1">支持 JPG、PNG 格式</p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  补录数据差异对比
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-white rounded-xl border-2 border-red-200">
                    <h5 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      补录前
                    </h5>
                    <div className="space-y-3">
                      {previewBefore && Object.entries(previewBefore).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center py-2 border-b border-red-100 last:border-0">
                          <span className="text-sm text-slate-500">{key}</span>
                          <span className={`text-sm font-medium ${
                            String(value).includes('空') || String(value).includes('无')
                              ? 'text-red-600'
                              : 'text-slate-700'
                          }`}>
                            {value as string}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-xl border-2 border-emerald-200">
                    <h5 className="font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      补录后
                    </h5>
                    <div className="space-y-3">
                      {previewAfter && Object.entries(previewAfter).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center py-2 border-b border-emerald-100 last:border-0">
                          <span className="text-sm text-slate-500">{key}</span>
                          <span className="text-sm font-medium text-emerald-700">
                            {value as string}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-700">
                    <strong>⚠️ 重要提示：</strong>
                    提交后，以上差异将永久记录在审计日志中，供主管复查。
                    导出时会标记此记录为"手工补录"，并在"状态变更历史"中显示完整的补录信息。
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <h4 className="font-semibold text-slate-700 mb-3">审计信息预览</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">操作类型</p>
                    <p className="text-sm font-medium text-purple-600">手工补录</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">操作人</p>
                    <p className="text-sm font-medium text-slate-700">
                      {form.getFieldValue('operator') || '-'}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">操作时间</p>
                    <p className="text-sm font-medium text-slate-700">
                      {new Date().toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">审计状态</p>
                    <p className="text-sm font-medium text-emerald-600">将永久保留</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
            <Button
              onClick={handlePrev}
              disabled={currentStep === 0}
              size="large"
            >
              上一步
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                type="primary"
                onClick={handleNext}
                size="large"
                className="bg-gradient-to-r from-rose-500 to-orange-500 border-none"
              >
                下一步
              </Button>
            ) : (
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={submitting}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 border-none"
                icon={<PlusCircle className="w-4 h-4" />}
              >
                确认补录
              </Button>
            )}
          </div>
        </Form>
      </div>

      <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
        <h4 className="font-semibold text-amber-800 mb-2">💡 操作提示</h4>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• 选择有空数据标记的宝宝进行补录，可以看到更明显的前后差异对比</li>
          <li>• 补录完成后，可在宝宝详情页的"手工补录信息"区域查看完整的差异记录</li>
          <li>• 所有补录操作都会永久记录在审计日志中，主管可随时复查</li>
          <li>• 导出的Excel会标记手工补录记录，并包含补录前后的状态变化历史</li>
        </ul>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ManualAdd;
