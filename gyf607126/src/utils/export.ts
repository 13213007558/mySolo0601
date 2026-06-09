import * as XLSX from 'xlsx';
import { Contract } from '../types/contract';

export const exportToExcel = (contracts: Contract[], filename: string = '售电合同数据') => {
  const exportData = contracts.map((c) => ({
    '合同编号': c.contractNo,
    '客户名称': c.customerName,
    '客户经理': c.customerManager,
    '设备编号': c.deviceId,
    '设备名称': c.deviceName,
    '合同金额(元)': c.contractAmount,
    '电价(元/度)': c.electricityPrice,
    '合同日期': c.contractDate,
    '生效日期': c.effectiveDate,
    '到期日期': c.expiryDate,
    '状态': c.status,
    '有无附件': c.hasAttachment ? '有' : '无',
    '附件名称': c.attachmentName || '',
    '异常类型': c.anomalies.join('、'),
    '创建时间': c.createdAt,
    '更新时间': c.updatedAt,
    '更新人': c.updatedBy,
    '是否补录': c.isSupplement ? '是' : '否',
    '补录来源': c.supplementFrom || '',
    '备注': c.notes || '',
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '合同数据');
  
  ws['!cols'] = [
    { wch: 15 }, { wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 15 },
    { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    { wch: 10 }, { wch: 10 }, { wch: 25 }, { wch: 20 }, { wch: 20 },
    { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 30 },
  ];

  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const importFromExcel = (file: File): Promise<Contract[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Array<Record<string, unknown>>;

        const contracts: Contract[] = jsonData.map((row, index) => {
          const now = new Date().toISOString();
          return {
            id: `imported_${Date.now()}_${index}`,
            contractNo: String(row['合同编号'] || `SD-IMPORT-${index + 1}`),
            customerName: String(row['客户名称'] || ''),
            customerManager: String(row['客户经理'] || ''),
            deviceId: String(row['设备编号'] || ''),
            deviceName: String(row['设备名称'] || ''),
            contractAmount: Number(row['合同金额(元)']) || 0,
            electricityPrice: Number(row['电价(元/度)']) || 0,
            contractDate: String(row['合同日期'] || now.split('T')[0]),
            effectiveDate: String(row['生效日期'] || now.split('T')[0]),
            expiryDate: String(row['到期日期'] || now.split('T')[0]),
            status: (row['状态'] as Contract['status']) || '草稿',
            hasAttachment: String(row['有无附件']) === '有',
            attachmentName: row['附件名称'] ? String(row['附件名称']) : undefined,
            anomalies: row['异常类型'] ? (String(row['异常类型']).split('、') as Contract['anomalies']) : [],
            createdAt: now,
            updatedAt: now,
            updatedBy: '导入用户',
            isSupplement: String(row['是否补录']) === '是',
            supplementFrom: row['补录来源'] ? String(row['补录来源']) : undefined,
            notes: row['备注'] ? String(row['备注']) : undefined,
          };
        });

        resolve(contracts);
      } catch (error) {
        reject(new Error('文件解析失败，请检查文件格式'));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
};

export const exportToJSON = (contracts: Contract[], filename: string = '售电合同数据') => {
  const dataStr = JSON.stringify(contracts, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importFromJSON = (file: File): Promise<Contract[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as Contract[];
        const contracts = data.map((c, index) => ({
          ...c,
          id: c.id || `imported_${Date.now()}_${index}`,
          updatedAt: c.updatedAt || new Date().toISOString(),
          updatedBy: c.updatedBy || '导入用户',
        }));
        resolve(contracts);
      } catch (error) {
        reject(new Error('JSON解析失败，请检查文件格式'));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
};
