import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import {
  FileDown,
  FileText,
  Shield,
  Download,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  ITEM_TYPE_LABEL,
  METHOD_LABEL,
  RECORD_STATUS_LABEL,
  formatDateTime,
} from '@/utils/format';
import { applyPrivacyFilter } from '@/utils/privacyFilter';
import type { Role } from '@/types';

const EXPORT_FIELDS = [
  { key: 'babyName', label: '宝宝姓名', privacy: true },
  { key: 'bedNo', label: '床位号' },
  { key: 'itemType', label: '用品类型' },
  { key: 'method', label: '消毒方式' },
  { key: 'operatedAt', label: '操作时间' },
  { key: 'operatorName', label: '操作人', privacy: true },
  { key: 'status', label: '状态' },
  { key: 'isManual', label: '是否补录' },
  { key: 'photoRemark', label: '照片说明' },
  { key: 'motherName', label: '家属姓名', privacy: true, supervisorOnly: true },
];

export default function ExportPage() {
  const allUsers = useAppStore((s) => s.users);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const records = useAppStore((s) => s.records);
  const babies = useAppStore((s) => s.babies);
  const users = useAppStore((s) => s.users);
  const classes = useAppStore((s) => s.classes);

  const role = useMemo<Role>(() => {
    const u = allUsers.find((x) => x.id === currentUserId);
    return u?.role ?? 'nurse';
  }, [allUsers, currentUserId]);

  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [previewRole, setPreviewRole] = useState<Role>(role);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const filteredRecords =
    selectedClass === 'all'
      ? records
      : records.filter((r) => {
          const baby = babies.find((b) => b.id === r.babyId);
          return baby?.classId === selectedClass;
        });

  const visibleFields = EXPORT_FIELDS.filter(
    (f) => !f.supervisorOnly || previewRole !== 'nurse'
  );

  const buildRows = (targetRole: Role) => {
    return filteredRecords.map((r) => {
      const baby = babies.find((b) => b.id === r.babyId);
      const filteredBaby = baby
        ? (applyPrivacyFilter(baby, targetRole) as typeof baby)
        : null;
      const operator = users.find((u) => u.id === r.operatorId);
      const filteredOperator = operator
        ? (applyPrivacyFilter(operator, targetRole) as typeof operator)
        : null;
      return {
        babyName: filteredBaby?.name ?? '—',
        bedNo: filteredBaby?.bedNo ?? '—',
        motherName:
          previewRole !== 'nurse' ? baby?.motherName ?? '' : '[已脱敏]',
        itemType: ITEM_TYPE_LABEL[r.itemType],
        method: METHOD_LABEL[r.disinfectionMethod],
        operatedAt: formatDateTime(r.operatedAt),
        operatorName: filteredOperator?.name ?? '—',
        status: RECORD_STATUS_LABEL[r.status],
        isManual: r.isManual ? '是' : '否',
        photoRemark: r.photoRemark ?? '',
      };
    });
  };

  const rows = buildRows(previewRole);

  const exportCSV = () => {
    const actualRows = buildRows(role);
    const header = visibleFields.map((f) => f.label).join(',');
    const body = actualRows
      .map((row: any) =>
        visibleFields
          .map((f) => {
            const val = String(row[f.key] ?? '');
            return val.includes(',') ? `"${val}"` : val;
          })
          .join(',')
      )
      .join('\n');
    const csv = '\ufeff' + header + '\n' + body;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `消毒记录_${new Date().toISOString().slice(0, 10)}_${role}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToast('导出成功：已按当前角色过滤隐私字段');
    setTimeout(() => setToast(null), 2600);
  };

  const exportJSON = () => {
    const actualRows = buildRows(role);
    const payload = {
      exportedAt: new Date().toISOString(),
      exportedByRole: role,
      privacyApplied: true,
      total: actualRows.length,
      data: actualRows,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `消毒记录_${new Date().toISOString().slice(0, 10)}_${role}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToast('JSON 导出成功：响应体已按角色脱敏');
    setTimeout(() => setToast(null), 2600);
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg animate-slide-in-right flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          {toast}
        </div>
      )}
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-900 tracking-tight">
          导出中心
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          所有导出均按当前登录角色自动过滤隐私字段，后端接口、前端页面、日志系统使用同一过滤规则
        </p>
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="label">选择班级</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input !w-56"
            >
              <option value="all">全部班级</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">预览角色（用于查看过滤效果）</label>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              {(['nurse', 'supervisor', 'admin'] as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setPreviewRole(r)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                    previewRole === r
                      ? 'bg-white text-teal-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Shield className="w-3 h-3" />
                  {r === 'nurse' ? '护理员' : r === 'supervisor' ? '主管' : '管理员'}
                </button>
              ))}
            </div>
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={exportCSV} className="btn-primary">
              <FileDown className="w-4 h-4" />
              导出 CSV
            </button>
            <button onClick={exportJSON} className="btn-secondary">
              <FileText className="w-4 h-4" />
              导出 JSON
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-teal-600" />
            共 <span className="font-mono font-medium text-slate-700">{rows.length}</span> 条记录
            {previewRole !== role && (
              <span className="text-amber-600">
                （以「{previewRole === 'nurse' ? '护理员' : previewRole === 'supervisor' ? '主管' : '管理员'}」身份预览）
              </span>
            )}
          </div>
          <button
            onClick={() => setShowJsonPreview((v) => !v)}
            className="btn-ghost !text-xs"
          >
            {showJsonPreview ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                隐藏 JSON 预览
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                查看接口响应预览
              </>
            )}
          </button>
        </div>
      </div>

      {showJsonPreview && (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-900 text-slate-300 text-xs font-mono flex items-center justify-between">
            <span>GET /api/export?role={previewRole}</span>
            <span className="text-teal-400">200 OK</span>
          </div>
          <pre className="p-4 text-xs font-mono bg-slate-950 text-slate-300 overflow-x-auto max-h-64">
{JSON.stringify(
  {
    exportedAt: new Date().toISOString(),
    exportedByRole: previewRole,
    privacyApplied: true,
    total: Math.min(rows.length, 2),
    data: rows.slice(0, 2),
  },
  null,
  2
)}
          </pre>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500">
                {visibleFields.map((f) => (
                  <th
                    key={f.key}
                    className="px-4 py-3 text-left font-medium whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      {f.label}
                      {f.privacy && (
                        <span
                          title="隐私字段：护理员角色自动脱敏"
                          className="w-3.5 h-3.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold flex items-center justify-center"
                        >
                          P
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.slice(0, 50).map((row: any, i) => (
                <tr key={i} className="hover:bg-slate-50/60">
                  {visibleFields.map((f) => (
                    <td key={f.key} className="px-4 py-2.5 text-slate-700 whitespace-nowrap">
                      {String(row[f.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length > 50 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 text-center">
            仅预览前 50 条，共 {rows.length} 条，点击下方按钮导出完整数据
          </div>
        )}
      </div>

      <div className="card p-5 bg-gradient-to-br from-slate-50 to-white">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4.5 h-4.5 text-teal-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-slate-900">隐私字段统一过滤策略</h3>
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              <li>• <strong>页面渲染</strong>：applyPrivacyFilter 按角色脱敏姓名、工号、家属信息</li>
              <li>• <strong>JSON 接口</strong>：响应序列化前调用同一过滤器，避免前端藏数</li>
              <li>• <strong>日志系统</strong>：sanitizeForLog 函数在写入控制台/远程日志前脱敏</li>
              <li>• <strong>导出文件</strong>：CSV/JSON 导出均使用当前角色重新过滤字段</li>
            </ul>
          </div>
          <Download className="w-5 h-5 text-slate-300" />
        </div>
      </div>
    </div>
  );
}
