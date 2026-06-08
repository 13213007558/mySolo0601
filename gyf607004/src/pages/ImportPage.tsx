import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileUp, CheckCircle2, XCircle } from 'lucide-react';
import { useAppStore } from '@/store';
import Layout from '@/components/Layout';
import ImportPreview from '@/components/ImportPreview';
import Button from '@/components/Button';
import type { NavKey } from '@/components/Sidebar';
import type { User, ImportDryRunResult } from '@/types';

export default function ImportPage() {
  const navigate = useNavigate();
  const { init, currentUser, switchUser, dryRunImport, commitImport } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dryRunResult, setDryRunResult] = useState<ImportDryRunResult | null>(null);
  const [dryRunLoading, setDryRunLoading] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);
  const [commitResult, setCommitResult] = useState<{ success: number; failed: number } | null>(null);

  useEffect(() => {
    const initialize = async () => {
      await init();
    };
    initialize();
  }, [init]);

  useEffect(() => {
    if (currentUser && currentUser.role !== 'supervisor') {
      const state = useAppStore.getState();
      state.accessDeniedInfo = {
        recordId: '',
        babyName: '',
        reason: '仅护理主管可使用批量导入功能',
      };
      useAppStore.setState({ accessDeniedInfo: state.accessDeniedInfo });
      navigate('/access-denied');
    }
  }, [currentUser, navigate]);

  const handleNavChange = (key: NavKey) => {
    switch (key) {
      case 'list':
        navigate('/');
        break;
      case 'new':
        navigate('/records/new');
        break;
      case 'approve':
        navigate('/approvals');
        break;
      case 'import':
        break;
      case 'export':
        navigate('/export');
        break;
    }
  };

  const handleUserSwitch = (user: User) => {
    switchUser(user.id);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setDryRunResult(null);
    setCommitResult(null);
    setDryRunLoading(true);
    try {
      const result = await dryRunImport(file);
      setDryRunResult(result);
    } finally {
      setDryRunLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!dryRunResult) return;
    setCommitLoading(true);
    try {
      const result = await commitImport(dryRunResult);
      setCommitResult(result);
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } finally {
      setCommitLoading(false);
    }
  };

  const handleCancelImport = () => {
    setDryRunResult(null);
    setSelectedFile(null);
    setCommitResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!currentUser) return null;

  return (
    <Layout
      user={currentUser}
      activeNav="import"
      onNavChange={handleNavChange}
      onUserSwitch={handleUserSwitch}
    >
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">批量导入（试跑校验）</h1>
          <p className="mt-2 text-sm text-gray-500">
            上传旧记录或新材料，系统先校验不直接入库，标记坏行不影响正常记录
          </p>
        </div>

        {commitResult ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <div className="flex items-center justify-center gap-6 mb-4">
              <div className="flex flex-col items-center">
                <CheckCircle2 className="h-9 w-9 mb-2 text-status-green" />
                <div className="text-2xl font-bold text-gray-900">{commitResult.success}</div>
                <div className="text-sm text-gray-500">成功入库</div>
              </div>
              <div className="flex flex-col items-center">
                <XCircle className="h-9 w-9 mb-2 text-status-red" />
                <div className="text-2xl font-bold text-gray-900">{commitResult.failed}</div>
                <div className="text-sm text-gray-500">失败跳过</div>
              </div>
            </div>
            <div className="text-sm text-gray-500">正在返回记录列表...</div>
          </div>
        ) : dryRunResult ? (
          <ImportPreview
            result={dryRunResult}
            onConfirm={handleConfirmImport}
            onCancel={handleCancelImport}
            loading={commitLoading}
          />
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-8">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onClick={handleUploadClick}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-ink-blue hover:bg-ink-blue/5 transition-colors"
            >
              <div className="flex flex-col items-center">
                {dryRunLoading ? (
                  <>
                    <FileUp className="h-12 w-12 mb-4 text-ink-blue animate-pulse" />
                    <div className="text-lg font-medium text-gray-900 mb-1">正在校验文件...</div>
                    <div className="text-sm text-gray-500">
                      {selectedFile?.name}
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="h-12 w-12 mb-4 text-gray-400" />
                    <div className="text-lg font-medium text-gray-900 mb-1">
                      点击上传文件
                    </div>
                    <div className="text-sm text-gray-500 mb-4">
                      支持 .csv, .xlsx, .xls 格式
                    </div>
                    <Button type="button" onClick={handleUploadClick} disabled={dryRunLoading}>
                      选择文件
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
