import { Request, Response, NextFunction } from 'express';
import { UserRole, Baby, SupplyRecord, AuditLog } from '../../shared/types';

const PRIVACY_FIELDS = ['allergyHistory', 'parentPhone', 'address', 'allergy_history', 'parent_phone'];

function maskName(name: string): string {
  if (!name || name.length <= 1) return name || '';
  return name[0] + '*'.repeat(name.length - 1);
}

function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone || '';
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

export function filterPrivacyFields<T>(data: T, userRole: UserRole | null | undefined): T {
  if (!data) return data;
  
  const role: UserRole = userRole || 'staff';
  
  const filterValue = (value: any, field: string): any => {
    if (value === null || value === undefined) return value;
    
    if (role === 'supervisor' || role === 'admin') {
      return value;
    }
    
    if (role === 'customer_service') {
      if (field === 'parentPhone' || field === 'parent_phone') {
        return maskPhone(value as string);
      }
      if (field === 'name' && typeof value === 'string') {
        return maskName(value);
      }
      if (field === 'allergyHistory' || field === 'allergy_history') {
        return value;
      }
      if (field === 'address') {
        return '***';
      }
      return value;
    }
    
    if (PRIVACY_FIELDS.includes(field) || field === 'address' || field === 'name') {
      return '***';
    }
    
    return value;
  };
  
  const filterObject = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(item => filterObject(item));
    }
    
    if (obj && typeof obj === 'object' && obj !== null) {
      const filtered: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          if (value && typeof value === 'object' && value !== null) {
            filtered[key] = filterObject(value);
          } else {
            filtered[key] = filterValue(value, key);
          }
        }
      }
      return filtered;
    }
    
    return obj;
  };
  
  return filterObject(data);
}

export function privacyFilterMiddleware(req: Request, res: Response, next: NextFunction) {
  const userRole = req.headers['x-user-role'] as UserRole | undefined;
  
  const originalJson = res.json.bind(res);
  res.json = function(data: any) {
    try {
      const filtered = filterPrivacyFields(data, userRole);
      return originalJson(filtered);
    } catch (error) {
      console.error('Privacy filter error:', error);
      return originalJson(data);
    }
  };
  
  next();
}

export function filterLogPrivacy(logData: string, userRole: UserRole | null | undefined): string {
  try {
    const parsed = JSON.parse(logData);
    const filtered = filterPrivacyFields(parsed, userRole);
    return JSON.stringify(filtered);
  } catch {
    return logData;
  }
}
