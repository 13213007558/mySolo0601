export interface DiffResult {
  field: string;
  oldValue: string;
  newValue: string;
  type: 'added' | 'modified' | 'removed';
}

export const computeDiff = (
  before: Record<string, unknown>,
  after: Record<string, unknown>
): DiffResult[] => {
  const results: DiffResult[] = [];
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  allKeys.forEach((key) => {
    const oldVal = before[key];
    const newVal = after[key];
    const oldStr = oldVal !== undefined ? String(oldVal) : '';
    const newStr = newVal !== undefined ? String(newVal) : '';

    if (oldVal === undefined && newVal !== undefined) {
      results.push({ field: key, oldValue: '', newValue: newStr, type: 'added' });
    } else if (oldVal !== undefined && newVal === undefined) {
      results.push({ field: key, oldValue: oldStr, newValue: '', type: 'removed' });
    } else if (oldStr !== newStr) {
      results.push({ field: key, oldValue: oldStr, newValue: newStr, type: 'modified' });
    }
  });

  return results;
};

export const formatDiffAsText = (diffs: DiffResult[]): string => {
  return diffs
    .map((d) => {
      const symbol = d.type === 'added' ? '+' : d.type === 'removed' ? '-' : '~';
      return `${symbol} ${d.field}: "${d.oldValue}" → "${d.newValue}"`;
    })
    .join('\n');
};
