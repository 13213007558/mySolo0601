import { AnimatePresence, motion } from 'framer-motion';
import { Inbox } from 'lucide-react';
import type { BatchData } from '@/types';
import { BatchCard } from './BatchCard';

interface AlertWallProps {
  batches: BatchData[];
  selectedBatchId: string | null;
  onBatchSelect: (batchId: string) => void;
}

export const AlertWall = ({ batches, selectedBatchId, onBatchSelect }: AlertWallProps) => {
  if (batches.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
          <Inbox className="w-12 h-12 text-slate-600" />
        </div>
        <h3 className="text-xl font-medium text-slate-400 mb-2">暂无批次数据</h3>
        <p className="text-slate-500 max-w-md">
          当前场景下没有绿证批次数据。请切换到"正常数据"或"异常数据"场景查看样例。
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <AnimatePresence mode="popLayout">
        {batches.map((batch, index) => (
          <BatchCard
            key={batch.id}
            batch={batch}
            index={index}
            isSelected={selectedBatchId === batch.id}
            onSelect={onBatchSelect}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
