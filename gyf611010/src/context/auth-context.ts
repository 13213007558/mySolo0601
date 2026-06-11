import { createContext } from '@lit-labs/context';
import type { Context } from '@lit-labs/context';
import type { User } from '../types/index';
import type { SecurityAuditLog } from '../utils/audit-logger';
import { auditLogger } from '../utils/audit-logger';
import { sendForgeryAlert } from '../utils/sms-notifier';
import { users as mockUsers } from '../utils/mock-data';

/**
 * 认证上下文类型
 * @description 定义认证相关的状态和操作接口，支持用户管理、安全审计与合规上报
 */
export interface AuthContextType {
  /**
   * 当前登录用户
   * @compliance 便于追溯操作责任人，满足食品安全审计的人员可追溯要求
   */
  currentUser: User | null;

  /**
   * 主管联系电话列表（只读）
   * @compliance 确保安全告警能够及时通知到多名主管，避免单点遗漏
   */
  readonly supervisorPhones: string[];

  /**
   * 安全审计日志列表（只读）
   * @compliance 支持现场合规检查时快速查阅操作历史
   */
  readonly auditLogs: SecurityAuditLog[];

  /**
   * 用户登录
   * @compliance 记录登录行为，确保系统访问可追溯
   * @param username 用户名
   * @param password 密码
   */
  login: (username: string, password: string) => Promise<boolean>;

  /**
   * 用户登出
   * @compliance 清除会话，防止未授权访问
   */
  logout: () => void;

  /**
   * 当前用户是否被锁定
   * @compliance 支持账号安全控制，检测到异常行为时可强制锁定
   */
  isUserLocked: boolean;

  /**
   * 锁定用户
   * @compliance 发现数据伪造等严重违规时，立即冻结账号防止进一步破坏
   * @param userId 用户ID
   */
  lockUser: (userId: string) => void;

  /**
   * 解锁用户
   * @compliance 经核实后恢复账号，同时记录解锁操作以备审计
   * @param userId 用户ID
   */
  unlockUser: (userId: string) => void;

  /**
   * 判断用户是否拥有指定角色
   * @compliance 基于角色的访问控制（RBAC），确保操作权限与岗位匹配
   * @param role 角色或角色数组
   */
  hasRole: (role: User['role'] | User['role'][]) => boolean;

  /**
   * 获取所有安全审计日志
   * @compliance 支持监管机构审查和内部审计的日志调阅需求
   */
  getAuditLogs: () => SecurityAuditLog[];

  /**
   * 向主管上报数据伪造事件
   * @compliance 遵循严重安全事件逐级上报制度，确保管理层第一时间知情
   * @param wheelNumber 奶酪轮编号
   * @param userName 关联用户名
   * @param reasons 伪造判定原因列表
   * @param confidence 检测置信度（0-1）
   */
  reportForgeryToSupervisor: (
    wheelNumber: string,
    userName: string,
    reasons: string[],
    confidence: number
  ) => Promise<boolean>;

  /**
   * 用户被锁定时的回调
   * @compliance 支持安全事件的联动响应机制（如刷新界面、强制登出等）
   */
  onUserLocked?: (user: User) => void;

  /**
   * 用户被解锁时的回调
   * @compliance 支持解锁后的状态同步和通知机制
   */
  onUserUnlocked?: (user: User) => void;
}

/**
 * 主管电话号码配置
 * @compliance 双主管配置确保告警不遗漏
 */
const SUPERVISOR_PHONES: string[] = ['13900139001', '13900139002'];

/**
 * 用户存储 Map
 * @compliance 集中管理用户状态，确保锁定/解锁操作的一致性
 */
const userMap = new Map<string, User>();

/**
 * 将 mock 数据用户映射为系统 User 类型
 * @description 填充默认电话、锁定状态和登录时间
 */
const mapMockUser = (mockUser: typeof mockUsers[0], phoneOverride?: string): User => {
  return {
    id: mockUser.id,
    username: mockUser.username,
    role: mockUser.role as User['role'],
    phone: phoneOverride || '',
    isLocked: false,
    lastLogin: new Date(),
  };
};

// 初始化用户 Map
mockUsers.forEach(u => {
  userMap.set(u.id, mapMockUser(u));
});

// 获取 technician 用户作为默认当前用户，并设置模拟手机号
const defaultTechnician = mockUsers.find(u => u.role === 'technician');
let currentUser: User | null = defaultTechnician
  ? mapMockUser(defaultTechnician, '13800138001')
  : null;

// 将已设置手机号的默认用户同步写入 userMap
if (currentUser) {
  userMap.set(currentUser.id, currentUser);
}

export const authContext = createContext<AuthContextType, symbol>(
  Symbol('auth-context')
);

export type AuthContext = Context<symbol, AuthContextType>;

/**
 * 认证上下文默认值实现
 * @compliance 提供完整的安全控制与审计能力，满足食品安全管理的合规要求
 */
export const authContextDefaultValue: AuthContextType = {
  /**
   * 当前登录用户
   * @compliance 默认使用技术员账号，便于演示和开发环境快速使用
   */
  get currentUser(): User | null {
    return currentUser;
  },

  /**
   * 主管联系电话列表（只读）
   * @compliance 安全告警多通道接收，防止信息遗漏
   */
  get supervisorPhones(): string[] {
    return [...SUPERVISOR_PHONES];
  },

  /**
   * 安全审计日志列表（只读）
   * @compliance 实时反映系统安全操作历史
   */
  get auditLogs(): SecurityAuditLog[] {
    return auditLogger.getAuditLogs();
  },

  /**
   * 用户登录
   * @compliance 验证用户身份并记录登录审计日志
   */
  login: async (username: string, _password: string): Promise<boolean> => {
    const mockUser = mockUsers.find(u => u.username === username);
    if (!mockUser) {
      auditLogger.log('login_failed', {
        severity: 'medium',
        userName: username,
        reasons: ['用户不存在'],
      });
      return false;
    }

    const user = userMap.get(mockUser.id) || mapMockUser(mockUser, '13800138001');
    user.lastLogin = new Date();
    userMap.set(user.id, user);
    currentUser = user;

    auditLogger.log('login', {
      severity: 'low',
      userId: user.id,
      userName: user.username,
    });

    return true;
  },

  /**
   * 用户登出
   * @compliance 清除当前会话并记录登出日志，确保操作可追溯
   */
  logout: (): void => {
    if (currentUser) {
      auditLogger.log('logout', {
        severity: 'low',
        userId: currentUser.id,
        userName: currentUser.username,
      });
    }
    currentUser = null;
  },

  /**
   * 当前用户是否被锁定
   * @compliance 动态获取锁定状态，确保界面与实际状态一致
   */
  get isUserLocked(): boolean {
    return currentUser?.isLocked ?? false;
  },

  /**
   * 锁定用户
   * @compliance 严重违规时立即冻结账号、记录审计、通知主管，防止数据进一步篡改
   * @param userId 用户ID
   */
  lockUser: (userId: string): void => {
    const user = userMap.get(userId);
    if (!user) return;

    user.isLocked = true;
    userMap.set(userId, user);

    if (currentUser?.id === userId) {
      currentUser = { ...user };
    }

    auditLogger.log('user_locked', {
      severity: 'critical',
      userId: user.id,
      userName: user.username,
      reasons: ['检测到数据伪造风险，账号已被安全锁定'],
      operatorId: currentUser?.id,
    });

    SUPERVISOR_PHONES.forEach(phone => {
      sendForgeryAlert(phone, 'SYSTEM_LOCK', user.username).catch(err => {
        console.error('[AUTH] 发送锁定通知短信失败:', err);
      });
    });

    if (authContextDefaultValue.onUserLocked) {
      authContextDefaultValue.onUserLocked(user);
    }
  },

  /**
   * 解锁用户
   * @compliance 核实后恢复账号，记录审计并上报主管，形成完整的闭环管理
   * @param userId 用户ID
   */
  unlockUser: (userId: string): void => {
    const user = userMap.get(userId);
    if (!user) return;

    user.isLocked = false;
    userMap.set(userId, user);

    if (currentUser?.id === userId) {
      currentUser = { ...user };
    }

    const log = auditLogger.log('user_unlocked', {
      severity: 'high',
      userId: user.id,
      userName: user.username,
      reasons: ['经核查后解除账号锁定'],
      operatorId: currentUser?.id,
    });

    auditLogger.reportToSupervisor(log).catch(err => {
      console.error('[AUTH] 上报解锁事件失败:', err);
    });

    if (authContextDefaultValue.onUserUnlocked) {
      authContextDefaultValue.onUserUnlocked(user);
    }
  },

  /**
   * 判断当前用户是否拥有指定角色
   * @compliance 基于角色的权限控制，确保操作与岗位职责匹配
   * @param role 角色或角色数组
   */
  hasRole: (role: User['role'] | User['role'][]): boolean => {
    if (!currentUser) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(currentUser.role);
  },

  /**
   * 获取所有安全审计日志
   * @compliance 支持监管审查和内部审计的日志查询
   */
  getAuditLogs: (): SecurityAuditLog[] => {
    return auditLogger.getAuditLogs();
  },

  /**
   * 向主管上报数据伪造事件
   * @compliance 数据伪造属于严重食品安全隐患，必须立即记录审计、短信通知主管并上报
   * @param wheelNumber 奶酪轮编号
   * @param userName 关联用户名
   * @param reasons 伪造判定原因列表
   * @param confidence 检测置信度（0-1）
   */
  reportForgeryToSupervisor: async (
    wheelNumber: string,
    userName: string,
    reasons: string[],
    confidence: number
  ): Promise<boolean> => {
    const log = auditLogger.log('forgery_reported', {
      severity: 'critical',
      userName,
      wheelNumber,
      reasons,
      confidence,
      operatorId: currentUser?.id,
    });

    const sendResults = await Promise.all(
      SUPERVISOR_PHONES.map(phone => sendForgeryAlert(phone, wheelNumber, userName))
    );

    await auditLogger.reportToSupervisor(log);

    return sendResults.every(r => r === true);
  },

  /**
   * 用户被锁定回调（可由上层覆盖）
   * @compliance 支持安全事件发生时的联动响应
   */
  onUserLocked: undefined,

  /**
   * 用户被解锁回调（可由上层覆盖）
   * @compliance 支持解锁后的状态同步和后续业务处理
   */
  onUserUnlocked: undefined,
};

export type AuthContextProvider = (value: AuthContextType) => void;
