import { v4 as uuidv4 } from 'uuid';
import { db, ANNOTATION_STATUS, ERROR_TYPES, MAJORS, BUILDINGS } from './index';

export async function getAnnotations(filters = {}) {
  let query = db.annotations;
  
  if (filters.building) {
    query = query.where('building').equals(filters.building);
  }
  if (filters.major) {
    query = query.where('major').equals(filters.major);
  }
  if (filters.assignee) {
    query = query.where('assignee').equals(filters.assignee);
  }
  if (filters.status) {
    query = query.where('status').equals(filters.status);
  }
  if (filters.pageNo) {
    query = query.where('pageNo').equals(filters.pageNo);
  }
  
  let results = await query.reverse().sortBy('createdAt');
  
  if (filters.hasError !== undefined) {
    results = results.filter(a => a.hasError === filters.hasError);
  }
  
  if (filters.keyword) {
    const keyword = filters.keyword.toLowerCase();
    results = results.filter(a => 
      a.description?.toLowerCase().includes(keyword) ||
      a.annotationNo?.toLowerCase().includes(keyword)
    );
  }
  
  return results;
}

export async function getAnnotationById(id) {
  return await db.annotations.get(id);
}

export async function getRepliesByAnnotationId(annotationId) {
  return await db.replies
    .where('annotationId')
    .equals(annotationId)
    .sortBy('repliedAt');
}

export async function createAnnotation(annotation) {
  const now = new Date().toISOString();
  const id = annotation.id || uuidv4();
  
  const newAnnotation = {
    id,
    annotationNo: annotation.annotationNo || `AN-${Date.now()}`,
    building: annotation.building || '',
    major: annotation.major || '',
    pageNo: annotation.pageNo || '',
    description: annotation.description || '',
    source: annotation.source || 'pdf',
    assignee: annotation.assignee || '',
    status: annotation.status || ANNOTATION_STATUS.PENDING,
    priority: annotation.priority || 'medium',
    importBatchId: annotation.importBatchId || null,
    hasError: annotation.hasError || false,
    errorType: annotation.errorType || null,
    imageUrl: annotation.imageUrl || null,
    createdAt: now,
    updatedAt: now
  };
  
  validateAnnotation(newAnnotation);
  
  await db.annotations.add(newAnnotation);
  return newAnnotation;
}

export async function updateAnnotation(id, updates) {
  const annotation = await db.annotations.get(id);
  if (!annotation) {
    throw new Error('批注不存在');
  }
  
  const updated = {
    ...annotation,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  validateAnnotation(updated);
  
  await db.annotations.put(updated);
  return updated;
}

export async function deleteAnnotation(id) {
  await db.transaction('rw', [db.annotations, db.replies], async () => {
    await db.replies.where('annotationId').equals(id).delete();
    await db.annotations.delete(id);
  });
}

export async function addReply(annotationId, content, replier = '设计经理') {
  const reply = {
    id: uuidv4(),
    annotationId,
    content,
    replier,
    repliedAt: new Date().toISOString()
  };
  
  await db.replies.add(reply);
  
  await updateAnnotation(annotationId, {
    status: ANNOTATION_STATUS.REPLIED
  });
  
  return reply;
}

export async function assignAnnotation(id, assignee) {
  return await updateAnnotation(id, {
    assignee,
    status: ANNOTATION_STATUS.ASSIGNED
  });
}

export async function updateAnnotationStatus(id, status) {
  return await updateAnnotation(id, { status });
}

export async function checkDuplicate(annotation) {
  if (!annotation.annotationNo) return false;
  
  const existing = await db.annotations
    .where('annotationNo')
    .equals(annotation.annotationNo)
    .first();
  
  return existing ? existing.id : null;
}

export async function checkFileHashExists(fileHash) {
  const batch = await db.importBatches
    .where('fileHash')
    .equals(fileHash)
    .first();
  
  return batch ? batch : null;
}

export function generateFileHash(content) {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export function validateAnnotation(annotation) {
  const errors = [];
  
  if (!annotation.building || !BUILDINGS.includes(annotation.building)) {
    errors.push(ERROR_TYPES.INVALID_BUILDING);
  }
  
  if (!annotation.major || !MAJORS.includes(annotation.major)) {
    errors.push(ERROR_TYPES.INVALID_MAJOR);
  }
  
  if (!annotation.pageNo || annotation.pageNo.toString().trim() === '') {
    errors.push(ERROR_TYPES.MISSING_PAGE);
  }
  
  if (errors.length > 0) {
    annotation.hasError = true;
    annotation.errorType = errors[0];
  } else {
    annotation.hasError = false;
    annotation.errorType = null;
  }
  
  return errors;
}

export async function importAnnotations(rows, fileName = 'unknown.xlsx') {
  const contentStr = JSON.stringify(rows);
  const fileHash = generateFileHash(contentStr);
  
  const existingBatch = await checkFileHashExists(fileHash);
  if (existingBatch) {
    return {
      success: false,
      reason: 'duplicate_file',
      message: `该文件已在 ${new Date(existingBatch.importTime).toLocaleString()} 导入过，共 ${existingBatch.recordCount} 条记录`,
      existingBatch
    };
  }
  
  const batchId = uuidv4();
  const importResults = {
    success: true,
    batchId,
    total: rows.length,
    imported: 0,
    errors: 0,
    skipped: 0,
    errorDetails: []
  };
  
  await db.transaction('rw', [db.annotations, db.importBatches], async () => {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      const annotationNo = row['批注编号'] || row['编号'] || row['annotationNo'] || `AN-${batchId.slice(0, 8)}-${i + 1}`;
      
      const existingId = await checkDuplicate({ annotationNo });
      if (existingId) {
        importResults.skipped++;
        importResults.errorDetails.push({
          row: i + 1,
          annotationNo,
          reason: '重复批注编号，已跳过'
        });
        continue;
      }
      
      const annotation = {
        annotationNo,
        building: row['楼栋'] || row['building'] || '',
        major: row['专业'] || row['major'] || '',
        pageNo: row['图纸页码'] || row['页码'] || row['pageNo']?.toString() || '',
        description: row['批注内容'] || row['问题描述'] || row['description'] || '',
        source: row['来源'] || row['source'] || 'excel',
        assignee: row['责任人'] || row['assignee'] || '',
        priority: row['优先级'] || row['priority'] || 'medium',
        importBatchId: batchId
      };
      
      validateAnnotation(annotation);
      
      try {
        await createAnnotation(annotation);
        if (annotation.hasError) {
          importResults.errors++;
        } else {
          importResults.imported++;
        }
      } catch (e) {
        importResults.errors++;
        importResults.errorDetails.push({
          row: i + 1,
          annotationNo,
          reason: e.message
        });
      }
    }
    
    await db.importBatches.add({
      id: batchId,
      fileName,
      fileHash,
      importTime: new Date().toISOString(),
      recordCount: rows.length,
      errorCount: importResults.errors
    });
  });
  
  return importResults;
}

export async function getImportBatches() {
  return await db.importBatches.reverse().sortBy('importTime');
}

export async function compareVersions(annotationId) {
  const annotation = await getAnnotationById(annotationId);
  const replies = await getRepliesByAnnotationId(annotationId);
  
  return {
    current: annotation,
    history: replies.map(r => ({
      type: 'reply',
      timestamp: r.repliedAt,
      content: r.content,
      operator: r.replier
    }))
  };
}

export async function clearAllData() {
  await db.transaction('rw', [db.annotations, db.replies, db.importBatches], async () => {
    await db.annotations.clear();
    await db.replies.clear();
    await db.importBatches.clear();
  });
}

export async function getStatistics() {
  const annotations = await db.annotations.toArray();
  
  const stats = {
    total: annotations.length,
    byStatus: {},
    byMajor: {},
    byBuilding: {},
    hasError: 0,
    pending: 0
  };
  
  Object.values(ANNOTATION_STATUS).forEach(s => {
    stats.byStatus[s] = 0;
  });
  
  annotations.forEach(a => {
    stats.byStatus[a.status] = (stats.byStatus[a.status] || 0) + 1;
    stats.byMajor[a.major] = (stats.byMajor[a.major] || 0) + 1;
    stats.byBuilding[a.building] = (stats.byBuilding[a.building] || 0) + 1;
    if (a.hasError) stats.hasError++;
    if (a.status === ANNOTATION_STATUS.PENDING) stats.pending++;
  });
  
  return stats;
}
