import { useState, useEffect } from 'react';
import { Layout, Menu, Dropdown, Space, Button, Select, ConfigProvider, message, theme } from 'antd';
import { UserOutlined, UnorderedListOutlined, FileTextOutlined } from '@ant-design/icons';
import RecordList from './RecordList';
import RecordDetail from './RecordDetail';
import { usersApi, setCurrentUserId, getCurrentUserId } from './api';
import zhCN from 'antd/locale/zh_CN';
import './App.css';

const { Header, Content } = Layout;
const { Option } = Select;

function App() {
  const [view, setView] = useState('list');
  const [currentRecordId, setCurrentRecordId] = useState(null);
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserIdState] = useState(getCurrentUserId());

  useEffect(() => {
    usersApi.list().then(setUsers);
  }, []);

  function handleViewDetail(id) {
    setCurrentRecordId(id);
    setView('detail');
    window.scrollTo(0, 0);
  }

  function handleBack() {
    setView('list');
    setCurrentRecordId(null);
  }

  function handleUserChange(id) {
    setCurrentUserId(id);
    setCurrentUserIdState(id);
    const user = users.find(u => u.id === id);
    message.success(`已切换为：${user?.name || ''}（${getRoleText(user?.role)}）`);
  }

  function getRoleText(role) {
    const map = {
      admin: '系统管理员',
      supervisor: '护理主管',
      morning_teacher: '早班老师',
      teacher: '护士',
      parent: '家长'
    };
    return map[role] || role;
  }

  const currentUser = users.find(u => u.id === currentUserId);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 4
        }
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ background: '#fff', padding: '0 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space size={16}>
            <FileTextOutlined style={{ fontSize: 24, color: '#1677ff' }} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.2 }}>婴幼儿批次追溯对账台</div>
              <div style={{ fontSize: 12, color: '#999', lineHeight: 1.2 }}>月子护理版</div>
            </div>
            {view === 'detail' && (
              <span style={{ color: '#999' }}>/ 记录详情 #{currentRecordId}</span>
            )}
          </Space>
          <Space>
            <span style={{ fontSize: 13, color: '#666' }}>当前身份：</span>
            <Select
              value={currentUserId}
              style={{ width: 220 }}
              onChange={handleUserChange}
              optionLabelProp="label"
            >
              {users.map(u => (
                <Option key={u.id} value={u.id} label={`${u.name}（${getRoleText(u.role)}）`}>
                  <Space>
                    <UserOutlined />
                    <span>{u.name}</span>
                    <span style={{ color: '#999', fontSize: 12 }}>{getRoleText(u.role)}</span>
                  </Space>
                </Option>
              ))}
            </Select>
            {currentUser && (
              <span style={{ color: '#999', fontSize: 12 }}>
                可查看内部备注：{['admin', 'supervisor', 'morning_teacher', 'teacher'].includes(currentUser.role) ? '是' : '否（家长）'}
              </span>
            )}
          </Space>
        </Header>
        <Content style={{ padding: 16 }}>
          {view === 'list' && (
            <RecordList onViewDetail={handleViewDetail} />
          )}
          {view === 'detail' && currentRecordId && (
            <RecordDetail recordId={currentRecordId} onBack={handleBack} />
          )}
        </Content>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
