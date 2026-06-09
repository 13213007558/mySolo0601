import { useState, useEffect } from 'react';
import { X, Send, History, User, Calendar, FileText, AlertTriangle, GitCompare, CheckCircle2 } from 'lucide-react';
import { StatusBadge, PriorityBadge, SourceBadge, ErrorBadge } from './StatusBadge';
import { ANNOTATION_STATUS, ANNOTATION_STATUS_LABELS, ASSIGNEES } from '../db';
import { getRepliesByAnnotationId, addReply, updateAnnotationStatus, assignAnnotation, compareVersions } from '../db/operations';

export function DetailDrawer({ annotation, onClose, onRefresh }) {
  const [replies, setReplies] = useState([]);
  const [newReply, setNewReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVersionCompare, setShowVersionCompare] = useState(false);
  const [versionHistory, setVersionHistory] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState('');

  useEffect(() => {
    if (annotation) {
      loadReplies();
    }
  }, [annotation]);

  const loadReplies = async () => {
    if (!annotation) return;
    const data = await getRepliesByAnnotationId(annotation.id);
    setReplies(data);
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!newReply.trim()) return;

    setLoading(true);
    try {
      await addReply(annotation.id, newReply.trim());
      setNewReply('');
      await loadReplies();
      onRefresh();
    } catch (error) {
      alert('回复失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await updateAnnotationStatus(annotation.id, newStatus);
      onRefresh();
      onClose();
    } catch (error) {
      alert('状态更新失败：' + error.message);
    }
  };

  const handleAssign = async () => {
    if (!selectedAssignee) return;
    
    try {
      await assignAnnotation(annotation.id, selectedAssignee);
      setAssigning(false);
      setSelectedAssignee('');
      onRefresh();
      onClose();
    } catch (error) {
      alert('分派失败：' + error.message);
    }
  };

  const handleShowVersionCompare = async () => {
    try {
      const history = await compareVersions(annotation.id);
      setVersionHistory(history);
      setShowVersionCompare(true);
    } catch (error) {
      alert('获取版本历史失败：' + error.message);
    }
  };

  if (!annotation) return null;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose}></div>
      
      <div className="drawer-panel overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-slate-800">
              批注详情
            </h3>
            <span className="font-mono text-sm text-primary-600 bg-primary-50 px-2 py-1 rounded">
              {annotation.annotationNo}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <StatusBadge status={annotation.status} />
              <PriorityBadge priority={annotation.priority} />
              <SourceBadge source={annotation.source} />
              {annotation.hasError && (
                <ErrorBadge errorType={annotation.errorType} />
              )}
            </div>

            <div className="card p-4">
              <h4 className="font-medium text-slate-700 mb-3">批注内容</h4>
              <p className="text-slate-800 leading-relaxed">
                {annotation.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="card p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">图纸页码</span>
                </div>
                <p className="font-mono text-lg font-medium text-slate-800">
                  {annotation.pageNo || '未标注'}
                </p>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <User className="w-4 h-4" />
                  <span className="text-sm">责任人</span>
                </div>
                {assigning ? (
                  <div className="flex gap-2">
                    <select
                      className="select text-sm"
                      value={selectedAssignee}
                      onChange={(e) => setSelectedAssignee(e.target.value)}
                    >
                      <option value="">请选择</option>
                      {ASSIGNEES.map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssign}
                      disabled={!selectedAssignee}
                      className="btn-primary text-sm px-3 py-1"
                    >
                      确认
                    </button>
                    <button
                      onClick={() => setAssigning(false)}
                      className="btn-secondary text-sm px-3 py-1"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <p className="text-lg font-medium text-slate-800">
                    {annotation.assignee || (
                      <button
                        onClick={() => setAssigning(true)}
                        className="text-primary-600 hover:underline text-sm"
                      >
                        点击分派责任人
                      </button>
                    )}
                  </p>
                )}
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">创建时间</span>
                </div>
                <p className="text-slate-800">
                  {formatDateTime(annotation.createdAt)}
                </p>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">更新时间</span>
                </div>
                <p className="text-slate-800">
                  {formatDateTime(annotation.updatedAt)}
                </p>
              </div>
            </div>

            <div className="card p-4">
              <h4 className="font-medium text-slate-700 mb-3">位置信息</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-sm text-slate-500">楼栋</span>
                  <p className="font-medium text-slate-800">{annotation.building || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">专业</span>
                  <p className="font-medium text-slate-800">{annotation.major || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">导入批次</span>
                  <p className="font-mono text-slate-800 text-sm">
                    {annotation.importBatchId?.slice(0, 12) || '-'}
                  </p>
                </div>
              </div>
            </div>

            {annotation.hasError && (
              <div className="problem-card">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800">数据问题提示</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      该条记录存在数据质量问题，请返回列表页，在问题区点击「修复问题」进行修正。
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-slate-600" />
                  <h4 className="font-medium text-slate-700">
                    回复历史 ({replies.length} 条)
                  </h4>
                </div>
                <button
                  onClick={handleShowVersionCompare}
                  className="btn-secondary text-sm py-1.5 px-3"
                >
                  <GitCompare className="w-4 h-4 mr-1" />
                  版本对比
                </button>
              </div>

              {replies.length === 0 ? (
                <div className="card p-8 text-center text-slate-500">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p>暂无回复记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {replies.map((reply, index) => (
                    <div key={reply.id} className="card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-medium text-sm">
                              {reply.replier?.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 text-sm">
                              {reply.replier}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatDateTime(reply.repliedAt)}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400">#{index + 1}</span>
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed pl-10">
                        {reply.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {annotation.status !== ANNOTATION_STATUS.CLOSED && (
              <form onSubmit={handleSubmitReply} className="card p-4">
                <h4 className="font-medium text-slate-700 mb-3">添加回复</h4>
                <textarea
                  className="input mb-3"
                  rows="3"
                  placeholder="输入回复内容...（如：已联系设计院，预计明天给出修改方案）"
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                />
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    {annotation.status !== ANNOTATION_STATUS.REPLIED && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(ANNOTATION_STATUS.REPLIED)}
                        className="btn-secondary text-sm"
                      >
                        标记为已回复
                      </button>
                    )}
                    {annotation.status !== ANNOTATION_STATUS.CLOSED && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('确定要关闭此批注吗？关闭后将无法继续编辑。')) {
                            handleStatusChange(ANNOTATION_STATUS.CLOSED);
                          }
                        }}
                        className="btn-danger text-sm"
                      >
                        关闭批注
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={!newReply.trim() || loading}
                    className="btn-primary"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    发送回复
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {showVersionCompare && versionHistory && (
        <div className="modal-backdrop" onClick={() => setShowVersionCompare(false)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">版本历史对比</h3>
              <button
                onClick={() => setShowVersionCompare(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto scrollbar-thin">
              <div className="mb-6">
                <h4 className="font-medium text-slate-700 mb-2">当前状态</h4>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <StatusBadge status={versionHistory.current.status} />
                    <PriorityBadge priority={versionHistory.current.priority} />
                  </div>
                  <p className="text-slate-800">{versionHistory.current.description}</p>
                  <p className="text-sm text-slate-500 mt-2">
                    责任人：{versionHistory.current.assignee || '未分派'}
                  </p>
                </div>
              </div>
              
              <h4 className="font-medium text-slate-700 mb-3">历史回复</h4>
              <div className="space-y-3">
                {versionHistory.history.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">暂无历史记录</p>
                ) : (
                  versionHistory.history.map((item, idx) => (
                    <div key={idx} className="border-l-4 border-primary-500 pl-4 py-2">
                      <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                        <span>{item.operator}</span>
                        <span>·</span>
                        <span>{formatDateTime(item.timestamp)}</span>
                      </div>
                      <p className="text-slate-700">{item.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function formatDateTime(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
