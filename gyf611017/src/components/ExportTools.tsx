import React, { useState } from 'react';
import { useStoneStore } from '@/store/useStoneStore';
import { Download, Image as ImageIcon, FileCode, Loader2, CheckCircle, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';

interface ExportToolsProps {
  className?: string;
}

export const ExportTools: React.FC<ExportToolsProps> = ({ className = '' }) => {
  const { getCurrentStone } = useStoneStore();
  const [exporting, setExporting] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const stone = getCurrentStone();

  if (!stone) return null;

  const triggerSuccess = (type: string) => {
    setSuccess(type);
    setTimeout(() => setSuccess(null), 2000);
  };

  const exportAsSVG = async () => {
    const plotEl = document.querySelector('#plot-board-container svg');
    if (!plotEl) return;
    setExporting('svg');

    try {
      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(plotEl);

      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${stone.certificateNo}_内含物标记图.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      triggerSuccess('svg');
    } catch (err) {
      console.error('SVG export failed:', err);
    } finally {
      setExporting(null);
    }
  };

  const exportAsPNG = async (withPhoto: boolean = false) => {
    const container = document.querySelector('#plot-board-container');
    if (!container) return;
    const type = withPhoto ? 'png-photo' : 'png';
    setExporting(type);

    try {
      const svgEl = container.querySelector('svg') as SVGSVGElement;
      const canvas = document.createElement('canvas');
      const scale = 2;
      const size = 1000;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      if (withPhoto) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = stone.imageUrl;
        });
        ctx.save();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 20, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, 0, 0, size, size);
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 20, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(15,23,42,0.15)';
        ctx.fill();
        ctx.restore();
      } else {
        const gradient = ctx.createRadialGradient(size / 2, size * 0.35, 0, size / 2, size / 2, size / 2);
        gradient.addColorStop(0, 'rgba(255,255,255,0.95)');
        gradient.addColorStop(0.4, 'rgba(226,232,240,0.9)');
        gradient.addColorStop(0.75, 'rgba(148,163,184,0.75)');
        gradient.addColorStop(1, 'rgba(100,116,139,0.6)');

        ctx.save();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 20, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();
      }

      const svgData = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const svgImg = new Image();
      svgImg.crossOrigin = 'anonymous';
      await new Promise<void>((resolve) => {
        svgImg.onload = () => resolve();
        svgImg.src = url;
      });
      ctx.drawImage(svgImg, 0, 0, size, size);
      URL.revokeObjectURL(url);

      ctx.save();
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.fillStyle = '#D4AF37';
      ctx.textAlign = 'left';
      ctx.fillText(`证书编号: ${stone.certificateNo}`, 30, size - 65);
      ctx.font = '16px Inter, sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText(`钻石内含Plot台 · ${stone.carat}ct · ${stone.color}色 · ${stone.clarity}`, 30, size - 35);

      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `${stone.certificateNo}_内含物标记图${withPhoto ? '_叠加照片' : ''}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      triggerSuccess(type);
    } catch (err) {
      console.error('PNG export failed:', err);
      try {
        const container2 = document.querySelector('#plot-board-container');
        if (container2) {
          const canvas2 = await html2canvas(container2 as HTMLElement, {
            backgroundColor: '#0F172A',
            scale: 2,
          });
          const url2 = canvas2.toDataURL('image/png');
          const link2 = document.createElement('a');
          link2.href = url2;
          link2.download = `${stone.certificateNo}_标记图.png`;
          link2.click();
          triggerSuccess(type);
        }
      } catch (e2) {
        console.error('Fallback export also failed:', e2);
      }
    } finally {
      setExporting(null);
    }
  };

  const exportDataJSON = () => {
    setExporting('json');
    const exportObj = {
      certificateNo: stone.certificateNo,
      carat: stone.carat,
      color: stone.color,
      clarity: stone.clarity,
      exportedAt: new Date().toISOString(),
      inclusions: stone.inclusions.map(inc => ({
        type: inc.type,
        position: { x: inc.x, y: inc.y },
        color: inc.color,
        notes: inc.notes,
      })),
      progress: stone.progress,
      fieldMappings: stone.fieldMappings,
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${stone.certificateNo}_对标数据.json`;
    link.click();
    URL.revokeObjectURL(url);
    setExporting(null);
    triggerSuccess('json');
  };

  const tools = [
    {
      id: 'png-photo',
      label: 'PNG叠加照片',
      desc: '位图格式 · 打印推荐',
      icon: Share2,
      color: 'from-emerald-500 to-teal-500',
      onClick: () => exportAsPNG(true),
      disabled: !stone?.submittedAt && stone?.progress < 100,
    },
    {
      id: 'png',
      label: 'PNG纯标记图',
      desc: '位图格式 · 邮件附件',
      icon: ImageIcon,
      color: 'from-blue-500 to-indigo-500',
      onClick: () => exportAsPNG(false),
      disabled: false,
    },
    {
      id: 'svg',
      label: 'SVG矢量图',
      desc: '无限缩放 · 排版打印',
      icon: FileCode,
      color: 'from-purple-500 to-fuchsia-500',
      onClick: exportAsSVG,
      disabled: false,
    },
    {
      id: 'json',
      label: '导出JSON数据',
      desc: '结构化数据 · 系统对接',
      icon: Download,
      color: 'from-slate-500 to-slate-600',
      onClick: exportDataJSON,
      disabled: false,
    },
  ];

  return (
    <div className={`bs-card p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Download size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-diamond-cream">导出工具</h3>
            <p className="text-xs text-slate-500">矢量图叠加照片输出</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {tools.map((tool) => {
          const isExporting = exporting === tool.id;
          const isSuccess = success === tool.id;

          return (
            <button
              key={tool.id}
              onClick={tool.onClick}
              disabled={isExporting || tool.disabled}
              className={`
                w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 group
                ${tool.disabled
                  ? 'opacity-50 cursor-not-allowed border-slate-700/50 bg-slate-800/30'
                  : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600 hover:-translate-y-0.5 hover:shadow-lg'
                }
              `}
              style={{ textAlign: 'left' }}
            >
              <div className={`
                w-11 h-11 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center flex-shrink-0
                ${!tool.disabled ? 'group-hover:shadow-lg' : ''}
              `}>
                {isExporting ? (
                  <Loader2 size={20} className="text-white animate-spin" />
                ) : isSuccess ? (
                  <CheckCircle size={20} className="text-white" />
                ) : (
                  <tool.icon size={20} className="text-white" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${isSuccess ? 'text-emerald-400' : 'text-diamond-cream'}`}>
                    {isSuccess ? '导出成功!' : tool.label}
                  </span>
                  {tool.disabled && !isExporting && !isSuccess && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium">
                      需完成
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{tool.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">标记数量</span>
          <span className="text-diamond-cream font-semibold">{stone.inclusions.length} 个内含物</span>
        </div>
        <div className="flex items-center justify-between text-xs mt-1.5">
          <span className="text-slate-500">映射字段</span>
          <span className="text-diamond-cream font-semibold">
            {stone.fieldMappings.filter(f => f.confirmed).length} / {stone.fieldMappings.length}
          </span>
        </div>
      </div>
    </div>
  );
};
