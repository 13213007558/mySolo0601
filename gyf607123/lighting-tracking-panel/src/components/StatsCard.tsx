import React from 'react';
import { Card, Statistic, Row, Col, Tooltip } from 'antd';
import {
  BulbOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  FileUnknownOutlined,
} from '@ant-design/icons';
import { useApp } from '../context/AppContext';

interface StatsCardProps {
  showProblemCount?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({ showProblemCount = true }) => {
  const { getStatistics } = useApp();
  const stats = getStatistics();

  const cards = [
    {
      title: '总记录数',
      value: stats.totalRecords,
      icon: <BulbOutlined style={{ color: '#1890ff', fontSize: 24 }} />,
      color: '#1890ff',
      tooltip: '系统中所有正常回路记录的总数',
    },
    {
      title: '运行正常',
      value: stats.normalCount,
      icon: <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 24 }} />,
      color: '#52c41a',
      tooltip: '各项指标都在正常范围内的回路数量',
    },
    {
      title: '故障告警',
      value: stats.faultCount,
      icon: <WarningOutlined style={{ color: '#ff4d4f', fontSize: 24 }} />,
      color: '#ff4d4f',
      tooltip: '检测到故障需要处理的回路数量，要赶紧去现场看看',
    },
    {
      title: '待确认',
      value: stats.pendingCount,
      icon: <ClockCircleOutlined style={{ color: '#faad14', fontSize: 24 }} />,
      color: '#faad14',
      tooltip: '还在等待进一步检查确认的回路数量',
    },
    {
      title: '总功率',
      value: stats.totalPower,
      suffix: 'W',
      icon: <ThunderboltOutlined style={{ color: '#722ed1', fontSize: 24 }} />,
      color: '#722ed1',
      tooltip: '所有回路的总功率消耗，值越高越费电',
    },
    {
      title: '平均照度',
      value: stats.avgIllumination,
      suffix: 'lux',
      icon: <SafetyOutlined style={{ color: '#13c2c2', fontSize: 24 }} />,
      color: '#13c2c2',
      tooltip: '所有回路的平均照明度，太低的话现场会很暗',
    },
    {
      title: '合格率',
      value: stats.passRate,
      suffix: '%',
      icon: <CheckCircleOutlined style={{ color: '#2f54eb', fontSize: 24 }} />,
      color: '#2f54eb',
      tooltip: '正常记录占总导入记录（含问题记录）的比例',
    },
  ];

  if (showProblemCount) {
    cards.push({
      title: '问题待处理',
      value: stats.problemCount,
      icon: <FileUnknownOutlined style={{ color: '#eb2f96', fontSize: 24 }} />,
      color: '#eb2f96',
      tooltip: '手写补抄单中检测出的坏行，需要人工修正后才能进入统计',
    });
  }

  return (
    <Row gutter={[16, 16]}>
      {cards.map((card, index) => (
        <Col xs={12} sm={8} md={6} lg={6} key={index}>
          <Tooltip title={card.tooltip} placement="top">
            <Card
              hoverable
              style={{
                borderLeft: `4px solid ${card.color}`,
                borderRadius: 8,
              }}
              bodyStyle={{ padding: '16px 20px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Statistic
                  title={
                    <span style={{ fontSize: 13, color: '#666' }}>{card.title}</span>
                  }
                  value={card.value}
                  suffix={card.suffix}
                  valueStyle={{ fontSize: 26, fontWeight: 600, color: card.color }}
                />
                <div style={{ marginLeft: 8 }}>{card.icon}</div>
              </div>
            </Card>
          </Tooltip>
        </Col>
      ))}
    </Row>
  );
};
