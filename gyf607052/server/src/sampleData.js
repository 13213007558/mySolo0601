import { v4 as uuidv4 } from 'uuid';

const today = new Date();
const formatDate = (d) => d.toISOString().split('T')[0];
const date1 = formatDate(today);
const date2 = formatDate(new Date(today.getTime() + 86400000));
const date3 = formatDate(new Date(today.getTime() + 86400000 * 2));

export const STATUS = {
  PENDING: '待确认',
  NORMAL: '正常',
  ABNORMAL: '异常',
  MANUAL_OVERRIDDEN: '人工改判',
  KITCHEN_PREPARING: '厨房备料中',
  COMPLETED: '已完成'
};

export const buildSampleRecords = () => {
  const records = [];

  records.push({
    id: uuidv4(),
    childName: '乐乐',
    age: 3,
    parentName: '乐乐妈妈',
    tableNo: 'A12',
    allergies: ['花生', '鸡蛋'],
    taboos: ['海鲜', '坚果类'],
    specialNote: '乐乐家长补了一句话：对芒果也过敏，之前忘记说了',
    supplementNote: null,
    isSupplemented: false,
    status: STATUS.PENDING,
    statusHistory: [
      { time: new Date().toISOString(), status: STATUS.PENDING, operator: '系统', remark: '初始录入' }
    ],
    threeDayIngredients: [
      { date: date1, items: ['小米粥', '蒸南瓜', '胡萝卜泥'], checked: true },
      { date: date2, items: ['软面条', '菠菜泥', '苹果泥'], checked: false },
      { date: date3, items: ['燕麦糊', '西兰花泥', '香蕉泥'], checked: false }
    ],
    issues: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isBadData: false,
    badDataReason: null,
    exportAudit: null
  });

  records.push({
    id: uuidv4(),
    childName: '豆豆',
    age: 2,
    parentName: '豆豆爸爸',
    tableNo: 'B05',
    allergies: ['牛奶'],
    taboos: ['乳制品'],
    specialNote: '只能喝深度水解奶',
    supplementNote: null,
    isSupplemented: false,
    status: STATUS.NORMAL,
    statusHistory: [
      { time: new Date(Date.now() - 3600000).toISOString(), status: STATUS.PENDING, operator: '系统', remark: '初始录入' },
      { time: new Date(Date.now() - 3000000).toISOString(), status: STATUS.NORMAL, operator: '李店长', remark: '三日食材表已核对，无禁忌冲突' }
    ],
    threeDayIngredients: [
      { date: date1, items: ['小米粥', '蒸南瓜', '胡萝卜泥'], checked: true },
      { date: date2, items: ['软面条', '蔬菜粥', '梨泥'], checked: true },
      { date: date3, items: ['燕麦糊', '西兰花泥', '香蕉泥'], checked: true }
    ],
    issues: [],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3000000).toISOString(),
    isBadData: false,
    badDataReason: null,
    exportAudit: null
  });

  records.push({
    id: uuidv4(),
    childName: '苗苗',
    age: 1,
    parentName: '苗苗奶奶',
    tableNo: 'C08',
    allergies: ['小麦', '大豆'],
    taboos: ['面筋', '豆制品'],
    specialNote: '吃面条会起红疹',
    supplementNote: null,
    isSupplemented: false,
    status: STATUS.ABNORMAL,
    statusHistory: [
      { time: new Date(Date.now() - 7200000).toISOString(), status: STATUS.PENDING, operator: '系统', remark: '初始录入' },
      { time: new Date(Date.now() - 6000000).toISOString(), status: STATUS.ABNORMAL, operator: '王店长', remark: '检测到三日食材表第2页材料缺页，第3日含小麦成分' }
    ],
    threeDayIngredients: [
      { date: date1, items: ['小米粥', '蒸南瓜'], checked: true },
      { date: date2, items: [], checked: false },
      { date: date3, items: ['小麦面条', '大豆蛋白糊'], checked: true, hasConflict: true, conflictNote: '含小麦、大豆成分，与禁忌冲突' }
    ],
    issues: [
      { type: '材料缺页', detail: '第二日食材清单缺失，请厨房重新填写' },
      { type: '禁忌冲突', detail: '第三日"小麦面条"含小麦成分，与小麦过敏冲突；"大豆蛋白糊"含大豆成分，与大豆过敏冲突' }
    ],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 6000000).toISOString(),
    isBadData: false,
    badDataReason: null,
    exportAudit: null
  });

  records.push({
    id: uuidv4(),
    childName: '彤彤',
    age: 4,
    parentName: '彤彤妈妈',
    tableNo: 'A03',
    allergies: ['虾'],
    taboos: ['海鲜'],
    specialNote: '以前吃虾嘴肿',
    supplementNote: '补充：维C泡腾片也不能碰（补录',
    isSupplemented: true,
    supplementedAt: new Date(Date.now() - 1800000).toISOString(),
    supplementedBy: '张服务员',
    originalData: {
      allergies: ['虾'],
      taboos: ['海鲜'],
      specialNote: '以前吃虾嘴肿'
    },
    status: STATUS.MANUAL_OVERRIDDEN,
    statusHistory: [
      { time: new Date(Date.now() - 5400000).toISOString(), status: STATUS.PENDING, operator: '系统', remark: '初始录入' },
      { time: new Date(Date.now() - 4800000).toISOString(), status: STATUS.ABNORMAL, operator: '李店长', remark: '初查有疑问，需人工复核' },
      { time: new Date(Date.now() - 1800000).toISOString(), status: STATUS.MANUAL_OVERRIDDEN, operator: '王店长', remark: '人工改判：家长确认维C泡腾片过敏，重新调整三日食材，去除相关食物', supplemented: true }
    ],
    threeDayIngredients: [
      { date: date1, items: ['小米粥', '蒸南瓜', '胡萝卜泥'], checked: true },
      { date: date2, items: ['软米饭', '菠菜泥', '苹果泥'], checked: true },
      { date: date3, items: ['燕麦糊', '西兰花泥', '香蕉泥'], checked: true }
    ],
    issues: [
      { type: '人工改判', detail: '初判异常，经人工复核后改判为正常处理' }
    ],
    createdAt: new Date(Date.now() - 5400000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    isBadData: false,
    badDataReason: null,
    exportAudit: null
  });

  records.push({
    id: uuidv4(),
    childName: '坏数据测试',
    age: 0,
    parentName: '测试员',
    tableNo: 'T00',
    allergies: [],
    taboos: [],
    specialNote: '这是一条坏数据，用于测试隔离测试',
    supplementNote: null,
    isSupplemented: false,
    status: STATUS.PENDING,
    statusHistory: [
      { time: new Date(Date.now() - 9000000).toISOString(), status: STATUS.PENDING, operator: '系统', remark: '初始录入' }
    ],
    threeDayIngredients: [],
    issues: [],
    createdAt: new Date(Date.now() - 9000000).toISOString(),
    updatedAt: new Date(Date.now() - 9000000).toISOString(),
    isBadData: true,
    badDataReason: '年龄为0且无任何禁忌信息，标记为坏数据已隔离',
    exportAudit: null
  });

  records.push({
    id: uuidv4(),
    childName: '果果',
    age: 2,
    parentName: '果果妈妈',
    tableNo: 'B11',
    allergies: ['花生'],
    taboos: ['坚果'],
    specialNote: '',
    supplementNote: null,
    isSupplemented: false,
    status: STATUS.KITCHEN_PREPARING,
    statusHistory: [
      { time: new Date(Date.now() - 10800000).toISOString(), status: STATUS.PENDING, operator: '系统', remark: '初始录入' },
      { time: new Date(Date.now() - 9600000).toISOString(), status: STATUS.NORMAL, operator: '李店长', remark: '确认正常' },
      { time: new Date(Date.now() - 600000).toISOString(), status: STATUS.KITCHEN_PREPARING, operator: '服务员小刘', remark: '手机端点击开始备料' }
    ],
    threeDayIngredients: [
      { date: date1, items: ['小米粥', '蒸南瓜', '胡萝卜泥'], checked: true },
      { date: date2, items: ['软面条', '菠菜泥', '苹果泥'], checked: true },
      { date: date3, items: ['燕麦糊', '西兰花泥', '香蕉泥'], checked: true }
    ],
    issues: [],
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    updatedAt: new Date(Date.now() - 600000).toISOString(),
    isBadData: false,
    badDataReason: null,
    exportAudit: null
  });

  return records;
};
