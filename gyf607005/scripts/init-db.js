const { getDb, closeDb } = require('../src/db');
const { SCHEMA_SQL, TABLES } = require('../src/db/schema');

function initDatabase() {
  const db = getDb();
  
  console.log('=== 初始化数据库 ===\n');
  
  console.log('1. 执行建表SQL...');
  db.exec(SCHEMA_SQL);
  console.log('   ✓ 表结构创建完成\n');
  
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all();
  
  console.log('2. 已创建的表：');
  tables.forEach(t => console.log(`   - ${t.name}`));
  
  console.log('\n=== 数据库初始化完成 ===');
  
  closeDb();
}

if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;
