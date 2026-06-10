import { v4 as uuid } from 'uuid';
import type { StoneRecord, PhotoAttachment, ReplacementRecord, OperationHistory } from '@/types';

const BATCHES = ['SC-2024-001', 'SC-2024-002', 'SC-2024-003', 'SC-2024-004', 'SC-2024-005'];
const ZONES = ['东立面-1区', '东立面-2区', '南立面-1区', '南立面-2区', '西立面-1区', '西立面-2区', '北立面-1区', '北立面-2区'];
const GRADES: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'A', 'A', 'B', 'B', 'C', 'D'];
const STATUSES: Array<'normal' | 'replaced' | 'pending' | 'conflict'> = ['normal', 'normal', 'normal', 'replaced', 'pending', 'conflict'];
const OPERATORS = ['张工', '李工', '王工', '赵工'];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeBatchNo(raw: string): string {
  if (Math.random() < 0.2) {
    return `  ${raw.trim()}  `;
  }
  return raw;
}

export function generateMockData() {
  const stones: StoneRecord[] = [];
  const photos: PhotoAttachment[] = [];
  const replacements: ReplacementRecord[] = [];
  const histories: OperationHistory[] = [];

  let stoneIdx = 0;
  const now = new Date().toISOString();

  for (const batch of BATCHES) {
    const count = randInt(8, 15);
    for (let i = 0; i < count; i++) {
      stoneIdx++;
      const id = uuid();
      const grade = rand(GRADES);
      const status = grade === 'D' ? 'replaced' : grade === 'C' ? rand(STATUSES) : 'normal';
      const isConflict = Math.random() < 0.08;
      const finalStatus = isConflict ? 'conflict' : status;
      const operator = rand(OPERATORS);
      const hasPhoto = Math.random() > 0.12;
      const zone1 = rand(ZONES);
      const isDuplicate = isConflict && Math.random() > 0.3;
      const zone2 = isDuplicate ? rand(ZONES.filter(z => z !== zone1)) : zone1;
      const batchNo = makeBatchNo(batch);

      const stone: StoneRecord = {
        id,
        batchNo: batchNo.trim(),
        stoneNo: `ST-${String(stoneIdx).padStart(4, '0')}`,
        facadeZone: zone1,
        colorGrade: grade,
        wallStatus: finalStatus,
        operator,
        createdAt: now,
        updatedAt: now,
      };
      stones.push(stone);

      if (hasPhoto) {
        const photoCount = randInt(1, 3);
        for (let p = 0; p < photoCount; p++) {
          photos.push({
            id: uuid(),
            stoneId: id,
            photoData: null,
            fileName: `IMG_${stoneIdx}_${p + 1}.jpg`,
            isMissing: false,
            uploadedAt: now,
          });
        }
      } else {
        photos.push({
          id: uuid(),
          stoneId: id,
          photoData: null,
          fileName: '',
          isMissing: true,
          uploadedAt: now,
        });
      }

      if (finalStatus === 'replaced' || grade === 'C' || grade === 'D') {
        replacements.push({
          id: uuid(),
          stoneId: id,
          targetStoneNo: `ST-${String(randInt(1, stoneIdx)).padStart(4, '0')}`,
          reason: grade === 'D' ? '严重色差，无法上墙' : grade === 'C' ? '明显色差，建议替换' : '批次色差超出容许范围',
          suggestion: grade === 'D' ? '建议整块替换，不得上墙' : '建议调整至低可见度区域或替换同批次石材',
          confirmedBy: Math.random() > 0.3 ? rand(OPERATORS) : '',
          confirmedAt: Math.random() > 0.3 ? now : '',
          confirmResult: Math.random() > 0.4 ? 'approved' : Math.random() > 0.5 ? 'rejected' : 'pending',
        });
      }

      if (isConflict && isDuplicate) {
        histories.push({
          id: uuid(),
          stoneId: id,
          operator: operator,
          action: '分区冲突',
          oldValue: zone1,
          newValue: zone2,
          operatedAt: now,
        });
      }

      if (finalStatus === 'replaced') {
        histories.push({
          id: uuid(),
          stoneId: id,
          operator: rand(OPERATORS),
          action: '状态变更',
          oldValue: '正常上墙',
          newValue: '已替换',
          operatedAt: now,
        });
      }
    }
  }

  return { stones, photos, replacements, histories };
}
