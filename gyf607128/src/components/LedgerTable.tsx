import { useEffect, useRef, useState } from 'react';
import { Table, Checkbox, Input, Tag, Space, Button, Popover } from 'antd';
import type { TableProps } from 'antd';
import { Edit2, Info, User, AlertTriangle } from 'lucide-react';
import type { CarbonLedger, LedgerStatus } from '@/types';
import { STATUS_TEXT_MAP } from '@/types';
import { useLedgerStore } from '@/store/useLedgerStore';

const { TextArea } = Input;

interface LedgerTableProps {
  onScrollToRow?: (id: string) => void;
}

const statusColorMap: Record<LedgerStatus, string> = {
  normal: 'green',
  withdrawn: 'red',
  pending: 'orange',
};

export default function LedgerTable({ onScrollToRow }: LedgerTableProps) {
  const {
    ledgers,
    highlightedRowId,
    toggleSelected,
    selectAll,
    updateWithdrawReason,
    setHighlightedRowId,
  } = useLedgerStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const tableRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  const allSelected = ledgers.length > 0 && ledgers.every((l) => l.selected);
  const someSelected = ledgers.some((l) => l.selected);

  useEffect(() => {
    if (highlightedRowId && rowRefs.current[highlightedRowId]) {
      rowRefs.current[highlightedRowId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      onScrollToRow?.(highlightedRowId);
    }
  }, [highlightedRowId, onScrollToRow]);

  const handleEditReason = (record: CarbonLedger) => {
    setEditingId(record.id);
    setEditValue(record.withdrawReason);
  };

  const handleSaveReason = (id: string) => {
    updateWithdrawReason(id, editValue);
    setEditingId(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const columns: TableProps<CarbonLedger>['columns'] = [
    {
      title: (
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected && !allSelected}
          onChange={(e) => selectAll(e.target.checked)}
        />
      ),
      dataIndex: 'selected',
      key: 'selected',
      width: 50,
      render: (_, record) => (
        <Checkbox
          checked={record.selected}
          onChange={() => toggleSelected(record.id)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      title: '台账ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (text) => <span className="font-mono text-xs text-gray-500">{text}</span>,
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 110,
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: '楼宇',
      dataIndex: 'building',
      key: 'building',
      width: 130,
      filters: [
        { text: 'A座写字楼', value: 'A座写字楼' },
        { text: 'B座科研楼', value: 'B座科研楼' },
        { text: 'C座商业中心', value: 'C座商业中心' },
        { text: 'D座公寓楼', value: 'D座公寓楼' },
        { text: 'E座综合楼', value: 'E座综合楼' },
      ],
      onFilter: (value, record) => record.building === value,
    },
    {
      title: '用电量(kWh)',
      dataIndex: 'electricity',
      key: 'electricity',
      width: 110,
      align: 'right',
      sorter: (a, b) => a.electricity - b.electricity,
    },
    {
      title: '用气量(m³)',
      dataIndex: 'gas',
      key: 'gas',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.gas - b.gas,
    },
    {
      title: '碳排放量(tCO₂)',
      dataIndex: 'carbonEmission',
      key: 'carbonEmission',
      width: 150,
      align: 'right',
      sorter: (a, b) => a.carbonEmission - b.carbonEmission,
      render: (value, record) => {
        const diff = record.carbonEmission - record.originalCarbonEmission;
        const hasDiff = record.isManualEntry && Math.abs(diff) > 0.01;
        return (
          <div className="flex flex-col items-end">
            <span
              className={
                hasDiff ? 'text-orange-600 font-semibold' : ''
              }
            >
              {value.toFixed(2)}
            </span>
            {hasDiff && (
              <span className="text-xs text-orange-500">
                +{diff.toFixed(2)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: '排放因子',
      dataIndex: 'emissionFactor',
      key: 'emissionFactor',
      width: 100,
      align: 'center',
      render: (value, record) => (
        <span
          className={
            record.isManualEntry ? 'text-orange-600 font-medium' : ''
          }
        >
          {value}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      align: 'center',
      filters: [
        { text: '正常', value: 'normal' },
        { text: '已撤回', value: 'withdrawn' },
        { text: '待拍板', value: 'pending' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (value: LedgerStatus) => (
        <Tag color={statusColorMap[value]}>{STATUS_TEXT_MAP[value]}</Tag>
      ),
    },
    {
      title: '撤回原因',
      dataIndex: 'withdrawReason',
      key: 'withdrawReason',
      width: 180,
      render: (value, record) => {
        if (editingId === record.id) {
          return (
            <div className="flex flex-col gap-2">
              <TextArea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={2}
                placeholder="请输入撤回原因"
                autoFocus
              />
              <Space>
                <Button
                  size="small"
                  type="primary"
                  onClick={() => handleSaveReason(record.id)}
                >
                  保存
                </Button>
                <Button size="small" onClick={handleCancelEdit}>
                  取消
                </Button>
              </Space>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-1">
            <span className={value ? '' : 'text-gray-400'}>
              {value || '点击编辑'}
            </span>
            <Button
              type="text"
              size="small"
              icon={<Edit2 size={14} />}
              onClick={() => handleEditReason(record)}
              className="p-0"
            />
          </div>
        );
      },
    },
    {
      title: '白话提示',
      dataIndex: 'plainTip',
      key: 'plainTip',
      width: 80,
      align: 'center',
      render: (value, record) =>
        value ? (
          <Popover content={value} title="白话说明" trigger="hover">
            <Button
              type="text"
              size="small"
              icon={<Info size={16} className="text-blue-500" />}
              className="p-0"
            />
          </Popover>
        ) : null,
    },
    {
      title: '处理人',
      dataIndex: 'handler',
      key: 'handler',
      width: 80,
      render: (value) => (
        <div className="flex items-center gap-1">
          <User size={14} className="text-gray-400" />
          <span>{value}</span>
        </div>
      ),
    },
    {
      title: '韩工补录',
      dataIndex: 'isManualEntry',
      key: 'isManualEntry',
      width: 90,
      align: 'center',
      render: (value, record) =>
        value ? (
          <Popover
            content={
              <div className="max-w-xs">
                <p className="text-sm">{record.manualEntryNote}</p>
              </div>
            }
            title="补录详情"
            trigger="hover"
          >
            <Tag color="orange" className="cursor-help">
              <AlertTriangle size={12} className="inline mr-1" />
              韩工补录
            </Tag>
          </Popover>
        ) : null,
    },
  ];

  return (
    <div ref={tableRef} className="h-full">
      <Table
        rowKey="id"
        columns={columns}
        dataSource={ledgers}
        scroll={{ y: 450, x: 1400 }}
        size="small"
        onRow={(record) => ({
          ref: (el: HTMLTableRowElement | null) => {
            rowRefs.current[record.id] = el;
          },
          className: `transition-all duration-300 ${
            record.selected ? 'bg-teal-50' : ''
          } ${highlightedRowId === record.id ? 'animate-pulse bg-yellow-100' : ''}`,
          onClick: () => {
            if (highlightedRowId === record.id) {
              setHighlightedRowId(null);
            }
          },
        })}
        rowClassName={(record) =>
          highlightedRowId === record.id ? 'highlight-row' : ''
        }
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
      />
      <style>{`
        .highlight-row {
          animation: highlightPulse 0.6s ease-in-out 2;
        }
        @keyframes highlightPulse {
          0%, 100% { background-color: transparent; }
          50% { background-color: #fef3c7; }
        }
      `}</style>
    </div>
  );
}
