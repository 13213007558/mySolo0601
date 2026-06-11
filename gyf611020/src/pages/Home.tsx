import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Camera,
  ListChecks,
  SplitSquareVertical,
  Download,
  Settings,
  ChevronRight,
  FileText,
  Clock,
} from 'lucide-react';
import { seedMockData } from '../db';
import { storageService } from '../services/storageService';
import { Manuscript } from '../types';

export default function Home() {
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ captures: 0, retakes: 0 });

  useEffect(() => {
    (async () => {
      await seedMockData();
      const list = await storageService.listManuscripts();
      setManuscripts(list);
      const all = await storageService.listCaptures();
      setStats({
        captures: all.length,
        retakes: all.filter((c) => c.needsRetake).length,
      });
      setLoading(false);
    })();
  }, []);

  const navCards = [
    {
      to: '/records',
      icon: <ListChecks size={22} />,
      title: '采集记录',
      desc: `共 ${stats.captures} 条 · 待重拍 ${stats.retakes}`,
      color: '#2D5A7B',
    },
    {
      to: '/diff/m1/1',
      icon: <SplitSquareVertical size={22} />,
      title: '历史对比',
      desc: '同页修复版本叠放比较',
      color: '#C97F30',
    },
    {
      to: '/export',
      icon: <Download size={22} />,
      title: 'IIIF 导出',
      desc: '国际标准图像互操作包',
      color: '#5A7B2D',
    },
    {
      to: '/settings',
      icon: <Settings size={22} />,
      title: '偏好设置',
      desc: '低蓝光 / 角度吸附 / 采集人',
      color: '#5C4522',
    },
  ];

  return (
    <div className="min-h-screen">
      <section
        className="px-6 md:px-10 pt-10 pb-8 border-b"
        style={{
          borderColor: '#8B6B3D33',
          background:
            'radial-gradient(1200px 400px at 10% -20%, rgba(212,175,55,0.15), transparent 60%), radial-gradient(800px 400px at 90% 0%, rgba(45,90,123,0.12), transparent 60%), #F5EFE0',
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
            <div>
              <div
                className="text-xs tracking-[0.3em] mb-2"
                style={{ color: '#8B6B3D' }}
              >
                · MANUSCRIPT SIDE-LIGHT ACQUISITION ·
              </div>
              <h1
                className="text-4xl md:text-5xl font-bold mb-3"
                style={{
                  fontFamily: "'LXGW WenKai', 'Source Han Serif', 'Noto Serif SC', serif",
                  color: '#3B2F2F',
                  letterSpacing: '0.02em',
                }}
              >
                手稿侧光采集仪
              </h1>
              <p className="text-sm md:text-base" style={{ color: '#5C4522', maxWidth: 640 }}>
                针对文献修复项目外审整改打造：0–360° 滑杆控角、角度自动写入 EXIF 元数据、纤维走向箭头标注、
                修补区多边形圈选与文字备注、IIIF 标准导出、历史版本对比、低蓝光护纸模式。
              </p>
            </div>
            <div
              className="px-4 py-3 rounded-xl border text-sm"
              style={{ borderColor: '#8B6B3D44', background: 'rgba(253,248,236,0.8)' }}
            >
              <div className="flex items-center gap-2 mb-1" style={{ color: '#B23A48' }}>
                <Clock size={14} />
                <b>合规提示</b>
              </div>
              <div style={{ color: '#5C4522', maxWidth: 260 }}>
                角度偏差超过 ±2° 将强制重拍 · 标注层与原图分离存储
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {navCards.map((c) => (
              <Link
                key={c.to}
                to={c.to}
                className="group block p-4 rounded-xl border hover:-translate-y-0.5 transition-all"
                style={{
                  borderColor: '#8B6B3D33',
                  background: '#FDF8EC',
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-white"
                  style={{ background: c.color }}
                >
                  {c.icon}
                </div>
                <div className="font-bold mb-1 flex items-center justify-between" style={{ color: '#3B2F2F' }}>
                  {c.title}
                  <ChevronRight
                    size={16}
                    className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                    style={{ color: c.color }}
                  />
                </div>
                <div className="text-xs" style={{ color: '#8B6B3D' }}>
                  {c.desc}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 md:px-10 py-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-xl md:text-2xl font-bold flex items-center gap-2"
            style={{
              color: '#3B2F2F',
              fontFamily: "'Source Han Serif', serif",
            }}
          >
            <BookOpen size={22} style={{ color: '#2D5A7B' }} />
            在修手稿
          </h2>
          <Link
            to="/records"
            className="text-sm flex items-center gap-1"
            style={{ color: '#2D5A7B' }}
          >
            查看全部记录 <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="text-sm text-[#8B6B3D] py-10 text-center">加载手稿…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {manuscripts.map((m) => (
              <ManuscriptCard key={m.id} m={m} />
            ))}
          </div>
        )}
      </section>

      <footer
        className="px-6 md:px-10 py-6 border-t text-center text-xs"
        style={{ borderColor: '#8B6B3D33', color: '#8B6B3D' }}
      >
        手稿侧光采集仪 v1.0 · 标注层与原始层分离存储 · EXIF UserComment 写入角度元数据 · IIIF Presentation 3.0 合规
      </footer>
    </div>
  );
}

function ManuscriptCard({ m }: { m: Manuscript }) {
  const [counts, setCounts] = useState({ total: 0, need: 0 });
  useEffect(() => {
    (async () => {
      const list = await storageService.listCapturesByManuscript(m.id);
      setCounts({
        total: list.length,
        need: list.filter((c) => c.needsRetake).length,
      });
    })();
  }, [m.id]);

  return (
    <div
      className="rounded-2xl p-5 border flex flex-col hover:shadow-lg transition-shadow"
      style={{
        borderColor: '#8B6B3D44',
        background:
          'linear-gradient(135deg, #FDF8EC 0%, #F5EAD1 100%)',
      }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-12 h-16 rounded-md shrink-0 flex items-center justify-center text-xl shadow-inner"
          style={{
            background: 'linear-gradient(160deg, #EDE2C4 0%, #D4B887 100%)',
            border: '1px solid #8B6B3D33',
            color: '#5C4522',
            fontFamily: "'LXGW WenKai', serif",
          }}
        >
          <FileText size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-xs tracking-wider mb-1 font-mono"
            style={{ color: '#8B6B3D' }}
          >
            {m.code}
          </div>
          <div
            className="font-bold leading-snug truncate"
            style={{
              color: '#3B2F2F',
              fontFamily: "'LXGW WenKai', 'Source Han Serif', serif",
              fontSize: 18,
            }}
            title={m.title}
          >
            {m.title}
          </div>
          <div className="text-xs mt-1" style={{ color: '#8B6B3D' }}>
            共 {m.totalPages} 页 · 入藏 {formatDate(m.createdAt)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="rounded-lg py-2" style={{ background: '#fff' }}>
          <div className="text-xl font-bold" style={{ color: '#2D5A7B' }}>{counts.total}</div>
          <div className="text-[10px]" style={{ color: '#8B6B3D' }}>已采集</div>
        </div>
        <div className="rounded-lg py-2" style={{ background: '#fff' }}>
          <div className="text-xl font-bold" style={{ color: counts.need ? '#B23A48' : '#5A7B2D' }}>{counts.need}</div>
          <div className="text-[10px]" style={{ color: '#8B6B3D' }}>待重拍</div>
        </div>
        <div className="rounded-lg py-2" style={{ background: '#fff' }}>
          <div className="text-xl font-bold" style={{ color: '#C97F30' }}>
            {counts.total ? ((counts.total / m.totalPages) * 100).toFixed(0) : 0}%
          </div>
          <div className="text-[10px]" style={{ color: '#8B6B3D' }}>进度</div>
        </div>
      </div>

      <div className="mt-auto pt-3 border-t flex flex-wrap gap-2" style={{ borderColor: '#8B6B3D33' }}>
        <Link
          to={`/capture/${m.id}/1`}
          className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm text-white shadow hover:opacity-90 transition"
          style={{ background: '#2D5A7B' }}
        >
          <Camera size={14} /> 开始采集
        </Link>
        <Link
          to={`/diff/${m.id}/1`}
          className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm border hover:bg-[#EFE5CF] transition"
          style={{ borderColor: '#8B6B3D55', color: '#3B2F2F' }}
        >
          <SplitSquareVertical size={14} /> 对比
        </Link>
      </div>
    </div>
  );
}

function formatDate(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d
    .getDate()
    .toString()
    .padStart(2, '0')}`;
}
