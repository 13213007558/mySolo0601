const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function main() {
  const base = 'http://localhost:4000';
  const lines = [];
  lines.push('=== 启动日志 ===');
  lines.push(require('fs').readFileSync('/tmp/baby-sleep-4000.log', 'utf8'));

  lines.push('\n=== 1. Health ===');
  const h = await get(base + '/api/health');
  lines.push(JSON.stringify(h.body));

  lines.push('\n=== 2. 列表 ===');
  const list = await get(base + '/api/observations');
  const rows = JSON.parse(list.body);
  lines.push('总数: ' + rows.length);
  rows.forEach(r => lines.push(`  #${r.id} ${r.baby_name} - ${r.status} - ${r.nurse_name}`));

  lines.push('\n=== 3. 详情 #3 (乐乐, 退回整改) ===');
  const d3 = await get(base + '/api/observations/3');
  const x3 = JSON.parse(d3.body);
  lines.push(`宝宝: ${x3.baby_name} 状态: ${x3.status}`);
  lines.push(`照片: ${x3.photos.length}张, 整改: ${x3.corrections.length}条, 审计: ${x3.audit.length}条`);
  x3.audit.forEach(a => lines.push(`  - ${a.created_at.slice(11,19)} ${a.action} ${a.operator} | ${a.remark || ''}`));

  lines.push('\n=== 4. 详情 #4 (糖糖, 完整归档) ===');
  const d4 = await get(base + '/api/observations/4');
  const x4 = JSON.parse(d4.body);
  lines.push(`宝宝: ${x4.baby_name} 状态: ${x4.status}`);
  lines.push('审计轨迹:');
  x4.audit.forEach(a => lines.push(`  - ${a.created_at.slice(11,19)} ${a.action} ${a.from_status||'无'} → ${a.to_status} ${a.operator} | ${a.remark||''}`));

  lines.push('\n=== 5. 异常测试端点 (模拟重启前写入审计) ===');
  const ct = await get(base + '/api/crash-test');
  lines.push(ct.body);

  lines.push('\n=== 6. 导出CSV Headers ===');
  const ex = await get(base + '/api/export');
  lines.push('Status: ' + ex.status);
  lines.push('Content-Type: ' + ex.headers['content-type']);
  lines.push('Content-Disposition: ' + ex.headers['content-disposition']);
  lines.push('CSV前300字符: ' + ex.body.slice(0, 300).replace(/\n/g, '\\n'));

  lines.push('\n=== 7. 模拟服务重启: 杀掉进程再启动 ===');
  const { execSync } = require('child_process');
  try { execSync('pkill -f "node server.js" 2>/dev/null'); } catch {}
  require('fs').writeFileSync('/tmp/baby-sleep-4000.log', '');
  execSync('PORT=4000 nohup node server.js > /tmp/baby-sleep-4000.log 2>&1 &', { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 2500));
  lines.push('重启后日志:');
  lines.push(require('fs').readFileSync('/tmp/baby-sleep-4000.log', 'utf8'));

  lines.push('\n=== 8. 重启后验证详情 #3 (确保照片/状态/整改记录仍在) ===');
  const d3b = await get(base + '/api/observations/3');
  const x3b = JSON.parse(d3b.body);
  lines.push(`宝宝: ${x3b.baby_name} 状态: ${x3b.status}`);
  lines.push(`照片: ${x3b.photos.length}张, 整改: ${x3b.corrections.length}条, 审计: ${x3b.audit.length}条`);
  if (x3b.photos.length > 0 && x3b.corrections.length > 0 && x3b.audit.length >= 5) {
    lines.push('✅ 重启验证通过: 照片说明、状态、整改记录、审计日志全部保留');
  } else {
    lines.push('❌ 重启验证失败: 数据丢失');
  }

  require('fs').writeFileSync('/tmp/test-result.txt', lines.join('\n'));
  console.log('结果已写入 /tmp/test-result.txt');
}

main().catch(e => { console.error(e); process.exit(1); });
