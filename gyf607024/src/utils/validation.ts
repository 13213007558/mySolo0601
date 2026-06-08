import type { RescheduleRecord, RecordFormData, DataQualityIssue } from "@/types";

export function generateId(): string {
  return "REC_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

export function validatePhone(phone: string): boolean {
  return /^1\d{10}$/.test(phone.trim());
}

export function validateRecord(data: RecordFormData, allRecords: RescheduleRecord[] = []): DataQualityIssue[] {
  const issues: DataQualityIssue[] = [];
  const recordId = "pending";
  if (!data.babyName || data.babyName.trim().length < 2) {
    issues.push({ id: "issue_name_" + Date.now(), recordId, type: "empty_name", field: "babyName", reason: "宝宝姓名不能为空或过短，至少需要 2 个字符", severity: "error" });
  }
  if (!validatePhone(data.phone)) {
    issues.push({ id: "issue_phone_" + Date.now(), recordId, type: "invalid_phone", field: "phone", reason: "手机号格式不正确，应为 11 位有效号码且以 1 开头", severity: "error" });
  }
  const hoursNum = typeof data.hours === "number" ? data.hours : Number(data.hours);
  if (data.hours === "" || isNaN(hoursNum) || hoursNum <= 0) {
    issues.push({ id: "issue_bound_zero_" + Date.now(), recordId, type: "boundary_value", field: "hours", reason: "课时数量为 0 或空值，属于异常边界值", severity: "error" });
  } else if (hoursNum > 30) {
    issues.push({ id: "issue_bound_high_" + Date.now(), recordId, type: "boundary_value", field: "hours", reason: "课时数量 " + hoursNum + " 超过 30，超出单次改期正常范围，请确认", severity: "warning" });
  }
  if (data.originalCourse && data.targetCourse && data.originalCourse === data.targetCourse) {
    issues.push({ id: "issue_same_" + Date.now(), recordId, type: "same_course", field: "targetCourse", reason: "原课程与改期课程相同，疑似误操作", severity: "warning" });
  }
  if (data.phone && data.unit) {
    const samePhoneRecords = allRecords.filter(r => r.phone === data.phone.trim() && r.unit !== data.unit);
    if (samePhoneRecords.length > 0) {
      const otherUnits = [...new Set(samePhoneRecords.map(r => r.unit))];
      issues.push({ id: "issue_unit_" + Date.now(), recordId, type: "unit_mismatch", field: "unit", reason: "该学员历史记录单位为「" + otherUnits.join("/") + "」，本次为「" + data.unit + "」，存在单位混用风险", severity: "warning" });
    }
  }
  return issues;
}
  const hoursNum = typeof data.hours === 'number' ? data.hours : Number(data.hours);
  if (data.hours === '' || isNaN(hoursNum) || hoursNum <= 0) {
    issues.push({
      id: 'issue_boundary_zero_' + Date.now(),
      recordId,
      type: 'boundary_value',
      field: 'hours',
      reason: '课时数量为 0 或空值，属于异常边界值',
      severity: 'error',
    });
  } else if (hoursNum > 30) {
    issues.push({
      id: 'issue_boundary_high_' + Date.now(),
      recordId,
      type: 'boundary_value',
      field: 'hours',
      reason: `课时数量 ${hoursNum} 超过 30，超出单次改期正常范围，请确认`,
      severity: 'warning',
    });
  }

  if (data.originalCourse && data.targetCourse && data.originalCourse === data.targetCourse) {
    issues.push({
      id: 'issue_same_course_' + Date.now(),
      recordId,
      type: 'same_course',
      field: 'targetCourse',
      reason: '原课程与改期课程相同，疑似误操作',
      severity: 'warning',
    });
  }

  if (data.phone && data.unit) {
    const samePhoneRecords = allRecords.filter(
      (r) => r.phone === data.phone.trim() && r.unit !== data.unit
    );
    if (samePhoneRecords.length > 0) {
      const otherUnits = [...new Set(samePhoneRecords.map((r) => r.unit))];
      issues.push({
        id: 'issue_unit_' + Date.now(),
        recordId,
        type: 'unit_mismatch',
        field: 'unit',
        reason: `该学员历史记录单位为「${otherUnits.join('/')}」，本次为「${data.unit}」，存在单位混用风险`,
        severity: 'warning',
      });
    }
  }

  return issues;
}
