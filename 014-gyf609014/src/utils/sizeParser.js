const chineseNumMap = {
  '零': 0, '〇': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4,
  '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
  '百': 100, '千': 1000, '万': 10000
};

function chineseToNumber(str) {
  if (!str) return null;
  if (/^\d+(\.\d+)?$/.test(str)) return parseFloat(str);

  let result = 0;
  let temp = 0;
  let hasUnit = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const num = chineseNumMap[char];

    if (num === undefined) continue;

    if (num >= 10) {
      if (temp === 0) temp = 1;
      result += temp * num;
      temp = 0;
      hasUnit = true;
    } else {
      if (i > 0 && chineseNumMap[str[i - 1]] >= 10) {
        temp = num;
      } else {
        temp = temp * 10 + num;
      }
    }
  }

  if (!hasUnit) {
    result = temp;
  } else {
    result += temp;
  }

  return result > 0 ? result : null;
}

function extractNumbers(str) {
  const matches = str.match(/\d+(\.\d+)?/g);
  if (matches && matches.length >= 2) {
    return [parseFloat(matches[0]), parseFloat(matches[1])];
  }
  return null;
}

function parseChineseDescription(str) {
  const widthPatterns = [
    /宽\s*([零〇一二两三四五六七八九十百千万\d.]+)\s*(毫米|mm|厘米|cm|米|m)?/i,
    /宽度\s*([零〇一二两三四五六七八九十百千万\d.]+)\s*(毫米|mm|厘米|cm|米|m)?/i,
    /([零〇一二两三四五六七八九十百千万\d.]+)\s*(毫米|mm|厘米|cm|米|m)?\s*宽/i,
  ];

  const heightPatterns = [
    /高\s*([零〇一二两三四五六七八九十百千万\d.]+)\s*(毫米|mm|厘米|cm|米|m)?/i,
    /高度\s*([零〇一二两三四五六七八九十百千万\d.]+)\s*(毫米|mm|厘米|cm|米|m)?/i,
    /([零〇一二两三四五六七八九十百千万\d.]+)\s*(毫米|mm|厘米|cm|米|m)?\s*高/i,
  ];

  let width = null;
  let height = null;

  for (const pattern of widthPatterns) {
    const match = str.match(pattern);
    if (match) {
      const num = chineseToNumber(match[1]);
      if (num !== null) {
        width = convertToMm(num, match[2]);
        break;
      }
    }
  }

  for (const pattern of heightPatterns) {
    const match = str.match(pattern);
    if (match) {
      const num = chineseToNumber(match[1]);
      if (num !== null) {
        height = convertToMm(num, match[2]);
        break;
      }
    }
  }

  if (width !== null && height !== null) {
    return { width, height, unit: 'mm' };
  }

  return null;
}

function convertToMm(value, unit) {
  if (!unit) return value;
  const lowerUnit = unit.toLowerCase();
  if (lowerUnit === 'mm' || lowerUnit === '毫米') return value;
  if (lowerUnit === 'cm' || lowerUnit === '厘米') return value * 10;
  if (lowerUnit === 'm' || lowerUnit === '米') return value * 1000;
  return value;
}

export function parseSize(sizeStr) {
  if (!sizeStr || typeof sizeStr !== 'string') {
    return { valid: false, width: null, height: null, raw: sizeStr, error: '尺寸为空' };
  }

  const trimmed = sizeStr.trim();
  if (!trimmed) {
    return { valid: false, width: null, height: null, raw: sizeStr, error: '尺寸为空' };
  }

  const numbers = extractNumbers(trimmed);
  if (numbers) {
    const sorted = [...numbers].sort((a, b) => b - a);
    return {
      valid: true,
      width: sorted[0],
      height: sorted[1],
      raw: trimmed,
      unit: 'mm',
      parseMethod: 'numeric'
    };
  }

  const chineseResult = parseChineseDescription(trimmed);
  if (chineseResult) {
    return {
      valid: true,
      ...chineseResult,
      raw: trimmed,
      parseMethod: 'chinese'
    };
  }

  return {
    valid: false,
    width: null,
    height: null,
    raw: trimmed,
    error: '无法解析尺寸格式'
  };
}

export function formatSize(size) {
  if (!size || !size.valid) return size?.raw || '-';
  return `${size.width}×${size.height}mm`;
}

export function sizeToString(width, height) {
  if (width == null || height == null) return '';
  return `${width}×${height}`;
}
