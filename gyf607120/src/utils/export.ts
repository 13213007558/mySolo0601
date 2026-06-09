import * as XLSX from 'xlsx';
import type { PaymentFlow, FilterConditions } from '@/types';
import { formatAmount, formatDateTime, formatDate, getStatusText } from './formatters';

interface ExportOptions {
  flows: PaymentFlow[];
  filters: FilterConditions;
  chartFiltersApplied: boolean;
  unappliedFilterReasons: string[];
  supplementRecords?: Array<{
    paymentFlowId: string;
    operatorName: string;
    beforeRemark: string;
    afterRemark: string;
    operateTime: string;
  }>;
}

export const exportToExcel = (options: ExportOptions): void => {
  const { flows, filters, chartFiltersApplied, unappliedFilterReasons, supplementRecords = [] } = options;

  const exportData = flows.map(flow => {
    const supplement = supplementRecords.find(s => s.paymentFlowId === flow.id);
    return {
      '订单ID': flow.id,
      '车牌号': flow.plateNumber,
      '枪号': flow.gunNo,
      '司机': flow.driverName,
      '交易金额': flow.amount,
      '交易时间': flow.transactionTime,
      '支付状态': flow.paymentStatus === 'completed' ? '支付完成' : 
                 flow.paymentStatus === 'pending' ? '待支付' :
                 flow.paymentStatus === 'refunded' ? '已退款' : '支付失败',
      '有退款标记': flow.hasRefundMark ? '是' : '否',
      '账单状态': getStatusText(flow.status),
      '异常类型': flow.anomalyType || '-',
      '充电时长(分钟)': flow.chargeDuration,
      '起始电量(%)': flow.startSoc,
      '结束电量(%)': flow.endSoc,
      '支付流水备注': flow.remark,
      '试运行报告日期': formatDate(flow.trialReportDate),
      '支付流水备注日期': formatDate(flow.paymentRemarkDate),
      '补录前备注': supplement?.beforeRemark || '-',
      '补录后备注': supplement?.afterRemark || '-',
      '补录操作人': supplement?.operatorName || '-',
      '补录时间': supplement?.operateTime ? formatDateTime(supplement.operateTime) : '-',
      '未采用筛选原因': !chartFiltersApplied ? unappliedFilterReasons.join('；') : '-'
    };
  });

  const filterInfo = [
    { '项目': '导出时间', '内容': formatDateTime(new Date().toISOString()) },
    { '项目': '导出记录数', '内容': `${flows.length} 条` },
    { '项目': '图表筛选是否应用', '内容': chartFiltersApplied ? '是' : '否' },
    { '项目': '筛选条件-车牌号', '内容': filters.plateNumber.length > 0 ? filters.plateNumber.join('、') : '全部' },
    { '项目': '筛选条件-支付流水备注', '内容': filters.paymentRemark || '全部' },
    { '项目': '筛选条件-退款标记', '内容': filters.hasRefundMark === null ? '全部' : filters.hasRefundMark ? '有退款' : '无退款' },
    { '项目': '筛选条件-枪号', '内容': filters.gunNo.length > 0 ? filters.gunNo.join('、') : '全部' },
    { '项目': '未采用原因说明', '内容': unappliedFilterReasons.length > 0 ? unappliedFilterReasons.join('；') : '无' }
  ];

  const wb = XLSX.utils.book_new();
  
  const ws1 = XLSX.utils.json_to_sheet(exportData);
  XLSX.utils.book_append_sheet(wb, ws1, '快充账单明细');
  
  const ws2 = XLSX.utils.json_to_sheet(filterInfo);
  XLSX.utils.book_append_sheet(wb, ws2, '筛选条件说明');

  ws1['!cols'] = [
    { wch: 15 }, { wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 12 },
    { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 },
    { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 30 }, { wch: 15 },
    { wch: 18 }, { wch: 25 }, { wch: 25 }, { wch: 12 }, { wch: 20 }, { wch: 30 }
  ];
  
  ws2['!cols'] = [{ wch: 25 }, { wch: 60 }];

  const fileName = `快充账单对账_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

export const generateUnappliedReasons = (
  filters: FilterConditions,
  actualFilterCount: number
): string[] => {
  const reasons: string[] = [];
  
  if (filters.plateNumber.length > 0) {
    reasons.push('车牌号筛选条件未应用于图表数据');
  }
  if (filters.paymentRemark) {
    reasons.push('支付流水备注筛选条件未应用于图表数据');
  }
  if (filters.hasRefundMark !== null) {
    reasons.push('退款标记筛选条件未应用于图表数据');
  }
  if (filters.gunNo.length > 0) {
    reasons.push('枪号筛选条件未应用于图表数据');
  }
  if (filters.dateRange) {
    reasons.push('日期范围筛选条件未应用于图表数据');
  }
  
  if (reasons.length === 0 && actualFilterCount > 0) {
    reasons.push('筛选条件已变更但图表尚未刷新，请点击"应用筛选"按钮更新图表');
  }
  
  return reasons;
};
