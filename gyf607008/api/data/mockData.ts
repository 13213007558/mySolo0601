import type { InfantRecord, AuditLog } from '../../shared/types';

const now = new Date();
const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

function fmt(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export const initialRecords: InfantRecord[] = [
  {
    id: 'rec-001',
    batchNo: 'BATCH-20260605-A',
    babyName: '李一诺',
    gender: 'female',
    birthDate: '2023-08-15',
    parentPhone: '13812345678',
    source: 'batch',
    status: 'normal',
    createdAt: fmt(twoDaysAgo),
    updatedAt: fmt(twoDaysAgo),
    createdBy: '张老师（白班）',
    updatedBy: '张老师（白班）',
    parentVisible: {
      feeding: '上午 180ml 配方奶，中午半碗小米粥',
      temperature: '36.5℃（入园）/ 36.7℃（午检）',
      sleep: '午睡 2 小时 15 分，安稳无异常',
    },
    internalNotes: '对芒果过敏，家长已书面告知。情绪稳定，与小朋友互动良好。',
    issues: [],
  },
  {
    id: 'rec-002',
    batchNo: '',
    babyName: '王梓轩',
    gender: 'male',
    birthDate: '',
    parentPhone: '13-5678 9012',
    source: 'supplement',
    status: 'abnormal',
    createdAt: fmt(oneHourAgo),
    updatedAt: fmt(oneHourAgo),
    createdBy: '刘老师（夜班）',
    updatedBy: '刘老师（夜班）',
    parentVisible: {
      feeding: '家长身份证号 310101199001011234，已确认身份',
      temperature: '37.1℃，略高，持续观察中',
      sleep: '入睡较难，需拍哄',
    },
    internalNotes: '临时补录，家长银行卡号 6222021234567890 请勿外泄。联系邮箱 dad@example.com。',
    issues: [
      {
        id: 'issue-002-1',
        field: 'batchNo',
        type: 'required_missing',
        severity: 'warning',
        message: '批次号缺失',
        reason: '该记录为临时补充材料，未填写批次号。导出时无法归入对应批次统计，可能导致该宝宝被遗漏在正常批次报表之外。建议尽快向白班确认批次号并补录。',
      },
      {
        id: 'issue-002-2',
        field: 'birthDate',
        type: 'required_missing',
        severity: 'warning',
        message: '出生日期未填写',
        reason: '临时补充时未获取到宝宝出生日期，护理标准无法按年龄段匹配。夜班老师应在交接备注中说明，并要求次日白班联系家长补录。',
      },
      {
        id: 'issue-002-3',
        field: 'parentPhone',
        type: 'phone_format',
        severity: 'error',
        message: '手机号格式异常："13-5678 9012"',
        reason: '检测到输入值 "13-5678 9012" 不符合中国大陆手机号规范（应为 11 位数字且以 13-19 开头）。当前值包含空格和短横线且位数不足，导出到 CSV 后将无法正常拨号。请向家长核实正确号码并修正。',
      },
      {
        id: 'issue-002-4',
        field: 'feeding',
        type: 'privacy_leak',
        severity: 'error',
        message: '家长可见区-喂养记录中检测到疑似身份证号',
        reason: '在"家长可见区"的"喂养记录"字段中发现内容 "家长身份证号 310101199001011234，已确认身份"，其中包含疑似身份证号。家长端会直接看到该信息，违反《个人信息保护法》。请将身份核验信息移至内部备注区并做脱敏处理。',
      },
      {
        id: 'issue-002-5',
        field: 'internalNotes',
        type: 'privacy_leak',
        severity: 'error',
        message: '内部备注区-内部备注中检测到疑似银行卡号',
        reason: '在"内部备注区"的"内部备注"字段中发现疑似银行卡号。即使是内部可见，明文存储敏感金融信息也存在合规风险。建议删除或仅保留末 4 位。',
      },
      {
        id: 'issue-002-6',
        field: 'internalNotes',
        type: 'privacy_leak',
        severity: 'warning',
        message: '内部备注区-内部备注中检测到疑似邮箱地址',
        reason: '在"内部备注区"检测到邮箱地址 dad@example.com。若该字段被误勾选加入家长可见导出，将造成不必要的信息泄露。建议仅保留必要联系方式。',
      },
    ],
  },
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'audit-001',
    recordId: 'rec-001',
    babyName: '李一诺',
    operator: '张老师（白班）',
    action: 'create',
    timestamp: fmt(twoDaysAgo),
    fieldChanges: [],
  },
  {
    id: 'audit-002',
    recordId: 'rec-002',
    babyName: '王梓轩',
    operator: '刘老师（夜班）',
    action: 'create',
    timestamp: fmt(oneHourAgo),
    fieldChanges: [],
  },
];
