import { useState } from 'react';
import { Eye, Phone, UserCheck, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { usePickupStore } from '@/store/pickupStore';
import { StatusBadge, TypeBadge } from '@/components/Badges';
import type { PickupRecord } from '@/types';
import { ActionModal } from './ActionModal';
import { cn } from '@/lib/utils';

interface Props {
  records: PickupRecord[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
}

export function PickupTable({ records, selectedIds, onToggleSelect }: Props) {
  const selectRecord = usePickupStore((s) => s.selectRecord);
  const flashId = usePickupStore((s) => s.flashRecordId);
  const [modal, setModal] = useState<{ id: string; mode: 'phone' | 'aunt' | 'normal' | 'exception' } | null>(null);

  if (records.length === 0) {
    return (
      <div className="py-16 text-center text-night-400 text-sm">
        该分组暂无记录
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-night-300 border-b border-night-600">
              <th className="py-2.5 px-3 w-10 font-mono"></th>
              <th className="py-2.5 px-3 font-mono">宝宝姓名</th>
              <th className="py-2.5 px-3 font-mono">班级</th>
              <th className="py-2.5 px-3 font-mono">授权人</th>
              <th className="py-2.5 px-3 font-mono">接走人</th>
              <th className="py-2.5 px-3 font-mono">类型</th>
              <th className="py-2.5 px-3 font-mono">状态</th>
              <th className="py-2.5 px-3 font-mono text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => {
              const isBad = r.isBadRow;
              const canAct = r.status === 'pending' && !isBad;
              return (
                <tr
                  key={r.id}
                  className={cn(
                    'border-b border-night-700/50 transition-colors',
                    i % 2 === 0 ? 'bg-night-800/40' : 'bg-night-800/20',
                    isBad && 'bg-pickup-withdrawn/5',
                    flashId === r.id && 'row-flash'
                  )}
                >
                  <td className="py-2.5 px-3">
                    <input
                      type="checkbox"
                      disabled={!canAct || r.pickupType !== 'normal'}
                      checked={selectedIds.has(r.id)}
                      onChange={() => onToggleSelect(r.id)}
                      className="w-4 h-4 rounded border-night-500 bg-night-800 text-pickup-normal focus:ring-pickup-normal/50 disabled:opacity-30"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={cn('font-medium', isBad && 'text-pickup-withdrawn')}>
                      {r.babyName}
                    </span>
                    {isBad && (
                      <span className="ml-2 inline-flex items-center text-[10px] text-pickup-withdrawn">
                        <AlertTriangle size={10} className="mr-0.5" /> 坏行
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-night-200 font-mono text-xs">{r.className}</td>
                  <td className="py-2.5 px-3 text-night-200">{r.authorizedBy || '—'}</td>
                  <td className="py-2.5 px-3 text-night-200">{r.pickupPerson || '—'}</td>
                  <td className="py-2.5 px-3"><TypeBadge type={r.pickupType} /></td>
                  <td className="py-2.5 px-3"><StatusBadge status={r.status} /></td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => selectRecord(r.id)}
                        title="查看详情/时间线"
                        className="p-1.5 rounded text-night-300 hover:text-night-50 hover:bg-night-600 transition-colors"
                      >
                        <Eye size={14} />
                      </button>
                      {canAct && (
                        <>
                          <button
                            onClick={() => setModal({ id: r.id, mode: 'normal' })}
                            title="确认正常接送"
                            className="p-1.5 rounded text-pickup-normal hover:bg-pickup-normal/10 transition-colors"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                          <button
                            onClick={() => setModal({ id: r.id, mode: 'phone' })}
                            title="登记电话授权"
                            className="p-1.5 rounded text-pickup-phone hover:bg-pickup-phone/10 transition-colors"
                          >
                            <Phone size={14} />
                          </button>
                          <button
                            onClick={() => setModal({ id: r.id, mode: 'aunt' })}
                            title="登记临时阿姨"
                            className="p-1.5 rounded text-pickup-aunt hover:bg-pickup-aunt/10 transition-colors"
                          >
                            <UserCheck size={14} />
                          </button>
                          <button
                            onClick={() => setModal({ id: r.id, mode: 'exception' })}
                            title="标记异常"
                            className="p-1.5 rounded text-pickup-exception hover:bg-pickup-exception/10 transition-colors"
                          >
                            <XCircle size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal && (
        <ActionModal
          record={records.find((r) => r.id === modal.id)!}
          mode={modal.mode}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
