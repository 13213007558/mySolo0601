import { PrismaClient } from '@prisma/client';
import { RecordSource, RecordSourceType } from './validation';

const prisma = new PrismaClient();

const AVERAGE_AMOUNT_BY_AGE: Record<number, { min: number; max: number }> = {
  1: { min: 120, max: 200 },
  2: { min: 150, max: 250 },
  3: { min: 180, max: 300 },
  4: { min: 200, max: 350 },
  5: { min: 220, max: 400 },
};

export async function detectSuspiciousRecord(
  childId: number,
  amount: number,
  source: string,
  parentMessage?: string | null,
  paperNote?: string | null
): Promise<{ isSuspicious: boolean; reason: string }> {
  const reasons: string[] = [];

  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child) {
    return { isSuspicious: true, reason: '孩子信息不存在' };
  }

  const ageRange = AVERAGE_AMOUNT_BY_AGE[child.age] || { min: 100, max: 400 };
  if (amount < ageRange.min * 0.5) {
    reasons.push(`奶量过低：${amount}ml，低于同龄正常范围下限的50%（${ageRange.min}ml）`);
  }
  if (amount > ageRange.max * 1.5) {
    reasons.push(`奶量过高：${amount}ml，超过同龄正常范围上限的50%（${ageRange.max}ml）`);
  }

  if (source === RecordSource.PARENT_MESSAGE && (!parentMessage || parentMessage.trim().length === 0)) {
    reasons.push('家长群留言来源缺少留言内容');
  }
  if (source === RecordSource.PAPER_RECEIPT && (!paperNote || paperNote.trim().length === 0)) {
    reasons.push('纸质交接单来源缺少交接单编号');
  }

  if (amount === 0) {
    reasons.push('奶量为0，需要确认是否当日未进食');
  }

  return {
    isSuspicious: reasons.length > 0,
    reason: reasons.join('；'),
  };
}

export async function isolateSuspiciousRecord(
  recordId: number | null,
  childId: number,
  childName: string,
  recordDate: Date,
  amount: number,
  source: string,
  suspiciousReason: string,
  parentMessage?: string | null,
  paperNote?: string | null
) {
  return prisma.suspiciousRecord.create({
    data: {
      originalId: recordId,
      childId,
      childName,
      recordDate,
      amount,
      source,
      parentMessage,
      paperNote,
      suspiciousReason,
    },
  });
}
