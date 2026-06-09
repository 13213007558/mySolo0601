import * as XLSX from 'xlsx';
import { ANNOTATION_STATUS_LABELS, PRIORITY_LABELS, SOURCE_LABELS, ERROR_TYPE_LABELS } from '../db';

export function exportToExcel(annotations, fileName = '图纸会审批注清单.xlsx') {
  const exportData = annotations.map(a => ({
    '批注编号': a.annotationNo,
    '楼栋': a.building,
    '专业': a.major,
    '图纸页码': a.pageNo,
    '批注内容': a.description,
    '来源': SOURCE_LABELS[a.source] || a.source,
    '责任人': a.assignee,
    '处理状态': ANNOTATION_STATUS_LABELS[a.status] || a.status,
    '优先级': PRIORITY_LABELS[a.priority] || a.priority,
    '是否有问题': a.hasError ? '是' : '否',
    '问题类型': a.errorType ? ERROR_TYPE_LABELS[a.errorType] || a.errorType : '',
    '创建时间': formatDateTime(a.createdAt),
    '更新时间': formatDateTime(a.updatedAt)
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  
  const columnWidths = [
    { wch: 15 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 50 },
    { wch: 12 },
    { wch: 15 },
    { wch: 10 },
    { wch: 8 },
    { wch: 10 },
    { wch: 15 },
    { wch: 20 },
    { wch: 20 }
  ];
  worksheet['!cols'] = columnWidths;
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '批注清单');
  
  XLSX.writeFile(workbook, fileName);
}

export function exportSummary(annotations, replies, fileName = '会审批注回复摘要.txt') {
  const repliedAnnotations = annotations.filter(a => a.status === 'replied' || a.status === 'closed');
  
  let content = '═══════════════════════════════════════════════════════════════\n';
  content += '                图纸会审批注回复摘要报告\n';
  content += '═══════════════════════════════════════════════════════════════\n\n';
  content += `生成时间：${formatDateTime(new Date().toISOString())}\n\n`;
  content += '───────────────────────────────────────────────────────────────\n';
  content += '一、统计概览\n';
  content += '───────────────────────────────────────────────────────────────\n\n';
  content += `  总批注数：${annotations.length} 条\n`;
  content += `  已回复：${repliedAnnotations.length} 条\n`;
  content += `  待处理：${annotations.filter(a => a.status === 'pending').length} 条\n`;
  content += `  处理中：${annotations.filter(a => a.status === 'in_progress' || a.status === 'assigned').length} 条\n`;
  content += `  有问题：${annotations.filter(a => a.hasError).length} 条\n\n`;
  
  const grouped = groupBy(repliedAnnotations, 'building');
  
  for (const [building, items] of Object.entries(grouped)) {
    content += '═══════════════════════════════════════════════════════════════\n';
    content += `【${building}】已回复批注明细\n`;
    content += '═══════════════════════════════════════════════════════════════\n\n';
    
    items.forEach(a => {
      const annotationReplies = replies.filter(r => r.annotationId === a.id);
      
      content += `● 批注编号：${a.annotationNo}\n`;
      content += `  专业：${a.major}    页码：${a.pageNo || '未标注'}\n`;
      content += `  优先级：${PRIORITY_LABELS[a.priority]}\n`;
      content += `  责任人：${a.assignee || '未分派'}\n\n`;
      content += `  ▶ 批注内容：\n`;
      content += `    ${a.description}\n\n`;
      
      if (annotationReplies.length > 0) {
        content += `  ◀ 回复历史（共 ${annotationReplies.length} 条）：\n`;
        annotationReplies.forEach((r, idx) => {
          content += `    [${idx + 1}] ${formatDateTime(r.repliedAt)} - ${r.replier}\n`;
          content += `        ${r.content}\n\n`;
        });
      }
      
      content += `  当前状态：${ANNOTATION_STATUS_LABELS[a.status]}\n`;
      content += `  ─────────────────────────────────────────────────────────\n\n`;
    });
  }
  
  content += '\n═══════════════════════════════════════════════════════════════\n';
  content += '                        报告结束\n';
  content += '═══════════════════════════════════════════════════════════════\n';
  
  downloadTextFile(content, fileName);
}

export function exportChecklist(annotations, fileName = '会审问题追踪核对表.txt') {
  let content = '╔══════════════════════════════════════════════════════════════╗\n';
  content += '║                  图纸会审问题追踪核对表                     ║\n';
  content += '╚══════════════════════════════════════════════════════════════╝\n\n';
  content += `核对日期：${formatDateTime(new Date().toISOString())}\n\n`;
  
  const statusGroups = {
    pending: '□ 待分派',
    assigned: '□ 已分派',
    in_progress: '□ 处理中',
    replied: '☑ 已回复',
    closed: '■ 已关闭'
  };
  
  for (const [status, label] of Object.entries(statusGroups)) {
    const items = annotations.filter(a => a.status === status);
    if (items.length === 0) continue;
    
    content += `\n${label}（${items.length} 条）\n`;
    content += '─'.repeat(70) + '\n\n';
    
    items.forEach((a, idx) => {
      const checkbox = status === 'replied' || status === 'closed' ? '☑' : '□';
      const errorTag = a.hasError ? ' ⚠' : '';
      content += `  ${checkbox} ${idx + 1}. [${a.annotationNo}] ${a.building}/${a.major}`;
      content += errorTag + '\n';
      content += `     页码：${a.pageNo || '未标注'}    责任人：${a.assignee || '未分派'}\n`;
      content += `     ${a.description.substring(0, 50)}${a.description.length > 50 ? '...' : ''}\n\n`;
    });
  }
  
  content += '\n' + '─'.repeat(70) + '\n';
  content += `核对说明：\n`;
  content += `  ☑ = 已回复  ■ = 已关闭  □ = 待处理  ⚠ = 数据有问题\n`;
  
  downloadTextFile(content, fileName);
}

export function generateHash(data) {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).toUpperCase();
}

export function verifyDataConsistency(annotations, exportedData) {
  const annotationsHash = generateHash(annotations.map(a => ({
    annotationNo: a.annotationNo,
    status: a.status,
    description: a.description,
    assignee: a.assignee
  })));
  
  const exportedHash = generateHash(exportedData.map(a => ({
    annotationNo: a['批注编号'],
    status: a['处理状态'],
    description: a['批注内容'],
    assignee: a['责任人']
  })));
  
  return {
    isConsistent: annotationsHash === exportedHash,
    originalHash: annotationsHash,
    exportedHash: exportedHash
  };
}

function formatDateTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function groupBy(array, key) {
  return array.reduce((result, item) => {
    (result[item[key]] = result[item[key]] || []).push(item);
    return result;
  }, {});
}

function downloadTextFile(content, fileName) {
  const blob = new Blob(['\ufeff' + content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
