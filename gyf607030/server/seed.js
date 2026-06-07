const db = require('./database');

function seed() {
  const count = db.prepare('SELECT COUNT(*) as count FROM milk_records').get().count;
  if (count > 0) {
    console.log('数据已存在，跳过种子数据');
    return;
  }

  const insertRecord = db.prepare(`
    INSERT INTO milk_records 
    (baby_name, parent_name, parent_phone, class_name, record_date, 
     source_chat_amount, source_paper_amount, original_promise, status,
     is_bad_data, bad_data_reason, material_pages, material_pages_expected,
     export_count_mismatch, export_count_reason, reconciliation_note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertHistory = db.prepare(`
    INSERT INTO status_history (record_id, old_status, new_status, old_promise, new_promise, changed_by, change_note)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertNote = db.prepare(`
    INSERT INTO notes (record_id, content, author_id, is_parent_correction)
    VALUES (?, ?, ?, ?)
  `);

  const records = [
    {
      baby: '小明', parent: '王芳', phone: '13800138001', class: '托班A',
      date: '2026-06-05', chat: 180, paper: 180, promise: '每日3次，每次180ml',
      status: 'matched', bad: 0, badReason: null, pages: 3, expPages: 3,
      exportMismatch: 0, exportReason: null, note: null
    },
    {
      baby: '小红', parent: '李刚', phone: '13800138002', class: '托班A',
      date: '2026-06-05', chat: 200, paper: 150, promise: '每日3次，每次200ml',
      status: 'mismatched', bad: 0, badReason: null, pages: 2, expPages: 3,
      exportMismatch: 0, exportReason: null, note: '纸质交接单少填一次'
    },
    {
      baby: '小宝', parent: '赵敏', phone: '13800138003', class: '小班B',
      date: '2026-06-05', chat: null, paper: 160, promise: '每日2次，每次160ml',
      status: 'missing_material', bad: 0, badReason: null, pages: 1, expPages: 2,
      exportMismatch: 0, exportReason: null, note: '材料缺页：第2页交接单丢失'
    },
    {
      baby: '豆豆', parent: '刘强', phone: '13800138004', class: '小班B',
      date: '2026-06-05', chat: -50, paper: 999, promise: '异常数据',
      status: 'bad_data', bad: 1, badReason: '奶量数值超出合理范围（负数/超大值）', pages: 0, expPages: 2,
      exportMismatch: 1, exportReason: '坏数据默认不计入导出统计', note: null
    },
    {
      baby: '萌萌', parent: '周婷', phone: '13800138005', class: '托班A',
      date: '2026-06-06', chat: 150, paper: 150, promise: '每日3次，每次150ml',
      status: 'pending', bad: 0, badReason: null, pages: 3, expPages: 3,
      exportMismatch: 0, exportReason: null, note: null
    },
    {
      baby: '壮壮', parent: '吴浩', phone: '13800138006', class: '小班B',
      date: '2026-06-06', chat: 180, paper: 200, promise: '每日2次，每次180ml',
      status: 'mismatched', bad: 0, badReason: null, pages: 2, expPages: 2,
      exportMismatch: 0, exportReason: null, note: '家长临时增加奶量至200ml'
    },
    {
      baby: '朵朵', parent: '郑丽', phone: '13800138007', class: '托班A',
      date: '2026-06-06', chat: 120, paper: null, promise: '每日4次，每次120ml',
      status: 'pending', bad: 0, badReason: null, pages: 3, expPages: 3,
      exportMismatch: 0, exportReason: null, note: null
    },
    {
      baby: '阳阳', parent: '孙明', phone: '13800138008', class: '小班B',
      date: '2026-06-06', chat: 9999, paper: 160, promise: '异常数据',
      status: 'bad_data', bad: 1, badReason: '群留言奶量数值异常（9999ml）', pages: 2, expPages: 2,
      exportMismatch: 1, exportReason: '坏数据不计入，导致导出数量比页面少1条', note: null
    }
  ];

  records.forEach((r, idx) => {
    const info = insertRecord.run(
      r.baby, r.parent, r.phone, r.class, r.date,
      r.chat, r.paper, r.promise, r.status,
      r.bad, r.badReason, r.pages, r.expPages,
      r.exportMismatch, r.exportReason, r.note
    );
    const recordId = info.lastInsertRowid;

    if (r.status !== 'pending') {
      insertHistory.run(recordId, 'pending', r.status, null, r.promise, 1, '初始对账');
    }

    if (r.status === 'mismatched' && r.baby === '壮壮') {
      insertNote.run(recordId, '家长下午来电改口说孩子胃口好，临时加到每次200ml', 1, 1);
    }
    if (r.status === 'missing_material') {
      insertNote.run(recordId, '门岗反馈交接单少了一页，正在查找', 3, 0);
    }
  });

  console.log(`已插入 ${records.length} 条测试数据`);
}

seed();
