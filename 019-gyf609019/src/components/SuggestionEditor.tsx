import { useAppStore } from '@/store/useAppStore';
import { addSuggestionVersion, getSuggestionByZone, getSuggestionVersions } from '@/db';
import { Save, X, FileEdit, History } from 'lucide-react';
import VersionHistory from './VersionHistory';

export default function SuggestionEditor() {
  const {
    suggestion,
    suggestionVersions,
    editingSuggestion,
    editingContent,
    editingChangeNote,
    startEditingSuggestion,
    cancelEditingSuggestion,
    setEditingContent,
    setEditingChangeNote,
    setSuggestion,
    setSuggestionVersions,
    setComparingVersions,
    selectedZoneId,
  } = useAppStore();

  const handleSave = async () => {
    if (!suggestion || !editingContent.trim()) return;
    const note = editingChangeNote.trim() || '更新建议';
    await addSuggestionVersion(suggestion.id, editingContent, note);
    const updated = await getSuggestionByZone(selectedZoneId!);
    const versions = await getSuggestionVersions(suggestion.id);
    setSuggestion(updated);
    setSuggestionVersions(versions);
    cancelEditingSuggestion();
  };

  return (
    <div className="bg-white rounded-xl border border-steel-200 shadow-sm">
      <div className="px-5 py-3 border-b border-steel-200 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-navy-500 uppercase tracking-wider flex items-center gap-2">
          <FileEdit className="w-4 h-4" />
          返工建议
          {suggestion && (
            <span className="text-xs font-normal text-steel-400 bg-steel-50 px-2 py-0.5 rounded">
              v{suggestionVersions.length}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          {suggestion && suggestionVersions.length > 1 && (
            <button
              onClick={() => setComparingVersions(true)}
              className="flex items-center gap-1 text-xs text-steel-500 hover:text-navy-500 px-2 py-1 rounded hover:bg-steel-50 transition-colors"
            >
              <History className="w-3.5 h-3.5" />
              版本比较
            </button>
          )}
          {!editingSuggestion && suggestion && (
            <button
              onClick={startEditingSuggestion}
              className="flex items-center gap-1 text-xs bg-navy-500 text-white px-3 py-1.5 rounded-lg hover:bg-navy-600 transition-colors"
            >
              <FileEdit className="w-3.5 h-3.5" />
              编辑建议
            </button>
          )}
        </div>
      </div>

      <div className="p-5">
        {editingSuggestion ? (
          <div className="space-y-3">
            <textarea
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              rows={8}
              className="w-full border border-steel-200 rounded-lg p-3 text-sm text-navy-700 font-sans resize-y focus:outline-none focus:ring-2 focus:ring-navy-400/30 focus:border-navy-400"
              placeholder="输入返工建议..."
            />
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={editingChangeNote}
                onChange={(e) => setEditingChangeNote(e.target.value)}
                placeholder="修改说明（可选）"
                className="flex-1 border border-steel-200 rounded-lg px-3 py-1.5 text-sm text-navy-700 focus:outline-none focus:ring-2 focus:ring-navy-400/30 focus:border-navy-400"
              />
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 bg-safe text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
              >
                <Save className="w-4 h-4" />
                保存新版本
              </button>
              <button
                onClick={cancelEditingSuggestion}
                className="flex items-center gap-1.5 bg-steel-100 text-steel-600 px-3 py-1.5 rounded-lg text-sm hover:bg-steel-200 transition-colors"
              >
                <X className="w-4 h-4" />
                取消
              </button>
            </div>
          </div>
        ) : suggestion ? (
          <div className="whitespace-pre-wrap text-sm text-navy-700 leading-relaxed bg-steel-50 rounded-lg p-4 border border-steel-100">
            {suggestion.currentContent}
          </div>
        ) : (
          <div className="text-center text-steel-400 text-sm py-8">暂无返工建议</div>
        )}
      </div>

      <VersionHistory />
    </div>
  );
}
