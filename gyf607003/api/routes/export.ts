import { Router } from 'express';
import { getDb } from '../db/index.js';
import { applyPrivacyMaskToList } from '../../shared/privacy.js';
import type { UserRole, Baby, DisinfectionRecord, ExceptionRecord } from '../../shared/types.js';
import { ITEM_TYPE_LABEL, RECORD_STATUS_LABEL, EXCEPTION_TYPE_LABEL } from '../../shared/types.js';

const router = Router();

interface ExportField {
  key: string;
  label: string;
  category: 'record' | 'baby' | 'exception';
  privacy?: boolean;
}

const EXPORT_FIELDS: ExportField[] = [
  { key: 'operateTime', label: '操作时间', category: 'record' },
  { key: 'babyName', label: '宝宝姓名', category: 'record' },
  { key: 'className', label: '所属班级', category: 'record' },
  { key: 'itemType', label: '用品类型', category: 'record' },
  { key: 'itemName', label: '用品名称', category: 'record' },
  { key: 'status', label: '状态', category: 'record' },
  { key: 'isManual', label: '是否补录', category: 'record' },
  { key: 'operatorName', label: '操作人', category: 'record' },
  { key: 'parentPhone', label: '家长电话', category: 'baby', privacy: true },
  { key: 'parentIdCard', label: '家长身份证', category: 'baby', privacy: true },
  { key: 'homeAddress', label: '家庭地址', category: 'baby', privacy: true },
  { key: 'exceptionType', label: '异常类型', category: 'exception' },
  { key: 'exceptionReason', label: '异常原因', category: 'exception' },
  { key: 'handleMeasure', label: '处理措施', category: 'exception' },
];

router.get('/config', (_req, res) => {
  res.json({ fields: EXPORT_FIELDS });
});

router.post('/generate', (req, res) => {
  const { currentUser } = req;
  const role = (currentUser?.role || 'teacher') as UserRole;
  const { fields, format = 'csv' } = req.body as { fields?: string[]; format?: 'csv' | 'json' };
  const selected = fields || EXPORT_FIELDS.map((f) => f.key);

  const db = getDb();

  const babiesRows = db.prepare('SELECT * FROM babies').all() as Record<string, unknown>[];
  const babiesList = babiesRows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    classId: r.class_id as string,
    className: r.class_name as string,
    parentPhone: r.parent_phone as string,
    parentIdCard: r.parent_id_card as string,
    homeAddress: r.home_address as string,
    status: r.status as Baby['status'],
  })) as Baby[];
  const babies = applyPrivacyMaskToList(babiesList, role);
  const babyMap = new Map(babies.map((b) => [b.id, b]));

  const records = db.prepare('SELECT * FROM disinfection_records ORDER BY operate_time DESC').all() as Record<string, unknown>[];
  const exceptions = db.prepare('SELECT * FROM exception_records').all() as Record<string, unknown>[];
  const exceptionByRecord = new Map(exceptions.map((e) => [e.record_id as string, e]));

  const rows: Record<string, unknown>[] = [];
  for (const r of records) {
    const baby = babyMap.get(r.baby_id as string);
    const ex = exceptionByRecord.get(r.id as string);
    const row: Record<string, unknown> = {
      operateTime: r.operate_time as string,
      babyName: r.baby_name as string,
      className: r.class_id as string,
      itemType: ITEM_TYPE_LABEL[(r.item_type as DisinfectionRecord['itemType']) || 'other'],
      itemName: r.item_name as string,
      status: RECORD_STATUS_LABEL[(r.status as DisinfectionRecord['status']) || 'pending'],
      isManual: (r.is_manual as number) === 1 ? '是' : '否',
      operatorName: r.operator_name as string,
      parentPhone: baby?.parentPhone || '',
      parentIdCard: baby?.parentIdCard || '',
      homeAddress: baby?.homeAddress || '',
      exceptionType: ex ? EXCEPTION_TYPE_LABEL[(ex.type as ExceptionRecord['type']) || 'other'] : '',
      exceptionReason: ex ? (ex.reason as string) : '',
      handleMeasure: ex ? ((ex.handle_measure as string) || '') : '',
    };
    const filtered: Record<string, unknown> = {};
    for (const k of selected) if (k in row) filtered[k] = row[k];
    rows.push(filtered);
  }

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="disinfection-export.json"');
    return res.json(rows);
  }

  const headers = selected.map((k) => EXPORT_FIELDS.find((f) => f.key === k)?.label || k);
  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      selected.map((k) => {
        const v = String(row[k] ?? '');
        return v.includes(',') || v.includes('"') || v.includes('\n')
          ? '"' + v.replace(/"/g, '""') + '"'
          : v;
      }).join(','),
    ),
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="disinfection-export.csv"');
  res.send('\uFEFF' + csv);
});

export default router;
