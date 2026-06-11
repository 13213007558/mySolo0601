import { useEffect, useRef, useState } from 'react';
import { useStationStore, type RosterRow } from '../stores/station';
import { WEAR_META } from '../types';
import { WEAR_ORDER, wearBadgeColor, r1, computeLineAngle, formatCountdown, diffAngle, DIFF_THRESHOLD } from '../utils/station';
import WearThumb from './WearThumb';
import {
  Camera, CameraOff, Crosshair, ScanLine, AlertTriangle, TriangleAlert,
  Lock, Unlock, RotateCcw, CheckCircle2, Flag, Scale, TrendingUp, Eye,
  Target, QrCode, Download, ChevronDown
} from 'lucide-react';
import { SESSIONS } from '../data/sessions';
import jsPDF from 'jspdf';

const VIEW_W = 640;
const VIEW_H = 480;

function fmt(v: number) { return v.toFixed(1); }

export default function BladeCaptureIsland() {
  const [, forceTick] = useState(0);
  const init = useStationStore(s => s.init);
  useEffect(() => { init(); }, [init]);

  // 赛事倒计时 & 锁
  const session = SESSIONS[0];
  const countdown = formatCountdown(session.startTime);
  const [lockFired, setLockFired] = useState<boolean>(() => {
    try { return localStorage.getItem('blade-station.lock-' + session.id) === '1'; } catch { return false; }
  });
  const locked = countdown.locked || lockFired;

  useEffect(() => {
    const t = setInterval(() => forceTick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (countdown.inLockWindow && !lockFired) {
      localStorage.setItem('blade-station.lock-' + session.id, '1');
      setLockFired(true);
    }
  }, [countdown.inLockWindow]);

  const roster = useStationStore(s => s.roster);
  const capture = useStationStore(s => s.capture);
  const selectAthlete = useStationStore(s => s.selectAthlete);
  const setAngles = useStationStore(s => s.setAngles);
  const setWear = useStationStore(s => s.setWear);
  const setAnchors = useStationStore(s => s.setAnchors);
  const setCaptureLive = useStationStore(s => s.setCaptureLive);
  const submitCapture = useStationStore(s => s.submitCapture);
  const togglePostpone = useStationStore(s => s.togglePostpone);
  const removeCurrent = useStationStore(s => s.removeCurrentCheck);
  const isOverLimitFor = useStationStore(s => s.isOverLimitFor);
  const setCalibrated = useStationStore(s => s.setCalibrated);

  const [toast, setToast] = useState<string>('');
  const [qrInput, setQrInput] = useState('');
  const [wearOpen, setWearOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<'a1' | 'a2' | null>(null);

  const selected: RosterRow | undefined = roster.find(r => r.athleteId === capture.selectedAthleteId);
  const overLimitCur = isOverLimitFor(capture.angleLeft, capture.angleRight, selected?.lastCheck || null);

  // 侧摄
  useEffect(() => {
    let raf = 0;
    let stream: MediaStream | null = null;
    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: VIEW_W, height: VIEW_H } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch {
        // 降级：canvas 内绘制 Mock 冰刀
      }
      function loop() {
        drawOverlay();
        raf = requestAnimationFrame(loop);
      }
      loop();
    }
    if (capture.isLive) start();
    return () => {
      cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [capture.isLive, capture.anchor1, capture.anchor2, capture.angleLeft, capture.angleRight]);

  function drawOverlay() {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    if (!capture.isLive) {
      // Mock 冰刀底图
      const grd = ctx.createLinearGradient(0, 0, VIEW_W, VIEW_H);
      grd.addColorStop(0, 'rgba(14,165,233,0.05)');
      grd.addColorStop(1, 'rgba(6,34,52,0.6)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.strokeStyle = 'rgba(56,189,248,0.25)';
      ctx.lineWidth = 1;
      for (let y = 0; y < VIEW_H; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VIEW_W, y); ctx.stroke(); }
      for (let x = 0; x < VIEW_W; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, VIEW_H); ctx.stroke(); }
      // 画一条斜的模拟冰刀
      ctx.strokeStyle = 'rgba(186,230,253,0.9)';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(capture.anchor1[0], capture.anchor1[1]);
      ctx.lineTo(capture.anchor2[0], capture.anchor2[1]);
      ctx.stroke();
    }

    // 0° 基准线
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(56,189,248,0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, capture.anchor1[1]);
    ctx.lineTo(VIEW_W, capture.anchor1[1]);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = 'rgba(56,189,248,0.95)';
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText('0° BASELINE', 10, capture.anchor1[1] - 6);

    // 刃口轮廓 SVG style 圆弧
    const [x1, y1] = capture.anchor1;
    const [x2, y2] = capture.anchor2;
    const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2;
    const ang = computeLineAngle(capture.anchor1, capture.anchor2);
    // 圆弧
    const r = 80;
    ctx.strokeStyle = overLimitCur ? 'rgba(239,68,68,0.85)' : 'rgba(16,185,129,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x1, y1, r, 0, -ang * Math.PI / 180, true);
    ctx.stroke();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillText(`${ang.toFixed(1)}°`, x1 + r * 0.6, y1 - r * 0.2);

    // 锚点
    [[x1, y1, 'A'], [x2, y2, 'B']].forEach(([x, y, tag], i) => {
      ctx.fillStyle = overLimitCur ? '#EF4444' : '#0EA5E9';
      ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#E0F2FE'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#082F49';
      ctx.font = 'bold 10px "JetBrains Mono"';
      ctx.fillText(tag as string, x - 3, y + 4);
    });

    // 同步角度到左侧读数
    const angL = r1(ang + (capture.anchor2[1] < capture.anchor1[1] ? 0 : 0));
    if (Math.abs(angL - capture.angleLeft) > 0.05) {
      // 轻量同步（避免重绘循环）—— 直接由用户拖动锚点触发外部同步
    }
  }

  function pointerDown(e: React.PointerEvent) {
    const rect = viewRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (VIEW_W / rect.width);
    const y = (e.clientY - rect.top) * (VIEW_H / rect.height);
    const d = (p: [number, number]) => Math.hypot(p[0] - x, p[1] - y);
    if (d(capture.anchor1) < 14) draggingRef.current = 'a1';
    else if (d(capture.anchor2) < 14) draggingRef.current = 'a2';
    if (draggingRef.current) (e.target as Element).setPointerCapture(e.pointerId);
  }
  function pointerMove(e: React.PointerEvent) {
    if (!draggingRef.current) return;
    const rect = viewRef.current!.getBoundingClientRect();
    const x = Math.max(6, Math.min(VIEW_W - 6, (e.clientX - rect.left) * (VIEW_W / rect.width)));
    const y = Math.max(6, Math.min(VIEW_H - 6, (e.clientY - rect.top) * (VIEW_H / rect.height)));
    let a1 = capture.anchor1, a2 = capture.anchor2;
    if (draggingRef.current === 'a1') a1 = [x, y]; else a2 = [x, y];
    setAnchors(a1, a2);
    // 同步角度（锚连线与水平线夹角 → 刃口法向补角 90°-ang）
    const ang = computeLineAngle(a1, a2);
    const bladeAngle = r1(Math.max(84, Math.min(92, 90 - ang + 88)));
    // 给左右刃加一个微差（模拟左右不对称）
    setAngles(bladeAngle, r1(bladeAngle - 0.6 + Math.random() * 1.2));
  }
  function pointerUp() { draggingRef.current = null; }

  function onSubmit() {
    const res = submitCapture();
    if (!res.ok) { setToast(res.reason || '提交失败'); setTimeout(() => setToast(''), 2500); return; }
    setToast('✓ 刃角数据已提交检录');
    setTimeout(() => setToast(''), 2500);
  }

  function onQRGo() {
    const qr = qrInput.trim();
    if (!qr) return;
    const row = roster.find(r => r.bladeQr === qr);
    if (row) { selectAthlete(row.athleteId); setToast('已定位：' + row.athleteName); setTimeout(() => setToast(''), 2000); setQrInput(''); }
    else { setToast('未找到该冰刀 QR'); setTimeout(() => setToast(''), 2500); }
  }

  function exportISU() {
    const rows = roster.filter(r => r.currentCheck);
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('ISU OFFICIAL BLADE EDGE CHECK-IN ROSTER', 40, 50);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Event: ${session.eventName}`, 40, 72);
    doc.text(`Session: ${session.sessionName}`, 40, 88);
    doc.text(`Start: ${new Date(session.startTime).toLocaleString('zh-CN')}`, 40, 104);
    doc.text(`Exported At: ${new Date().toLocaleString('zh-CN')}`, 40, 120);

    const cols = [40, 70, 200, 260, 330, 380, 440, 520];
    const headers = ['No', 'ISU ID', 'Name', 'Country', 'L(°)', 'R(°)', 'Wear', 'Status'];
    let y = 160;
    doc.setFont('helvetica', 'bold');
    headers.forEach((h, i) => doc.text(h, cols[i], y));
    doc.setFont('helvetica', 'normal');
    y += 14;
    rows.forEach((r, i) => {
      const cc = r.currentCheck!;
      const we = WEAR_META[cc.wear].label;
      const st = (cc.postponeTag ? 'POSTPONE ' : '') + (r.overLimit ? 'OVER-LIMIT' : 'PASS');
      const cells = [String(i + 1), r.isuId, r.athleteName, r.country,
        cc.angleLeft.toFixed(1), cc.angleRight.toFixed(1), we, st];
      cells.forEach((t, idx) => doc.text(t, cols[idx], y));
      y += 14;
      if (y > 780) { doc.addPage(); y = 60; }
    });
    doc.setFontSize(9); doc.setTextColor(100);
    doc.text('Signature (Checker): _________________', 40, 820);
    doc.text('Signature (Coach): _________________', 320, 820);
    doc.save(`ISU-Roster-${session.id}-${new Date().toISOString().slice(0,10)}.pdf`);
  }

  // 磨损下拉
  const wMeta = WEAR_META[capture.wear];

  return (
    <div className="p-6 space-y-5">
      {/* 赛事状态条 */}
      <div className="ice-card rounded-sm px-5 py-3 flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className={`grid place-items-center w-9 h-9 rounded-sm border ${countdown.inLockWindow || locked ? 'border-rose-400/50 bg-rose-500/15' : 'border-ice-400/40 bg-ice-500/15'}`}>
            {locked || countdown.inLockWindow ? <Lock size={18} className={locked ? 'text-rose-400' : 'text-amber-400 animate-pulse2x'} /> : <Unlock size={18} className="text-ice-300" />}
          </div>
          <div>
            <div className="text-sm text-frost font-semibold">{session.eventName}</div>
            <div className="text-[11px] text-ice-200 mt-0.5">{session.sessionName} · 开赛 {new Date(session.startTime).toLocaleTimeString('zh-CN', { hour12: false })}</div>
          </div>
        </div>
        <div className="h-8 w-px bg-ice-700/60" />
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] uppercase tracking-widest text-ice-200">距开赛</span>
          <span className={`font-mono font-bold text-2xl tabular-nums ${locked ? 'text-rose-400' : countdown.inLockWindow ? 'text-amber-400 animate-pulse2x' : 'text-ice-200'}`}>{countdown.text}</span>
          {(countdown.inLockWindow || locked) && (
            <span className="status-chip ml-2 bg-rose-500/20 text-rose-300 border border-rose-400/40">
              <Lock size={11} /> 赛前 30 分钟名单已锁
            </span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={exportISU} className="ice-btn">
            <Download size={15} /> 导出 ISU PDF
          </button>
          <button onClick={() => setCalibrated(true)} className="ice-btn ice-btn--ghost">
            <Target size={15} /> {capture.calibrated ? '已校零' : '标记已校零'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* 左：检录表 */}
        <section className="col-span-7 ice-card rounded-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-ice-700/60 flex items-center gap-3 bg-ice-950/40">
            <ScanLine size={16} className="text-ice-300" />
            <h2 className="font-display text-sm tracking-widest text-frost">检录名单 · ROSTER</h2>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <QrCode size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ice-300" />
                <input
                  className="ice-input pl-8 w-60"
                  placeholder="扫/输入冰刀 QR 快速定位…"
                  value={qrInput}
                  onChange={e => setQrInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') onQRGo(); }}
                  disabled={locked}
                />
              </div>
              <button className="ice-btn" onClick={onQRGo} disabled={locked}>定位</button>
            </div>
          </div>

          <div className="max-h-[70vh] overflow-auto">
            <table className="check-table">
              <thead>
                <tr>
                  <th style={{ width: 46 }}>#</th>
                  <th>冰刀 QR · 运动员</th>
                  <th>本次刃角 °</th>
                  <th>上次刃角 °</th>
                  <th>差值 Δ°</th>
                  <th>磨损</th>
                  <th>标签</th>
                  <th style={{ width: 150 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((r, idx) => {
                  const cc = r.currentCheck;
                  const pc = r.lastCheck;
                  const dL = cc && pc ? diffAngle(cc.angleLeft, pc.angleLeft) : null;
                  const dR = cc && pc ? diffAngle(cc.angleRight, pc.angleRight) : null;
                  const over = r.overLimit;
                  const wb = cc ? wearBadgeColor(cc.wear) : null;
                  const isSel = capture.selectedAthleteId === r.athleteId;
                  return (
                    <tr key={r.athleteId} className={`${over ? 'row-overlimit' : ''} ${isSel ? '!bg-ice-500/10' : ''}`}>
                      <td className="text-ice-300 text-xs">{String(idx + 1).padStart(2, '0')}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{r.flag}</span>
                          <div>
                            <div className="text-frost font-semibold text-sm">{r.athleteName}</div>
                            <div className="text-[11px] text-ice-300 font-mono">{r.bladeQr} · {r.isuId}</div>
                          </div>
                          {r.athleteId === 'ath-002' && (
                            <span className="status-chip bg-rose-500/20 text-rose-300 border border-rose-400/40 ml-2" title="存在禁赛记录">禁</span>
                          )}
                        </div>
                      </td>
                      <td className="font-mono">
                        {cc
                          ? <span className={over ? 'text-rose-300 font-bold' : 'text-ice-100'}>L {fmt(cc.angleLeft)} / R {fmt(cc.angleRight)}</span>
                          : <span className="text-ice-500">—</span>}
                      </td>
                      <td className="font-mono text-ice-200">
                        {pc ? `L ${fmt(pc.angleLeft)} / R ${fmt(pc.angleRight)}` : <span className="text-ice-500">—</span>}
                      </td>
                      <td className="font-mono">
                        {dL !== null && dR !== null
                          ? (
                            <span className={`inline-flex items-center gap-1 ${(dL > DIFF_THRESHOLD || dR > DIFF_THRESHOLD) ? 'text-rose-300 font-bold' : 'text-emerald-300'}`}>
                              <TrendingUp size={12} /> L {fmt(dL)} / R {fmt(dR)}
                            </span>
                          )
                          : <span className="text-ice-500">—</span>}
                      </td>
                      <td>
                        {wb && (
                          <span className={`status-chip border ${wb.bg} ${wb.border} ${wb.text}`}>
                            <span className={`w-2 h-2 rounded-full ${wb.text.replace('text-', 'bg-')}`} />
                            {WEAR_META[cc!.wear].label}
                          </span>
                        )}
                      </td>
                      <td>
                        {cc?.postponeTag && (
                          <span className="status-chip bg-amber-500/20 text-amber-300 border border-amber-400/50">暂缓参赛</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button className="ice-btn ice-btn--ghost !px-2 !py-1" disabled={locked}
                            onClick={() => selectAthlete(r.athleteId)}>
                            <Eye size={13} />
                          </button>
                          {over && (
                            <label className={`ice-btn !px-2 !py-1 ${cc?.postponeTag ? '!bg-amber-500/30 !border-amber-400/60' : ''}`} title="教练勾选">
                              <input type="checkbox" className="mr-1 accent-amber-500"
                                disabled={locked}
                                checked={!!cc?.postponeTag}
                                onChange={() => togglePostpone(r.athleteId)} />
                              暂缓
                            </label>
                          )}
                          {cc && (
                            <button className="ice-btn ice-btn--ghost !px-2 !py-1" disabled={locked} onClick={() => removeCurrent(r.athleteId)}>
                              <RotateCcw size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* 右：采集岛 */}
        <section className="col-span-5 space-y-4">
          <div className="ice-card rounded-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Crosshair size={16} className="text-ice-300" />
                <h2 className="font-display text-sm tracking-widest text-frost">刃角采集 · CAPTURE</h2>
              </div>
              <button onClick={() => setCaptureLive(!capture.isLive)} className={`ice-btn ${capture.isLive ? 'ice-btn--danger' : ''}`}>
                {capture.isLive ? <><CameraOff size={14} /> 关闭侧摄</> : <><Camera size={14} /> 开启侧摄</>}
              </button>
            </div>

            <div className="relative rounded-sm overflow-hidden border border-ice-500/40" ref={viewRef}
              style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}`, background: '#051825' }}
              onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}>
              <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-80" muted playsInline />
              <canvas ref={canvasRef} width={VIEW_W} height={VIEW_H} className="absolute inset-0 w-full h-full" />
              <div className="corner-tl" /><div className="corner-tr" /><div className="corner-bl" /><div className="corner-br" />
              <div className="absolute top-2 left-2 status-chip bg-ice-950/70 text-ice-200 border border-ice-400/40 backdrop-blur-sm">
                <Target size={11} /> 拖动锚点 A · B 对齐刃口
              </div>
              <div className="absolute top-2 right-2 status-chip bg-ice-950/70 text-ice-200 border border-ice-400/40 backdrop-blur-sm font-mono text-[11px]">
                {capture.calibrated ? '✓ CAL' : '⚠ NO CAL'} · 0.1° STEP
              </div>
              {!selected && (
                <div className="absolute inset-0 grid place-items-center">
                  <div className="ice-card px-5 py-4 text-center">
                    <div className="text-ice-200 text-xs uppercase tracking-widest mb-1">未选中运动员</div>
                    <div className="text-ice-400 text-sm">在左侧点击 <Eye size={12} className="inline" /> 或扫冰刀 QR 开始采集</div>
                  </div>
                </div>
              )}
            </div>

            {/* 选中信息 + 差值 */}
            {selected && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="ice-card p-3 rounded-sm">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-ice-200 mb-2">
                    <Flag size={12} /> 当前选中
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{selected.flag}</span>
                    <div>
                      <div className="text-frost text-sm font-semibold leading-tight">{selected.athleteName}</div>
                      <div className="font-mono text-[11px] text-ice-300">{selected.bladeQr}</div>
                    </div>
                  </div>
                </div>
                <div className="ice-card p-3 rounded-sm">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-ice-200 mb-2">
                    <Scale size={12} /> 对比上次
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <div className="text-ice-400 text-[10px]">L</div>
                      <div className="text-frost">{selected.lastCheck ? fmt(selected.lastCheck.angleLeft) : '—'}</div>
                      <div className={`${Math.abs(capture.angleLeft - (selected.lastCheck?.angleLeft || 0)) > DIFF_THRESHOLD ? 'text-rose-400 font-bold' : 'text-emerald-300'}`}>
                        {selected.lastCheck ? `Δ ${fmt(Math.abs(capture.angleLeft - selected.lastCheck.angleLeft))}` : ''}
                      </div>
                    </div>
                    <div>
                      <div className="text-ice-400 text-[10px]">R</div>
                      <div className="text-frost">{selected.lastCheck ? fmt(selected.lastCheck.angleRight) : '—'}</div>
                      <div className={`${Math.abs(capture.angleRight - (selected.lastCheck?.angleRight || 0)) > DIFF_THRESHOLD ? 'text-rose-400 font-bold' : 'text-emerald-300'}`}>
                        {selected.lastCheck ? `Δ ${fmt(Math.abs(capture.angleRight - selected.lastCheck.angleRight))}` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 角度滑块 + 磨损 */}
            {selected && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {(['angleLeft', 'angleRight'] as const).map((k, i) => (
                    <div key={k}>
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider mb-1.5">
                        <span className="text-ice-200">{i === 0 ? '左刃 · LEFT' : '右刃 · RIGHT'}</span>
                        <span className={`font-mono text-2xl font-bold tabular-nums ${
                          selected.lastCheck && diffAngle(capture[k], selected.lastCheck[k === 'angleLeft' ? 'angleLeft' : 'angleRight']) > DIFF_THRESHOLD
                            ? 'text-rose-400 animate-pulse2x' : 'text-ice-100'
                        }`}>
                          {fmt(capture[k])}°
                        </span>
                      </div>
                      <input
                        type="range" min={84} max={92} step={0.1}
                        value={capture[k]}
                        onChange={e => {
                          const v = parseFloat(e.target.value);
                          setAngles(k === 'angleLeft' ? v : capture.angleLeft, k === 'angleRight' ? v : capture.angleRight);
                        }}
                        disabled={locked}
                        className="w-full accent-sky-400"
                      />
                      <div className="flex justify-between text-[10px] text-ice-500 font-mono"><span>84</span><span>88</span><span>92</span></div>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="text-[11px] uppercase tracking-wider text-ice-200 mb-2">磨损分级 · WEAR LEVEL</div>
                  <div className="relative">
                    <button type="button" disabled={locked}
                      onClick={() => setWearOpen(v => !v)}
                      className="ice-btn w-full justify-between !py-2.5">
                      <span className="flex items-center gap-2.5">
                        <WearThumb level={capture.wear} size={28} />
                        <span className="text-left">
                          <span className={`status-chip border ${wearBadgeColor(capture.wear).bg} ${wearBadgeColor(capture.wear).border} ${wearBadgeColor(capture.wear).text} mb-0.5`}>{wMeta.label}</span>
                          <div className="text-[11px] text-ice-200">{wMeta.desc}</div>
                        </span>
                      </span>
                      <ChevronDown size={16} className={`transition ${wearOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {wearOpen && (
                      <div className="absolute z-20 top-full mt-1 w-full ice-card rounded-sm p-1.5">
                        {WEAR_ORDER.map(w => {
                          const m = WEAR_META[w];
                          const wc = wearBadgeColor(w);
                          return (
                            <button key={w} onClick={() => { setWear(w); setWearOpen(false); }}
                              className={`w-full text-left flex items-center gap-3 p-2 rounded-sm hover:bg-ice-500/10 ${capture.wear === w ? 'bg-ice-500/10 ring-1 ring-inset ' + wc.border : ''}`}>
                              <WearThumb level={w} size={32} />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={`status-chip border ${wc.bg} ${wc.border} ${wc.text}`}>{m.label}</span>
                                </div>
                                <div className="text-[11px] text-ice-200 mt-0.5">{m.desc}</div>
                              </div>
                              {capture.wear === w && <CheckCircle2 size={14} className="text-ice-300" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {overLimitCur && (
                  <div className="ice-card rounded-sm p-3 border-rose-500/60 bg-rose-500/10 flex items-start gap-3">
                    <TriangleAlert size={18} className="text-rose-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-rose-200 leading-relaxed">
                      <div className="font-semibold text-rose-300 mb-1">刃角差值超限（＞ 5°）</div>
                      <div>已自动锁定检录提交。必须由教练勾选「暂缓参赛」标签后，方可提交。<a className="underline hover:text-rose-100" href="/athletes/ath-002">查阅该运动员禁赛史 →</a></div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={onSubmit}
                    disabled={!selected || locked || (overLimitCur && !(selected && selected.currentCheck?.postponeTag))}
                    className="ice-btn flex-1 !py-2.5 text-sm font-semibold">
                    <CheckCircle2 size={16} /> 提交检录
                  </button>
                  <button className="ice-btn ice-btn--ghost" onClick={() => selectAthlete(selected!.athleteId)} disabled={!selected || locked}>
                    <RotateCcw size={14} /> 复位
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 合规提示 */}
          <div className="ice-card rounded-sm p-4 text-[11px] text-ice-200 space-y-1.5 leading-relaxed">
            <div className="text-frost font-semibold text-xs mb-1 flex items-center gap-1.5">
              <AlertTriangle size={13} className="text-amber-400" /> 合规约束
            </div>
            <div>• 赛前 <strong className="text-amber-300">30 分钟</strong> 自动锁名单，不可再改动</div>
            <div>• 刃角 Δ ＞ <strong className="text-rose-300">5°</strong> 整行标红，必须教练挂「暂缓参赛」标签</div>
            <div>• <strong className="text-ice-300">检录员与教练不可同人</strong>，系统已按登录角色隔离权限</div>
          </div>
        </section>
      </div>

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 ice-card px-5 py-3 rounded-sm text-sm shadow-ice animate-pulse2x">
          {toast}
        </div>
      )}
    </div>
  );
}
