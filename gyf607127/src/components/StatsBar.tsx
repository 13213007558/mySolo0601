import { motion } from 'framer-motion';
import { Layers, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import type { StatsData } from '@/types';

interface StatsBarProps {
  stats: StatsData;
}

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  color, 
  delay 
}: { 
  icon: typeof Layers; 
  label: string; 
  value: number; 
  color: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className={`relative bg-slate-800/60 backdrop-blur-sm rounded-xl p-5 border ${color} overflow-hidden`}
  >
    <div className="absolute top-0 right-0 w-24 h-24 opacity-5">
      <Icon className={`w-24 h-24 ${color.replace('border-', 'text-')}`} />
    </div>
    <div className="relative z-10">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-5 h-5 ${color.replace('border-', 'text-')}`} />
        <span className="text-slate-400 text-sm">{label}</span>
      </div>
      <motion.p
        key={value}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-3xl font-bold text-white font-mono"
      >
        {value}
      </motion.p>
    </div>
  </motion.div>
);

export const StatsBar = ({ stats }: StatsBarProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={Layers}
        label="批次总数"
        value={stats.total}
        color="border-slate-600"
        delay={0}
      />
      <StatCard
        icon={AlertTriangle}
        label="异常批次"
        value={stats.abnormal}
        color="border-red-500/50"
        delay={0.1}
      />
      <StatCard
        icon={Clock}
        label="待处理"
        value={stats.pending}
        color="border-yellow-500/50"
        delay={0.2}
      />
      <StatCard
        icon={CheckCircle2}
        label="已完成"
        value={stats.completed}
        color="border-emerald-500/50"
        delay={0.3}
      />
    </div>
  );
};
