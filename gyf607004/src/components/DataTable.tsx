import { cn } from '@/lib/utils';
import type { RescheduleRecord } from '@/types';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowRight, Eye, CheckSquare, FileText } from 'lucide-react';
import StatusBadge from './StatusBadge';
import Button from './Button';

interface DataTableProps {
  data: RescheduleRecord[];
  onView: (record: RescheduleRecord) => void;
  onApprove: (record: RescheduleRecord) => void;
}

const columnHelper = createColumnHelper<RescheduleRecord>();

export default function DataTable({ data, onView, onApprove }: DataTableProps) {
  const columns = [
    columnHelper.accessor('sourceFileName', {
      header: '来源文件',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-1.5 text-sm text-gray-700">
          <FileText className="h-[14px] w-[14px] text-gray-400 flex-shrink-0" />
          <span className="truncate max-w-[160px]" title={getValue()}>
            {getValue()}
          </span>
        </div>
      ),
    }),
    columnHelper.accessor('babyName', {
      header: '宝宝姓名',
      cell: ({ getValue, row }) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{getValue()}</div>
          <div className="text-xs text-gray-500">{row.original.babyId}</div>
        </div>
      ),
    }),
    columnHelper.display({
      id: 'shift',
      header: '原班次 → 改期班次',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm">
          <div className="text-right">
            <div className="text-gray-900">{row.original.originalShift}</div>
            <div className="text-xs text-gray-500">{row.original.originalDate}</div>
          </div>
          <ArrowRight className="h-[14px] w-[14px] text-gray-400 flex-shrink-0" />
          <div>
            <div className="text-gray-900">{row.original.targetShift}</div>
            <div className="text-xs text-gray-500">{row.original.targetDate}</div>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('handlerName', {
      header: '处理人',
      cell: ({ getValue }) => <span className="text-sm text-gray-700">{getValue()}</span>,
    }),
    columnHelper.accessor('status', {
      header: '状态',
      cell: ({ getValue }) => <StatusBadge status={getValue()} />,
    }),
    columnHelper.accessor('latestNote', {
      header: '最近人工说明',
      cell: ({ getValue, row }) => (
        <div className="text-sm text-gray-600 max-w-[200px]">
          {getValue() ? (
            <div>
              <div className="truncate" title={getValue() || ''}>
                {getValue()}
              </div>
              {row.original.latestNoteBy && row.original.latestNoteAt && (
                <div className="text-xs text-gray-400 mt-0.5">
                  {row.original.latestNoteBy} · {row.original.latestNoteAt.slice(0, 10)}
                </div>
              )}
            </div>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon={<Eye className="h-[14px] w-[14px]" />}
            onClick={() => onView(row.original)}
          >
            查看
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<CheckSquare className="h-[14px] w-[14px]" />}
            onClick={() => onApprove(row.original)}
          >
            审批
          </Button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="overflow-auto max-h-[calc(100vh-200px)]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="sticky top-0 z-10 bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100">
            {table.getRowModel().rows.map((row, idx) => (
              <tr
                key={row.id}
                className={cn(
                  'hover:bg-ink-blue/5 transition-colors',
                  idx % 2 === 1 && 'bg-gray-50/50',
                  row.original.status === 'bad_data' && 'bg-status-red/5 hover:bg-status-red/10'
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-top">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-gray-500">
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
