import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { AuthRecord, AuthJudgment, MaterialType, HistoryVersion } from '../types';
import {
  getRecord,
  updateRecord,
  supplementMaterials,
  labelJudgment,
  labelStatus,
  labelMaterialType,
  labelChangeType,
  labelAuditNoteType,
  subscribeStore,
} from '../store';

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<AuthRecord | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'audit' | 'materials'>('overview');
  const [showEditForm, setShowEditForm] = useState(false);
  const [showSupplementForm, setShowSupplementForm] = useState(false);
  const [diffTarget, setDiffTarget] = useState<{ a: HistoryVersion; b: HistoryVersion } | null>(null);

  const refresh = useCallback(() => {
    if (!id) return;
    const r = getRecord(id);
    if (!r) {
      setNotFound(true);
      return;
    }
    setRecord(r);
  }, [id]);

  useEffect(() => {
    refresh();
    return subscribeStore(refresh);
  }, [refresh]);

  const originalMaterials = useMemo(
    () => record?.materials.filter(m => m.source === 'original') ?? [],
    [record]
  );
  const supplementMaterialsList = useMemo(
    () => record?.materials.filter(m => m.source === 'supplement') ?? [],
    [record]
  );

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-center">
        <div className="text-slate-500">未找到该记录</div>
        <Link to="/" className="mt-4 inline-block text-brand-600 hover:underline">
          返回列表
        </Link>
      </div>
    );
  }
  if (!record) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <header className="mb-5">
        <div className="flex items-center gap-3 mb-2">
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-700">
            ← 返回列表
          </Link>
          {record.isCorrupted && (
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-rose-100 text-rose-700 border border-rose-200">
              数据异常（已隔离，不参与统计）
            </span>
          )}
          <span className="text-xs text-slate-400 font-mono">#{record.id.slice(0, 8)}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          {record.babyName}
          <span className="text-base font-normal text-slate-500">· 监护人 {record.guardianName}</span>
        </h1>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">
            当前版本 v{record.currentVersion}
          </span>
          <JudgmentBadge value={record.authJudgment} />
          <StatusBadge value={record.status} />
          {record.materials.some(m => m.source === 'supplement') && (
            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
              含补录材料 {supplementMaterialsList.length} 项
            </span>
          )}
          {record.auditNotes.length > 0 && (
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">
              审计说明 {record.auditNotes.length} 条
            </span>
          )}
        </div>
      </header>

      {record.isCorrupted && (
        <div className="mb-5 p-4 rounded-lg border border-rose-200 bg-rose-50">
          <div className="font-medium text-rose-800 text-sm">该记录已被标记为异常，修改操作将被拒绝</div>
          <div className="text-xs text-rose-700 mt-1">
            原因：{record.auditNotes.filter(n => n.type === 'corrupted_data' || n.type === 'data_integrity').map(n => n.reason).join('；') || '详见审计标签页'}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4 border-b border-slate-200">
        {(['overview', 'materials', 'history', 'audit'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={
              'px-3 py-2 text-sm font-medium border-b-2 -mb-px transition ' +
              (activeTab === tab
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-700')
            }
          >
            {tab === 'overview' && '概览'}
            {tab === 'materials' && `材料（${record.materials.length}）`}
            {tab === 'history' && `历史版本（${record.history.length}）`}
            {tab === 'audit' && `审计说明（${record.auditNotes.length}）`}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 pb-2">
          {!record.isCorrupted && (
            <>
              <button
                onClick={() => setShowSupplementForm(true)}
                className="px-3 py-1.5 text-sm rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium"
              >
                补录材料
              </button>
              <button
                onClick={() => setShowEditForm(true)}
                className="px-3 py-1.5 text-sm rounded-md border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 font-medium"
              >
                修改记录
              </button>
              {record.status === 'open' && (
                <button
                  onClick={() => {
                    const by = prompt('请输入处理人姓名：', '张护士') || '';
                    const reviewer = prompt('请输入复核人姓名（可选）：', '李护士长') || undefined;
                    const reason = prompt('关闭原因：', '授权判断已完成') || '';
                    if (!by.trim()) return;
                    updateRecord({
                      id: record.id,
                      status: 'closed',
                      changedBy: by,
                      reviewBy: reviewer,
                      changeReason: reason,
                    });
                  }}
                  className="px-3 py-1.5 text-sm rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium"
                >
                  关闭记录
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {activeTab === 'overview' && (
        <OverviewTab
          record={record}
          originalMaterials={originalMaterials}
          supplementMaterialsList={supplementMaterialsList}
        />
      )}
      {activeTab === 'materials' && (
        <MaterialsTab
          record={record}
          originalMaterials={originalMaterials}
          supplementMaterialsList={supplementMaterialsList}
        />
      )}
      {activeTab === 'history' && (
        <HistoryTab record={record} onDiff={(a, b) => setDiffTarget({ a, b })} />
      )}
      {activeTab === 'audit' && <AuditTab record={record} />}

      {showEditForm && (
        <EditModal
          record={record}
          onClose={() => setShowEditForm(false)}
          onSubmit={values => {
            updateRecord({
              id: record.id,
              ...values,
            });
            setShowEditForm(false);
          }}
        />
      )}
      {showSupplementForm && (
        <SupplementModal
          onClose={() => setShowSupplementForm(false)}
          onSubmit={values => {
            supplementMaterials({
              id: record.id,
              materials: values.materials.map((m, i) => ({ ...m, order: m.order ?? i })),
              changedBy: values.changedBy,
              reviewBy: values.reviewBy,
              changeReason: values.changeReason,
              manualEntry: values.manualEntry,
            });
            setShowSupplementForm(false);
          }}
        />
      )}
      {diffTarget && (
        <DiffModal
          a={diffTarget.a}
          b={diffTarget.b}
          onClose={() => setDiffTarget(null)}
        />
      )}

      <footer className="mt-8 text-xs text-slate-400">
        登记人：{record.createdBy || '(缺失，见审计说明)'} · 登记时间：
        {new Date(record.createdAt).toLocaleString('zh-CN', { hour12: false })} · 最后更新：
        {new Date(record.updatedAt).toLocaleString('zh-CN', { hour12: false })}
      </footer>
    </div>
  );
}

function OverviewTab({
  record,
  originalMaterials,
  supplementMaterialsList,
}: {
  record: AuthRecord;
  originalMaterials: AuthRecord['materials'];
  supplementMaterialsList: AuthRecord['materials'];
}) {
  return (
    <div className="grid md:grid-cols-3 gap-5">
      <div className="md:col-span-2 space-y-4">
        <Card title="基本信息">
          <Row label="婴幼儿姓名" value={record.babyName} />
          <Row label="监护人" value={record.guardianName} />
          <Row label="当前授权判断">
            <JudgmentBadge value={record.authJudgment} />
          </Row>
          <Row label="当前状态">
            <StatusBadge value={record.status} />
          </Row>
          <Row label="当前版本" value={`v${record.currentVersion}（共 ${record.history.length} 个历史版本）`} />
        </Card>

        <Card title={`课堂照片及材料（原始 ${originalMaterials.length} 项，补录 ${supplementMaterialsList.length} 项）`}>
          {originalMaterials.length === 0 && supplementMaterialsList.length === 0 && (
            <div className="text-sm text-slate-400 py-4 text-center">暂无材料</div>
          )}
          {originalMaterials.length > 0 && (
            <>
              <div className="text-xs text-slate-500 mb-2">原始材料</div>
              <ul className="text-sm divide-y divide-slate-100 mb-4">
                {originalMaterials.map(m => (
                  <li key={m.id} className="py-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-6">#{m.order + 1}</span>
                      <span className="font-medium text-slate-800">{m.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {labelMaterialType(m.type)}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(m.uploadedAt).toLocaleString('zh-CN', { hour12: false })}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {supplementMaterialsList.length > 0 && (
            <>
              <div className="text-xs text-indigo-600 font-medium mb-2">补录材料（不会覆盖原始判断）</div>
              <ul className="text-sm divide-y divide-indigo-100 bg-indigo-50/50 rounded-md">
                {supplementMaterialsList.map(m => (
                  <li key={m.id} className="py-2 px-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-indigo-400 w-6">#{m.order + 1}</span>
                      <span className="font-medium text-slate-800">{m.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-200">
                        {labelMaterialType(m.type)}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">补录</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(m.uploadedAt).toLocaleString('zh-CN', { hour12: false })}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      <div className="space-y-4">
        <Card title="操作提醒">
          <ul className="text-xs text-slate-600 space-y-2">
            <li>✓ 每次修改都会生成新的历史版本，旧值不会被覆盖</li>
            <li>✓ 补录材料不会改变原有的授权判断</li>
            <li>✓ 刷新或重启后历史版本可完整读回</li>
            <li>✓ 审计中找不到处理人会在「审计说明」中展示原因</li>
            <li>✓ 已关闭记录追加材料会被标记为「已补录」并记录原因</li>
            <li>✓ 异常数据被隔离，不污染统计</li>
          </ul>
        </Card>
        {record.auditNotes.length > 0 && (
          <Card title="最近审计说明">
            <ul className="text-xs space-y-2">
              {record.auditNotes.slice(-3).reverse().map(n => (
                <li key={n.id} className="p-2 rounded bg-amber-50 border border-amber-100">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-medium">
                      {labelAuditNoteType(n.type)}
                    </span>
                    <span className="text-slate-400">
                      {new Date(n.createdAt).toLocaleString('zh-CN', { hour12: false })}
                    </span>
                  </div>
                  <div className="mt-1 text-slate-700 leading-relaxed">{n.reason}</div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}

function MaterialsTab({
  record,
  originalMaterials,
  supplementMaterialsList,
}: {
  record: AuthRecord;
  originalMaterials: AuthRecord['materials'];
  supplementMaterialsList: AuthRecord['materials'];
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 text-xs">
          <tr>
            <th className="px-4 py-3 text-left font-medium">顺序</th>
            <th className="px-4 py-3 text-left font-medium">材料名称</th>
            <th className="px-4 py-3 text-left font-medium">类型</th>
            <th className="px-4 py-3 text-left font-medium">来源</th>
            <th className="px-4 py-3 text-left font-medium">上传时间</th>
          </tr>
        </thead>
        <tbody>
          {[...originalMaterials, ...supplementMaterialsList]
            .sort((a, b) => a.order - b.order)
            .map(m => (
              <tr
                key={m.id}
                className={
                  'border-t border-slate-100 ' +
                  (m.source === 'supplement' ? 'bg-indigo-50/40' : '')
                }
              >
                <td className="px-4 py-3 text-slate-400">#{m.order + 1}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{m.name}</td>
                <td className="px-4 py-3 text-slate-600">{labelMaterialType(m.type)}</td>
                <td className="px-4 py-3">
                  {m.source === 'original' ? (
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">原始</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-xs bg-indigo-100 text-indigo-700 border border-indigo-200">
                      补录
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {new Date(m.uploadedAt).toLocaleString('zh-CN', { hour12: false })}
                </td>
              </tr>
            ))}
          {record.materials.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                暂无材料
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function HistoryTab({
  record,
  onDiff,
}: {
  record: AuthRecord;
  onDiff: (a: HistoryVersion, b: HistoryVersion) => void;
}) {
  const [selectedA, setSelectedA] = useState<string | null>(null);
  const reversed = [...record.history].reverse();
  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-500">
        共 {record.history.length} 个版本 · 点击任意版本查看快照，选择两个版本可对比差异。每次变更均保留旧值、处理人、复核人及时间。
      </div>
      {selectedA && (
        <div className="p-3 rounded-md bg-brand-50 border border-brand-200 text-sm text-brand-700">
          已选择 v{record.history.find(h => h.id === selectedA)?.version} 作为基准，点击另一版本进行对比。
          <button onClick={() => setSelectedA(null)} className="ml-3 underline text-brand-700">
            取消选择
          </button>
        </div>
      )}
      <ol className="relative border-l-2 border-slate-200 ml-4 space-y-5">
        {reversed.map((h, idx) => {
          const isLatest = idx === 0;
          const isSelected = selectedA === h.id;
          return (
            <li key={h.id} className="ml-6 relative">
              <span
                className={
                  'absolute -left-[30px] top-2 w-4 h-4 rounded-full border-2 ' +
                  (isLatest
                    ? 'bg-brand-600 border-brand-600'
                    : isSelected
                    ? 'bg-white border-brand-600 ring-4 ring-brand-100'
                    : 'bg-white border-slate-300')
                }
              />
              <div
                onClick={() => {
                  if (!selectedA) {
                    setSelectedA(h.id);
                  } else if (selectedA === h.id) {
                    setSelectedA(null);
                  } else {
                    const a = record.history.find(x => x.id === selectedA)!;
                    onDiff(a, h);
                    setSelectedA(null);
                  }
                }}
                className={
                  'bg-white rounded-lg border p-4 cursor-pointer transition ' +
                  (isSelected
                    ? 'border-brand-300 ring-2 ring-brand-100'
                    : 'border-slate-200 hover:border-brand-200 hover:shadow-sm')
                }
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-slate-900">版本 v{h.version}</span>
                  {isLatest && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-600 text-white font-medium">
                      当前
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {labelChangeType(h.changeType)}
                  </span>
                  <span className="text-xs text-slate-500 ml-auto">
                    {new Date(h.changedAt).toLocaleString('zh-CN', { hour12: false })}
                  </span>
                </div>
                <div className="text-xs text-slate-600 grid sm:grid-cols-3 gap-2 mb-3">
                  <div>
                    <span className="text-slate-400">处理人：</span>
                    <span className={h.changedBy && h.changedBy !== '(缺失)' ? 'text-slate-800 font-medium' : 'text-rose-600 font-medium'}>
                      {h.changedBy || '(缺失，见审计说明)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">复核人：</span>
                    <span className="text-slate-800 font-medium">{h.reviewBy || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">复核时间：</span>
                    <span className="text-slate-800">
                      {h.reviewAt ? new Date(h.reviewAt).toLocaleString('zh-CN', { hour12: false }) : '—'}
                    </span>
                  </div>
                </div>
                {h.changeReason && (
                  <div className="text-xs text-slate-600 mb-2">
                    <span className="text-slate-400">变更原因：</span>
                    {h.changeReason}
                  </div>
                )}
                {h.diffSummary && (
                  <div className="text-xs p-2 rounded bg-slate-50 text-slate-600 leading-relaxed">
                    <span className="text-slate-400">变更摘要：</span>
                    {h.diffSummary}
                  </div>
                )}
                <details className="mt-3 text-xs">
                  <summary className="cursor-pointer text-slate-500 hover:text-slate-700">
                    查看快照（原始数据）
                  </summary>
                  <div className="mt-2 p-3 rounded bg-slate-50 text-slate-600 space-y-1">
                    <div>婴幼儿：{h.snapshot.babyName}</div>
                    <div>监护人：{h.snapshot.guardianName}</div>
                    <div>授权判断：{labelJudgment(h.snapshot.authJudgment)}</div>
                    <div>状态：{labelStatus(h.snapshot.status)}</div>
                    <div>材料 {h.snapshot.materials.length} 项：</div>
                    <ul className="list-disc ml-5 space-y-0.5">
                      {h.snapshot.materials.map(m => (
                        <li key={m.id}>
                          [{m.source === 'supplement' ? '补录' : '原始'}] {labelMaterialType(m.type)} - {m.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function AuditTab({ record }: { record: AuthRecord }) {
  if (record.auditNotes.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
        暂无审计说明
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {[...record.auditNotes].reverse().map(n => (
        <div key={n.id} className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={
                'text-xs px-2 py-0.5 rounded font-medium ' +
                (n.type === 'corrupted_data'
                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                  : n.type === 'missing_handler'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : n.type === 'closed_supplement'
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                  : n.type === 'manual_entry'
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-200')
              }
            >
              {labelAuditNoteType(n.type)}
            </span>
            {n.notedBy && (
              <span className="text-xs text-slate-500">记录人：{n.notedBy}</span>
            )}
            <span className="text-xs text-slate-400 ml-auto">
              {new Date(n.createdAt).toLocaleString('zh-CN', { hour12: false })}
            </span>
          </div>
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{n.reason}</div>
        </div>
      ))}
    </div>
  );
}

function EditModal({
  record,
  onClose,
  onSubmit,
}: {
  record: AuthRecord;
  onClose: () => void;
  onSubmit: (v: {
    babyName: string;
    guardianName: string;
    authJudgment: AuthJudgment;
    changedBy: string;
    reviewBy?: string;
    changeReason: string;
  }) => void;
}) {
  const [babyName, setBabyName] = useState(record.babyName);
  const [guardianName, setGuardianName] = useState(record.guardianName);
  const [authJudgment, setAuthJudgment] = useState<AuthJudgment>(record.authJudgment);
  const [changedBy, setChangedBy] = useState('张护士');
  const [reviewBy, setReviewBy] = useState('李护士长');
  const [changeReason, setChangeReason] = useState('');
  return (
    <ModalShell title="修改记录（会自动生成历史版本）" onClose={onClose}>
      <Field label="婴幼儿姓名">
        <input
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
          value={babyName}
          onChange={e => setBabyName(e.target.value)}
        />
      </Field>
      <Field label="监护人">
        <input
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
          value={guardianName}
          onChange={e => setGuardianName(e.target.value)}
        />
      </Field>
      <Field label="授权判断">
        <div className="flex gap-2">
          {(['authorized', 'pending', 'rejected'] as AuthJudgment[]).map(v => (
            <button
              key={v}
              onClick={() => setAuthJudgment(v)}
              className={
                'px-3 py-1.5 text-sm rounded border ' +
                (authJudgment === v
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50')
              }
            >
              {labelJudgment(v)}
            </button>
          ))}
        </div>
      </Field>
      <Field label="处理人" required hint="审计必填，留空会在审计说明中标记处理人缺失">
        <input
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
          value={changedBy}
          onChange={e => setChangedBy(e.target.value)}
          placeholder="请输入处理人姓名"
        />
      </Field>
      <Field label="复核人（可选）">
        <input
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
          value={reviewBy}
          onChange={e => setReviewBy(e.target.value)}
          placeholder="请输入复核人姓名"
        />
      </Field>
      <Field label="修改原因">
        <textarea
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
          rows={2}
          value={changeReason}
          onChange={e => setChangeReason(e.target.value)}
          placeholder="请说明本次修改的原因"
        />
      </Field>
      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
        >
          取消
        </button>
        <button
          onClick={() => {
            if (!babyName.trim() || !guardianName.trim()) {
              alert('请填写必填项');
              return;
            }
            onSubmit({
              babyName,
              guardianName,
              authJudgment,
              changedBy,
              reviewBy: reviewBy.trim() || undefined,
              changeReason,
            });
          }}
          className="px-4 py-2 text-sm rounded bg-brand-600 text-white hover:bg-brand-700"
        >
          保存并生成新版本
        </button>
      </div>
    </ModalShell>
  );
}

function SupplementModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (v: {
    materials: { type: MaterialType; name: string; order?: number }[];
    changedBy: string;
    reviewBy?: string;
    changeReason: string;
    manualEntry: boolean;
  }) => void;
}) {
  const [items, setItems] = useState<{ type: MaterialType; name: string }[]>([
    { type: 'photo', name: '' },
  ]);
  const [changedBy, setChangedBy] = useState('赵护士');
  const [reviewBy, setReviewBy] = useState('李护士长');
  const [changeReason, setChangeReason] = useState('');
  const [manualEntry, setManualEntry] = useState(true);
  return (
    <ModalShell title="补录材料（不覆盖原始判断，将生成新版本）" onClose={onClose}>
      <div className="space-y-2 mb-2">
        {items.map((it, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <select
              value={it.type}
              onChange={e => {
                const next = [...items];
                next[idx].type = e.target.value as MaterialType;
                setItems(next);
              }}
              className="border border-slate-300 rounded px-2 py-2 text-sm bg-white"
            >
              <option value="photo">课堂照片</option>
              <option value="consent_form">知情同意书</option>
              <option value="id_copy">身份证件</option>
              <option value="other">其他材料</option>
            </select>
            <input
              value={it.name}
              onChange={e => {
                const next = [...items];
                next[idx].name = e.target.value;
                setItems(next);
              }}
              className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm"
              placeholder="材料名称"
            />
            {items.length > 1 && (
              <button
                onClick={() => setItems(items.filter((_, i) => i !== idx))}
                className="px-2 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded"
              >
                删除
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={() => setItems([...items, { type: 'photo', name: '' }])}
        className="text-sm text-brand-600 hover:underline mb-4"
      >
        + 再补一项
      </button>
      <Field label="处理人" required>
        <input
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
          value={changedBy}
          onChange={e => setChangedBy(e.target.value)}
        />
      </Field>
      <Field label="复核人（可选）">
        <input
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
          value={reviewBy}
          onChange={e => setReviewBy(e.target.value)}
        />
      </Field>
      <Field label="补录原因">
        <textarea
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
          rows={2}
          value={changeReason}
          onChange={e => setChangeReason(e.target.value)}
          placeholder="例如：家属补充授权说明"
        />
      </Field>
      <label className="flex items-center gap-2 text-sm text-slate-700 mt-2">
        <input
          type="checkbox"
          checked={manualEntry}
          onChange={e => setManualEntry(e.target.checked)}
          className="rounded"
        />
        标记为「手工补录」（会在审计说明中登记，便于和系统自动补录区分）
      </label>
      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
        >
          取消
        </button>
        <button
          onClick={() => {
            const valid = items.filter(i => i.name.trim().length > 0);
            if (valid.length === 0) {
              alert('请至少填写一项材料');
              return;
            }
            onSubmit({
              materials: valid,
              changedBy,
              reviewBy: reviewBy.trim() || undefined,
              changeReason,
              manualEntry,
            });
          }}
          className="px-4 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700"
        >
          提交补录
        </button>
      </div>
    </ModalShell>
  );
}

function DiffModal({ a, b, onClose }: { a: HistoryVersion; b: HistoryVersion; onClose: () => void }) {
  const older = a.version < b.version ? a : b;
  const newer = a.version < b.version ? b : a;
  const rows: { field: string; old: string; new: string; changed: boolean }[] = [
    {
      field: '婴幼儿姓名',
      old: older.snapshot.babyName,
      new: newer.snapshot.babyName,
      changed: older.snapshot.babyName !== newer.snapshot.babyName,
    },
    {
      field: '监护人',
      old: older.snapshot.guardianName,
      new: newer.snapshot.guardianName,
      changed: older.snapshot.guardianName !== newer.snapshot.guardianName,
    },
    {
      field: '授权判断',
      old: labelJudgment(older.snapshot.authJudgment),
      new: labelJudgment(newer.snapshot.authJudgment),
      changed: older.snapshot.authJudgment !== newer.snapshot.authJudgment,
    },
    {
      field: '状态',
      old: labelStatus(older.snapshot.status),
      new: labelStatus(newer.snapshot.status),
      changed: older.snapshot.status !== newer.snapshot.status,
    },
  ];
  return (
    <ModalShell title={`版本对比 v${older.version} → v${newer.version}`} onClose={onClose}>
      <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 font-medium mb-2">
        <div>字段</div>
        <div>旧值 (v{older.version})</div>
        <div>新值 (v{newer.version})</div>
      </div>
      <div className="space-y-1">
        {rows.map(r => (
          <div
            key={r.field}
            className={
              'grid grid-cols-3 gap-2 text-sm p-2 rounded ' +
              (r.changed ? 'bg-amber-50' : 'bg-slate-50')
            }
          >
            <div className="text-slate-600">{r.field}</div>
            <div className={r.changed ? 'text-rose-700 line-through' : 'text-slate-800'}>{r.old}</div>
            <div className={r.changed ? 'text-emerald-700 font-medium' : 'text-slate-800'}>{r.new}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-xs text-slate-500">
        变更摘要：{newer.diffSummary || '（无）'}
      </div>
    </ModalShell>
  );
}

function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-slate-200">
      <div className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-800">{title}</div>
      <div className="p-4 space-y-2">{children}</div>
    </section>
  );
}

function Row({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <div className="w-28 text-slate-500 shrink-0 pt-0.5">{label}</div>
      <div className="flex-1 text-slate-800">{value ?? children}</div>
    </div>
  );
}

function Field({
  label,
  children,
  required,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      {children}
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

function JudgmentBadge({ value }: { value: AuthJudgment }) {
  const cls =
    value === 'authorized'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : value === 'rejected'
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';
  return (
    <span className={'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ' + cls}>
      {labelJudgment(value)}
    </span>
  );
}

function StatusBadge({ value }: { value: AuthRecord['status'] }) {
  const cls =
    value === 'open'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : value === 'closed'
      ? 'bg-slate-100 text-slate-600 border-slate-200'
      : 'bg-indigo-50 text-indigo-700 border-indigo-200';
  return (
    <span className={'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ' + cls}>
      {labelStatus(value)}
    </span>
  );
}
