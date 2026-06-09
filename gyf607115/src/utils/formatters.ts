export function maskPhone(phone: string): string {
  if (!phone || phone.length < 11) return phone;
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

export function formatAmountDisplay(amount: number): string {
  return amount.toFixed(2);
}

export function calculateTotalAmount(amounts: number[]): number {
  return amounts.reduce((sum, val) => sum + val, 0);
}

export function calculateTotalAmountPrecise(amounts: number[]): number {
  return amounts.reduce((sum, val) => {
    return Math.round((sum + val) * 100) / 100;
  }, 0);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function readmeCommandGetAlarmAmount(alarmId: string, mockData: { id: string; amount: number }[]): string {
  const alarm = mockData.find((a) => a.id === alarmId);
  if (!alarm) return 'N/A';
  return formatAmountDisplay(calculateTotalAmountPrecise([alarm.amount]));
}

export function detectDecimalPrecisionIssue(alarms: { amount: number; amountDisplay: string }[]): {
  hasIssue: boolean;
  expectedTotal: string;
  actualTotal: string;
  difference: number;
} {
  const amounts = alarms.map((a) => a.amount);
  const preciseTotal = calculateTotalAmountPrecise(amounts);
  const displayTotal = calculateTotalAmount(amounts);
  const difference = Math.abs(preciseTotal - displayTotal);

  return {
    hasIssue: difference > 0.001,
    expectedTotal: preciseTotal.toFixed(2),
    actualTotal: displayTotal.toFixed(2),
    difference,
  };
}

export function detectPhoneLeak(alarms: { phone: string; phoneMasked: string }[]): string[] {
  const leakedIds: string[] = [];
  alarms.forEach((alarm) => {
    if (alarm.phone !== alarm.phoneMasked && alarm.phoneMasked.includes('****')) {
    } else if (!alarm.phoneMasked.includes('****')) {
      leakedIds.push(alarm.phone);
    }
  });
  return leakedIds;
}

export function compareData<T extends object>(
  oldData: Partial<T>,
  newData: Partial<T>
): Record<string, { old: unknown; new: unknown }> {
  const diff: Record<string, { old: unknown; new: unknown }> = {};
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

  allKeys.forEach((key) => {
    const oldVal = oldData[key as keyof T];
    const newVal = newData[key as keyof T];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diff[key] = { old: oldVal, new: newVal };
    }
  });

  return diff;
}
