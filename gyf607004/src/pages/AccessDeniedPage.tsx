import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/store';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import type { NavKey } from '@/components/Sidebar';
import type { User } from '@/types';

export default function AccessDeniedPage() {
  const navigate = useNavigate();
  const { currentUser, switchUser, accessDeniedInfo, clearAccessDenied } = useAppStore();

  const handleNavChange = (key: NavKey) => {
    switch (key) {
      case 'list':
        clearAccessDenied();
        navigate('/');
        break;
      case 'new':
        navigate('/record/create');
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

  const handleBack = () => {
    clearAccessDenied();
    navigate('/');
  };

  useEffect(() => {
    return () => {
      clearAccessDenied();
    };
  }, [clearAccessDenied]);

  if (!currentUser) return null;

  const reason = accessDeniedInfo?.reason || '您无权访问此页面或记录';

  return (
    <Layout
      user={currentUser}
      activeNav="list"
      onNavChange={handleNavChange}
      onUserSwitch={handleUserSwitch}
    >
      <div className="h-full flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="flex justify-center mb-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-status-red/10">
              <ShieldAlert className="h-12 w-12 text-status-red" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">访问被拒绝</h1>

          <p className="text-base text-gray-600 mb-6">{reason}</p>

          {accessDeniedInfo && (accessDeniedInfo.recordId || accessDeniedInfo.babyName) && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 mb-6 text-left">
              <div className="space-y-1.5 text-sm">
                {accessDeniedInfo.recordId && (
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">记录ID</span>
                    <span className="text-gray-900 font-mono">
                      {accessDeniedInfo.recordId}
                    </span>
                  </div>
                )}
                {accessDeniedInfo.babyName && (
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">宝宝姓名</span>
                    <span className="text-gray-900 font-medium">
                      {accessDeniedInfo.babyName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <Button onClick={handleBack} icon={<ArrowLeft className="h-4 w-4" />}>
            返回列表
          </Button>
        </div>
      </div>
    </Layout>
  );
}
