const db = require('./db');

db.init().then(() => {
  console.log('数据库和样例数据已初始化完成');
}).catch(err => {
  console.error('初始化失败:', err);
  process.exit(1);
});
