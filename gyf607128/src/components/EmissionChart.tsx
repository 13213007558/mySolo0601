import { useMemo, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, Space, Button, Tooltip } from 'antd';
import { BarChart3, TrendingUp, Download } from 'lucide-react';
import { useLedgerStore } from '@/store/useLedgerStore';
import type { CarbonLedger } from '@/types';

type ChartType = 'bar' | 'line';

export default function EmissionChart() {
  const { ledgers, setHighlightedRowId } = useLedgerStore();

  const chartType: ChartType = 'bar';

  const chartData = useMemo(() => {
    const filtered = ledgers.filter((l) => l.selected || ledgers.every((x) => !x.selected));
    return filtered.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [ledgers]);

  const hasSelection = ledgers.some((l) => l.selected);

  const handleChartClick = useCallback(
    (params: any) => {
      const dataIndex = params.dataIndex;
      if (chartData[dataIndex]) {
        const ledger = chartData[dataIndex];
        setHighlightedRowId(ledger.id);
      }
    },
    [chartData, setHighlightedRowId]
  );

  const getOption = () => {
    const dates = chartData.map((l) => l.date.slice(5));
    const emissions = chartData.map((l) => l.carbonEmission);
    const originalEmissions = chartData.map((l) => l.originalCarbonEmission);
    const buildings = chartData.map((l) => l.building);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        formatter: (params: any) => {
          const data = chartData[params[0].dataIndex];
          const diff = data.carbonEmission - data.originalCarbonEmission;
          const hasDiff = data.isManualEntry && Math.abs(diff) > 0.01;
          return `
            <div style="padding: 8px;">
              <div style="font-weight: 600; margin-bottom: 4px;">${data.date} ${data.building}</div>
              <div>碳排放量: <strong>${data.carbonEmission.toFixed(2)}</strong> tCO₂</div>
              ${hasDiff ? `<div style="color: #f97316;">调整量: +${diff.toFixed(2)} tCO₂</div>` : ''}
              <div>用电量: ${data.electricity} kWh</div>
              <div>排放因子: ${data.emissionFactor}</div>
              <div style="margin-top: 4px; color: #666; font-size: 12px;">点击查看明细</div>
            </div>
          `;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          rotate: 45,
          fontSize: 11,
          color: '#666',
        },
        axisTick: {
          alignWithLabel: true,
        },
      },
      yAxis: {
        type: 'value',
        name: 'tCO₂',
        nameTextStyle: {
          color: '#666',
          fontSize: 12,
        },
        axisLabel: {
          fontSize: 11,
          color: '#666',
        },
        splitLine: {
          lineStyle: {
            type: 'dashed',
            color: '#e5e7eb',
          },
        },
      },
      series: [
        {
          name: '原始排放量',
          type: chartType,
          data: originalEmissions,
          itemStyle: {
            color: '#94a3b8',
          },
          barMaxWidth: 20,
          showBackground: chartType === 'bar',
          backgroundStyle: {
            color: 'rgba(180, 180, 180, 0.1)',
          },
        },
        {
          name: '当前排放量',
          type: chartType,
          data: emissions.map((value, index) => {
            const data = chartData[index];
            const isManual = data.isManualEntry;
            const isSelected = data.selected;
            const isWithdrawn = data.status === 'withdrawn';
            return {
              value,
              itemStyle: {
                color: isWithdrawn
                  ? '#ef4444'
                  : isManual
                    ? '#f97316'
                    : isSelected
                      ? '#0F4C5C'
                      : '#0d9488',
                borderRadius: chartType === 'bar' ? [4, 4, 0, 0] : undefined,
              },
            };
          }),
          barMaxWidth: 20,
          showBackground: chartType === 'bar',
          backgroundStyle: {
            color: 'rgba(15, 76, 92, 0.05)',
          },
          markPoint: {
            data: chartData
              .filter((l) => l.isManualEntry)
              .map((l) => ({
                name: '韩工补录',
                xAxis: dates.indexOf(l.date.slice(5)),
                yAxis: l.carbonEmission,
                value: '补',
                symbolSize: 30,
                itemStyle: {
                  color: '#f97316',
                },
                label: {
                  color: '#fff',
                  fontSize: 10,
                },
              })),
          },
        },
      ],
      legend: {
        data: ['原始排放量', '当前排放量'],
        bottom: 0,
        textStyle: {
          fontSize: 12,
          color: '#666',
        },
      },
    };
  };

  const onEvents = {
    click: handleChartClick,
  };

  return (
    <Card
      className="h-full flex flex-col"
      title={
        <Space>
          <BarChart3 size={18} className="text-teal-700" />
          <span className="font-semibold">碳排放量趋势</span>
          {hasSelection && (
            <span className="text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
              仅显示勾选数据
            </span>
          )}
        </Space>
      }
      extra={
        <Space>
          <Tooltip title="点击图表柱形可定位到对应台账记录">
            <Button type="text" size="small" icon={<TrendingUp size={14} />}>
              交互提示
            </Button>
          </Tooltip>
        </Space>
      }
      styles={{ body: { flex: 1, padding: '12px' } }}
    >
      <ReactECharts
        option={getOption()}
        style={{ height: '100%', minHeight: '320px' }}
        onEvents={onEvents}
        opts={{ renderer: 'canvas' }}
      />
    </Card>
  );
}
