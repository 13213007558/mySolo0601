import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography, Statistic, Row, Col, Card, Badge } from 'antd';
import {
  TableOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { statsApi } from '../services/api';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    reviewed: 0,
    suspicious: 0,
    rejected: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await statsApi.summary();
      setStats(res.data);
    } catch (error) {
      console.error('加载统计数据失败', error);
    }
  };

  const menuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <TableOutlined />,
      label: '奶量记录',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: '#001529',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Title level={3} style={{ color: '#fff', margin: 0 }}>
          婴幼儿奶量交接巡检屏 · 康复课务版
        </Title>
      </Header>
      <Layout>
        <Sider width={280} style={{ background: '#fff' }}>
          <div style={{ padding: '16px' }}>
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="总记录"
                    value={stats.total}
                    prefix={<EyeOutlined />}
                    valueStyle={{ fontSize: '18px' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title={<span><Badge status="processing" /> 待确认</span>}
                    value={stats.pending}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ fontSize: '18px', color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title={<span><Badge status="processing" /> 已确认</span>}
                    value={stats.confirmed}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ fontSize: '18px', color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title={<span><Badge status="success" /> 已复核</span>}
                    value={stats.reviewed}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ fontSize: '18px', color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title={<span><Badge status="warning" /> 可疑</span>}
                    value={stats.suspicious}
                    prefix={<ExclamationCircleOutlined />}
                    valueStyle={{ fontSize: '18px', color: '#fa8c16' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title={<span><Badge status="error" /> 已驳回</span>}
                    value={stats.rejected}
                    prefix={<CloseCircleOutlined />}
                    valueStyle={{ fontSize: '18px', color: '#f5222d' }}
                  />
                </Card>
              </Col>
            </Row>
          </div>
          <Menu
            mode="inline"
            defaultSelectedKeys={['/']}
            items={menuItems}
            style={{ borderRight: 0 }}
            onClick={() => {
              window.location.href = '/';
            }}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '8px',
              minHeight: 'calc(100vh - 144px)',
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
