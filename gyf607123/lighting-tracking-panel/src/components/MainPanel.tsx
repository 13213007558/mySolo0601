import React, { useState } from 'react';
import {
  Layout,
  Menu,
  Button,
  Space,
  Typography,
  Tabs,
  theme,
  ConfigProvider,
} from 'antd';
import zhCN from 'antd/locale/zh_CN';
import {
  DashboardOutlined,
  FileTextOutlined,
  TagsOutlined,
  BarChartOutlined,
  BulbOutlined,
  UploadOutlined,
  DatabaseOutlined,
  ClearOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useApp } from '../context/AppContext';
import { EmptyState } from './EmptyState';
import { StatsCard } from './StatsCard';
import { ProblemArea } from './ProblemArea';
import { NormalRecordsTable } from './NormalRecordsTable';
import { ManualStickerPanel } from './ManualStickerPanel';
import { ReviewPage } from './ReviewPage';
import { HandwrittenImport } from './HandwrittenImport';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

type MenuItem = Required<MenuProps>['items'][number];

const items: MenuItem[] = [
  {
    key: 'overview',
    icon: <DashboardOutlined />,
    label: '数据总览',
  },
  {
    key: 'manual',
    icon: <TagsOutlined />,
    label: '阿敏手工补录',
  },
  {
    key: 'review',
    icon: <BarChartOutlined />,
    label: '数据复盘',
  },
];

export const MainPanel: React.FC = () => {
  const {
    state,
    dispatch,
    getEmptyStateType,
    getFilteredRecords,
  } = useApp();

  const [collapsed, setCollapsed] = useState(false);
  const [activeKey, setActiveKey] = useState('overview');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [tabKey, setTabKey] = useState('1');
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const emptyStateType = getEmptyStateType();
  const hasData = state.circuitRecords.length > 0 || state.problemRecords.length > 0;
  const filteredRecords = getFilteredRecords();

  const handleLoadDemo = () => {
    dispatch({ type: 'LOAD_DEMO_DATA' });
  };

  const handleClearAll = () => {
    dispatch({ type: 'CLEAR_ALL_DATA' });
  };

  const handleClearFilters = () => {
    dispatch({ type: 'CLEAR_FILTERS' });
  };

  const handleRetryImport = () => {
    setImportModalOpen(true);
  };

  const tabItems = [
    {
      key: '1',
      label: (
        <Space>
          <DatabaseOutlined />
          正常记录
          <span style={{ color: '#1890ff' }}>({filteredRecords.length})</span>
        </Space>
      ),
    },
    {
      key: '2',
      label: (
        <Space>
          <FileTextOutlined />
          问题区
          <span style={{ color: '#ff4d4f' }}>({state.problemRecords.length})</span>
        </Space>
      ),
    },
  ];

  const renderOverviewContent = () => {
    if (emptyStateType !== 'none') {
      return (
        <EmptyState
          type={emptyStateType}
          onLoadDemo={handleLoadDemo}
          onClearFilters={handleClearFilters}
          onRetry={handleRetryImport}
        />
      );
    }

    return (
      <div>
        <StatsCard />
        <div style={{ height: 16 }} />
        <Tabs
          activeKey={tabKey}
          onChange={setTabKey}
          items={tabItems}
          type="card"
        />
        {tabKey === '1' && <NormalRecordsTable />}
        {tabKey === '2' && <ProblemArea />}
      </div>
    );
  };

  return (
    <ConfigProvider locale={zhCN}>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          theme="light"
          style={{
            borderRight: '1px solid #f0f0f0',
          }}
        >
          <div
            style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            {!collapsed && (
              <Space>
                <BulbOutlined style={{ fontSize: 24, color: '#faad14' }} />
                <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
                  照明回路追踪
                </Title>
              </Space>
            )}
            {collapsed && <BulbOutlined style={{ fontSize: 24, color: '#faad14' }} />}
          </div>
          <Menu
            mode="inline"
            selectedKeys={[activeKey]}
            items={items}
            onClick={({ key }) => setActiveKey(key)}
            style={{ borderRight: 0 }}
          />
        </Sider>
        <Layout>
          <Header
            style={{
              padding: '0 24px',
              background: colorBgContainer,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <Space>
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: '16px', width: 64, height: 64 }}
              />
              <Title level={4} style={{ margin: 0 }}>
                {activeKey === 'overview' && '能源照明回路追踪面板'}
                {activeKey === 'manual' && '阿敏手工补录 - 回路命名贴纸'}
                {activeKey === 'review' && '数据复盘 - 导出核对'}
              </Title>
            </Space>
            <Space>
              <Button
                icon={<UploadOutlined />}
                type="primary"
                onClick={() => setImportModalOpen(true)}
              >
                导入手写补抄单
              </Button>
              {hasData && (
                <Button icon={<ClearOutlined />} onClick={handleClearAll} danger>
                  清空数据
                </Button>
              )}
              {!hasData && (
                <Button icon={<DatabaseOutlined />} onClick={handleLoadDemo}>
                  加载示例数据
                </Button>
              )}
            </Space>
          </Header>
          <Content
            style={{
              margin: '24px',
              padding: 24,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              overflow: 'auto',
            }}
          >
            {activeKey === 'overview' && renderOverviewContent()}
            {activeKey === 'manual' && <ManualStickerPanel />}
            {activeKey === 'review' && <ReviewPage />}
          </Content>
        </Layout>
      </Layout>

      <HandwrittenImport
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
      />
    </ConfigProvider>
  );
};
