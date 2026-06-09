import * as XLSX from 'xlsx';
import { importAnnotations } from '../db/operations';

export async function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        resolve({
          fileName: file.name,
          rowCount: jsonData.length,
          columns: Object.keys(jsonData[0] || {}),
          data: jsonData,
          preview: jsonData.slice(0, 5)
        });
      } catch (error) {
        reject(new Error('Excel 文件解析失败：' + error.message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

export async function importExcelFile(file) {
  const parsed = await parseExcelFile(file);
  const result = await importAnnotations(parsed.data, file.name);
  return {
    ...parsed,
    importResult: result
  };
}

export function downloadImportTemplate() {
  const templateData = [
    {
      '批注编号': 'AN-2024-001',
      '楼栋': '1号楼',
      '专业': '建筑',
      '图纸页码': 'A-01',
      '批注内容': '请输入批注内容描述...',
      '来源': 'pdf',
      '责任人': '张工（建筑）',
      '优先级': 'high'
    },
    {
      '批注编号': 'AN-2024-002',
      '楼栋': '2号楼',
      '专业': '结构',
      '图纸页码': 'S-05',
      '批注内容': '第二条批注示例...',
      '来源': 'wechat',
      '责任人': '李工（结构）',
      '优先级': 'medium'
    }
  ];
  
  const worksheet = XLSX.utils.json_to_sheet(templateData);
  
  const columnWidths = [
    { wch: 15 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 50 },
    { wch: 12 },
    { wch: 15 },
    { wch: 10 }
  ];
  worksheet['!cols'] = columnWidths;
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '批注导入模板');
  
  const readmeSheet = XLSX.utils.aoa_to_sheet([
    ['图纸会审批注导入模板 - 使用说明'],
    [''],
    ['字段说明：'],
    ['批注编号：唯一标识，重复编号会被跳过'],
    ['楼栋：如 1号楼、2号楼 等（1-8号楼）'],
    ['专业：建筑、结构、给排水、暖通、电气、消防、弱电、景观、室内'],
    ['图纸页码：如 A-01、S-03 等，必填'],
    ['批注内容：问题描述'],
    ['来源：pdf / wechat / excel'],
    ['责任人：如 张工（建筑）'],
    ['优先级：high / medium / low'],
    [''],
    ['注意事项：'],
    ['1. 带 * 的字段为必填项'],
    ['2. 缺少页码或专业名称错误的记录会被放到问题区'],
    ['3. 重复导入相同文件会被检测到并阻止'],
    ['4. 专业名称必须严格匹配列表中的值']
  ]);
  readmeSheet['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(workbook, readmeSheet, '使用说明');
  
  XLSX.writeFile(workbook, '图纸会审批注导入模板.xlsx');
}
