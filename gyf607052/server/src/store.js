import { v4 as uuidv4 } from 'uuid';
import { buildSampleRecords, STATUS } from './sampleData.js';

let records = buildSampleRecords();

export const getAllRecords = (includeBadData = false) => {
  if (includeBadData) return records;
  return records.filter(r => !r.isBadData);
};

export const getRecordById = (id) => records.find(r => r.id === id);

export const getBadRecords = () => records.filter(r => r.isBadData);

const pushHistory = (record, status, operator, remark, extra = {}) => {
  record.statusHistory.push({
    time: new Date().toISOString(),
    status,
    operator,
    remark,
    ...extra
  });
  record.updatedAt = new Date().toISOString();
};

export const checkThreeDayIngredients = (id, operator) => {
  const record = getRecordById(id);
  if (!record || record.isBadData) return null;

  const issues = [];
  let totalItems = 0;
  let checkedCount = 0;

  record.threeDayIngredients.forEach((day, idx) => {
    if (!day.items || day.items.length === 0) {
      issues.push({
        type: '材料缺页',
        detail: `第${idx + 1}日食材清单为空，请厨房补全后再确认`
      });
    } else {
      totalItems += day.items.length;
    }
    if (day.checked) checkedCount++;
  });

  record.allergies.forEach(allergy => {
    record.threeDayIngredients.forEach((day, idx) => {
      day.items.forEach(item => {
        if (item.includes(allergy)) {
          issues.push({
            type: '禁忌冲突',
            detail: `第${idx + 1}日"${item}"含"${allergy}"成分，与过敏史冲突`
          });
          day.hasConflict = true;
          day.conflictNote = `含${allergy}成分`;
        }
      });
    });
  });

  if (checkedCount < 3) {
    issues.push({
      type: '确认未完成',
      detail: `三日食材表目前仅确认了${checkedCount}/3天，请完整核对后再确认`
    });
  }

  record.issues = issues;

  if (issues.length === 0) {
    record.status = STATUS.NORMAL;
    pushHistory(record, STATUS.NORMAL, operator, '三日食材表核对完成，无异常');
  } else {
    record.status = STATUS.ABNORMAL;
    pushHistory(record, STATUS.ABNORMAL, operator, `检测到${issues.length}项问题：${issues.map(i => i.type).join('、')}`);
  }

  return record;
};

export const manualOverride = (id, operator, remark) => {
  const record = getRecordById(id);
  if (!record || record.isBadData) return null;

  record.status = STATUS.MANUAL_OVERRIDDEN;
  pushHistory(record, STATUS.MANUAL_OVERRIDDEN, operator, remark || '人工改判：经复核确认可正常处理');

  return record;
};

export const updateStatus = (id, newStatus, operator, remark) => {
  const record = getRecordById(id);
  if (!record || record.isBadData) return null;

  record.status = newStatus;
  pushHistory(record, newStatus, operator, remark || '状态变更');

  return record;
};

export const supplementRecord = (id, operator, supplementData) => {
  const record = getRecordById(id);
  if (!record || record.isBadData) return null;

  record.originalData = record.originalData || {
    allergies: [...record.allergies],
    taboos: [...record.taboos],
    specialNote: record.specialNote
  };

  if (supplementData.allergies) record.allergies = supplementData.allergies;
  if (supplementData.taboos) record.taboos = supplementData.taboos;
  if (supplementData.specialNote) record.specialNote = supplementData.specialNote;
  if (supplementData.supplementNote) record.supplementNote = supplementData.supplementNote;

  record.isSupplemented = true;
  record.supplementedAt = new Date().toISOString();
  record.supplementedBy = operator;

  pushHistory(record, record.status, operator, `手工补录信息：${supplementData.supplementNote || '补充了禁忌/过敏信息'}`, { supplemented: true });

  return record;
};

export const createRecord = (data) => {
  const today = new Date();
  const formatDate = (d) => d.toISOString().split('T')[0];

  const newRecord = {
    id: uuidv4(),
    childName: data.childName || '',
    age: data.age || 0,
    parentName: data.parentName || '',
    tableNo: data.tableNo || '',
    allergies: data.allergies || [],
    taboos: data.taboos || [],
    specialNote: data.specialNote || '',
    supplementNote: null,
    isSupplemented: false,
    status: STATUS.PENDING,
    statusHistory: [
      { time: new Date().toISOString(), status: STATUS.PENDING, operator: data.operator || '服务员', remark: '初始录入' }
    ],
    threeDayIngredients: data.threeDayIngredients || [
      { date: formatDate(today), items: [], checked: false },
      { date: formatDate(new Date(today.getTime() + 86400000)), items: [], checked: false },
      { date: formatDate(new Date(today.getTime() + 86400000 * 2)), items: [], checked: false }
    ],
    issues: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isBadData: false,
    badDataReason: null,
    exportAudit: null
  };

  records.unshift(newRecord);
  return newRecord;
};

export const generateExportSummary = (ids) => {
  const targetRecords = records.filter(r => ids.includes(r.id) && !r.isBadData);
  const pageCount = targetRecords.length;
  const exportedItems = targetRecords.length;

  const hasDiscrepancy = pageCount !== exportedItems;

  const summary = {
    generatedAt: new Date().toLocaleString('zh-CN'),
    totalRecords: exportedItems,
    pageCount,
    hasDiscrepancy,
    discrepancyReason: hasDiscrepancy
      ? `页面显示${pageCount}条，但实际导出${exportedItems}条有效记录（坏数据已隔离未导出）`
      : null,
    records: targetRecords.map(r => ({
      桌号: r.tableNo,
      儿童姓名: r.childName,
      年龄: `${r.age}岁`,
      家长: r.parentName,
      当前状态: r.status,
      过敏食物: r.allergies.length > 0 ? r.allergies.join('、') : '无',
      饮食禁忌: r.taboos.length > 0 ? r.taboos.join('、') : '无',
      特别说明: r.specialNote || '无',
      是否补录: r.isSupplemented ? '是' : '否',
      补录内容: r.supplementNote || '',
      三日食材状态: r.threeDayIngredients.map((d, i) =>
        `第${i + 1}天(${d.date}): ${d.items.length > 0 ? d.items.join('、') : '(材料缺页)'}${d.hasConflict ? ' ⚠冲突' : ''}`
      ).join('；'),
      问题说明: r.issues.length > 0 ? r.issues.map(i => `[${i.type}] ${i.detail}`).join('；') : '无',
      最后更新: r.updatedAt
    })),
    operatorNote: '此摘要可直接转发给同事，包含所有现场可理解的中文信息，无内部字段名。'
  };

  targetRecords.forEach(r => {
    r.exportAudit = {
      exportedAt: new Date().toISOString(),
      pageCount,
      exportedItems,
      hasDiscrepancy,
      discrepancyReason: summary.discrepancyReason
    };
  });

  return summary;
};
