import { AlertTriangle, Wrench, Eye, Trash2 } from 'lucide-react';
import { StatusBadge, PriorityBadge, SourceBadge, ErrorBadge } from './StatusBadge';
import { BUILDINGS, MAJORS } from '../db';
import { updateAnnotation, deleteAnnotation } from '../db/operations';
import { useState } from 'react';

export function ProblemSection({ annotations, onRefresh, onViewDetail }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  if (annotations.length === 0) {
    return null;
  }

  const handleEdit = (annotation) => {
    setEditingId(annotation.id);
    setEditForm({
      building: annotation.building,
      major: annotation.major,
      pageNo: annotation.pageNo,
      description: annotation.description
    });
  };

  const handleSave = async (annotationId) => {
    try {
      await updateAnnotation(annotationId, editForm);
      setEditingId(null);
      setEditForm({});
      onRefresh();
      alert('问题已修复，记录已移出问题区');
    } catch (error) {
      alert('保存失败：' + error.message);
    }
  };

  const handleDelete = async (annotation) => {
    if (confirm(`确定要删除问题记录「${annotation.annotationNo}」吗？`)) {
      await deleteAnnotation(annotation.id);
      onRefresh();
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-amber-600" />
        <h2 className="text-lg font-semibold text-slate-800">
          问题区
          <span className="ml-2 text-sm font-normal text-amber-600">
            ({annotations.length} 条记录需要处理)
          </span>
        </h2>
      </div>
      
      <div className="grid gap-4">
        {annotations.map((annotation) => (
          <div key={annotation.id} className="problem-card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-sm font-medium text-amber-700">
                    {annotation.annotationNo}
                  </span>
                  <ErrorBadge errorType={annotation.errorType} />
                  <SourceBadge source={annotation.source} />
                  <PriorityBadge priority={annotation.priority} />
                </div>
                
                {editingId === annotation.id ? (
                  <div className="bg-white rounded-lg p-4 mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">
                          楼栋
                        </label>
                        <select
                          className="select"
                          value={editForm.building}
                          onChange={(e) => setEditForm(p => ({ ...p, building: e.target.value }))}
                        >
                          <option value="">请选择楼栋</option>
                          {BUILDINGS.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">
                          专业
                        </label>
                        <select
                          className="select"
                          value={editForm.major}
                          onChange={(e) => setEditForm(p => ({ ...p, major: e.target.value }))}
                        >
                          <option value="">请选择专业</option>
                          {MAJORS.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">
                          图纸页码
                        </label>
                        <input
                          type="text"
                          className="input"
                          placeholder="如 A-01"
                          value={editForm.pageNo}
                          onChange={(e) => setEditForm(p => ({ ...p, pageNo: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-600 mb-1">
                        批注内容
                      </label>
                      <textarea
                        className="input"
                        rows="2"
                        value={editForm.description}
                        onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(annotation.id)}
                        className="btn-primary"
                      >
                        <Wrench className="w-4 h-4 mr-2" />
                        修复并保存
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="btn-secondary"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                      <div>
                        <span className="text-slate-500">楼栋：</span>
                        <span className={!annotation.building ? 'text-red-600 font-medium' : ''}>
                          {annotation.building || '未填写'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">专业：</span>
                        <span className={!annotation.major || !MAJORS.includes(annotation.major) ? 'text-red-600 font-medium' : ''}>
                          {annotation.major || '未填写'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">页码：</span>
                        <span className={!annotation.pageNo ? 'text-red-600 font-medium' : ''}>
                          {annotation.pageNo || '未填写'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">责任人：</span>
                        <span>{annotation.assignee || '未分派'}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-slate-700 mb-3">
                      {annotation.description}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(annotation)}
                        className="btn-secondary text-sm py-1.5 px-3"
                      >
                        <Wrench className="w-4 h-4 mr-1" />
                        修复问题
                      </button>
                      <button
                        onClick={() => onViewDetail(annotation)}
                        className="btn-secondary text-sm py-1.5 px-3"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        查看详情
                      </button>
                      <button
                        onClick={() => handleDelete(annotation)}
                        className="btn-danger text-sm py-1.5 px-3"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        删除
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
