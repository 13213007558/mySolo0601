import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function Forbidden() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark-700 grid-bg flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-danger-500/20 border-2 border-danger-500 mb-6">
          <ShieldAlert className="w-12 h-12 text-danger-400" />
        </div>
        
        <h1 className="font-mono text-6xl font-bold text-danger-400 mb-2 glow-text">
          403
        </h1>
        <h2 className="text-2xl font-semibold text-white mb-4">
          访问被拒绝
        </h2>
        <p className="text-dark-300 mb-8">
          您当前的角色权限不足以访问此页面。如果您认为这是错误，请联系系统管理员。
        </p>

        <div className="bg-dark-600 border border-dark-500 p-4 mb-6">
          <p className="text-xs text-dark-400 mb-2">权限说明</p>
          <ul className="text-sm text-dark-200 space-y-1 text-left">
            <li>• 值班人员：查看告警、处理告警</li>
            <li>• 运维工程师：值班权限 + 导入数据、导出报表</li>
            <li>• 管理员：所有权限 + 查看敏感数据</li>
            <li>• 叶师傅：专属启停时段补录权限</li>
          </ul>
        </div>

        <button
          onClick={() => navigate('/', { replace: true })}
          className="btn-primary inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </button>
      </div>
    </div>
  );
}
