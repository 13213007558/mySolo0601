import { PRIVATE_FIELDS } from '../shared/types.js';
function maskString(s, type = 'default') {
    if (!s || s.length <= 2)
        return '***';
    if (type === 'phone') {
        return s.slice(0, 3) + '****' + s.slice(-4);
    }
    if (type === 'id') {
        return s.slice(0, 4) + '**********' + s.slice(-4);
    }
    const half = Math.floor(s.length / 2);
    return s.slice(0, Math.ceil((s.length - half) / 2)) + '*'.repeat(half) + s.slice(-Math.floor((s.length - half) / 2));
}
export function filterBabyByRole(baby, role) {
    const result = { ...baby };
    for (const [field, allowedRoles] of Object.entries(PRIVATE_FIELDS)) {
        if (field in result && !allowedRoles.includes(role)) {
            if (field === 'guardianPhone') {
                result[field] = maskString(result[field], 'phone');
            }
            else if (field === 'guardianIdNo') {
                result[field] = maskString(result[field], 'id');
            }
            else {
                result[field] = '***';
            }
        }
    }
    return result;
}
export function filterRecordByRole(record, role, babiesMap) {
    const result = { ...record };
    if (result.processorId && role === 'store_staff') {
    }
    return result;
}
export function filterAuditByRole(log, role) {
    const result = { ...log };
    if (role === 'store_staff') {
        if (result.diff) {
            const diff = {};
            for (const [k, v] of Object.entries(result.diff)) {
                if (k in PRIVATE_FIELDS && !PRIVATE_FIELDS[k].includes(role)) {
                    diff[k] = { old: '***', new: '***' };
                }
                else {
                    diff[k] = v;
                }
            }
            result.diff = diff;
        }
    }
    return result;
}
export function sanitizeLogData(obj, role = 'store_staff') {
    if (obj === null || obj === undefined)
        return obj;
    if (typeof obj !== 'object')
        return obj;
    if (Array.isArray(obj))
        return obj.map(item => sanitizeLogData(item, role));
    const result = {};
    for (const [k, v] of Object.entries(obj)) {
        if (k in PRIVATE_FIELDS && !PRIVATE_FIELDS[k].includes(role)) {
            if (k === 'guardianPhone') {
                result[k] = typeof v === 'string' ? maskString(v, 'phone') : v;
            }
            else if (k === 'guardianIdNo') {
                result[k] = typeof v === 'string' ? maskString(v, 'id') : v;
            }
            else {
                result[k] = '***';
            }
        }
        else if (typeof v === 'object') {
            result[k] = sanitizeLogData(v, role);
        }
        else {
            result[k] = v;
        }
    }
    return result;
}
