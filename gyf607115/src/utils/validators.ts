import type { Alarm, ValidationIssue, ValidationType } from '../types';
import { detectDecimalPrecisionIssue, maskPhone } from './formatters';

export const README_INCONSISTENCY_ALARM_ID = 'alarm-readme-001';

export const README_EXPECTED_DATA = {
  alarmCode: 'BMS-READM-001',
  siteName: '测试站点A',
  deviceName: 'BMS-001',
  amount: 12345.67,
  amountDisplay: '12345.67',
  phone: '13800138000',
  description: 'README命令测试告警-页面显示版本',
};

export const README_COMMAND_DATA = {
  alarmCode: 'BMS-READM-001',
  siteName: '测试站点A',
  deviceName: 'BMS-001',
  amount: 12345.67,
  amountDisplay: '12345.67',
  phone: '13800138000',
  description: 'README命令测试告警-命令行版本',
};

export function validateAlarms(alarms: Alarm[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  issues.push(...validateReadmeInconsistency(alarms));
  issues.push(...validateDecimalPrecision(alarms));
  issues.push(...validatePhoneMasking(alarms));

  return issues;
}

export function validateReadmeInconsistency(alarms: Alarm[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const targetAlarm = alarms.find((a) => a.id === README_INCONSISTENCY_ALARM_ID);

  if (targetAlarm) {
    const pageDescription = targetAlarm.description;
    const commandDescription = README_COMMAND_DATA.description;

    if (pageDescription !== commandDescription) {
      issues.push({
        type: 'readme_inconsistency',
        severity: 'error',
        message: 'README命令与页面显示不一致',
        details: `告警 [${targetAlarm.alarmCode}] 的描述在页面和README命令输出中不一致。页面显示"${pageDescription}"，命令输出"${commandDescription}"`,
        affectedIds: [targetAlarm.id],
        expectedValue: commandDescription,
        actualValue: pageDescription,
      });
    }

    const pageAmount = targetAlarm.amountDisplay;
    const commandAmount = README_COMMAND_DATA.amount.toFixed(2);
    if (pageAmount !== commandAmount) {
      issues.push({
        type: 'readme_inconsistency',
        severity: 'warning',
        message: 'README命令金额与页面显示不一致',
        details: `告警 [${targetAlarm.alarmCode}] 的金额在页面显示"${pageAmount}"，命令输出"${commandAmount}"`,
        affectedIds: [targetAlarm.id],
        expectedValue: commandAmount,
        actualValue: pageAmount,
      });
    }
  }

  return issues;
}

export function validateDecimalPrecision(alarms: Alarm[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const result = detectDecimalPrecisionIssue(alarms);

  if (result.hasIssue) {
    const affectedIds = alarms
      .filter((a) => Math.abs(a.amount - parseFloat(a.amountDisplay)) > 0.001)
      .map((a) => a.id);

    issues.push({
      type: 'decimal_precision',
      severity: 'warning',
      message: '小数精度导致金额计算偏差',
      details: `浮点数累加导致总金额偏差。精确计算总额: ¥${result.expectedTotal}，页面显示总额: ¥${result.actualTotal}，差额: ¥${result.difference.toFixed(4)}`,
      affectedIds,
      expectedValue: result.expectedTotal,
      actualValue: result.actualTotal,
    });
  }

  return issues;
}

export function validatePhoneMasking(alarms: Alarm[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const leakedPhones: string[] = [];
  const leakedIds: string[] = [];

  alarms.forEach((alarm) => {
    const expectedMasked = maskPhone(alarm.phone);
    if (alarm.phoneMasked !== expectedMasked) {
      leakedPhones.push(alarm.phone);
      leakedIds.push(alarm.id);
    }
  });

  if (leakedIds.length > 0) {
    issues.push({
      type: 'phone_leak',
      severity: 'error',
      message: `检测到 ${leakedIds.length} 条手机号未脱敏`,
      details: `以下告警的手机号未正确脱敏: ${leakedIds.join(', ')}。原始号码可能已泄露: ${leakedPhones.map((p) => p.substring(0, 3) + '...').join(', ')}`,
      affectedIds: leakedIds,
    });
  }

  return issues;
}

export function fixReadmeInconsistency(alarm: Alarm): Alarm {
  return {
    ...alarm,
    description: README_COMMAND_DATA.description,
    amountDisplay: README_COMMAND_DATA.amount.toFixed(2),
  };
}

export function fixPhoneMasking(alarm: Alarm): Alarm {
  return {
    ...alarm,
    phoneMasked: maskPhone(alarm.phone),
  };
}

export function getValidationTypeLabel(type: ValidationType): string {
  const labels: Record<ValidationType, string> = {
    readme_inconsistency: 'README不一致',
    decimal_precision: '小数精度问题',
    phone_leak: '手机号泄露',
  };
  return labels[type];
}
