import type { PaymentFlow, ImportCheckResult } from '@/types';

export const generateCompositeKey = (flow: PaymentFlow): string => {
  return `${flow.plateNumber}-${flow.gunNo}-${flow.transactionTime}`;
};

export const checkForDuplicates = (
  incomingFlows: PaymentFlow[],
  existingFlows: PaymentFlow[]
): ImportCheckResult => {
  const existingKeys = new Set(existingFlows.map(generateCompositeKey));
  const duplicates: PaymentFlow[] = [];
  const validNew: PaymentFlow[] = [];
  const needReturn: PaymentFlow[] = [];
  const returnReasons: string[] = [];

  incomingFlows.forEach((flow) => {
    const key = generateCompositeKey(flow);
    
    if (existingKeys.has(key)) {
      duplicates.push(flow);
      return;
    }

    const reasons: string[] = [];
    
    if (!flow.trialReportDate) {
      reasons.push('试运行报告缺失');
    }
    
    if (!flow.paymentRemarkDate) {
      reasons.push('支付流水备注日期缺失');
    }
    
    if (flow.trialReportDate && flow.paymentRemarkDate) {
      const trialDate = new Date(flow.trialReportDate).toDateString();
      const remarkDate = new Date(flow.paymentRemarkDate).toDateString();
      if (trialDate !== remarkDate) {
        reasons.push('试运行报告与支付流水备注日期不一致');
      }
    }

    if (reasons.length > 0) {
      needReturn.push(flow);
      returnReasons.push(`${flow.plateNumber} (${flow.gunNo}): ${reasons.join('、')}`);
    } else {
      validNew.push(flow);
    }
  });

  return { duplicates, validNew, needReturn, returnReasons };
};

export const generateMockImportData = (baseFlows: PaymentFlow[]): PaymentFlow[] => {
  const newFlows: PaymentFlow[] = [
    {
      id: 'pay-import-001',
      plateNumber: '京A12345',
      gunNo: 'G-01',
      amount: 145.20,
      transactionTime: '2026-06-08 18:30:00',
      remark: '快充订单-20260608-晚间充电',
      paymentStatus: 'completed',
      hasRefundMark: false,
      trialReportDate: '2026-06-09',
      paymentRemarkDate: '2026-06-08',
      status: 'pending',
      anomalyType: null,
      driverName: '张伟',
      chargeDuration: 52,
      startSoc: 18,
      endSoc: 96
    },
    {
      id: 'pay-import-002',
      plateNumber: '京B67890',
      gunNo: 'G-02',
      amount: 98.70,
      transactionTime: '2026-06-08 19:45:00',
      remark: '快充订单-20260608-补能',
      paymentStatus: 'completed',
      hasRefundMark: false,
      trialReportDate: null,
      paymentRemarkDate: '2026-06-09',
      status: 'anomaly',
      anomalyType: '试运行报告缺失',
      driverName: '李明',
      chargeDuration: 35,
      startSoc: 30,
      endSoc: 89
    },
    ...baseFlows.slice(0, 2)
  ];
  
  return newFlows;
};
