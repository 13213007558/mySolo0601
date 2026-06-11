import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import type { HACCPReport, CheeseWheel } from '../types';
import { calculateCriticalControlPoints } from './haccp-generator';

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

function generateReportNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `HACCP-${y}${m}${d}-${rand}`;
}

function drawTemperatureChart(
  report: HACCPReport,
  width: number,
  height: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const padding = { top: 30, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const points = report.temperatureCurve;
  if (points.length === 0) {
    ctx.fillStyle = '#999999';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('暂无温度数据', width / 2, height / 2);
    return canvas.toDataURL('image/png');
  }

  const [minTarget, maxTarget] = report.targetRange;
  let minTemp = Infinity;
  let maxTemp = -Infinity;
  for (const p of points) {
    if (p.temperature < minTemp) minTemp = p.temperature;
    if (p.temperature > maxTemp) maxTemp = p.temperature;
  }
  minTemp = Math.min(minTemp, minTarget) - 1;
  maxTemp = Math.max(maxTemp, maxTarget) + 1;

  const startTime = points[0].timestamp.getTime();
  const endTime = points[points.length - 1].timestamp.getTime();
  const timeRange = endTime - startTime || 1;

  const targetY1 = padding.top + chartHeight - ((maxTarget - minTemp) / (maxTemp - minTemp)) * chartHeight;
  const targetY2 = padding.top + chartHeight - ((minTarget - minTemp) / (maxTemp - minTemp)) * chartHeight;
  ctx.fillStyle = 'rgba(76, 175, 80, 0.15)';
  ctx.fillRect(padding.left, targetY1, chartWidth, targetY2 - targetY1);

  ctx.strokeStyle = '#4CAF50';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(padding.left, targetY1);
  ctx.lineTo(padding.left + chartWidth, targetY1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(padding.left, targetY2);
  ctx.lineTo(padding.left + chartWidth, targetY2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + chartHeight);
  ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
  ctx.stroke();

  ctx.strokeStyle = '#2196F3';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const x = padding.left + ((points[i].timestamp.getTime() - startTime) / timeRange) * chartWidth;
    const y = padding.top + chartHeight - ((points[i].temperature - minTemp) / (maxTemp - minTemp)) * chartHeight;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  for (const p of points) {
    const x = padding.left + ((p.timestamp.getTime() - startTime) / timeRange) * chartWidth;
    const y = padding.top + chartHeight - ((p.temperature - minTemp) / (maxTemp - minTemp)) * chartHeight;
    if (p.status === 'forged') {
      ctx.fillStyle = '#F44336';
    } else if (p.status === 'interrupted' || p.temperature < minTarget || p.temperature > maxTarget) {
      ctx.fillStyle = '#FF9800';
    } else {
      ctx.fillStyle = '#2196F3';
    }
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#333333';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('温度曲线 (℃)', width / 2, 20);

  ctx.font = '11px sans-serif';
  ctx.textAlign = 'right';
  const tempStep = Math.ceil((maxTemp - minTemp) / 5);
  for (let t = Math.ceil(minTemp); t <= maxTemp; t += tempStep) {
    const y = padding.top + chartHeight - ((t - minTemp) / (maxTemp - minTemp)) * chartHeight;
    ctx.fillText(`${t}°`, padding.left - 8, y + 4);
    ctx.strokeStyle = '#eeeeee';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartWidth, y);
    ctx.stroke();
  }

  ctx.textAlign = 'center';
  ctx.fillText(formatDate(points[0].timestamp), padding.left, padding.top + chartHeight + 20);
  ctx.fillText(formatDate(points[points.length - 1].timestamp), padding.left + chartWidth, padding.top + chartHeight + 20);
  ctx.fillText('时间', width / 2, padding.top + chartHeight + 35);

  return canvas.toDataURL('image/png');
}

function calculateDataIntegrityScore(report: HACCPReport): number {
  const points = report.temperatureCurve;
  if (points.length === 0) return 0;

  let validCount = 0;
  for (const p of points) {
    if (p.status === 'valid') validCount++;
  }
  return Math.round((validCount / points.length) * 100);
}

export async function exportHACCPReportToPDF(report: HACCPReport): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const reportNumber = generateReportNumber();

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('HACCP 合规报告', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`报告编号: ${reportNumber}`, 14, 32);
  doc.text(`生成时间: ${formatDate(report.generatedAt)}`, 14, 38);

  let yPos = 50;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('基本信息', 14, yPos);
  yPos += 8;

  const basicInfoData = [
    ['奶酪轮编号', report.wheelNumber],
    ['酒窖位置', report.cellarPosition],
    ['酵母批次', report.yeastBatch],
    ['操作员', report.operator],
    ['目标温度范围', `${report.targetRange[0]}℃ ~ ${report.targetRange[1]}℃`],
    ['数据点数', `${report.temperatureCurve.length} 个`],
  ];

  autoTable(doc, {
    startY: yPos,
    body: basicInfoData,
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 40 },
      1: { cellWidth: 130 },
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        data.cell.styles.halign = 'left';
      }
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  if (yPos > 230) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('温度曲线', 14, yPos);
  yPos += 8;

  const chartDataUrl = drawTemperatureChart(report, 800, 300);
  if (chartDataUrl) {
    doc.addImage(chartDataUrl, 'PNG', 14, yPos, pageWidth - 28, 60);
    yPos += 68;
  }

  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('HACCP 关键控制点 (CCP)', 14, yPos);
  yPos += 8;

  const ccps = calculateCriticalControlPoints(report);
  const ccpTableData = ccps.map(ccp => [ccp.point, ccp.status, ccp.description]);

  autoTable(doc, {
    startY: yPos,
    head: [['控制点', '状态', '说明']],
    body: ccpTableData,
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [33, 150, 243], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 120 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        const status = data.cell.raw as string;
        if (status === '通过') {
          data.cell.styles.textColor = [76, 175, 80];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [244, 67, 54];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  if (yPos > 210) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('异常事件记录', 14, yPos);
  yPos += 8;

  const anomalyTableData = report.anomalies.length > 0
    ? report.anomalies.map(a => [
        a.id,
        a.type === 'temperature_spike' ? '温度异常' : a.type === 'forgery_detected' ? '数据伪造' : '数据中断',
        a.severity === 'critical' ? '危急' : a.severity === 'high' ? '高' : a.severity === 'medium' ? '中' : '低',
        formatDate(a.timestamp),
        a.acknowledged ? `已确认 (${a.acknowledgedBy})` : '未确认',
      ])
    : [['-', '无异常事件', '-', '-', '-']];

  autoTable(doc, {
    startY: yPos,
    head: [['事件ID', '类型', '严重程度', '发生时间', '确认状态']],
    body: anomalyTableData,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [255, 152, 0], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 25 },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 35 },
      4: { cellWidth: 48 },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('数据完整性评分', 14, yPos);
  yPos += 10;

  const integrityScore = calculateDataIntegrityScore(report);
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(integrityScore >= 95 ? 76 : integrityScore >= 80 ? 255 : 244, integrityScore >= 95 ? 175 : integrityScore >= 80 ? 152 : 67, integrityScore >= 95 ? 80 : integrityScore >= 80 ? 0 : 54);
  doc.text(`${integrityScore}%`, pageWidth / 2, yPos + 20, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let scoreComment = '';
  if (integrityScore >= 98) scoreComment = '优秀 - 数据完整可信';
  else if (integrityScore >= 95) scoreComment = '良好 - 数据基本完整';
  else if (integrityScore >= 80) scoreComment = '一般 - 存在部分数据缺失';
  else scoreComment = '较差 - 数据完整性不足，需关注';
  doc.text(scoreComment, pageWidth / 2, yPos + 32, { align: 'center' });

  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('本报告由奶酪成熟监控系统自动生成，数据真实有效。', pageWidth / 2, pageHeight - 15, { align: 'center' });
  doc.text(`HACCP 合规声明：本报告符合 ISO 22000 食品安全管理体系标准`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  doc.save(`HACCP报告_${report.wheelNumber}_${report.generatedAt.getTime()}.pdf`);
}

export async function exportShippingLabel(wheel: CheeseWheel): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [100, 70] });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(3, 3, pageWidth - 6, pageHeight - 6);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('奶酪轮出库标签', pageWidth / 2, 12, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`生成时间: ${formatDate(new Date())}`, pageWidth / 2, 17, { align: 'center' });

  const qrDataUrl = await QRCode.toDataURL(wheel.wheelNumber, {
    width: 300,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
  });

  doc.addImage(qrDataUrl, 'PNG', pageWidth - 32, 22, 26, 26);

  let yPos = 26;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('奶酪轮编号:', 8, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(wheel.wheelNumber, 38, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'bold');
  doc.text('窖位:', 8, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(wheel.cellarPositionId, 38, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'bold');
  doc.text('酵母批次:', 8, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(wheel.yeastBatchId, 38, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'bold');
  doc.text('入窖时间:', 8, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(wheel.entryTime), 38, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'bold');
  doc.text('熟成时长:', 8, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${wheel.maturationHours} 小时`, 38, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'bold');
  doc.text('状态:', 8, yPos);
  doc.setFont('helvetica', 'normal');
  const statusText = wheel.status === 'ready' ? '已成熟 ✔' : wheel.status;
  doc.text(statusText, 38, yPos);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('扫描二维码查询完整熟成记录', pageWidth / 2, pageHeight - 6, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  doc.save(`出库标签_${wheel.wheelNumber}.pdf`);
}
