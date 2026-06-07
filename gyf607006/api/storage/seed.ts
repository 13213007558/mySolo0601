import type { Baby, AuthRecord } from '../../shared/types';
import { loadBabies, saveBabies, loadRecords, saveRecords, isDataInitialized } from '../storage/jsonStore';

const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;

export function seedIfEmpty() {
  if (isDataInitialized()) return;

  const babies: Baby[] = [
    { id: 'b001', name: '李小安', className: '小一班', createdAt: now - 30 * DAY },
    { id: 'b002', name: '王朵朵', className: '小一班', createdAt: now - 28 * DAY },
    { id: 'b003', name: '赵乐乐', className: '小二班', createdAt: now - 25 * DAY },
    { id: 'b004', name: '陈思远', className: '小二班', createdAt: now - 20 * DAY },
    { id: 'b005', name: '孙雨桐', className: '小三班', createdAt: now - 18 * DAY },
    { id: 'b006', name: '周子墨', className: '小三班', createdAt: now - 15 * DAY },
    { id: 'b007', name: '吴欣怡', className: '小一班', createdAt: now - 12 * DAY },
    { id: 'b008', name: '郑浩然', className: '小二班', createdAt: now - 10 * DAY },
  ];

  const records: AuthRecord[] = [
    {
      id: 'r001', babyId: 'b001', version: 1, status: 'authorized', source: 'original',
      operatorName: '张老师',
      photoPresent: true, affectsSummary: true,
      recordedAt: now - 10 * DAY, createdAt: now - 10 * DAY,
    },
    {
      id: 'r002', babyId: 'b002', version: 1, status: 'authorized', source: 'original',
      operatorName: '张老师', remark: '家长签署纸质授权书',
      photoPresent: true, affectsSummary: true,
      recordedAt: now - 9 * DAY, createdAt: now - 9 * DAY,
    },
    {
      id: 'r003', babyId: 'b003', version: 1, status: 'authorized', source: 'original',
      operatorName: '李老师',
      photoPresent: true, affectsSummary: true,
      recordedAt: now - 8 * DAY, createdAt: now - 8 * DAY,
    },
    {
      id: 'r004', babyId: 'b004', version: 1, status: 'pending', source: 'original',
      operatorName: '李老师', remark: '家长尚未回复',
      photoPresent: true, affectsSummary: true,
      recordedAt: now - 7 * DAY, createdAt: now - 7 * DAY,
    },
    {
      id: 'r005', babyId: 'b005', version: 1, status: 'authorized', source: 'original',
      operatorName: '王老师',
      photoPresent: true, affectsSummary: true,
      recordedAt: now - 6 * DAY, createdAt: now - 6 * DAY,
    },
    {
      id: 'r006', babyId: 'b006', version: 1, status: 'authorized', source: 'original',
      operatorName: '王老师',
      photoPresent: true, affectsSummary: true,
      recordedAt: now - 5 * DAY, createdAt: now - 5 * DAY,
    },
    {
      id: 'r007', babyId: 'b006', version: 2, status: 'revoked', source: 'supplement',
      operatorName: '夜班-刘老师',
      remark: '家长昨夜微信撤回授权，邮件晚到补录',
      photoPresent: true, affectsSummary: true,
      recordedAt: now - 1 * DAY, createdAt: now - 1 * DAY,
    },
    {
      id: 'r008', babyId: 'b007', version: 1, status: 'missing', source: 'original',
      operatorName: '张老师',
      photoPresent: false,
      anomalyReason: '照片文件缺失，系统未能归档；家长签字未同步上传，等待家长补发',
      affectsSummary: false,
      recordedAt: now - 4 * DAY, createdAt: now - 4 * DAY,
    },
    {
      id: 'r009', babyId: 'b008', version: 1, status: 'authorized', source: 'original',
      operatorName: '李老师',
      photoPresent: true, affectsSummary: true,
      recordedAt: now - 3 * DAY, createdAt: now - 3 * DAY,
    },
    {
      id: 'r010', babyId: 'b008', version: 2, status: 'authorized', source: 'manual',
      operatorName: '夜班-刘老师',
      remark: '手工补录：家长昨日补交授权确认书',
      photoPresent: true, affectsSummary: true,
      recordedAt: now - 12 * 60 * 60 * 1000,
      createdAt: now - 12 * 60 * 60 * 1000,
    },
  ];

  saveBabies(babies);
  saveRecords(records);
}
