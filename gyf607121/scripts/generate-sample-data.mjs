import * as XLSX from 'xlsx';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const data = [
  {
    电表编号: '20240001',
    读数: 1250.5,
    抄表时间: '2026-06-01 08:30:00',
    倍率: 40,
  },
  {
    电表编号: '20240002',
    读数: 2380.75,
    抄表时间: '2026-06-01 08:31:00',
    倍率: 60,
  },
  {
    电表编号: '20240015',
    读数: 890.25,
    抄表时间: '2026-06-01 08:32:00',
    倍率: 80,
  },
  {
    电表编号: '20240003',
    读数: 1560.0,
    抄表时间: '2026-06-01 08:33:00',
    倍率: 40,
  },
  {
    电表编号: '20240004',
    读数: 3200.5,
    抄表时间: '2026-06-01 08:34:00',
    倍率: 50,
  },
  {
    电表编号: '20240005',
    读数: 450.75,
    抄表时间: '2026-06-01 08:35:00',
    倍率: 30,
  },
  {
    电表编号: '20240006',
    读数: 2100.25,
    抄表时间: '2026-06-01 08:36:00',
    倍率: 45,
  },
  {
    电表编号: '2024015X',
    读数: 2340.0,
    抄表时间: '2026-06-01 08:41:00',
    倍率: 50,
  },
  {
    电表编号: '20240012',
    读数: -150.5,
    抄表时间: '2026-06-01 08:42:00',
    倍率: 40,
  },
  {
    电表编号: '',
    读数: 2560.75,
    抄表时间: '2026-06-01 08:44:00',
    倍率: 50,
  },
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(data);
XLSX.utils.book_append_sheet(wb, ws, '电表数据');

const publicDir = join(process.cwd(), 'public');
try {
  mkdirSync(publicDir, { recursive: true });
} catch (e) {
  // 目录已存在
}

const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
writeFileSync(join(publicDir, 'sample_meter_data.xlsx'), excelBuffer);

console.log('示例Excel文件已生成: public/sample_meter_data.xlsx');
console.log(`包含 ${data.length} 条测试数据，其中包含多条问题记录用于测试`);
