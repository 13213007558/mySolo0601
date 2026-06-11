import type { Batch, Sample, Score, SessionUser, StandardScores, Certificate } from "../types.js";
import { DEVIATION_TOLERANCE, MAX_INVALIDATE_COUNT } from "../types.js";
import * as repo from "../repositories/cuppingRepository.js";

export function renderCertificatePage(
  batch: Batch,
  samples: Sample[],
  standards: StandardScores,
  certificate: Certificate | null,
  user: SessionUser
): string {
  return `
    <div class="mb-6 no-print">
      <a href="/cupping/${batch.id}" class="text-amber-300 hover:text-amber-200 text-sm hover:underline">
        ← 返回审评室
      </a>
    </div>

    <div id="certificate-wrapper">
      ${renderCertificateInner(batch, samples, standards, certificate, user)}
    </div>
  `;
}

export function renderCertificateInner(
  batch: Batch,
  samples: Sample[],
  standards: StandardScores,
  certificate: Certificate | null,
  user: SessionUser
): string {
  const sampleRows = samples
    .map((s) => {
      const scores = repo.getScoresBySampleId(s.id);
      return renderCertificateSampleRow(s, scores, standards);
    })
    .join("");

  const isSigned = certificate?.signed_at !== null && certificate?.signed_at !== undefined;

  return `
    <div class="certificate-paper max-w-4xl mx-auto">
      <div class="certificate-watermark">茶叶审评</div>
      
      <div class="text-center border-b-2 border-amber-400/30 pb-8 mb-8">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow-glow">
          <span class="text-charcoal-900 font-serif font-bold text-2xl">茶</span>
        </div>
        <h2 class="font-serif text-3xl font-bold text-amber-300 glow-text">茶叶拍卖审评证书</h2>
        <p class="text-charcoal-200 mt-2">Tea Auction Cupping Certificate</p>
      </div>

      <div class="grid grid-cols-2 gap-6 mb-8">
        <div>
          <p class="text-charcoal-200 text-sm">批次编号</p>
          <p class="text-amber-100 font-serif text-xl font-bold">${batch.batch_code}</p>
        </div>
        <div>
          <p class="text-charcoal-200 text-sm">茶叶名称</p>
          <p class="text-amber-100 font-serif text-xl font-bold">${batch.tea_name}</p>
        </div>
        <div>
          <p class="text-charcoal-200 text-sm">产地</p>
          <p class="text-amber-100">${batch.origin || "—"}</p>
        </div>
        <div>
          <p class="text-charcoal-200 text-sm">审评状态</p>
          <p class="text-amber-100">
            ${
              batch.status === "locked"
                ? "已锁定"
                : batch.status === "downgraded"
                ? "已降级"
                : "审评中"
            }
          </p>
        </div>
      </div>

      <div class="mb-8">
        <h3 class="font-serif text-lg font-bold text-amber-200 mb-4">审评结果明细</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-charcoal-400">
                <th class="text-left py-3 px-3 text-charcoal-200 font-medium">样本编号</th>
                <th class="text-center py-3 px-3 text-charcoal-200 font-medium">啜饮时长</th>
                <th class="text-center py-3 px-3 text-charcoal-200 font-medium">平均音量</th>
                <th class="text-center py-3 px-3 text-charcoal-200 font-medium">外观</th>
                <th class="text-center py-3 px-3 text-charcoal-200 font-medium">香气</th>
                <th class="text-center py-3 px-3 text-charcoal-200 font-medium">滋味</th>
                <th class="text-center py-3 px-3 text-charcoal-200 font-medium">叶底</th>
                <th class="text-center py-3 px-3 text-charcoal-200 font-medium">总分</th>
                <th class="text-center py-3 px-3 text-charcoal-200 font-medium">偏差</th>
                <th class="text-center py-3 px-3 text-charcoal-200 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              ${sampleRows}
            </tbody>
          </table>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-6 mb-8">
        <div class="p-4 bg-charcoal-600 rounded-md">
          <p class="text-charcoal-200 text-sm">标准样参考</p>
          <div class="grid grid-cols-2 gap-2 mt-2 text-sm">
            <div><span class="text-charcoal-300">外观：</span><span class="text-amber-100">${standards.appearance}</span></div>
            <div><span class="text-charcoal-300">香气：</span><span class="text-amber-100">${standards.aroma}</span></div>
            <div><span class="text-charcoal-300">滋味：</span><span class="text-amber-100">${standards.taste}</span></div>
            <div><span class="text-charcoal-300">叶底：</span><span class="text-amber-100">${standards.leaf}</span></div>
          </div>
          <p class="text-charcoal-300 text-xs mt-2">偏差容差：±${DEVIATION_TOLERANCE} 分</p>
        </div>
        <div class="p-4 bg-charcoal-600 rounded-md">
          <p class="text-charcoal-200 text-sm">证书签发</p>
          ${
            isSigned
              ? `
            <p class="text-tea-300 font-medium mt-2">✓ 已签发</p>
            <p class="text-charcoal-300 text-xs mt-1">签发日期：${new Date(
              certificate!.signed_at!
            ).toLocaleString("zh-CN")}</p>
          `
              : `
            <p class="text-charcoal-300 mt-2">等待主评师签发...</p>
          `
          }
        </div>
      </div>

      <div class="border-t border-charcoal-400 pt-6">
        <p class="text-xs text-charcoal-300 text-center">
          本证书由茶叶杯测啜饮席系统自动生成 · 审评室专用
        </p>
        <p class="text-xs text-charcoal-400 text-center mt-1">
          生成时间：${new Date().toLocaleString("zh-CN")}
        </p>
      </div>
    </div>

    <div class="flex gap-4 justify-center mt-6 no-print">
      ${
        user.role === "chief" && !isSigned
          ? `
        <button
          hx-post="/cupping/${batch.id}/certificate/sign"
          hx-target="#certificate-wrapper"
          hx-swap="innerHTML"
          hx-confirm="确定要签发此证书吗？签发后不可更改。"
          class="btn-primary"
          id="sign-cert-btn"
        >
          签发证书
        </button>
      `
          : ""
      }
      <button
        onclick="window.print()"
        class="btn-secondary"
      >
        打印证书
      </button>
    </div>
  `;
}

function renderCertificateSampleRow(
  sample: Sample,
  scores: Score[],
  standards: StandardScores
): string {
  const hasScores = scores.length > 0;
  const avgScore = hasScores
    ? {
        appearance: scores.reduce((a, b) => a + b.appearance, 0) / scores.length,
        aroma: scores.reduce((a, b) => a + b.aroma, 0) / scores.length,
        taste: scores.reduce((a, b) => a + b.taste, 0) / scores.length,
        leaf: scores.reduce((a, b) => a + b.leaf, 0) / scores.length,
        total: scores.reduce((a, b) => a + b.total, 0) / scores.length,
        deviation: scores.reduce((a, b) => a + b.deviation, 0) / scores.length,
      }
    : null;

  const statusLabel =
    sample.status === "scored"
      ? "已评分"
      : sample.status === "invalid"
      ? "已作废"
      : "待评";

  const statusColor =
    sample.status === "scored"
      ? "text-tea-300"
      : sample.status === "invalid"
      ? "text-copper-300"
      : "text-charcoal-300";

  return `
    <tr class="border-b border-charcoal-500 hover:bg-charcoal-600/50">
      <td class="py-3 px-3 text-amber-100">${sample.sample_code}</td>
      <td class="py-3 px-3 text-center text-amber-100">
        ${sample.sip_duration_ms ? (sample.sip_duration_ms / 1000).toFixed(2) + "s" : "—"}
      </td>
      <td class="py-3 px-3 text-center text-amber-100">
        ${sample.avg_volume_db ? sample.avg_volume_db.toFixed(1) + "dB" : "—"}
      </td>
      <td class="py-3 px-3 text-center text-amber-100">
        ${avgScore ? avgScore.appearance.toFixed(1) : "—"}
      </td>
      <td class="py-3 px-3 text-center text-amber-100">
        ${avgScore ? avgScore.aroma.toFixed(1) : "—"}
      </td>
      <td class="py-3 px-3 text-center text-amber-100">
        ${avgScore ? avgScore.taste.toFixed(1) : "—"}
      </td>
      <td class="py-3 px-3 text-center text-amber-100">
        ${avgScore ? avgScore.leaf.toFixed(1) : "—"}
      </td>
      <td class="py-3 px-3 text-center text-amber-300 font-bold">
        ${avgScore ? avgScore.total.toFixed(1) : "—"}
      </td>
      <td class="py-3 px-3 text-center ${
        avgScore && avgScore.deviation <= DEVIATION_TOLERANCE ? "text-tea-300" : "text-copper-300"
      }">
        ${avgScore ? avgScore.deviation.toFixed(1) : "—"}
      </td>
      <td class="py-3 px-3 text-center ${statusColor}">
        ${statusLabel}
        ${sample.invalidate_count > 0 ? ` (重评${sample.invalidate_count}次)` : ""}
      </td>
    </tr>
  `;
}

