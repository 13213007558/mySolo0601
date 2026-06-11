import jsPDF from "jspdf";
import type { DivePlan, DiveState, User } from "~/data/types";
import { formatDateTime, formatGps, formatDepth, formatDurationMM, roleLabel } from "./format";

export async function generateDivePdf(
  state: DiveState,
  users: User[]
): Promise<Blob> {
  const plan = state.plan;
  if (!plan) throw new Error("No dive plan");

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = doc.internal.pageSize.getWidth();
  const marginL = 14;
  let y = 18;

  doc.setFillColor(10, 22, 40);
  doc.rect(0, 0, pageW, 22, "F");

  doc.setTextColor(0, 229, 255);
  doc.setFontSize(18);
  doc.text("MARITIME DIVE DECOMPRESSION LOG", pageW / 2, 8, { align: "center" });
  doc.setTextColor(200, 220, 255);
  doc.setFontSize(9);
  doc.text("中华人民共和国海事局 潜水减压停留核对日志", pageW / 2, 14, { align: "center" });
  doc.setTextColor(20, 20, 20);

  y += 6;
  doc.setDrawColor(0, 229, 255);
  doc.setLineWidth(0.6);
  doc.line(marginL, y, pageW - marginL, y);
  y += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`潜点 Dive Site:`, marginL, y);
  doc.setFont("helvetica", "normal");
  doc.text(plan.siteName, marginL + 52, y);
  doc.setFont("helvetica", "bold");
  doc.text(`编号 Log No.:`, pageW - marginL - 70, y);
  doc.setFont("helvetica", "normal");
  doc.text(state.tokenId ?? "--", pageW - marginL - 20, y, { align: "right" });

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text(`最大深度 Max Depth:`, marginL, y);
  doc.setFont("helvetica", "normal");
  doc.text(formatDepth(plan.maxDepth), marginL + 42, y);
  doc.setFont("helvetica", "bold");
  doc.text(`潜点 GPS:`, pageW - marginL - 70, y);
  doc.setFont("helvetica", "normal");
  doc.text(formatGps(plan.siteGpsLat, plan.siteGpsLng), pageW - marginL, y, { align: "right" });

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text(`开始时间 Start:`, marginL, y);
  doc.setFont("helvetica", "normal");
  doc.text(formatDateTime(plan.plannedStartTime), marginL + 34, y);
  doc.setFont("helvetica", "bold");
  doc.text(`出水时间 Surface:`, pageW - marginL - 70, y);
  doc.setFont("helvetica", "normal");
  doc.text(formatDateTime(state.surfacedAt), pageW - marginL, y, { align: "right" });
  y += 4;
  doc.setDrawColor(150);
  doc.setLineWidth(0.2);
  doc.line(marginL, y, pageW - marginL, y);
  y += 8;

  const headers = ["#", "Depth", "Plan", "Arrival", "GPS", "Deviation", "Diver Sign", "Instr Sign"];
  const colX = [marginL, marginL + 10, marginL + 30, marginL + 62, marginL + 90, marginL + 120, marginL + 145, marginL + 165];
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.setFillColor(15, 39, 68);
  doc.rect(marginL, y - 4, pageW - marginL * 2, 6, "F");
  headers.forEach((h, i) => doc.text(h, colX[i], y));
  y += 5;
  doc.setTextColor(20, 20, 20);

  const sorted = [...plan.steps].sort((a, b) => a.index - b.index);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);

  for (const step of sorted) {
    if (y > 255) {
      doc.addPage();
      y = 20;
    }
    const diver = users.find(u => u.id === step.assignedDiverId);
    const rowH = 20;
    doc.setDrawColor(220);
    doc.rect(marginL, y - 3, pageW - marginL * 2, rowH);

    doc.text(String(step.index + 1), colX[0], y);
    doc.text(formatDepth(step.plannedDepth), colX[1], y);
    doc.text(formatDurationMM(step.plannedDuration), colX[2], y);
    doc.text(formatDateTime(step.actualArrivalTime), colX[3], y);
    doc.setTextColor(80);
    doc.text(
      step.gpsLat ? formatGps(step.gpsLat, step.gpsLng) : "--", colX[4], y);
    doc.setTextColor(step.deviationSeconds && step.deviationSeconds > 0 ? 200 : 20,
      step.deviationSeconds && step.deviationSeconds > 180 ? 30 : 20,
      step.deviationSeconds && step.deviationSeconds > 180 ? 30 : 20);
    doc.text(
      step.deviationSeconds ? `${step.deviationSeconds > 0 ? "+" : ""}${step.deviationSeconds}s` : "--",
      colX[5], y);
    doc.setTextColor(20, 20, 20);

    if (step.diverSignature) {
      try {
        doc.addImage(step.diverSignature, "PNG", colX[6] - 1, y - 1, 26, 13);
      } catch {}
    } else {
      doc.setTextColor(180, 30, 30);
      doc.text("缺失 MISSING", colX[6], y);
      doc.setTextColor(20, 20, 20);
    }
    if (step.instructorSignature) {
      try {
        doc.addImage(step.instructorSignature, "PNG", colX[7] - 1, y - 1, 26, 13);
      } catch {}
    } else {
      doc.setTextColor(180, 30, 30);
      doc.text(step.status === "skipped" ? "跳过 SKIP" : "缺失", colX[7], y);
      doc.setTextColor(20, 20, 20);
    }
    y += rowH;
    doc.setFontSize(6);
    doc.setTextColor(120);
    doc.text(
      `Diver: ${diver?.name ?? "--"}  ${roleLabel(diver?.role ?? "")}`, colX[6], y - 1);
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(7.5);
  }

  y += 6;

  if (state.mode === "emergency") {
    doc.setFillColor(255, 235, 235);
    doc.setTextColor(200, 30, 30);
    doc.rect(marginL, y - 4, pageW - marginL * 2, 12, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`紧急上升事件 / EMERGENCY ASCENT`, marginL + 2, y + 2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`原因: ${state.emergencyReason ?? "未记录"}`, marginL + 2, y + 7);
    y += 14;
    doc.setTextColor(20, 20, 20);
  }

  if (state.tokenId) {
    doc.setFillColor(48, 209, 88);
    doc.rect(marginL, y - 4, pageW - marginL * 2, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`可出水令牌 SURFACE TOKEN: ${state.tokenId}`, pageW / 2, y + 4, { align: "center" });
    doc.setTextColor(20, 20, 20);
    y += 14;
  }

  y += 4;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100);
  const signersText = state.alerts
    .filter(a => a.type === "deviation")
    .map(a => `[偏离告警] ${a.message} @ ${formatDateTime(a.createdAt)}`)
    .join("  |  ");
  if (signersText) {
    doc.text(`告警记录 Alerts: ${signersText}`, marginL, y);
    y += 5;
  }
  doc.text(`本文件由深潜减压核对台电子生成 ｜ 版本 v1.0 ｜ 打印时间 ${formatDateTime(Date.now())}`, marginL, y);

  return doc.output("blob");
}
