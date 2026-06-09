import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { generateHash } from './storage';

const EXCEL_HEADERS = [
  { key: 'changeNo', label: '变更编号' },
  { key: 'title', label: '变更标题' },
  { key: 'description', label: '变更内容说明' },
  { key: 'source', label: '来源类型' },
  { key: 'sourceRef', label: '来源编号' },
  { key: 'dateIssued', label: '发出日期' },
  { key: 'dateReceived', label: '收到日期' },
  { key: 'floorId', label: '楼层' },
  { key: 'major', label: '责任专业' },
  { key: 'affectedAreas', label: '影响区域' },
  { key: 'constructionStatus', label: '施工状态' },
  { key: 'constructionProgress', label: '施工进度说明' },
  { key: 'impactLevel', label: '影响等级' },
  { key: 'costImpact', label: '成本影响(元)' },
  { key: 'scheduleImpact', label: '进度影响(天)' },
  { key: 'processImpact', label: '工序影响说明' },
  { key: 'responsiblePerson', label: '责任人' },
  { key: 'status', label: '处理状态' },
  { key: 'remarks', label: '备注' },
];

export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        
        const changes = rows.map(row => {
          const affectedAreas = typeof row['影响区域'] === 'string' 
            ? row['影响区域'].split(/[,，、]/).map(s => s.trim()).filter(Boolean)
            : [];
            
          return {
            id: uuidv4(),
            changeNo: row['变更编号'] || '',
            version: 1,
            title: row['变更标题'] || '',
            description: row['变更内容说明'] || '',
            source: row['来源类型'] || 'design_letter',
            sourceRef: row['来源编号'] || '',
            dateIssued: row['发出日期'] ? new Date(row['发出日期']).toISOString().split('T')[0] : '',
            dateReceived: row['收到日期'] ? new Date(row['收到日期']).toISOString().split('T')[0] : '',
            floorId: row['楼层'] || '',
            major: row['责任专业'] || '',
            affectedAreas,
            constructionStatus: row['施工状态'] || 'drawing',
            constructionProgress: row['施工进度说明'] || '',
            impactLevel: row['影响等级'] || 'medium',
            costImpact: Number(row['成本影响(元)']) || 0,
            scheduleImpact: Number(row['进度影响(天)']) || 0,
            processImpact: row['工序影响说明'] || '',
            responsiblePerson: row['责任人'] || null,
            status: row['处理状态'] || 'pending',
            attachments: [],
            remarks: row['备注'] || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            history: [
              {
                id: uuidv4(),
                action: 'import',
                timestamp: new Date().toISOString(),
                operator: 'sun',
                oldValue: null,
                newValue: { status: 'pending', imported: true },
                reason: '从 Excel 文件导入'
              }
            ]
          };
        });
        
        resolve(changes);
      } catch (error) {
        reject(new Error('文件解析失败：' + error.message));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
};

export const exportToExcel = (changes) => {
  const exportData = changes.map(change => {
    const row = {};
    EXCEL_HEADERS.forEach(({ key, label }) => {
      if (key === 'affectedAreas') {
        row[label] = Array.isArray(change[key]) ? change[key].join('、') : change[key];
      } else if (key === 'costImpact' || key === 'scheduleImpact') {
        row[label] = change[key] || 0;
      } else {
        row[label] = change[key] || '';
      }
    });
    return row;
  });
  
  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '设计变更清单');
  
  ws['!cols'] = [
    { wch: 16 }, { wch: 40 }, { wch: 60 }, { wch: 12 }, { wch: 20 },
    { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 30 },
    { wch: 12 }, { wch: 40 }, { wch: 12 }, { wch: 14 }, { wch: 14 },
    { wch: 40 }, { wch: 12 }, { wch: 12 }, { wch: 40 }
  ];
  
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  XLSX.writeFile(wb, `设计变更清单_${timestamp}.xlsx`);
};

export const exportImpactReport = (changes, floorName = '') => {
  const floorChanges = floorName && floorName !== 'all' 
    ? changes.filter(c => c.floorId === floorName)
    : changes;
  
  const totalCost = floorChanges.reduce((sum, c) => sum + (c.costImpact || 0), 0);
  const totalDays = floorChanges.reduce((sum, c) => sum + (c.scheduleImpact || 0), 0);
  
  const constructedCount = floorChanges.filter(c => c.constructionStatus === 'constructed').length;
  const partialCount = floorChanges.filter(c => c.constructionStatus === 'partial').length;
  const drawingCount = floorChanges.filter(c => c.constructionStatus === 'drawing').length;
  
  const highCount = floorChanges.filter(c => c.impactLevel === 'high').length;
  const mediumCount = floorChanges.filter(c => c.impactLevel === 'medium').length;
  const lowCount = floorChanges.filter(c => c.impactLevel === 'low').length;
  const noneCount = floorChanges.filter(c => c.impactLevel === 'none').length;
  
  let content = `设计变更影响报告\n`;
  content += `生成时间：${new Date().toLocaleString('zh-CN')}\n`;
  content += `${floorName && floorName !== 'all' ? `楼层：${floorName}\n` : '范围：全部楼层\n'}`;
  content += `\n`;
  content += `═══════════════════════════════════════════════\n`;
  content += `一、总体统计\n`;
  content += `═══════════════════════════════════════════════\n`;
  content += `变更总数：${floorChanges.length} 条\n`;
  content += `成本影响总计：${totalCost.toLocaleString()} 元\n`;
  content += `进度影响总计：${totalDays} 天\n`;
  content += `\n`;
  content += `施工状态分布：\n`;
  content += `  • 已施工：${constructedCount} 条（需返工）\n`;
  content += `  • 部分施工：${partialCount} 条（需调整工序）\n`;
  content += `  • 仅图纸：${drawingCount} 条（无现场影响）\n`;
  content += `\n`;
  content += `影响等级分布：\n`;
  content += `  • 高影响：${highCount} 条\n`;
  content += `  • 中影响：${mediumCount} 条\n`;
  content += `  • 低影响：${lowCount} 条\n`;
  content += `  • 无影响：${noneCount} 条\n`;
  content += `\n`;
  content += `═══════════════════════════════════════════════\n`;
  content += `二、已施工区域变更明细（重点关注）\n`;
  content += `═══════════════════════════════════════════════\n`;
  
  const constructed = floorChanges.filter(c => c.constructionStatus === 'constructed');
  if (constructed.length === 0) {
    content += `无已施工区域的变更\n`;
  } else {
    constructed.forEach((c, i) => {
      content += `\n【${i + 1}】${c.changeNo} - ${c.title}\n`;
      content += `  专业：${c.major} | 影响等级：${c.impactLevel}\n`;
      content += `  成本影响：${(c.costImpact || 0).toLocaleString()} 元\n`;
      content += `  进度影响：${c.scheduleImpact || 0} 天\n`;
      content += `  施工进度：${c.constructionProgress}\n`;
      content += `  工序影响：${c.processImpact}\n`;
    });
  }
  
  content += `\n`;
  content += `═══════════════════════════════════════════════\n`;
  content += `三、数据哈希校验\n`;
  content += `═══════════════════════════════════════════════\n`;
  content += `数据哈希值：${generateHash(floorChanges)}\n`;
  content += `数据条数：${floorChanges.length}\n`;
  content += `\n`;
  content += `本报告可用于数据一致性校验，刷新页面后重新导出报告，\n`;
  content += `如哈希值相同则证明数据未发生变化。\n`;
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  a.href = url;
  a.download = `设计变更影响报告_${timestamp}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportChecklist = (changes) => {
  let content = `设计变更核对清单\n`;
  const timestamp = new Date().toLocaleString('zh-CN');
  content += `生成时间：${timestamp}\n`;
  content += `\n`;
  content += `□ 已核对变更编号的唯一性\n`;
  content += `□ 已确认所有变更均已关联责任专业\n`;
  content += `□ 已标记所有已施工区域的变更\n`;
  content += `□ 已评估每条变更的成本影响\n`;
  content += `□ 已评估每条变更的进度影响\n`;
  content += `□ 已分派所有待确认变更的责任人\n`;
  content += `□ 已确认设计院函件均已存档\n`;
  content += `□ 已通知相关施工班组暂停受影响区域\n`;
  content += `□ 已记录所有版本变更的差异\n`;
  content += `□ 已更新变更台账\n`;
  content += `\n`;
  content += `变更总数：${changes.length} 条\n`;
  content += `待确认：${changes.filter(c => c.status === 'pending').length} 条\n`;
  content += `数据哈希：${generateHash(changes)}\n`;
  content += `\n`;
  content += `核对人：___________  日期：___________\n`;
  content += `复核人：___________  日期：___________\n`;
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const fileTimestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  a.href = url;
  a.download = `设计变更核对清单_${fileTimestamp}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadImportTemplate = () => {
  const template = [
    {
      '变更编号': 'CHG-2024-010',
      '变更标题': '7层公寓阳台栏杆高度调整',
      '变更内容说明': '应规范要求，7层公寓阳台栏杆高度从1.1米提高到1.2米。',
      '来源类型': 'design_letter',
      '来源编号': '设计院函件 A-2024-018',
      '发出日期': '2026-06-09',
      '收到日期': '2026-06-10',
      '楼层': 'F7',
      '责任专业': 'architecture',
      '影响区域': '阳台',
      '施工状态': 'drawing',
      '施工进度说明': '尚未施工',
      '影响等级': 'low',
      '成本影响(元)': 12000,
      '进度影响(天)': 1,
      '工序影响说明': '调整阳台栏杆高度',
      '责任人': 'li',
      '处理状态': 'pending',
      '备注': '需检查已下单的栏杆材料是否可以修改'
    }
  ];
  
  const ws = XLSX.utils.json_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '导入模板');
  
  ws['!cols'] = [
    { wch: 16 }, { wch: 40 }, { wch: 60 }, { wch: 12 }, { wch: 20 },
    { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 30 },
    { wch: 12 }, { wch: 40 }, { wch: 12 }, { wch: 14 }, { wch: 14 },
    { wch: 40 }, { wch: 12 }, { wch: 12 }, { wch: 40 }
  ];
  
  XLSX.writeFile(wb, '设计变更导入模板.xlsx');
};
