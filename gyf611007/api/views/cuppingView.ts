import type { Batch, Sample, Score, SessionUser, StandardScores } from "../types.js";
import {
  SIP_DURATION_THRESHOLD_MS,
  VOLUME_THRESHOLD_DB,
  MAX_INVALIDATE_COUNT,
  DEVIATION_TOLERANCE,
} from "../types.js";

export function renderCuppingRoom(
  batch: Batch,
  samples: Sample[],
  currentSample: Sample | null,
  standards: StandardScores,
  user: SessionUser,
  existingScore: Score | null
): string {
  const sampleList = samples
    .map((s) => renderSampleListItem(s, s.id === currentSample?.id))
    .join("");

  const mainContent = currentSample
    ? renderCurrentSample(currentSample, standards, existingScore, user)
    : renderBatchComplete(batch);

  const isLocked = batch.status === "locked" || batch.status === "downgraded";

  return `
    <div class="mb-6">
      <a href="/dashboard" class="text-amber-300 hover:text-amber-200 text-sm hover:underline">
        ← 返回批次列表
      </a>
    </div>

    <div class="mb-6 flex items-start justify-between">
      <div>
        <h2 class="font-serif text-2xl font-bold text-amber-200">
          ${batch.batch_code} · ${batch.tea_name}
        </h2>
        <p class="text-charcoal-200 text-sm mt-1">${batch.origin || "产地未设置"}</p>
      </div>
      <div class="flex items-center gap-3">
        ${
          batch.status === "in_progress" && user.role === "chief"
            ? `
          <button
            hx-post="/cupping/${batch.id}/lock"
            hx-confirm="确定要锁定此批次吗？锁定后不可更改顺序。"
            hx-target="body"
            hx-push-url="true"
            class="btn-secondary text-sm"
          >
            锁定批次
          </button>
        `
            : ""
        }
        ${
          isLocked
            ? `
          <span class="px-3 py-1.5 rounded text-sm font-medium ${
            batch.status === "downgraded"
              ? "bg-copper-400/20 text-copper-300"
              : "bg-charcoal-400/30 text-charcoal-200"
          }">
            ${batch.status === "downgraded" ? "已降级" : "已锁定"}
          </span>
        `
            : ""
        }
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div class="lg:col-span-1">
        <div class="card">
          <h3 class="font-serif text-lg font-bold text-amber-200 mb-4">样本列表</h3>
          <div class="space-y-2" id="sample-list">
            ${sampleList}
          </div>
        </div>
      </div>

      <div class="lg:col-span-3" id="cupping-main">
        ${mainContent}
      </div>
    </div>
  `;
}

function renderSampleListItem(sample: Sample, isActive: boolean): string {
  const statusLabel =
    sample.status === "pending"
      ? "待评"
      : sample.status === "sipping"
      ? "啜饮中"
      : sample.status === "scored"
      ? "已评分"
      : "已作废";

  const statusColor =
    sample.status === "scored"
      ? "text-tea-300"
      : sample.status === "sipping"
      ? "text-amber-300"
      : sample.status === "invalid"
      ? "text-copper-300"
      : "text-charcoal-200";

  return `
    <div
      class="p-3 rounded-md border transition-all cursor-pointer ${
        isActive
          ? "border-amber-400 bg-amber-400/10"
          : "border-charcoal-400 hover:border-charcoal-300"
      }"
      hx-get="/cupping/${sample.batch_id}/sample/${sample.id}"
      hx-target="#cupping-main"
      hx-swap="innerHTML"
    >
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-amber-100">${sample.sample_code}</span>
        <span class="text-xs ${statusColor}">${statusLabel}</span>
      </div>
      <div class="flex items-center justify-between mt-1">
        <span class="text-xs text-charcoal-300">
          第 ${sample.order_index} 号
        </span>
        ${
          sample.invalidate_count > 0
            ? `
          <span class="text-xs text-copper-300">
            重评 ${sample.invalidate_count}/${MAX_INVALIDATE_COUNT}
          </span>
        `
            : ""
        }
      </div>
    </div>
  `;
}

function renderCurrentSample(
  sample: Sample,
  standards: StandardScores,
  existingScore: Score | null,
  user: SessionUser
): string {
  if (sample.status === "invalid") {
    return `
      <div class="card text-center py-12">
        <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-copper-400/20 flex items-center justify-center">
          <span class="text-4xl">⚠️</span>
        </div>
        <h3 class="font-serif text-xl font-bold text-copper-300 mb-2">样本已作废</h3>
        <p class="text-charcoal-200 text-sm">该样本已作废，请选择下一个样本继续审评。</p>
      </div>
    `;
  }

  if (sample.sip_valid !== null) {
    return renderScoringSection(sample, standards, existingScore, user);
  } else if (sample.spoon_verified) {
    return renderSipSection(sample);
  } else {
    return renderSpoonSection(sample);
  }
}

function renderSpoonSection(sample: Sample): string {
  return `
    <div class="card">
      <div class="text-center py-8">
        <h3 class="font-serif text-2xl font-bold text-amber-200 mb-2">
          ${sample.sample_code}
        </h3>
        <p class="text-charcoal-200 mb-8">第一步：勺量校验</p>

        <div class="relative w-64 h-64 mx-auto mb-8">
          <div class="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/10 border-4 border-amber-400/30 flex items-center justify-center">
            <div class="text-center">
              <p class="text-6xl font-serif font-bold text-amber-300 glow-text">2.5</p>
              <p class="text-amber-200 text-lg mt-2">克</p>
              <p class="text-charcoal-200 text-sm">标准勺量</p>
            </div>
          </div>
          <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-charcoal-600 px-4 py-1 rounded-full text-xs text-amber-200 border border-charcoal-400">
            标准量勺
          </div>
        </div>

        <p class="text-charcoal-200 text-sm mb-8 max-w-md mx-auto">
          请使用标准 2.5 克量勺取茶。确认取茶量准确无误后，点击下方按钮开始啜饮审评。
        </p>

        <button
          hx-post="/cupping/${sample.batch_id}/sample/${sample.id}/verify-spoon"
          hx-target="#cupping-main"
          hx-swap="innerHTML"
          hx-headers='{"Content-Type": "application/x-www-form-urlencoded"}'
          class="btn-primary text-lg px-10 py-4"
        >
          ✓ 勺量确认，开始啜饮
        </button>

        ${
          sample.invalidate_count > 0
            ? `
          <p class="text-copper-300 text-sm mt-4">
            ⚠️ 已重评 ${sample.invalidate_count} 次，最多 ${MAX_INVALIDATE_COUNT} 次
          </p>
        `
            : ""
        }
      </div>
    </div>
  `;
}

function renderSipSection(sample: Sample): string {
  const thresholdSec = SIP_DURATION_THRESHOLD_MS / 1000;

  return `
    <div class="card" id="sip-container">
      <div class="text-center py-6">
        <h3 class="font-serif text-2xl font-bold text-amber-200 mb-2">
          ${sample.sample_code}
        </h3>
        <p class="text-charcoal-200 mb-6">第二步：啜饮计时</p>
      </div>

      <div class="flex flex-col items-center py-8">
        <div class="relative w-72 h-72 mb-8">
          <svg class="w-full h-full -rotate-90" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="90"
              stroke="currentColor"
              class="text-charcoal-500"
              stroke-width="8"
              fill="none"
            />
            <circle
              id="timer-ring"
              cx="100"
              cy="100"
              r="90"
              stroke="currentColor"
              class="text-amber-400 timer-ring"
              stroke-width="8"
              fill="none"
              stroke-linecap="round"
              style="stroke-dashoffset: 565.48;"
            />
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span id="timer-display" class="text-5xl font-serif font-bold text-amber-300 glow-text">
              0.00
            </span>
            <p class="text-charcoal-200 text-sm mt-2">秒</p>
            <p class="text-charcoal-300 text-xs mt-1">
              阈值 ${thresholdSec}s
            </p>
          </div>
        </div>

        <div class="w-full max-w-md mb-8">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-charcoal-200">麦克风音量</span>
            <span id="volume-display" class="text-sm text-amber-300">— dB</span>
          </div>
          <div class="h-3 bg-charcoal-600 rounded-full overflow-hidden">
            <div
              id="volume-bar"
              class="h-full bg-gradient-to-r from-tea-400 to-amber-400 transition-all duration-75"
              style="width: 0%"
            ></div>
          </div>
          <div class="flex justify-between text-xs text-charcoal-300 mt-1">
            <span>0 dB</span>
            <span class="text-copper-300">阈值 ${VOLUME_THRESHOLD_DB} dB</span>
            <span>100 dB</span>
          </div>
        </div>

        <div id="sip-controls" class="flex gap-4">
          <button
            id="start-sip-btn"
            class="btn-primary text-lg px-10 py-4"
            onclick="startSipRecording()"
          >
            开始啜饮
          </button>
          <button
            id="end-sip-btn"
            class="btn-danger text-lg px-10 py-4 hidden"
            onclick="endSipRecording()"
          >
            结束啜饮
          </button>
          <button
            id="cancel-sip-btn"
            class="btn-secondary text-lg px-10 py-4 hidden"
            onclick="cancelSipRecording()"
          >
            取消
          </button>
        </div>

        <div id="sip-result" class="mt-6 hidden"></div>
      </div>

      <div class="mt-6 pt-6 border-t border-charcoal-400">
        <div class="flex items-center justify-between text-sm">
          <span class="text-charcoal-200">啜饮时长阈值</span>
          <span class="text-amber-100">${thresholdSec} 秒</span>
        </div>
        <div class="flex items-center justify-between text-sm mt-2">
          <span class="text-charcoal-200">音量阈值</span>
          <span class="text-amber-100">${VOLUME_THRESHOLD_DB} dB</span>
        </div>
        <div class="flex items-center justify-between text-sm mt-2">
          <span class="text-charcoal-200">最大重评次数</span>
          <span class="text-amber-100">${MAX_INVALIDATE_COUNT} 次</span>
        </div>
      </div>
    </div>

    <script>
      let audioContext = null;
      let analyser = null;
      let microphone = null;
      let isRecording = false;
      let startTime = 0;
      let timerInterval = null;
      let volumeSamples = [];
      let animationFrameId = null;

      async function initAudio() {
        if (audioContext) return true;
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioContext = new (window.AudioContext || window.webkitAudioContext)();
          analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          microphone = audioContext.createMediaStreamSource(stream);
          microphone.connect(analyser);
          return true;
        } catch (e) {
          alert('无法访问麦克风，请检查权限设置。');
          console.error(e);
          return false;
        }
      }

      function getVolume() {
        if (!analyser) return 0;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const average = sum / dataArray.length;
        const db = 20 * Math.log10(average / 255 + 0.001) + 100;
        return Math.max(0, Math.min(100, db));
      }

      function updateVolumeDisplay() {
        if (!isRecording) return;
        const volume = getVolume();
        const clampedVol = Math.max(0, Math.min(100, volume));
        document.getElementById('volume-bar').style.width = clampedVol + '%';
        document.getElementById('volume-display').textContent = volume.toFixed(1) + ' dB';
        volumeSamples.push(volume);
        animationFrameId = requestAnimationFrame(updateVolumeDisplay);
      }

      async function startSipRecording() {
        const ok = await initAudio();
        if (!ok) return;
        
        isRecording = true;
        startTime = Date.now();
        volumeSamples = [];
        
        document.getElementById('start-sip-btn').classList.add('hidden');
        document.getElementById('end-sip-btn').classList.remove('hidden');
        document.getElementById('cancel-sip-btn').classList.remove('hidden');
        
        timerInterval = setInterval(updateTimer, 10);
        updateVolumeDisplay();
      }

      function updateTimer() {
        const elapsed = (Date.now() - startTime) / 1000;
        document.getElementById('timer-display').textContent = elapsed.toFixed(2);
        
        const progress = Math.min(elapsed / ${thresholdSec}, 1);
        const circumference = 2 * Math.PI * 90;
        const offset = circumference * (1 - progress);
        document.getElementById('timer-ring').style.strokeDashoffset = offset;
        
        if (elapsed >= ${thresholdSec}) {
          endSipRecording();
        }
      }

      function endSipRecording() {
        if (!isRecording) return;
        isRecording = false;
        
        clearInterval(timerInterval);
        cancelAnimationFrame(animationFrameId);
        
        const durationMs = Date.now() - startTime;
        const avgVolume = volumeSamples.length > 0
          ? volumeSamples.reduce((a, b) => a + b, 0) / volumeSamples.length
          : 0;
        const peakVolume = volumeSamples.length > 0
          ? Math.max(...volumeSamples)
          : 0;
        const minVolume = volumeSamples.length > 0
          ? Math.min(...volumeSamples)
          : 0;
        const samplesAbove = volumeSamples.filter(v => v >= ${VOLUME_THRESHOLD_DB}).length;

        const formData = new FormData();
        formData.append('duration_ms', durationMs);
        formData.append('avg_volume_db', avgVolume);
        formData.append('peak_volume_db', peakVolume);
        formData.append('min_volume_db', minVolume);
        formData.append('samples_above_threshold', samplesAbove);
        formData.append('total_samples', volumeSamples.length);

        fetch('/cupping/${sample.batch_id}/sample/${sample.id}/end-sip', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(formData).toString(),
        }).then(response => response.text())
          .then(html => {
            document.getElementById('cupping-main').innerHTML = html;
          });
      }

      function cancelSipRecording() {
        isRecording = false;
        clearInterval(timerInterval);
        cancelAnimationFrame(animationFrameId);
        
        document.getElementById('timer-display').textContent = '0.00';
        document.getElementById('volume-bar').style.width = '0%';
        document.getElementById('volume-display').textContent = '— dB';
        document.getElementById('timer-ring').style.strokeDashoffset = 2 * Math.PI * 90;
        
        document.getElementById('start-sip-btn').classList.remove('hidden');
        document.getElementById('end-sip-btn').classList.add('hidden');
        document.getElementById('cancel-sip-btn').classList.add('hidden');
      }
    </script>
  `;
}

function renderScoringSection(
  sample: Sample,
  standards: StandardScores,
  existingScore: Score | null,
  user: SessionUser
): string {
  const sipDurationSec = (sample.sip_duration_ms || 0) / 1000;
  const isValid = sample.sip_valid;

  const appearance = existingScore?.appearance ?? standards.appearance;
  const aroma = existingScore?.aroma ?? standards.aroma;
  const taste = existingScore?.taste ?? standards.taste;
  const leaf = existingScore?.leaf ?? standards.leaf;
  const total = existingScore?.total ?? 0;
  const deviation = existingScore?.deviation ?? 0;

  return `
    <div class="space-y-6">
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-serif text-xl font-bold text-amber-200">
            ${sample.sample_code} · 啜饮结果
          </h3>
          <span
            class="px-3 py-1 rounded-full text-sm font-medium ${
              isValid
                ? "bg-tea-400/20 text-tea-300"
                : "bg-copper-400/20 text-copper-300"
            }"
          >
            ${isValid ? "✓ 合格" : "✗ 不合格"}
          </span>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="p-4 bg-charcoal-600 rounded-md">
            <p class="text-charcoal-200 text-sm">啜饮时长</p>
            <p class="text-2xl font-serif font-bold text-amber-300 mt-1">
              ${sipDurationSec.toFixed(2)} <span class="text-sm font-normal">秒</span>
            </p>
          </div>
          <div class="p-4 bg-charcoal-600 rounded-md">
            <p class="text-charcoal-200 text-sm">平均音量</p>
            <p class="text-2xl font-serif font-bold text-amber-300 mt-1">
              ${sample.avg_volume_db?.toFixed(1)} <span class="text-sm font-normal">dB</span>
            </p>
          </div>
        </div>
        ${
          !isValid
            ? `
          <div class="mt-4 p-4 bg-copper-400/10 border border-copper-400/30 rounded-md">
            <p class="text-copper-300 text-sm">
              ⚠️ 啜饮不合格，该样本需重评。请点击下方按钮作废并重评。
            </p>
          </div>
        `
            : ""
        }
      </div>

      ${
        isValid
          ? `
        <div class="card">
          <h3 class="font-serif text-xl font-bold text-amber-200 mb-6">四轴评分</h3>
          <p class="text-charcoal-200 text-sm mb-6">
            标准样评分参考：外观 ${standards.appearance} · 香气 ${standards.aroma} · 滋味 ${standards.taste} · 叶底 ${standards.leaf}
          </p>

          <form
            hx-post="/cupping/${sample.batch_id}/sample/${sample.id}/score"
            hx-target="#cupping-main"
            hx-swap="innerHTML"
            hx-headers='{"Content-Type": "application/x-www-form-urlencoded"}'
            id="score-form"
            class="space-y-6"
          >
            ${renderScoreAxis("appearance", "外观", appearance, standards.appearance)}
            ${renderScoreAxis("aroma", "香气", aroma, standards.aroma)}
            ${renderScoreAxis("taste", "滋味", taste, standards.taste)}
            ${renderScoreAxis("leaf", "叶底", leaf, standards.leaf)}

            <div class="pt-4 border-t border-charcoal-400">
              <div class="flex items-center justify-between">
                <span class="text-amber-100">总分</span>
                <span id="total-score" class="text-3xl font-serif font-bold text-amber-300 glow-text">
                  ${total.toFixed(1)}
                </span>
              </div>
              <div class="flex items-center justify-between mt-2">
                <span class="text-charcoal-200 text-sm">与标准样偏差</span>
                <span id="deviation-score" class="text-amber-200 text-sm">
                  ${deviation.toFixed(1)} 分
                </span>
              </div>
            </div>

            <div class="flex gap-3">
              <button type="submit" class="btn-primary flex-1">
                提交评分
              </button>
            </div>
          </form>
        </div>
      `
          : `
        <div class="card text-center py-8">
          <p class="text-charcoal-200 mb-6">
            该样本啜饮不合格，需要重评。
            ${
              sample.invalidate_count + 1 <= MAX_INVALIDATE_COUNT
                ? "点击下方按钮作废并重评。"
                : "样本已达最大重评次数。"
            }
          </p>
          ${
            sample.invalidate_count + 1 <= MAX_INVALIDATE_COUNT
              ? `
            <button
              hx-post="/cupping/${sample.batch_id}/sample/${sample.id}/invalidate"
              hx-target="#cupping-main"
              hx-swap="innerHTML"
              hx-headers='{"Content-Type": "application/x-www-form-urlencoded"}'
              hx-confirm="确定要作废并重评该样本吗？"
              class="btn-danger"
            >
              作废并重评
            </button>
          `
              : `
            <p class="text-copper-300">该样本已达最大重评次数，将整批降级。</p>
          `
          }
        </div>
      `
      }
    </div>

    <script>
      const axes = ['appearance', 'aroma', 'taste', 'leaf'];
      const weights = { appearance: 0.2, aroma: 0.3, taste: 0.35, leaf: 0.15 };
      const standards = ${JSON.stringify(standards)};

      function updateTotal() {
        let total = 0;
        let deviationSum = 0;
        axes.forEach(axis => {
          const el = document.getElementById('score-' + axis);
          const val = parseFloat(el.value) || 0;
          total += val * weights[axis];
          deviationSum += Math.abs(val - standards[axis]);
          document.getElementById('value-' + axis).textContent = val.toFixed(1);
        });
        document.getElementById('total-score').textContent = total.toFixed(1);
        document.getElementById('deviation-score').textContent = (deviationSum / 4).toFixed(1) + ' 分';
      }

      axes.forEach(axis => {
        const el = document.getElementById('score-' + axis);
        if (el) el.addEventListener('input', updateTotal);
      });
    </script>
  `;
}

function renderScoreAxis(
  name: string,
  label: string,
  value: number,
  standard: number
): string {
  const deviation = value - standard;
  const inTolerance = Math.abs(deviation) <= DEVIATION_TOLERANCE;

  return `
    <div>
      <div class="flex items-center justify-between mb-2">
        <label class="text-amber-100 font-medium">${label}</label>
        <div class="flex items-center gap-2">
          <span id="value-${name}" class="text-amber-300 font-bold">${value.toFixed(
    1
  )}</span>
          <span class="text-xs ${
    inTolerance ? "text-tea-300" : "text-copper-300"
  }">
            ${deviation >= 0 ? "+" : ""}${deviation.toFixed(1)}
          </span>
        </div>
      </div>
      <input
        type="range"
        id="score-${name}"
        name="${name}"
        min="0"
        max="100"
        step="0.5"
        value="${value}"
        class="w-full h-2 bg-charcoal-600 rounded-lg appearance-none cursor-pointer accent-amber-400"
      />
      <div class="flex justify-between text-xs text-charcoal-300 mt-1">
        <span>0</span>
        <span class="text-amber-300/50">标准: ${standard}</span>
        <span>100</span>
      </div>
      <div class="h-1 bg-charcoal-500 rounded mt-1">
        <div
          class="h-1 bg-amber-400/30 rounded"
          style="margin-left: ${standard - DEVIATION_TOLERANCE}%; width: ${DEVIATION_TOLERANCE * 2}%"
        ></div>
      </div>
    </div>
  `;
}

function renderBatchComplete(batch: Batch): string {
  const isDowngraded = batch.status === "downgraded";

  return `
    <div class="card text-center py-16">
      <div class="w-24 h-24 mx-auto mb-6 rounded-full bg-tea-400/20 flex items-center justify-center">
        <span class="text-5xl">✓</span>
      </div>
      <h3 class="font-serif text-2xl font-bold text-tea-300 mb-4">
        所有样本审评完成
      </h3>
      <p class="text-charcoal-200 mb-8">
        该批次所有样本已完成审评。
        ${isDowngraded ? "批次已降级。" : ""}
      </p>
      <div class="flex gap-4 justify-center">
        <a
          href="/cupping/${batch.id}/certificate"
          class="btn-primary"
        >
          查看拍卖证书
        </a>
      </div>
    </div>
  `;
}

export function renderSamplePartial(
  sample: Sample,
  standards: StandardScores,
  existingScore: Score | null,
  user: SessionUser
): string {
  return renderCurrentSample(sample, standards, existingScore, user);
}
