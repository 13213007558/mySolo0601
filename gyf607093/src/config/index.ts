export const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'rehabilitation-center-secret-key-2026',
  jwtExpiresIn: '24h',
  saltRounds: 10,
  privacy: {
    defaultMask: '***',
    phoneMaskStart: 3,
    phoneMaskEnd: 4,
    idCardMaskStart: 6,
    idCardMaskEnd: 14,
  },
  audit: {
    logUnauthorized: true,
    logCrossClass: true,
    logManualEntry: true,
  },
  sync: {
    retryAttempts: 3,
    retryDelay: 1000,
  },
};

export type UserRoleType = 'ADMIN' | 'SUPERVISOR' | 'THERAPIST' | 'RECEPTION' | 'GENERAL';

export const ROLE_HIERARCHY: Record<UserRoleType, number> = {
  ADMIN: 5,
  SUPERVISOR: 4,
  THERAPIST: 3,
  RECEPTION: 2,
  GENERAL: 1,
};

export const canAccessRole = (userRole: UserRoleType, requiredRole: UserRoleType): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};
