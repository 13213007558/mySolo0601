import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const RecordSource = {
  PARENT_MESSAGE: 'PARENT_MESSAGE',
  PAPER_RECEIPT: 'PAPER_RECEIPT',
} as const;

const RecordStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  REVIEWED: 'REVIEWED',
  REJECTED: 'REJECTED',
  SUSPICIOUS: 'SUSPICIOUS',
} as const;

async function main() {
  await prisma.$executeRaw`DELETE FROM "SuspiciousRecord"`;
  await prisma.$executeRaw`DELETE FROM "TherapyFeedback"`;
  await prisma.$executeRaw`DELETE FROM "ReviewRecord"`;
  await prisma.$executeRaw`DELETE FROM "MilkRecordHistory"`;
  await prisma.$executeRaw`DELETE FROM "MilkRecord"`;
  await prisma.$executeRaw`DELETE FROM "Child"`;

  const children = await prisma.child.createMany({
    data: [
      { name: '小明', age: 2, guardianName: '王女士', phone: '13800138001' },
      { name: '小红', age: 1, guardianName: '李先生', phone: '13800138002' },
      { name: '小刚', age: 3, guardianName: '张女士', phone: '13800138003' },
      { name: '小美', age: 2, guardianName: '刘先生', phone: '13800138004' },
    ],
  });

  const allChildren = await prisma.child.findMany();

  const baseDate = new Date('2026-06-09');
  
  for (let i = 0; i < 8; i++) {
    const recordDate = new Date(baseDate);
    recordDate.setDate(recordDate.getDate() - i);
    
    for (const child of allChildren.slice(0, 3)) {
      const amount = 150 + Math.floor(Math.random() * 100);
      const isSuspicious = Math.random() < 0.1;
      
      const record = await prisma.milkRecord.create({
        data: {
          childId: child.id,
          recordDate,
          amount,
          source: i % 2 === 0 ? RecordSource.PARENT_MESSAGE : RecordSource.PAPER_RECEIPT,
          status: isSuspicious ? RecordStatus.SUSPICIOUS : (i < 3 ? RecordStatus.REVIEWED : (i < 5 ? RecordStatus.CONFIRMED : RecordStatus.PENDING)),
          parentMessage: i % 2 === 0 ? `今日奶量${amount}ml，宝宝状态良好` : null,
          paperNote: i % 2 === 1 ? `交接单编号：${20260609 + i}-${child.id}` : null,
          reason: i < 3 ? '核对无误' : null,
          handledBy: i < 3 ? '前台小张' : null,
          handledAt: i < 3 ? recordDate : null,
        },
      });

      if (i < 3) {
        await prisma.milkRecordHistory.create({
          data: {
            recordId: record.id,
            oldStatus: RecordStatus.PENDING,
            newStatus: RecordStatus.CONFIRMED,
            changeNote: '前台核对确认',
            operator: '前台小张',
          },
        });

        await prisma.milkRecordHistory.create({
          data: {
            recordId: record.id,
            oldStatus: RecordStatus.CONFIRMED,
            newStatus: RecordStatus.REVIEWED,
            oldReason: '前台核对无误',
            newReason: '复核通过，数据准确',
            changeNote: '园长复核通过',
            operator: '园长',
          },
        });

        await prisma.reviewRecord.create({
          data: {
            recordId: record.id,
            reviewNote: '数据核对无误，已确认',
            reviewer: '园长',
          },
        });
      }

      if (i < 2 && !isSuspicious) {
        await prisma.therapyFeedback.create({
          data: {
            recordId: record.id,
            childId: child.id,
            content: `今日康复训练完成，宝宝配合度良好。奶量摄入${amount}ml，消化情况正常。建议明日继续观察。`,
            therapist: '李治疗师',
          },
        });
      }

      if (isSuspicious) {
        await prisma.suspiciousRecord.create({
          data: {
            originalId: record.id,
            childId: child.id,
            childName: child.name,
            recordDate,
            amount,
            source: record.source,
            parentMessage: record.parentMessage,
            paperNote: record.paperNote,
            suspiciousReason: '奶量数据异常，超出正常范围50%',
          },
        });
      }
    }
  }

  console.log('种子数据创建完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
