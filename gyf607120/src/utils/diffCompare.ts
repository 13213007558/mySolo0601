import type { DiffSegment } from '@/types';

export const computeDiff = (before: string, after: string): DiffSegment[] => {
  const segments: DiffSegment[] = [];
  
  if (!before && !after) {
    return [{ type: 'unchanged', value: '' }];
  }
  
  if (!before) {
    return [{ type: 'added', value: after }];
  }
  
  if (!after) {
    return [{ type: 'removed', value: before }];
  }
  
  const beforeChars = before.split('');
  const afterChars = after.split('');
  
  let i = 0;
  let j = 0;
  
  while (i < beforeChars.length && j < afterChars.length) {
    if (beforeChars[i] === afterChars[j]) {
      let commonStart = i;
      while (i < beforeChars.length && j < afterChars.length && beforeChars[i] === afterChars[j]) {
        i++;
        j++;
      }
      segments.push({
        type: 'unchanged',
        value: beforeChars.slice(commonStart, i).join('')
      });
    } else {
      let removedStart = i;
      let addedStart = j;
      
      while (i < beforeChars.length && j < afterChars.length && beforeChars[i] !== afterChars[j]) {
        const lookAhead = afterChars.slice(j).indexOf(beforeChars[i]);
        if (lookAhead !== -1 && lookAhead < 5) {
          break;
        }
        i++;
        j++;
      }
      
      if (removedStart < i) {
        segments.push({
          type: 'removed',
          value: beforeChars.slice(removedStart, i).join('')
        });
      }
      if (addedStart < j) {
        segments.push({
          type: 'added',
          value: afterChars.slice(addedStart, j).join('')
        });
      }
    }
  }
  
  if (i < beforeChars.length) {
    segments.push({
      type: 'removed',
      value: beforeChars.slice(i).join('')
    });
  }
  
  if (j < afterChars.length) {
    segments.push({
      type: 'added',
      value: afterChars.slice(j).join('')
    });
  }
  
  return segments;
};

export const renderDiffToHTML = (segments: DiffSegment[]): string => {
  return segments.map(seg => {
    switch (seg.type) {
      case 'added':
        return `<span class="bg-green-500/30 text-green-300 px-0.5 rounded">${seg.value}</span>`;
      case 'removed':
        return `<span class="bg-red-500/30 text-red-300 line-through px-0.5 rounded">${seg.value}</span>`;
      default:
        return seg.value;
    }
  }).join('');
};

export const hasDifferences = (before: string, after: string): boolean => {
  return before !== after;
};
