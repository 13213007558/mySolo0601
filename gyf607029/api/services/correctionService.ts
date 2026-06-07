import * as authRepo from '../repositories/authRepository.js';
import * as auditRepo from '../repositories/auditRepository.js';
import * as exportRepo from '../repositories/exportRepository.js';
import type { Authorization } from '../../shared/types.js';

export interface CorrectionRequest {
  authId: string;
  beforeData: Record<string, any>;
  afterData: Record<string, any>;
  reason: string;
  operator: string;
}

export function submitCorrection(req: CorrectionRequest) {
  const auth = authRepo.findAuthorizationById(req.authId);
  if (!auth) throw new Error('授权记录不存在');

  const correction = exportRepo.createCorrection(
    req.authId, req.beforeData, req.afterData, req.reason, req.operator,
  );

  auditRepo.createAudit(req.authId, req.operator, 'finance', 'correct', {
    oldValue: JSON.stringify(req.beforeData),
    newValue: JSON.stringify(req.afterData),
    reason: req.reason,
  });

  return correction;
}

export function getFailurePathRecords(): { auth: Authorization; audits: any[] }[] {
  const result = authRepo.findAuthorizations({ authStatus: 'failed', pageSize: 100 });
  return result.data.map(auth => ({
    auth,
    audits: auditRepo.findAuditsByAuthId(auth.id),
  }));
}

export function getCorrectionPathRecords(): { auth: Authorization; audits: any[]; corrections: any[] }[] {
  const corrections = exportRepo.findAllCorrections();
  const authIds = Array.from(new Set(corrections.map(c => c.authId)));
  const auths = authRepo.findAuthorizationsByIds(authIds);
  return auths.map(auth => ({
    auth,
    audits: auditRepo.findAuditsByAuthId(auth.id),
    corrections: corrections.filter(c => c.authId === auth.id),
  }));
}
