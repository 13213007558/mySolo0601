import { useMemo } from 'react';
import { useAlarmStore } from '../stores/useAlarmStore';
import type { ValidationIssue, ValidationType } from '../types';
import { getValidationTypeLabel } from '../utils/validators';

export function useValidation() {
  const { validationIssues, fixIssue } = useAlarmStore();

  const groupedIssues = useMemo(() => {
    const groups: Record<ValidationType, ValidationIssue[]> = {
      readme_inconsistency: [],
      decimal_precision: [],
      phone_leak: [],
    };

    validationIssues.forEach((issue) => {
      groups[issue.type].push(issue);
    });

    return groups;
  }, [validationIssues]);

  const issueCounts = useMemo(() => {
    return {
      total: validationIssues.length,
      errors: validationIssues.filter((i) => i.severity === 'error').length,
      warnings: validationIssues.filter((i) => i.severity === 'warning').length,
      readme_inconsistency: groupedIssues.readme_inconsistency.length,
      decimal_precision: groupedIssues.decimal_precision.length,
      phone_leak: groupedIssues.phone_leak.length,
    };
  }, [validationIssues, groupedIssues]);

  const hasIssues = validationIssues.length > 0;

  const getIssueTypeLabel = (type: ValidationType): string => {
    return getValidationTypeLabel(type);
  };

  return {
    issues: validationIssues,
    groupedIssues,
    issueCounts,
    hasIssues,
    fixIssue,
    getIssueTypeLabel,
  };
}
