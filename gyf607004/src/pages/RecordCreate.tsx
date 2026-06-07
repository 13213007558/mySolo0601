import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/store';
import Layout from '@/components/Layout';
import RecordForm, { type RecordFormValues } from '@/components/RecordForm';
import type { NavKey } from '@/components/Sidebar';
import type { User } from '@/types';

export default function RecordCreate() {
  const navigate = useNavigate();
  const { currentUser, createRecord, switchUser } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleNavChange = (key: NavKey) => {
    switch (key) {
      case 'list':
        navigate('/');
        break;
      case 'new':
        break;
      case 'approve':
        navigate('/approval');
        break;
      case 'import':
        navigate('/import');
        break;
      case 'export':
        navigate('/export');
        break;
    }
  };

  const handleUserSwitch = (user: User) => {
    switchUser(user.id);
  };

  const handleSubmit = async (values: RecordFormValues) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      await createRecord(values, currentUser);
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 800);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <Layout
      user={currentUser}
      activeNav="new"
      onNavChange={handleNavChange}
      onUserSwitch={handleUserSwitch}
    >
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-ink-blue transition-colors mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>返回列表</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">录入改期记录</h1>
        </div>

        {success ? (
          <div className="rounded-lg border border-status-green/30 bg-status-green/5 p-8 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-status-green" />
            <div className="text-lg font-semibold text-gray-900 mb-1">提交成功</div>
            <div className="text-sm text-gray-500">正在返回记录列表...</div>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <RecordForm
              onSubmit={handleSubmit}
              loading={loading}
              submitText="提交"
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
