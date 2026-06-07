const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'db.json');

function nowLocal() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function loadDb() {
  if (!fs.existsSync(dbPath)) {
    return {
      children: [],
      records: [],
      record_pages: [],
      timeline_events: [],
      audits: [],
      exports: [],
      seqs: { children: 0, records: 0, record_pages: 0, timeline_events: 0, audits: 0, exports: 0 }
    };
  }
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDb(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
}

class Statement {
  constructor(db, table, kind, sql) {
    this.db = db;
    this.table = table;
    this.kind = kind;
    this.sql = sql;
  }

  run(...args) {
    const data = loadDb();
    if (this.kind === 'insert') {
      const seq = data.seqs[this.table] + 1;
      data.seqs[this.table] = seq;
      const row = { id: seq };
      Object.assign(row, this.fieldValues || {});
      (this.argFieldOrder || this.fields).forEach((f, i) => {
        let v = args[i];
        if (v === undefined) v = null;
        if (f === 'created_at' && v === null) v = nowLocal();
        if (f === 'updated_at' && v === null) v = nowLocal();
        row[f] = v;
      });
      const allFields = [...Object.keys(this.fieldValues || {}), ...(this.argFieldOrder || this.fields)];
      if (!row.created_at && allFields.includes('created_at')) row.created_at = nowLocal();
      if (!row.updated_at && allFields.includes('updated_at')) row.updated_at = nowLocal();
      data[this.table].push(row);
      saveDb(data);
      return { lastInsertRowid: seq, changes: 1 };
    } else if (this.kind === 'update') {
      let changes = 0;
      const whereFn = this.makeWhere(args, this.whereOffset);
      data[this.table].forEach(r => {
        if (whereFn(r)) {
          if (this.setLiterals) Object.assign(r, this.setLiterals);
          this.setFields.forEach((f, i) => {
            r[f] = args[i];
          });
          if (this.table === 'records') r.updated_at = nowLocal();
          changes++;
        }
      });
      saveDb(data);
      return { changes };
    } else if (this.kind === 'delete') {
      const before = data[this.table].length;
      const whereFn = this.makeWhere(args, 0);
      data[this.table] = data[this.table].filter(r => !whereFn(r));
      saveDb(data);
      return { changes: before - data[this.table].length };
    }
    return { changes: 0 };
  }

  get(...args) {
    const data = loadDb();
    if (this.kind === 'count') {
      let rows = this.baseRows(data);
      if (this.whereFn) {
        rows = rows.filter(r => this.whereFn(r, args));
      }
      return { [this.countAs]: rows.length };
    }
    let rows = this.baseRows(data);
    if (this.whereFn) {
      rows = rows.filter(r => this.whereFn(r, args));
    }
    this.applyOrder(rows);
    this.applyLimit(rows);
    return rows[0] || undefined;
  }

  all(...args) {
    const data = loadDb();
    if (this.kind === 'count') {
      let rows = this.baseRows(data);
      if (this.whereFn) {
        rows = rows.filter(r => this.whereFn(r, args));
      }
      return [{ [this.countAs]: rows.length }];
    }
    let rows = this.baseRows(data);
    if (this.whereFn) {
      rows = rows.filter(r => this.whereFn(r, args));
    }
    this.applyOrder(rows);
    this.applyLimit(rows);
    return rows;
  }

  baseRows(data) {
    if (this.table === 'records' && this.joins && this.joins.children) {
      return data.records.map(r => {
        const c = data.children.find(x => x.id === r.child_id) || {};
        return { ...r, child_name: c.name, birth_date: c.birth_date, guardian: c.guardian };
      });
    }
    return [...data[this.table]];
  }

  applyOrder(rows) {
    if (!this.orderBy) return;
    rows.sort((a, b) => {
      for (const { field, desc } of this.orderBy) {
        const av = a[field], bv = b[field];
        if (av == null && bv == null) continue;
        if (av == null) return desc ? 1 : -1;
        if (bv == null) return desc ? -1 : 1;
        if (av < bv) return desc ? 1 : -1;
        if (av > bv) return desc ? -1 : 1;
      }
      return 0;
    });
  }

  applyLimit(rows) {
    if (this._limit != null) rows.splice(this._limit);
  }

  makeWhere(args, offset) {
    if (!this.whereExprs) return () => true;
    return row => this.whereExprs.every(e => {
      if (e.literal !== undefined) return row[e.field] === e.literal;
      const v = args[offset + e.argIndex];
      if (e.op === '=') return row[e.field] === v;
      if (e.op === 'IN') {
        const inVals = args.slice(offset + e.argIndex, offset + e.argIndex + (e.placeholderCount || 0));
        return inVals.includes(row[e.field]);
      }
      return true;
    });
  }
}

function parseSQL(sql) {
  const s = sql.trim();
  let table = null;
  let kind = null;
  const stmt = new Statement(null, null, null, sql);
  stmt.joins = {};
  stmt.orderBy = null;
  stmt._limit = null;

  if (s.startsWith('INSERT INTO')) {
    kind = 'insert';
    const m = s.match(/INSERT INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
    table = m[1];
    stmt.table = table;
    stmt.kind = kind;
    const fields = m[2].split(',').map(f => f.trim());
    const values = m[3].split(',').map(v => v.trim());
    stmt.fields = [];
    stmt.fieldValues = {};
    stmt.argFieldOrder = [];
    fields.forEach((f, i) => {
      const v = values[i];
      if (v === '?') {
        stmt.fields.push(f);
        stmt.argFieldOrder.push(f);
      } else {
        let lv;
        if (v.startsWith("'") && v.endsWith("'")) lv = v.slice(1, -1);
        else if (v.toLowerCase() === 'null') lv = null;
        else if (/^\d+$/.test(v)) lv = parseInt(v);
        else lv = v;
        stmt.fieldValues[f] = lv;
      }
    });
    return stmt;
  }
  if (s.startsWith('UPDATE')) {
    kind = 'update';
    const m = s.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE|$)/i);
    table = m[1];
    stmt.table = table;
    stmt.kind = kind;
    const setPart = m[2];
    stmt.setFields = [];
    stmt.setLiterals = {};
    setPart.split(',').forEach(p => {
      p = p.trim();
      const mm = p.match(/^(\w+)\s*=\s*\?$/i);
      if (mm) {
        stmt.setFields.push(mm[1]);
        return;
      }
      const ml = p.match(/^(\w+)\s*=\s*(\d+|'[^']*')$/i);
      if (ml) {
        let lv = ml[2];
        if (lv.startsWith("'") && lv.endsWith("'")) lv = lv.slice(1, -1);
        else lv = parseInt(lv);
        stmt.setLiterals[ml[1]] = lv;
      }
    });
    const whereMatch = s.match(/WHERE\s+(.+?)(?:\s+ORDER|$)/i);
    stmt.whereExprs = [];
    stmt.whereOffset = stmt.setFields.length;
    if (whereMatch) parseWhere(whereMatch[1], stmt);
    return stmt;
  }
  if (s.startsWith('DELETE FROM')) {
    kind = 'delete';
    const m = s.match(/DELETE FROM\s+(\w+)/i);
    table = m[1];
    stmt.table = table;
    stmt.kind = kind;
    stmt.whereExprs = [];
    const whereMatch = s.match(/WHERE\s+(.+)/i);
    if (whereMatch) parseWhere(whereMatch[1], stmt);
    return stmt;
  }
  if (s.startsWith('CREATE') || s.startsWith('PRAGMA') || s.startsWith('CREATE INDEX')) {
    stmt.kind = 'noop';
    stmt.table = '';
    return stmt;
  }

  const fromMatch = s.match(/FROM\s+(\w+)/i);
  table = fromMatch ? fromMatch[1] : null;
  stmt.table = table;
  kind = 'select';
  stmt.kind = kind;

  const joinMatch = s.match(/JOIN\s+(\w+)\s+\w+\s+ON\s+\w+\.(\w+)\s*=\s*\w+\.(\w+)/i);
  if (joinMatch) {
    stmt.joins[joinMatch[1]] = { left: joinMatch[2], right: joinMatch[3] };
  }

  const whereMatch = s.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/i);
  stmt.whereExprs = [];
  if (whereMatch) parseWhere(whereMatch[1], stmt);

  const orderMatch = s.match(/ORDER BY\s+(.+?)(?:\s+LIMIT|$)/i);
  if (orderMatch) {
    stmt.orderBy = orderMatch[1].split(',').map(p => {
      const parts = p.trim().split(/\s+/);
      return { field: parts[0], desc: parts[1] && parts[1].toUpperCase() === 'DESC' };
    });
  }

  const limitMatch = s.match(/LIMIT\s+(\d+)/i);
  if (limitMatch) stmt._limit = parseInt(limitMatch[1]);

  const countMatch = s.match(/COUNT\(\*\)\s+as\s+(\w+)/i);
  if (countMatch) {
    stmt.countAs = countMatch[1];
    stmt.kind = 'count';
  }

  return stmt;
}

function parseWhere(whereStr, stmt) {
  const conditions = whereStr.split(/\s+AND\s+/i);
  let argIdx = 0;
  const exprs = [];
  conditions.forEach(cond => {
    cond = cond.trim();
    const inMatch = cond.match(/(\w+)\s+IN\s*\(([^)]+)\)/i);
    if (inMatch) {
      const placeholders = inMatch[2].split(',').filter(s => s.trim() === '?').length;
      exprs.push({ field: inMatch[1], op: 'IN', argIndex: argIdx, placeholderCount: placeholders });
      argIdx += placeholders;
      return;
    }
    const eqQM = cond.match(/^(\w+)\s*=\s*\?$/i);
    if (eqQM) {
      exprs.push({ field: eqQM[1], op: '=', argIndex: argIdx });
      argIdx += 1;
      return;
    }
    const eqLit = cond.match(/^(\w+)\s*=\s*(\d+|'[^']*')$/i);
    if (eqLit) {
      let v = eqLit[2];
      if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
      else v = parseInt(v);
      exprs.push({ field: eqLit[1], op: '=', literal: v });
      return;
    }
  });
  stmt.whereExprs = exprs;
  stmt.whereFn = (row, args) => exprs.every(e => {
    if (e.literal !== undefined) return row[e.field] === e.literal;
    if (e.op === '=') return row[e.field] === args[e.argIndex];
    if (e.op === 'IN') {
      const inVals = args.slice(e.argIndex, e.argIndex + (e.placeholderCount || 0));
      return inVals.includes(row[e.field]);
    }
    return true;
  });
}

const db = {
  exec(sql) {
    const stmts = sql.split(';').map(s => s.trim()).filter(Boolean);
    stmts.forEach(s => {
      const stmt = parseSQL(s);
      if (stmt.kind === 'noop') return;
    });
  },
  prepare(sql) {
    return parseSQL(sql);
  },
  pragma() {}
};

module.exports = db;
