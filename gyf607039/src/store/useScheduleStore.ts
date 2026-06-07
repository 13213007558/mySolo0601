import { create } from 'zustand';
import type {
  Schedule,
  ScheduleStatus,
  SummaryStats,
  AuditLogEntry,
  NoteEntry,
  ExportOptions,
} from '../../shared/types';
import { sampleSchedules } from '../data/sampleData';

interface ScheduleState {
  schedules: Schedule[];
  selectedScheduleId: string | null;
  searchKeyword: string;
  statusFilter: ScheduleStatus | 'all';
  operator: string;

  setSchedules: (s: Schedule[]) => void;
  setSelectedScheduleId: (id: string | null) => void;
  setSearchKeyword: (kw: string) => void;
  setStatusFilter: (f: ScheduleStatus | 'all') => void;

  getFilteredSchedules: () => Schedule[];
  getSummaryStats: () => SummaryStats;
  getSelectedSchedule: () => Schedule | null;

  addNote: (scheduleId: string, content: string, isRevision: boolean, originalPromise?: string) => void;
  updateStatus: (scheduleId: string, newStatus: ScheduleStatus, reason?: string) => void;
  markPartialSuccess: (scheduleId: string, reason: string) => void;
  manualCorrect: (scheduleId: string, correctionNote: string, newStatus: ScheduleStatus) => void;
  appendAudit: (scheduleId: string, log: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;

  exportReport: (options: ExportOptions) => string;
}

const genId = () => Math.random().toString(36).slice(2, 10);
const nowISO = () => new Date().toISOString();

const statusLabel: Record<ScheduleStatus, string> = {
  scheduled: '待排程',
  confirmed: '已确认',
  in_progress: '进行中',
  completed: '已完成',
  failed: '失败',
  cancelled: '已取消',
  manually_corrected: '人工更正',
};

const identityLabel = { verified: '已核验', pending: '待核验', rejected: '已驳回', missing: '缺失' };
const materialLabel = { complete: '完整', partial: '部分', missing: '缺失', expired: '过期' };
const photoLabel = { present: '已上传', missing: '缺失', rejected: '不合格' };

function escapeCSV(v: string) {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  schedules: sampleSchedules,
  selectedScheduleId: sampleSchedules[0]?.id ?? null,
  searchKeyword: '',
  statusFilter: 'all',
  operator: '李顾问（Linda）',

  setSchedules: (s) => set({ schedules: s }),
  setSelectedScheduleId: (id) => set({ selectedScheduleId: id }),
  setSearchKeyword: (kw) => set({ searchKeyword: kw }),
  setStatusFilter: (f) => set({ statusFilter: f }),

  getFilteredSchedules: () => {
    const { schedules, searchKeyword, statusFilter } = get();
    return schedules.filter((s) => {
      const kw = searchKeyword.trim().toLowerCase();
      const matchKw =
        !kw ||
        s.childName.toLowerCase().includes(kw) ||
        s.childNickname.toLowerCase().includes(kw) ||
        s.id.toLowerCase().includes(kw) ||
        s.trialCourseName.toLowerCase().includes(kw) ||
        s.consultant.toLowerCase().includes(kw);
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchKw && matchStatus;
    });
  },

  getSummaryStats: () => {
    const { schedules } = get();
    const stats: SummaryStats = {
      total: schedules.length,
      confirmed: 0,
      inProgress: 0,
      completed: 0,
      failed: 0,
      partialSuccess: 0,
      pendingIdentity: 0,
      missingMaterial: 0,
      missingPhoto: 0,
      manuallyCorrected: 0,
    };
    schedules.forEach((s) => {
      if (s.status === 'confirmed') stats.confirmed++;
      if (s.status === 'in_progress') stats.inProgress++;
      if (s.status === 'completed') stats.completed++;
      if (s.status === 'failed') stats.failed++;
      if (s.isPartialSuccess) stats.partialSuccess++;
      if (s.identityStatus !== 'verified') stats.pendingIdentity++;
      if (s.materialStatus === 'missing' || s.materialStatus === 'partial') stats.missingMaterial++;
      if (s.photoStatus === 'missing' || s.photoStatus === 'rejected') stats.missingPhoto++;
      if (s.status === 'manually_corrected') stats.manuallyCorrected++;
    });
    return stats;
  },

  getSelectedSchedule: () => {
    const { schedules, selectedScheduleId } = get();
    return schedules.find((s) => s.id === selectedScheduleId) ?? null;
  },

  addNote: (scheduleId, content, isRevision, originalPromise) => {
    const { operator, schedules } = get();
    const note: NoteEntry = {
      id: genId(),
      timestamp: nowISO(),
      author: operator,
      content,
      isRevision,
      originalPromise,
    };
    const audit: Omit<AuditLogEntry, 'id' | 'timestamp'> = {
      action: 'note_add',
      operator,
      targetId: scheduleId,
      targetType: 'schedule',
      details: isRevision ? `追加修订备注：${content}` : `新增备注：${content}`,
    };
    set({
      schedules: schedules.map((s) =>
        s.id === scheduleId
          ? {
              ...s,
              notes: [...s.notes, note],
              auditLogs: [
                ...s.auditLogs,
                { ...audit, id: genId(), timestamp: nowISO() },
              ],
            }
          : s
      ),
    });
  },

  updateStatus: (scheduleId, newStatus, reason) => {
    const { operator, schedules } = get();
    set({
      schedules: schedules.map((s) => {
        if (s.id !== scheduleId) return s;
        const oldStatus = s.status;
        const audit: AuditLogEntry = {
          id: genId(),
          timestamp: nowISO(),
          action: 'status_change',
          operator,
          targetId: scheduleId,
          targetType: 'schedule',
          details: reason
            ? `状态由 ${statusLabel[oldStatus]} 变更为 ${statusLabel[newStatus]}，原因：${reason}`
            : `状态由 ${statusLabel[oldStatus]} 变更为 ${statusLabel[newStatus]}`,
          oldValue: oldStatus,
          newValue: newStatus,
        };
        return {
          ...s,
          status: newStatus,
          failureReason: newStatus === 'failed' ? reason ?? s.failureReason : s.failureReason,
          auditLogs: [...s.auditLogs, audit],
        };
      }),
    });
  },

  markPartialSuccess: (scheduleId, reason) => {
    const { operator, schedules } = get();
    set({
      schedules: schedules.map((s) => {
        if (s.id !== scheduleId) return s;
        const audit: AuditLogEntry = {
          id: genId(),
          timestamp: nowISO(),
          action: 'partial_success',
          operator,
          targetId: scheduleId,
          targetType: 'schedule',
          details: `标记为部分成功：${reason}`,
          oldValue: String(s.isPartialSuccess),
          newValue: 'true',
        };
        return {
          ...s,
          isPartialSuccess: true,
          partialSuccessReason: reason,
          auditLogs: [...s.auditLogs, audit],
        };
      }),
    });
  },

  manualCorrect: (scheduleId, correctionNote, newStatus) => {
    const { operator, schedules } = get();
    set({
      schedules: schedules.map((s) => {
        if (s.id !== scheduleId) return s;
        const oldStatus = s.status;
        const audit: AuditLogEntry = {
          id: genId(),
          timestamp: nowISO(),
          action: 'manual_correction',
          operator,
          targetId: scheduleId,
          targetType: 'schedule',
          details: `人工更正：${correctionNote}，状态由 ${statusLabel[oldStatus]} 更正为 ${statusLabel[newStatus]}`,
          oldValue: oldStatus,
          newValue: newStatus,
        };
        return {
          ...s,
          status: newStatus,
          manualCorrection: {
            correctedBy: operator,
            correctedAt: nowISO(),
            correctionNote,
            originalStatus: oldStatus,
          },
          auditLogs: [...s.auditLogs, audit],
        };
      }),
    });
  },

  appendAudit: (scheduleId, log) => {
    const { schedules } = get();
    set({
      schedules: schedules.map((s) =>
        s.id === scheduleId
          ? { ...s, auditLogs: [...s.auditLogs, { ...log, id: genId(), timestamp: nowISO() }] }
          : s
      ),
    });
  },

  exportReport: (options) => {
    const schedules = get().getFilteredSchedules();
    const stats = get().getSummaryStats();

    const header = [
      '排程编号',
      '幼儿姓名',
      '昵称',
      '试听课程',
      '排程日期',
      '排程时间',
      '接车时间',
      '送达时间',
      '顾问',
      '排程状态',
      '身份核验',
      '材料状态',
      '照片状态',
      '是否部分成功',
      '失败原因',
      '部分成功原因',
      '人工更正备注',
    ];

    const rows = schedules.map((s) => [
      s.id,
      s.childName,
      s.childNickname,
      s.trialCourseName,
      s.scheduledDate,
      s.scheduledTime,
      s.pickUpTime,
      s.dropOffTime,
      s.consultant,
      statusLabel[s.status],
      identityLabel[s.identityStatus],
      materialLabel[s.materialStatus],
      photoLabel[s.photoStatus],
      s.isPartialSuccess ? '是' : '否',
      s.failureReason ?? '',
      s.partialSuccessReason ?? '',
      s.manualCorrection?.correctionNote ?? '',
    ]);

    if (options.format === 'csv') {
      let csv = header.map(escapeCSV).join(',') + '\n';
      rows.forEach((r) => {
        csv += r.map(escapeCSV).join(',') + '\n';
      });
      if (options.includeNotes) {
        csv += '\n--- 备注历史 ---\n';
        csv += ['排程编号', '时间', '作者', '是否修订', '原承诺', '内容'].map(escapeCSV).join(',') + '\n';
        schedules.forEach((s) => {
          s.notes.forEach((n) => {
            csv +=
              [s.id, n.timestamp, n.author, n.isRevision ? '是' : '否', n.originalPromise ?? '', n.content]
                .map(escapeCSV)
                .join(',') + '\n';
          });
        });
      }
      if (options.includeAudit) {
        csv += '\n--- 审计日志 ---\n';
        csv += ['排程编号', '时间', '操作人', '动作', '详情', '旧值', '新值'].map(escapeCSV).join(',') + '\n';
        schedules.forEach((s) => {
          s.auditLogs.forEach((a) => {
            csv +=
              [s.id, a.timestamp, a.operator, a.action, a.details, a.oldValue ?? '', a.newValue ?? '']
                .map(escapeCSV)
                .join(',') + '\n';
          });
        });
      }
      csv +=
        '\n--- 汇总统计 ---\n' +
        Object.entries(stats)
          .map(([k, v]) => `${k},${v}`)
          .join('\n');
      return csv;
    }

    let md = `# 婴幼儿接送授权排程板 · 试听顾问版报告\n\n`;
    md += `> 导出时间：${new Date().toLocaleString('zh-CN')}  操作员：${get().operator}\n\n`;
    md += `## 汇总统计\n\n`;
    md += `| 指标 | 数量 |\n|---|---|\n`;
    md += `| 排程总数 | ${stats.total} |\n`;
    md += `| 已确认 | ${stats.confirmed} |\n`;
    md += `| 进行中 | ${stats.inProgress} |\n`;
    md += `| 已完成 | ${stats.completed} |\n`;
    md += `| 失败 | ${stats.failed} |\n`;
    md += `| 部分成功 | ${stats.partialSuccess} |\n`;
    md += `| 身份待核验 | ${stats.pendingIdentity} |\n`;
    md += `| 材料不完整 | ${stats.missingMaterial} |\n`;
    md += `| 照片异常 | ${stats.missingPhoto} |\n`;
    md += `| 人工更正 | ${stats.manuallyCorrected} |\n\n`;

    md += `## 排程明细\n\n`;
    md += `| ${header.join(' | ')} |\n`;
    md += `|${header.map(() => '---').join('|')}|\n`;
    rows.forEach((r) => {
      md += `| ${r.map((v) => v || '—').join(' | ')} |\n`;
    });

    if (options.includeNotes) {
      md += `\n## 备注历史（原承诺保留不可抹除）\n\n`;
      schedules.forEach((s) => {
        if (s.notes.length === 0) return;
        md += `### ${s.id} · ${s.childName}（${s.childNickname}）\n\n`;
        s.notes.forEach((n) => {
          md += `- **${n.timestamp.replace('T', ' ').slice(0, 19)}** · ${n.author}${n.isRevision ? ' · ✏️ 修订' : ''}\n`;
          md += `  - 内容：${n.content}\n`;
          if (n.originalPromise) md += `  - ⛓️ 原承诺：${n.originalPromise}\n`;
          md += `\n`;
        });
      });
    }

    if (options.includeAudit) {
      md += `\n## 审计日志（异常与更正全部可追溯）\n\n`;
      schedules.forEach((s) => {
        md += `### ${s.id} · ${s.childName}（${s.childNickname}）\n\n`;
        md += `| 时间 | 操作人 | 动作 | 详情 | 旧值 → 新值 |\n|---|---|---|---|---|\n`;
        s.auditLogs
          .slice()
          .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
          .forEach((a) => {
            md += `| ${a.timestamp.replace('T', ' ').slice(0, 19)} | ${a.operator} | ${a.action} | ${a.details} | ${a.oldValue ?? '—'} → ${a.newValue ?? '—'} |\n`;
          });
        md += `\n`;
      });
    }

    md += `\n---\n\n## 失败与人工更正路径（主管复盘用）\n\n`;
    const failed = schedules.filter((s) => s.status === 'failed');
    const corrected = schedules.filter((s) => s.status === 'manually_corrected');
    md += `### 失败路径（共 ${failed.length} 条）\n\n`;
    if (failed.length === 0) md += `> 暂无失败排程\n\n`;
    failed.forEach((s) => {
      md += `1. **${s.id} · ${s.childName}（${s.childNickname}）**\n`;
      md += `   - 失败原因：${s.failureReason ?? '未记录'}\n`;
      md += `   - 最后操作时间：${s.auditLogs[s.auditLogs.length - 1]?.timestamp.replace('T', ' ').slice(0, 19)}\n\n`;
    });
    md += `### 人工更正路径（共 ${corrected.length} 条）\n\n`;
    if (corrected.length === 0) md += `> 暂无更正排程\n\n`;
    corrected.forEach((s) => {
      md += `1. **${s.id} · ${s.childName}（${s.childNickname}）**\n`;
      md += `   - 更正人：${s.manualCorrection?.correctedBy}\n`;
      md += `   - 更正时间：${s.manualCorrection?.correctedAt.replace('T', ' ').slice(0, 19)}\n`;
      md += `   - 原状态：${statusLabel[s.manualCorrection?.originalStatus ?? s.status]}\n`;
      md += `   - 更正说明：${s.manualCorrection?.correctionNote}\n\n`;
    });

    return md;
  },
}));

export { statusLabel, identityLabel, materialLabel, photoLabel };
