const http = require('http');

const BASE = 'http://localhost:4000/api';

function request(method, path, token, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) options.headers.Authorization = 'Bearer ' + token;
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data || '{}') });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function login(username, password) {
  const r = await request('POST', '/auth/login', null, { username, password });
  return r.body.token;
}

async function main() {
  console.log('========== 异常场景触发脚本 ==========\n');

  try {
    await request('GET', '/meta/roles');
  } catch (e) {
    console.error('无法连接后端。请先在项目根目录运行: npm run dev');
    console.error('或运行: npm start');
    process.exit(1);
  }

  const superToken = await login('supervisor', '123456');
  const nannyToken = await login('nanny', '123456');
  const elderToken = await login('elder', '123456');

  console.log('[1] 测试老人越权访问详情接口(应返回无权或空):');
  const list1 = await request('GET', '/observations', elderToken);
  console.log('   老人查看列表,仅摘要字段数 =', Object.keys(list1.body[0] || {}).length, '(应 < 12)');
  console.log('   列表样例:', JSON.stringify(list1.body[0] || {}));

  console.log('\n[2] 测试非法状态转换(草稿直接归档,应失败):');
  const obs = await request('POST', '/observations', nannyToken, {
    baby_name: '豆豆', sleep_date: '2026-06-08', start_time: '12:00'
  });
  const badArchive = await request('POST', `/observations/${obs.body.id}/archive`, nannyToken, {});
  console.log('   草稿->归档 结果:', badArchive.status, JSON.stringify(badArchive.body));

  console.log('\n[3] 测试批量提交部分成功:');
  const obs2 = await request('POST', '/observations', nannyToken, {
    baby_name: '米米', sleep_date: '2026-06-08', start_time: '13:00'
  });
  await request('POST', `/observations/${obs2.body.id}/submit`, nannyToken);
  const batch = await request('POST', '/observations/batch-submit', nannyToken, {
    ids: [obs.body.id, obs2.body.id, 999999]
  });
  console.log('   批量提交(含已提交和不存在ID):', JSON.stringify(batch.body));

  console.log('\n[4] 测试状态回退(保留审计):');
  const submitted = await request('GET', '/observations', superToken);
  const submittedItem = submitted.body.find(o => o.status === 'submitted');
  if (submittedItem) {
    const rollback = await request('POST', `/observations/${submittedItem.id}/rollback`, superToken, {
      status: 'draft', comment: '触发回退演示', reason: '测试脚本触发'
    });
    console.log('   回退结果:', JSON.stringify(rollback.body));
    const detail = await request('GET', `/observations/${submittedItem.id}`, superToken);
    console.log('   回退后 timeline 中 rollback 动作数量:',
      detail.body.timeline.filter(t => t.action === 'rollback').length);
    console.log('   回退后审计日志数量:', detail.body.audits ? detail.body.audits.length : '无权限');
  }

  console.log('\n[5] 测试老人登录查看(只看摘要):');
  const elderList = await request('GET', '/observations', elderToken);
  console.log('   老人看到的字段:', Object.keys(elderList.body[0] || {}).join(', '));
  console.log('   首条摘要:', elderList.body[0] ? elderList.body[0].summary : '无');

  console.log('\n[6] 测试导出CSV(主管权限):');
  const exp = await request('GET', '/export/observations', superToken);
  console.log('   导出响应状态:', exp.status, 'Content-Type:', '通常为 text/csv 或 attachment');

  console.log('\n========== 异常场景演示完成 ==========');
  console.log('可在浏览器中以 supervisor 登录查看审计日志与时间线留痕');
}

main().catch(e => console.error(e));
