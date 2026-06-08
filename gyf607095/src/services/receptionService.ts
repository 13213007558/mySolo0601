import { ReceptionStep, User } from '../types';
import { db } from '../models/database';
import { generateId } from '../utils';
import { permissionService } from './permissionService';

export class ReceptionService {
  public initSteps(): void {
    if (db.receptionSteps.size > 0) return;

    const steps: ReceptionStep[] = [
      {
        id: generateId('step'),
        order: 1,
        title: '核对到课儿童名单',
        description: '查看今日已完成课程，确认儿童姓名、课程类型、治疗师无误。',
        keyActions: [
          '打开"今日课务"页面',
          '按儿童姓名逐个核对',
          '确认课程状态为"已完成"'
        ],
        checks: [
          '儿童姓名与系统档案一致',
          '课程类型与预约一致',
          '治疗师签字确认已上课'
        ],
        commonMistakes: [
          '忘记核对治疗师是否正确',
          '漏看课程状态，核销了未完成的课程',
          '同名儿童搞混，注意看出生日期区分'
        ]
      },
      {
        id: generateId('step'),
        order: 2,
        title: '检查上课凭证照片',
        description: '每节课需要3张照片（签到、训练中、下课），缺失时按规则处理。',
        keyActions: [
          '点击每条记录的"照片"按钮',
          '清点照片数量，标记缺失照片',
          '缺失1-2张可标记"部分成功"继续',
          '缺失3张或无照片标记"异常"待处理'
        ],
        checks: [
          '每张照片清晰可见儿童面部',
          '照片时间与课程时间匹配',
          '签到照片显示日期和时间'
        ],
        commonMistakes: [
          '照片模糊不清仍然通过',
          '缺失照片忘记标记，导致后续审计不通过',
          '把昨天的照片当成今天的用'
        ]
      },
      {
        id: generateId('step'),
        order: 3,
        title: '查看课后反馈',
        description: '确认治疗师已填写课后反馈，结算和详情共用同一版本。',
        keyActions: [
          '点击"查看反馈"',
          '确认反馈版本号',
          '如无反馈，提醒治疗师补填'
        ],
        checks: [
          '反馈内容真实具体，不是模板化内容',
          '版本号显示为最新',
          '有异常情况已在反馈中说明'
        ],
        commonMistakes: [
          '没有反馈就直接核销',
          '看错版本号，用了旧的反馈内容',
          '反馈内容为空也通过'
        ]
      },
      {
        id: generateId('step'),
        order: 4,
        title: '核对余额避免负数',
        description: '月底重点！扣款前确认余额充足，避免余额变负。',
        keyActions: [
          '查看儿童当前账户余额',
          '计算本次扣款后余额',
          '余额不足时通知家长充值',
          '部分成功的记录扣款减半'
        ],
        checks: [
          '扣款后余额 >= 0',
          '余额不足500元时提醒家长',
          '月底清零前确认所有欠费已补缴'
        ],
        commonMistakes: [
          '月底忘记检查余额，导致大量负余额',
          '部分成功的记录忘记扣款减半',
          '退款后没有重新核对余额'
        ]
      },
      {
        id: generateId('step'),
        order: 5,
        title: '提交核销验证',
        description: '确认无误后提交核销，系统自动进入验证流程。',
        keyActions: [
          '勾选所有准备核销的记录',
          '点击"批量验证"按钮',
          '查看验证结果，处理异常记录',
          '打印当日核销清单'
        ],
        checks: [
          '验证状态为"成功"或"部分成功"',
          '异常记录已标记原因',
          '总金额与明细相加一致'
        ],
        commonMistakes: [
          '选错了要核销的记录',
          '验证失败的记录没有及时处理',
          '忘记打印清单给主管签字'
        ]
      },
      {
        id: generateId('step'),
        order: 6,
        title: '完成结算',
        description: '验证通过后完成结算，余额自动扣除。',
        keyActions: [
          '确认验证通过的记录',
          '点击"完成结算"',
          '查看余额变动记录',
          '给家长发送扣款通知'
        ],
        checks: [
          '扣款金额正确',
          '余额变动记录完整',
          '家长已收到通知'
        ],
        commonMistakes: [
          '重复结算导致重复扣款',
          '没有给家长发通知引起投诉',
          '结算后发现错误忘记作废重结'
        ]
      }
    ];

    for (const step of steps) {
      db.receptionSteps.set(step.id, step);
    }
  }

  public getSteps(user: User): ReceptionStep[] {
    permissionService.assertPermission(user, 'step', 'view');
    return Array.from(db.receptionSteps.values())
      .sort((a, b) => a.order - b.order);
  }

  public getStepByOrder(user: User, order: number): ReceptionStep | undefined {
    permissionService.assertPermission(user, 'step', 'view');
    return Array.from(db.receptionSteps.values())
      .find(s => s.order === order);
  }

  public validateStepCompletion(user: User, order: number, data: any): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const step = this.getStepByOrder(user, order);
    if (!step) {
      return { valid: false, errors: ['步骤不存在'], warnings: [] };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    switch (order) {
      case 1:
        if (!data.childName) errors.push('儿童姓名不能为空');
        if (!data.courseType) errors.push('课程类型不能为空');
        if (!data.therapistName) errors.push('治疗师姓名不能为空');
        if (data.courseStatus !== 'completed') {
          errors.push('课程状态必须是"已完成"才能核销');
        }
        break;
      case 2:
        if (data.photoCount === 0) {
          errors.push('未找到任何照片，请上传后重试');
        } else if (data.missingCount >= 3) {
          errors.push(`缺失照片过多(${data.missingCount}张)，请补充后重试`);
        } else if (data.missingCount > 0) {
          warnings.push(`缺失${data.missingCount}张照片，将按"部分成功"处理，扣款减半`);
        }
        break;
      case 3:
        if (!data.feedback || data.feedback.trim().length < 10) {
          warnings.push('课后反馈内容较短，请确认治疗师已填写完整');
        }
        if (!data.feedbackVersion) {
          warnings.push('反馈版本号缺失，可能不是最新版本');
        }
        break;
      case 4:
        if (data.balanceAfter < 0) {
          errors.push(`余额不足！扣款后余额为 ¥${data.balanceAfter.toFixed(2)}，请先充值`);
        } else if (data.balanceAfter < 500) {
          warnings.push(`余额偏低（¥${data.balanceAfter.toFixed(2)}），建议提醒家长充值`);
        }
        break;
      case 5:
        if (!data.selectedRecords || data.selectedRecords.length === 0) {
          errors.push('请至少选择一条记录进行核销');
        }
        if (data.hasUnverifiedRecords) {
          warnings.push('存在未验证的记录，请确认是否已全部处理');
        }
        break;
      case 6:
        if (data.totalAmount !== data.expectedAmount) {
          errors.push(`金额不一致：明细合计 ¥${data.totalAmount.toFixed(2)}，预期 ¥${data.expectedAmount.toFixed(2)}`);
        }
        if (!data.notificationSent) {
          warnings.push('尚未发送扣款通知给家长');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export const receptionService = new ReceptionService();
