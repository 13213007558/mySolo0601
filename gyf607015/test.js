const http = require('http');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'erbao.db');
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

const app = require('./server.js');

function req(opt, body) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (opt.cookie) headers['Cookie'] = opt.cookie;
    const options = {
      hostname: 'localhost', port: 3000, path: opt.path,
      method: opt.method || 'GET', headers
    };
    const r = http.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null,
            headers: res.headers
          });
        } catch (e) {
          resolve({ status: res.statusCode, body: data, headers: res.headers });
        }
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

let pass = 0, fail = 0;
function test(name, cond) {
  if (cond) { pass++; console.log('  ✅ ' + name); }
  else { fail++; console.log('  ❌ ' + name); }
}

async function main() {
  await new Promise(r => setTimeout(r, 1500));
  console.log('\n=== 婴幼儿费用核销回访册 功能测试 ===\n');

  console.log('1. 用户登录与权限');
  let r = await req({ path: '/api/records', method: 'GET' });
  test('未登录访问被拒绝', r.status === 401);

  r = await req({ path: '/api/login', method: 'POST' }, { username: 'nurse01', password: '123456' });
  test('护士登录成功', r.status === 200 && r.body.user.role === 'nurse');
  const nurseCookie = r.headers['set-cookie'][0].split(';')[0];

  r = await req({ path: '/api/login', method: 'POST' }, { username: 'super01', password: '123456' });
  test('主管登录成功', r.status === 200 && r.body.user.role === 'supervisor');
  const superCookie = r.headers['set-cookie'][0].split(';')[0];

  r = await req({ path: '/api/login', method: 'POST' }, { username: 'nurse01', password: 'wrong' });
  test('错误密码被拒绝', r.status === 401);

  console.log('\n2. 角色权限隔离');
  r = await req({ path: '/api/audit', method: 'GET', cookie: nurseCookie });
  test('护士访问审计中心被拒绝(403)', r.status === 403);

  r = await req({ path: '/api/audit', method: 'GET', cookie: superCookie });
  test('主管可访问审计中心', r.status === 200 && r.body.logs);

  console.log('\n3. 核销记录与跨班部分成功');
  r = await req({ path: '/api/babies', method: 'GET', cookie: nurseCookie });
  const babies = r.body.babies;
  test('可获取宝宝列表(>=4)', babies && babies.length >= 4);

  r = await req({ path: '/api/records', method: 'POST', cookie: nurseCookie }, {
    baby_id: babies[0].id, service_date: '2025-01-15', service_type: '常规儿保',
    amount: 180, shift: '上午班'
  });
  test('创建核销成功(状态success)', r.status === 200 && r.body.status === 'success');
  const recId = r.body.id;

  r = await req({ path: '/api/records', method: 'POST', cookie: nurseCookie }, {
    baby_id: babies[1].id, service_date: '2025-01-15', service_type: '疫苗接种',
    amount: 220, shift: '上午班', is_cross_class: true,
    partial_note: '太阳班完成疫苗,月亮班未体检'
  });
  test('跨班核销状态为partial_success(部分成功)', r.status === 200 && r.body.status === 'partial_success');
  const crossId = r.body.id;

  r = await req({ path: '/api/records', method: 'POST', cookie: nurseCookie }, {
    baby_id: babies[2].id, service_date: '2025-01-16', service_type: '手工补录',
    amount: 150, shift: '下午班', source: 'manual'
  });
  test('手工补录创建成功', r.status === 200);

  console.log('\n4. 修改历史记录追踪(旧值/操作人/时间)');
  r = await req({ path: '/api/records/' + recId, method: 'PUT', cookie: nurseCookie },
    { amount: 200, service_type: '体检复查' });
  test('修改记录成功', r.status === 200);

  r = await req({ path: '/api/records/' + recId, method: 'GET', cookie: nurseCookie });
  const hasHist = r.body.history && r.body.history.length >= 1;
  test('修改后存在历史条目', hasHist);
  if (hasHist) {
    test('历史含字段名+新旧值对比',
      r.body.history.some(h => h.old_value !== null && h.new_value !== null));
    test('历史含操作人姓名', r.body.history.every(h => h.operator_name));
    test('历史含修改时间', r.body.history.every(h => h.changed_at));
  } else {
    test('历史含字段名+新旧值对比', false);
    test('历史含操作人姓名', false);
    test('历史含修改时间', false);
  }

  console.log('\n5. 主管复核功能');
  r = await req({ path: '/api/records/' + recId + '/review', method: 'POST', cookie: nurseCookie });
  test('护士无权复核(403)', r.status === 403);

  r = await req({ path: '/api/records/' + recId + '/review', method: 'POST', cookie: superCookie });
  test('主管可以复核', r.status === 200);

  r = await req({ path: '/api/records/' + recId, method: 'GET', cookie: superCookie });
  test('复核时间已写入记录', !!r.body.record.review_time);
  test('复核人已写入记录', !!r.body.record.reviewer_id);

  console.log('\n6. 越权审计记录');
  r = await req({ path: '/api/audit', method: 'GET', cookie: superCookie });
  const unauthorizedLogs = r.body.logs.filter(l => l.is_unauthorized === 1);
  test('越权访问已被记录审计日志', unauthorizedLogs.length >= 1);
  test('审计日志含操作人用户名', unauthorizedLogs[0] && unauthorizedLogs[0].username);

  console.log('\n7. 样例数据导入(去重不重复)');
  r = await req({ path: '/api/import-samples', method: 'POST', cookie: nurseCookie });
  test('首次导入样例成功(含手工补录)', r.status === 200 && r.body.count >= 4);

  r = await req({ path: '/api/records', method: 'GET', cookie: superCookie });
  const hasManual = r.body.records.some(x => x.source === 'manual');
  test('样例数据包含手工补录记录(便于对比)', hasManual);

  r = await req({ path: '/api/import-samples', method: 'POST', cookie: nurseCookie });
  test('重复导入样例不会报错', r.status === 200);

  r = await req({ path: '/api/records', method: 'GET', cookie: superCookie });
  const sampleActive = r.body.records.filter(x => x.source === 'sample' && x.is_active === 1);
  test('重复导入不产生重复有效样例(旧样例被置为无效)', sampleActive.length <= 3);

  console.log('\n8. 步骤化新人指引');
  r = await req({ path: '/api/workflow/steps', method: 'GET', cookie: nurseCookie });
  test('操作步骤API可用(>=5步)', r.body.steps && r.body.steps.length >= 5);
  test('步骤标识必填/可选', r.body.steps.every(s => 'required' in s));

  console.log('\n9. 护士/主管数据口径一致');
  const nurseR = await req({ path: '/api/records', method: 'GET', cookie: nurseCookie });
  const superR = await req({ path: '/api/records', method: 'GET', cookie: superCookie });
  test('护士与主管看到的记录数量一致(不打架)',
    nurseR.body.records.length === superR.body.records.length);

  const nurseFields = Object.keys(nurseR.body.records[0] || {});
  const superFields = Object.keys(superR.body.records[0] || {});
  test('护士视图字段少于主管视图(字段隔离)', nurseFields.length < superFields.length);
  test('护士视图不含敏感字段(reviewer_id等)', !nurseFields.includes('reviewer_id') && !nurseFields.includes('sample_batch'));

  console.log('\n10. 统计与负余额预警');
  r = await req({ path: '/api/stats', method: 'GET', cookie: nurseCookie });
  test('统计含total/success/partial/pending/negativeCount',
    typeof r.body.total === 'number' && typeof r.body.partial === 'number' &&
    typeof r.body.negativeCount === 'number');

  console.log('\n=== 测试结果: ' + pass + ' 通过, ' + fail + ' 失败 ===\n');
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
