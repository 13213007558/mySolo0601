const services = require('../server/services');

const today = new Date().toISOString().slice(0, 10);
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

console.log('=== 导入样例数据开始 ===\n');

const batchItems = [
  {
    name: '安安',
    birth_date: '2024-03-15',
    guardian: '安妈妈',
    shift_date: yesterday,
    total_pages: 3,
    pages: [
      { page_number: 1, content: '旧记录：20:00 喝奶150ml，20:30 入睡，呼吸平稳' },
      { page_number: 2, content: '旧记录：23:00 巡视，尿布已更换，体温36.5度' },
      { page_number: 3, content: '旧记录：05:30 起床，精神好，早餐意愿强' }
    ]
  },
  {
    name: '乐乐',
    birth_date: '2024-08-22',
    guardian: '乐爸爸',
    shift_date: today,
    total_pages: 3,
    pages: [
      { page_number: 1, content: '新补材料：21:00 入睡，环境温度26度，睡姿仰卧' },
      { page_number: 2, content: '新补材料：02:00 有翻身、哼唧，安抚后继续睡' },
      { page_number: 3, content: '新补材料：06:00 起床，体温正常', is_valid: false, invalid_reason: '字迹模糊，需白班老师确认' }
    ]
  },
  {
    name: '萌萌',
    birth_date: '2025-01-10',
    guardian: '萌奶奶',
    shift_date: today,
    total_pages: 5,
    pages: [
      { page_number: 1, content: '21:30 入睡，伴随哭闹5分钟后平静' },
      { page_number: 3, content: '03:15 巡视，无异常（第2、4、5页缺失，待补' }
    ]
  },
  {
    name: '坏行-无日期',
    pages: [
      { page_number: 1, content: '这行会因为缺少日期而导入失败（故意）' }
    ]
  },
  {
    name: '',
    shift_date: today,
    pages: [
      { page_number: 1, content: '这行会因为缺少姓名而导入失败（故意）' }
    ]
  }
];

console.log('1) 批量导入 5 条数据（含2条坏行）...');
const importResult = services.importBatch(batchItems, '李老师（夜班）');
console.log('   成功:', importResult.success.length, '条');
console.log('   失败:', importResult.failed.length, '条');
importResult.failed.forEach(f => {
  console.log('     -', '第' + (f.index + 1) + '行 ' + f.name + ':', f.error);
});

console.log('\n2) 将安安的记录走完完整流程：提交复核 -> 归档...');
const anRecord = services.listRecords().find(r => r.child_name === '安安');
if (anRecord) {
  services.submitForReview(anRecord.id, '李老师（夜班）', '安安夜班记录完整，提交复核');
  services.closeAndArchive(anRecord.id, '王主管', '复核通过，材料齐全');
  console.log('   安安记录已归档');
}

console.log('\n3) 将乐乐的记录：提交复核 -> 退回补充 -> 补材料 -> 再提交...');
const leRecord = services.listRecords().find(r => r.child_name === '乐乐');
if (leRecord) {
  services.submitForReview(leRecord.id, '李老师（夜班）', '乐乐记录新补');
  services.returnForSupplement(leRecord.id, '王主管', '第3页字迹模糊，请补充清晰内容并确认');
  services.addRecordPages(leRecord.id, [
    { page_number: 4, content: '补充：第3页确认内容为：06:00 起床，体温36.6度，精神好' }
  ], '李老师（夜班）');
  services.submitForReview(leRecord.id, '李老师（夜班）', '已补充第3页确认内容');
  console.log('   乐乐记录已重新提交复核');
}

console.log('\n4) 演示导出（故意包含不存在的ID触发审计...');
const allRecords = services.listRecords();
const ids = allRecords.map(r => r.id).concat([9999, 8888]);
const exportResult = services.exportRecords(ids, '王主管');
console.log('   导出文件名:', exportResult.file_name);
console.log('   是否不一致:', exportResult.has_mismatch ? '是（已写入审计日志）' : '否');
console.log('   期望/实际 记录数:', exportResult.expected_record_count, '/', exportResult.actual_record_count);
console.log('   期望/实际 页数:', exportResult.expected_pages, '/', exportResult.actual_pages);

console.log('\n=== 样例数据导入完成！');
console.log('\n数据说明：');
console.log('  - 安安：完整记录，已归档（3/3页）');
console.log('  - 乐乐：有无效页+退回补充后重提（4/3页，超出，含无效标记）');
console.log('  - 萌萌：材料缺页（2/5页，部分成功）');
console.log('  - 2条坏行：导入失败，但好宝宝未受影响');
console.log('  - 审计日志中可查：部分成功、无效页、导入行失败、导出不一致等记录');
