import { ForecastRecord } from '../types';
import { formatNumber, displayValue } from './calculation';
import { statusLabels } from '../data/mockData';

export const exportToCSV = (records: ForecastRecord[], filename: string = '负荷预测对账表'): void => {
  const headers = [
    '设备编号',
    '设备名称',
    '预测日期',
    '原始预测值(MW)',
    '日前修正值(MW)',
    '实际值(MW)',
    '偏差率(%)',
    '状态',
    '是否异常',
    '状态冲突',
    '创建人',
    '更新人',
    '更新时间',
    '原始材料',
    '备注',
  ];

  const rows = records.map(r => [
    r.deviceNo,
    r.deviceName,
    r.forecastDate,
    formatNumber(r.forecastValue, 2),
    formatNumber(r.revisedValue, 2),
    formatNumber(r.actualValue, 2),
    `${r.deviationRate > 0 ? '+' : ''}${r.deviationRate.toFixed(2)}`,
    statusLabels[r.status],
    r.isAbnormal ? '是' : '否',
    r.hasStatusConflict ? '是' : '否',
    r.createdBy,
    displayValue(r.updatedBy),
    r.updatedAt,
    displayValue(r.sourceMaterial),
    r.remarks.map(rm => `[${rm.author}] ${rm.content}`).join('; '),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

export const importFromCSV = (file: File): Promise<Partial<ForecastRecord>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split('\n').filter(l => l.trim());
        if (lines.length < 2) {
          reject(new Error('CSV文件内容为空或格式不正确'));
          return;
        }

        const dataLines = lines.slice(1);
        const records: Partial<ForecastRecord>[] = dataLines.map(line => {
          const cells = line.match(/(?:^|,)(?:"([^"]*)"|([^,]*))/g) || [];
          const values = cells.map(c => {
            const match = c.match(/^,?"([^"]*)"$/);
            return match ? match[1] : c.replace(/^,/, '');
          });

          return {
            deviceNo: values[0] || '',
            deviceName: values[1] || '',
            forecastDate: values[2] || new Date().toISOString().split('T')[0],
            forecastValue: parseFloat(values[3]) || 0,
            revisedValue: values[4] && values[4] !== '--' ? parseFloat(values[4]) : undefined,
            actualValue: parseFloat(values[5]) || 0,
            deviationRate: parseFloat(values[6]) || 0,
          };
        });

        resolve(records);
      } catch (err) {
        reject(new Error('CSV解析失败，请检查文件格式'));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
};

export const exportChartData = (data: { hour: number; forecast: number; revised?: number; actual: number }[], filename: string = '负荷曲线数据'): void => {
  const headers = ['时点', '原始预测值(MW)', '日前修正值(MW)', '实际值(MW)', '偏差(%)'];
  const rows = data.map(d => {
    const deviation = d.forecast > 0 ? ((d.actual - d.forecast) / d.forecast * 100).toFixed(2) : '0';
    return [
      `${d.hour}:00`,
      d.forecast.toFixed(2),
      d.revised ? d.revised.toFixed(2) : '--',
      d.actual.toFixed(2),
      `${Number(deviation) > 0 ? '+' : ''}${deviation}`,
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};
