import React from 'react';
import { Empty, Button, Space, Typography } from 'antd';
import {
  InboxOutlined,
  FilterOutlined,
  WarningOutlined,
  ReloadOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import type { EmptyStateType } from '../types';

const { Text, Paragraph } = Typography;

interface EmptyStateProps {
  type: EmptyStateType;
  onLoadDemo?: () => void;
  onClearFilters?: () => void;
  onRetry?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  onLoadDemo,
  onClearFilters,
  onRetry,
}) => {
  const configs: Record<EmptyStateType, {
    icon: React.ReactNode;
    title: string;
    description: string;
    tip: string;
    action?: React.ReactNode;
  }> = {
    'no-import': {
      icon: <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />,
      title: '还没有导入任何数据',
      description: '节能顾问，这里空空如也，因为还没有导入任何回路记录',
      tip: '请先导入回路命名贴纸或手写补抄单，也可以先查看示例数据了解功能',
      action: (
        <Space>
          <Button type="primary" icon={<InboxOutlined />} onClick={onLoadDemo}>
            加载示例数据
          </Button>
          <Text type="secondary" style={{ fontSize: 12 }}>
            或使用顶部"导入"按钮上传实际数据
          </Text>
        </Space>
      ),
    },
    'filter-too-narrow': {
      icon: <FilterOutlined style={{ fontSize: 48, color: '#faad14' }} />,
      title: '筛选条件太严格了',
      description: '当前筛选条件下没有匹配的记录，不是没有数据，是筛得太细了',
      tip: '试试放宽筛选条件，比如去掉状态筛选、扩大日期范围，或者清除所有筛选条件',
      action: (
        <Space>
          <Button icon={<ClearOutlined />} onClick={onClearFilters}>
            清除筛选条件
          </Button>
          <Text type="secondary" style={{ fontSize: 12 }}>
            筛选条件太窄会漏掉很多有用的数据哦
          </Text>
        </Space>
      ),
    },
    'all-bad': {
      icon: <WarningOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />,
      title: '导入的记录全是坏的',
      description: '已经导入了数据，但所有记录都有问题，全部留在了问题区',
      tip: '请检查手写补抄单的内容，看看是不是格式不对、数值填错了，或者有缺失的必填项',
      action: (
        <Space>
          <Button type="primary" danger icon={<ReloadOutlined />} onClick={onRetry}>
            重新检查导入
          </Button>
          <Text type="secondary" style={{ fontSize: 12 }}>
            可以去问题区看看具体是哪里出了问题
          </Text>
        </Space>
      ),
    },
    'none': {
      icon: <Empty />,
      title: '暂无数据',
      description: '',
      tip: '',
    },
  };

  const config = configs[type];

  if (type === 'none') {
    return <Empty description="暂无数据" />;
  }

  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ marginBottom: 16 }}>{config.icon}</div>
      <Typography.Title level={4} style={{ marginBottom: 8 }}>
        {config.title}
      </Typography.Title>
      <Paragraph type="secondary" style={{ marginBottom: 8 }}>
        {config.description}
      </Paragraph>
      <Text type="warning" style={{ fontSize: 13 }}>
        💡 {config.tip}
      </Text>
      {config.action && <div style={{ marginTop: 24 }}>{config.action}</div>}
    </div>
  );
};
