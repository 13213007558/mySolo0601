const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const { createObjectCsvStringifier } = require('csv-writer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

function generateCaseNo() {
  const date = new Date();
  const prefix = `SLP${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM cases WHERE case_no LIKE ?').get(`${prefix}%`);
  return `${prefix}${String(existing.cnt + 1).padStart(4, '0')}`;
}

function addAudit(caseId, eventId, action, detail, operatorId, operatorName) {
  const missing = (!operatorId && !operatorName) ? 1 : 0;
  db.prepare(`
    INSERT INTO audits (case_id, event_id, action, detail, operator_id, operator_name, operator_missing)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(caseId, eventId, action, detail, operatorId, operatorName, missing);
}

function addTimelineEvent(caseId, eventType, eventTitle, description, operatorId, operatorName, statusBefore, statusAfter) {
  const missing = (!operatorId && !operatorName) ? 1 : 0;
  const result = db.prepare(`
    INSERT INTO timeline_events (case_id, event_type, event_title, description, operator_id, operator_name, operator_missing, status_before, status_after)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(caseId, eventType, eventTitle, description, operatorId, operatorName, missing, statusBefore, statusAfter);
  
  addAudit(caseId, result.lastInsertRowid, eventType, description, operatorId, operatorName);
  return result.lastInsertRowid;
}
