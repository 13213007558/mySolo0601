import { useState } from 'react';
import { Eye, UserPlus, Trash2, MoreHorizontal, User, Calendar, Tag } from 'lucide-react';
import { StatusBadge, PriorityBadge, SourceBadge, ErrorBadge } from './StatusBadge';
import { ANNOTATION_STATUS, ANNOTATION_STATUS_LABELS, ASSIGNEES } from '../db';
import { assignAnnotation } from '../db/operations';

export function AnnotationList({ annotations, onViewDetail, onDelete, onRefresh, loading }) {
  const [assigningId, setAssigningId] = useState(null);
  const [selectedAssignee, setSelectedAssignee] = useState('');

  const handleAssign = async (annotationId) => {
    if (!selectedAssignee) return;
    
    try {
      await assignAnnotation(annotationId, selectedAssignee);
      onRefresh();
    } catch (error) {
      alert('分派失败：' + error.message);
    } finally {
      setAssigningId(null);
      setSelectedAssignee('');
    }
  };

  const handleDelete = async (annotation) => {
    if (confirm(`确定要删除批注「${annotation.annotationNo}」吗？此操作不可恢复。`)) {
      const success = await onDelete(annotation.id);
      if (success) {
        alert('删除成功');
      }
    }
  };

  if (loading) {
    return (
      <div className="card p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-slate-500">加载中...</p>
      </div>
    );
  }

  if (annotations.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="text-slate-400 mb-4">
          <Tag className="w-12 h-12 mx-auto mb-2" />
        </div>
        <p className="text-slate-500 text-lg">暂无符合条件的批注记录</p>
        <p className="text-slate-400 text-sm mt-2">请尝试调整筛选条件或导入新的数据</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="table-header">批注编号</th>
              <th className="table-header">楼栋/专业</th>
              <th className="table-header">图纸页码</th>
              <th className="table-header">批注内容</th>
              <th className="table-header">来源</th>
              <th className="table-header">责任人</th>
              <th className="table-header">状态</th>
              <th className="table-header">优先级</th>
              <th className="table-header">创建时间</th>
              <th className="table-header text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {annotations.map((annotation) => (
              <tr
                key={annotation.id}
                className={`hover:bg-slate-50 transition-colors ${annotation.hasError ? 'bg-amber-50/30' : ''}`}
              >
                <td className="table-cell">
                  <span className="font-mono text-sm font-medium text-primary-600">
                    {annotation.annotationNo}
                  </span>
                  {annotation.hasError && (
                    <div className="mt-1">
                      <ErrorBadge errorType={annotation.errorType} />
                    </div>
                  )}
                </td>
                <td className="table-cell">
                  <div className="font-medium">{annotation.building || '-'}</div>
                  <div className="text-sm text-slate-500">{annotation.major || '-'}</div>
                </td>
                <td className="table-cell">
                  <span className="font-mono bg-slate-100 px-2 py-1 rounded text-sm">
                    {annotation.pageNo || '未标注'}
                  </span>
                </td>
                <td className="table-cell max-w-xs">
                  <div className="line-clamp-2 text-sm" title={annotation.description}>
                    {annotation.description || '-'}
                  </div>
                </td>
                <td className="table-cell">
                  <SourceBadge source={annotation.source} />
                </td>
                <td className="table-cell">
                  {assigningId === annotation.id ? (
                    <div className="flex gap-2">
                      <select
                        className="select text-xs py-1"
                        value={selectedAssignee}
                        onChange={(e) => setSelectedAssignee(e.target.value)}
                      >
                        <option value="">请选择责任人</option>
                        {ASSIGNEES.map(a => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleAssign(annotation.id)}
                        disabled={!selectedAssignee}
                        className="btn-primary text-xs py-1 px-2"
                      >
                        确认
                      </button>
                      <button
                        onClick={() => setAssigningId(null)}
                        className="btn-secondary text-xs py-1 px-2"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      {annotation.assignee ? (
                        <span className="text-sm">{annotation.assignee}</span>
                      ) : (
                        <span className="text-sm text-slate-400">未分派</span>
                      )}
                    </div>
                  )}
                </td>
                <td className="table-cell">
                  <StatusBadge status={annotation.status} />
                </td>
                <td className="table-cell">
                  <PriorityBadge priority={annotation.priority} />
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-1 text-sm text-slate-500">
                    <Calendar className="w-3 h-3" />
                    {formatDateTime(annotation.createdAt)}
                  </div>
                </td>
                <td className="table-cell">
                  <div className="flex items-center justify-center gap-1">
                    <div className="relative group">
                      <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-slate-500" />
                      </button>
                      <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 w-36 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <button
                          onClick={() => onViewDetail(annotation)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          查看详情
                        </button>
                        {annotation.status !== ANNOTATION_STATUS.CLOSED && (
                          <button
                            onClick={() => setAssigningId(annotation.id)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                          >
                            <UserPlus className="w-4 h-4" />
                            分派责任人
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(annotation)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDateTime(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
