import type { ValidationIssue, TrackRecord } from '@/types';

const PHONE_REGEX_STRICT = /^1[3-9]\d{9}$/;
const PHONE_LOOSE_CHARS = /[^0-9]/g;

function validatePhone(phone: string): ValidationIssue | null {
  if (PHONE_REGEX_STRICT.test(phone)) return null;
  const cleaned = phone.replace(PHONE_LOOSE_CHARS, '');
  let reason = '';
  if (phone.includes('转') || phone.includes('分机')) {
    reason = `检测到分机后缀"${phone.match(/转.*/)?.[0] || ''}"，系统标准格式不支持分机。`;
  } else if (/[-_\s]/.test(phone)) {
    reason = `包含分隔符（短横线、空格、下划线等），请去除后使用 11 位纯数字。`;
  } else if (cleaned.length !== 11) {
    reason = `去除非数字字符后共 ${cleaned.length} 位，与标准手机号 11 位不符。`;
  } else if (!/^1[3-9]/.test(cleaned)) {
    reason = `手机号应以 13-19 开头，当前首位为"${cleaned.charAt(1)}"。`;
  } else {
    reason = '存在系统无法识别的字符，请检查后重新输入。';
  }
  return {
    field: 'motherPhone',
    issue: 'phone_format',
    severity: 'warn',
    humanReadable: `妈妈手机号格式不规范：${reason}建议使用 11 位纯数字（例如 13812345678）。`,
    rawValue: phone,
  };
}

function validatePrivacy(
  record: Pick<TrackRecord, 'babyNameRaw' | 'babyName'>
): ValidationIssue | null {
  const { babyNameRaw, babyName } = record;
  if (babyName && babyName !== babyNameRaw && babyName.includes('*')) {
    return {
      field: 'babyNameRaw',
      issue: 'privacy_leak',
      severity: 'error',
      humanReadable: `检测到隐私字段导出风险：宝宝姓名原文"${babyNameRaw}"属于可识别个人信息，对外协作时将自动替换为脱敏后的"${babyName}"。`,
      rawValue: babyNameRaw,
    };
  }
  if (babyNameRaw && !babyName.includes('*')) {
    return {
      field: 'babyNameRaw',
      issue: 'privacy_leak',
      severity: 'error',
      humanReadable: `宝宝姓名未脱敏："${babyNameRaw}"直接存储，导出给同事前将自动处理为"${
        babyNameRaw.charAt(0)
      }**"。`,
      rawValue: babyNameRaw,
    };
  }
  return null;
}

export function validateRecord(
  record: Pick<TrackRecord, 'motherPhone' | 'babyNameRaw' | 'babyName'>
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const phoneIssue = validatePhone(record.motherPhone);
  if (phoneIssue) issues.push(phoneIssue);
  const privacyIssue = validatePrivacy(record);
  if (privacyIssue) issues.push(privacyIssue);
  return issues;
}

export function maskPhone(phone: string): string {
  const cleaned = phone.replace(PHONE_LOOSE_CHARS, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}****${cleaned.slice(7)}`;
  }
  return cleaned.replace(/\d(?=\d{4})/g, '*');
}

export function maskName(name: string): string {
  if (!name) return '';
  if (name.length <= 1) return '*';
  return `${name.charAt(0)}${'*'.repeat(Math.max(1, name.length - 1))}`;
}
