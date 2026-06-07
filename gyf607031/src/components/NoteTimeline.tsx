import { useState } from 'react';
import { MessageSquare, Plus, User, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { NoteHistoryItem } from '../../shared/types';

interface Props {
  notes: NoteHistoryItem[];
  babyId: string;
  onAdd: (content: string) => Promise<boolean>;
}

export default function NoteTimeline({ notes, babyId: _babyId, onAdd }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    const ok = await onAdd(content.trim());
    setSubmitting(false);
    if (ok) {
      setContent('');
      setShowAdd(false);
    }
  };

  const visibleCount = expanded ? notes.length : Math.min(2, notes.length);
  const displayed = notes.slice(-visibleCount).reverse();

  return (
    <div className="paper-card overflow-hidden">
      <div
        className="px-5 py-3 border-b border-ink-100 flex items-center gap-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <MessageSquare className="w-4 h-4 text-ink-500" />
        <span className="font-medium text-ink-700">沟通备注历史</span>
        {notes.length > 0 && (
          <span className="chip bg-ink-100 text-ink-600 border border-ink-200">
            保留 {notes.length} 条
          </span>
        )}
        {notes.some(n => n.source === 'original') && (
          <span className="chip bg-sage-50 text-sage-700 border border-sage-200 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            含原始承诺
          </span>
        )}
        <button
          className="ml-auto btn-ghost !py-1 !px-2"
          onClick={e => { e.stopPropagation(); setShowAdd(!showAdd); }}
        >
          <Plus className="w-4 h-4" />
          追加备注
        </button>
        {expanded ? <ChevronUp className="w-4 h-4 text-ink-400" /> : <ChevronDown className="w-4 h-4 text-ink-400" />}
      </div>

      {showAdd && (
        <div className="px-5 py-4 border-b border-ink-100 bg-paper-100">
          <div className="label">顾问补录（家长临时改口）</div>
          <textarea
            className="input resize-none h-20"
            placeholder="例：【顾问补录】家长临时改口：保健卡遗失需重新办理，预计6月15日完成"
            value={content}
            onChange={e => setContent(e.target.value)}
          />
          <div className="flex items-center justify-between mt-2 text-xs text-ink-500">
            <span className="flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-clay-500" />
              原有备注将保留，不会被新内容覆盖
            </span>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={() => { setShowAdd(false); setContent(''); }}>
                取消
              </button>
              <button
                className="btn-primary"
                disabled={submitting || !content.trim()}
                onClick={handleSubmit}
              >
                {submitting ? '提交中…' : '确认追加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {notes.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <MessageSquare className="w-8 h-8 text-ink-300 mx-auto mb-2" />
          <div className="text-sm text-ink-500">暂无备注记录</div>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {displayed.map((note, idx) => (
            <div
              key={note.id}
              className={`relative pl-5 ${idx !== displayed.length - 1 ? 'pb-3' : ''}`}
            >
              {idx !== displayed.length - 1 && (
                <div className="absolute left-[11px] top-5 bottom-0 w-px bg-ink-200" />
              )}
              <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                note.source === 'original'
                  ? 'bg-sage-50 border-sage-300'
                  : 'bg-clay-50 border-clay-300'
              }`}>
                <User className={`w-3 h-3 ${note.source === 'original' ? 'text-sage-600' : 'text-clay-600'}`} />
              </div>
              <div className={`paper-card p-4 border-l-4 ${
                note.source === 'original' ? 'border-l-sage-400' : 'border-l-clay-400'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`chip border ${
                    note.source === 'original'
                      ? 'bg-sage-50 text-sage-700 border-sage-200'
                      : 'bg-clay-50 text-clay-700 border-clay-200'
                  }`}>
                    {note.source === 'original' ? '系统原始记录' : '顾问补录'}
                  </span>
                  <span className="text-xs text-ink-500 flex items-center gap-1 ml-auto">
                    <Clock className="w-3 h-3" />
                    {note.createdAt}
                  </span>
                </div>
                <div className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">{note.content}</div>
                <div className="text-xs text-ink-400 mt-2">操作人：{note.operator}</div>
              </div>
            </div>
          ))}
          {!expanded && notes.length > 2 && (
            <button
              className="w-full py-2 text-sm text-ink-500 hover:text-ink-700 hover:bg-paper-100 rounded-lg transition-colors"
              onClick={() => setExpanded(true)}
            >
              展开全部 {notes.length} 条历史备注
            </button>
          )}
        </div>
      )}
    </div>
  );
}
