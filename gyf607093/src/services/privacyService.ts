import { PrismaClient, PrivacyField } from '@prisma/client';
import { config, UserRoleType, canAccessRole } from '../config';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

class PrivacyService {
  private privacyFields: Map<string, PrivacyField> = new Map();
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    try {
      const fields = await prisma.privacyField.findMany();
      fields.forEach((field) => {
        const key = `${field.tableName}.${field.fieldName}`;
        this.privacyFields.set(key, field);
      });
      this.initialized = true;
      logger.info('隐私字段配置已加载', { count: this.privacyFields.size });
    } catch (error) {
      logger.error('加载隐私字段配置失败', { error });
    }
  }

  canViewField(tableName: string, fieldName: string, userRole: UserRoleType): boolean {
    const key = `${tableName}.${fieldName}`;
    const field = this.privacyFields.get(key);
    if (!field) return true;

    const requiredRoles = field.requiredRoles.split(',') as UserRoleType[];
    return requiredRoles.some((role) => canAccessRole(userRole, role));
  }

  maskValue(value: string, field: PrivacyField): string {
    if (!value) return value;

    if (field.maskPattern) {
      return field.maskPattern;
    }

    switch (field.fieldName) {
      case 'phone':
        return this.maskPhone(value);
      case 'idCard':
        return this.maskIdCard(value);
      case 'address':
        return this.maskAddress(value);
      case 'parentName':
        return this.maskName(value);
      default:
        return config.privacy.defaultMask;
    }
  }

  private maskPhone(phone: string): string {
    if (phone.length < 11) return config.privacy.defaultMask;
    return (
      phone.substring(0, config.privacy.phoneMaskStart) +
      '****' +
      phone.substring(phone.length - config.privacy.phoneMaskEnd)
    );
  }

  private maskIdCard(idCard: string): string {
    if (idCard.length < 18) return config.privacy.defaultMask;
    return (
      idCard.substring(0, config.privacy.idCardMaskStart) +
      '********' +
      idCard.substring(config.privacy.idCardMaskEnd)
    );
  }

  private maskAddress(address: string): string {
    if (address.length <= 6) return config.privacy.defaultMask;
    return address.substring(0, 6) + '***';
  }

  private maskName(name: string): string {
    if (name.length <= 1) return name;
    return name.charAt(0) + '*'.repeat(name.length - 1);
  }

  processBabyData(
    baby: Record<string, unknown>,
    userRole: UserRoleType,
    context: 'json' | 'export' | 'log' | 'page' = 'json'
  ): Record<string, unknown> {
    const processed = { ...baby };
    const sensitiveFields = ['idCard', 'phone', 'address', 'parentName', 'medicalRecord'];

    for (const fieldName of sensitiveFields) {
      if (processed[fieldName] !== undefined) {
        const key = `babies.${fieldName}`;
        const field = this.privacyFields.get(key);
        if (field) {
          if (!this.canViewField('babies', fieldName, userRole)) {
            processed[fieldName] = this.maskValue(processed[fieldName] as string, field);
          }
        }
      }
    }

    if (context === 'log') {
      for (const fieldName of sensitiveFields) {
        if (processed[fieldName] !== undefined) {
          const key = `babies.${fieldName}`;
          const field = this.privacyFields.get(key);
          if (field) {
            processed[fieldName] = this.maskValue(processed[fieldName] as string, field);
          }
        }
      }
    }

    return processed;
  }

  processDataArray<T extends Record<string, unknown>>(
    data: T[],
    userRole: UserRoleType,
    context: 'json' | 'export' | 'log' | 'page' = 'json'
  ): T[] {
    return data.map((item) => this.processBabyData(item, userRole, context) as T);
  }

  maskSensitiveData(
    data: Record<string, unknown>,
    userRole: UserRoleType
  ): Record<string, unknown> {
    const masked = { ...data };

    if (masked.idCard || masked.phone || masked.address || masked.parentName) {
      return this.processBabyData(masked, userRole, 'log');
    }

    for (const key of Object.keys(masked)) {
      if (typeof masked[key] === 'object' && masked[key] !== null) {
        masked[key] = this.maskSensitiveData(
          masked[key] as Record<string, unknown>,
          userRole
        );
      }
      if (typeof masked[key] === 'string') {
        const value = masked[key] as string;
        if (/^\d{17}[\dXx]$/.test(value)) {
          masked[key] = this.maskIdCard(value);
        } else if (/^1[3-9]\d{9}$/.test(value)) {
          masked[key] = this.maskPhone(value);
        }
      }
    }

    return masked;
  }

  getFieldDisplayNames(userRole: UserRoleType): Record<string, string> {
    const result: Record<string, string> = {};
    this.privacyFields.forEach((field) => {
      const key = `${field.tableName}.${field.fieldName}`;
      if (this.canViewField(field.tableName, field.fieldName, userRole)) {
        result[key] = field.displayName;
      }
    });
    return result;
  }

  async reloadPrivacyFields(): Promise<void> {
    this.privacyFields.clear();
    this.initialized = false;
    await this.init();
  }
}

export const privacyService = new PrivacyService();
