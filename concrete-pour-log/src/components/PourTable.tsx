import { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'
import {
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  ImageOff,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { usePourStore } from '@/store/usePourStore'
import type { PourRecord, RecordStatus } from '@/types'
import { RECORD_STATUS_LABELS, RECORD_STATUS_COLORS } from '@/types'
import { formatDateTime, isOvernight } from '@/utils/calc'
import { filterRecords } from '@/utils/calc'

const columnHelper = createColumnHelper<PourRecord>()

export default function PourTable() {
  const records = usePourStore((s) => s.records)
  const filter = usePourStore((s) => s.filter)
  const selectRecord = usePourStore((s) => s.selectRecord)
  const selectedId = usePourStore((s) => s.selectedId)
  const setShowDetail = usePourStore((s) => s.setShowDetail)

  const filtered = useMemo(() => filterRecords(records, filter), [records, filter])

  const columns = useMemo(
    () => [
      columnHelper.accessor('arriveTime', {
        header: () => <span className="text-xs font-medium text-concrete-500">到场时间</span>,
        cell: (info) => {
          const time = info.getValue()
          const row = info.row.original
          const overnight = row.endPourTime ? isOvernight(time, row.endPourTime) : false
          return (
            <div>
              <div className="text-sm text-concrete-900 font-medium">{formatDateTime(time)}</div>
              {overnight && (
                <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">跨天</span>
              )}
            </div>
          )
        },
        sortingFn: 'datetime'
      }),
      columnHelper.accessor('truckNo', {
        header: () => <span className="text-xs font-medium text-concrete-500">车号</span>,
        cell: (info) => (
          <span className="text-sm font-mono text-concrete-900">{info.getValue()}</span>
        )
      }),
      columnHelper.accessor('position', {
        header: () => <span className="text-xs font-medium text-concrete-500">部位</span>,
        cell: (info) => (
          <div>
            <div className="text-sm text-concrete-900">{info.getValue()}</div>
            <div className="text-xs text-concrete-400">{info.row.original.component}</div>
          </div>
        )
      }),
      columnHelper.accessor('grade', {
        header: () => <span className="text-xs font-medium text-concrete-500">标号</span>,
        cell: (info) => (
          <span className="text-sm font-medium text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
            {info.getValue()}
          </span>
        )
      }),
      columnHelper.accessor('volume', {
        header: () => <span className="text-xs font-medium text-concrete-500">方量</span>,
        cell: (info) => (
          <span className="text-sm text-concrete-900">{info.getValue()} m³</span>
        )
      }),
      columnHelper.accessor('slump', {
        header: () => <span className="text-xs font-medium text-concrete-500">坍落度</span>,
        cell: (info) => {
          const val = info.getValue()
          const isOut = val < 120 || val > 220
          return (
            <span className={`text-sm ${isOut ? 'text-red-600 font-medium' : 'text-concrete-900'}`}>
              {val}mm
              {isOut && <span className="ml-1 text-xs">⚠</span>}
            </span>
          )
        }
      }),
      columnHelper.accessor('hasPhoto', {
        header: () => <span className="text-xs font-medium text-concrete-500">照片</span>,
        cell: (info) =>
          info.getValue() ? (
            <ImageIcon className="w-4 h-4 text-green-500" />
          ) : (
            <ImageOff className="w-4 h-4 text-purple-500" />
          ),
        size: 60
      }),
      columnHelper.accessor('status', {
        header: () => <span className="text-xs font-medium text-concrete-500">状态</span>,
        cell: (info) => {
          const status = info.getValue() as RecordStatus
          return (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: RECORD_STATUS_COLORS[status] }}
            >
              {RECORD_STATUS_LABELS[status]}
            </span>
          )
        }
      }),
      columnHelper.accessor((row) => row.abnormals.filter((a) => !a.handled).length, {
        id: 'abnormalCount',
        header: () => <span className="text-xs font-medium text-concrete-500">未处理异常</span>,
        cell: (info) => {
          const count = info.getValue()
          if (count === 0) {
            return <CheckCircle className="w-4 h-4 text-green-500" />
          }
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
              <AlertTriangle className="w-3 h-3" />
              {count}
            </span>
          )
        }
      })
    ],
    []
  )

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      sorting: [{ id: 'arriveTime', desc: false }]
    },
    enableSorting: true
  })

  return (
    <div className="bg-white rounded-xl border border-concrete-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-concrete-100 flex items-center justify-between">
        <h3 className="font-semibold text-concrete-900">浇筑记录</h3>
        <span className="text-xs text-concrete-400">共 {filtered.length} 条</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-concrete-50 border-b border-concrete-100">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className={`text-left py-2.5 px-3 font-medium text-concrete-500 text-xs select-none ${
                      h.column.getCanSort() ? 'cursor-pointer hover:bg-concrete-100' : ''
                    }`}
                    style={{ width: h.getSize() }}
                    onClick={h.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {h.column.getCanSort() && (
                        <span className="text-concrete-300">
                          {h.column.getIsSorted() === 'asc' ? (
                            <ChevronUp className="w-3 h-3 text-accent" />
                          ) : h.column.getIsSorted() === 'desc' ? (
                            <ChevronDown className="w-3 h-3 text-accent" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-concrete-100">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-concrete-400 text-sm">
                  没有符合条件的记录
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => {
                    selectRecord(row.original.id)
                    setShowDetail(true)
                  }}
                  className={`cursor-pointer transition-colors ${
                    selectedId === row.original.id
                      ? 'bg-accent bg-opacity-10'
                      : 'hover:bg-concrete-50'
                  } ${
                    row.original.status === 'abnormal'
                      ? 'bg-red-50 bg-opacity-50'
                      : ''
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-2.5 px-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
