import { Inbox, AlertOctagon, SearchX, FileWarning } from 'lucide-react';

type Kind = 'empty' | 'dirty' | 'no-results' | 'missing';

const variants: Record<Kind, { icon: React.ReactNode; title: string; desc: string; tone: string }> = {
  empty: {
    icon: <Inbox className="w-10 h-10" />,
    title: '暂无晨检记录',
    desc: '请点击右上角"导入体温表"上传今日体温枪导出数据',
    tone: 'bg-slate-50 text-slate-400',
  },
  dirty: {
    icon: <AlertOctagon className="w-10 h-10" />,
    title: '数据质量待校验',
    desc: '当前筛选出脏数据或不完整记录，请逐条复核并补充信息',
    tone: 'bg-orange-50 text-orange-400',
  },
  'no-results': {
    icon: <SearchX className="w-10 h-10" />,
    title: '未找到匹配记录',
    desc: '尝试更换搜索关键词或调整筛选条件',
    tone: 'bg-medical-50 text-medical-400',
  },
  missing: {
    icon: <FileWarning className="w-10 h-10" />,
    title: '材料缺页',
    desc: '请假条或证明材料存在缺页，请联系家属补充并在详情中标记',
    tone: 'bg-rose-50 text-rose-400',
  },
};

export default function EmptyState({ kind = 'empty', action }: { kind?: Kind; action?: React.ReactNode }) {
  const v = variants[kind];
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 animate-fadeInUp">
      <div className={`w-20 h-20 rounded-3xl ${v.tone} flex items-center justify-center mb-5 shadow-inner`}>
        {v.icon}
      </div>
      <h3 className="font-serif text-xl font-semibold text-slate-700 mb-2">{v.title}</h3>
      <p className="text-sm text-slate-500 max-w-sm text-center leading-relaxed mb-5">{v.desc}</p>
      {action}
    </div>
  );
}
