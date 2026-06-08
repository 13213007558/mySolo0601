const ROLES = {
  TEACHER: '夜班老师(普通)',
  ADMIN: '主管'
};

const TABLE_NAMES = {
  BABIES: 'babies',
  FLOWS: 'flows',
  HX_RECORDS: 'hx_records',
  BL_RECORDS: 'bl_records',
  AUDIT_LOGS: 'audit_logs',
  ROLES: 'roles',
  VIEWS: 'views'
};

const PERMISSIONS = {
  [ROLES.TEACHER]: {
    tables: {
      [TABLE_NAMES.BABIES]: 'edit',
      [TABLE_NAMES.FLOWS]: 'edit',
      [TABLE_NAMES.HX_RECORDS]: 'edit',
      [TABLE_NAMES.BL_RECORDS]: 'edit',
      [TABLE_NAMES.AUDIT_LOGS]: 'no_perm',
      [TABLE_NAMES.ROLES]: 'no_perm',
      [TABLE_NAMES.VIEWS]: 'read'
    },
    fields: {
      [TABLE_NAMES.BABIES]: {
        id: 'read', baby_name: 'edit', baby_code: 'edit', parent_name: 'edit',
        phone: 'edit', class_name: 'edit', enrollment_date: 'edit',
        status: 'edit', created_at: 'read'
      },
      [TABLE_NAMES.FLOWS]: {
        id: 'read', flow_no: 'edit', baby_id: 'edit', package_name: 'edit',
        package_type: 'edit', total_hours: 'edit', total_amount: 'edit',
        purchase_date: 'edit', valid_until: 'edit', data_source: 'edit',
        batch_no: 'edit', record_status: 'edit', data_abnormal: 'read',
        abnormal_reason: 'read', created_at: 'read'
      },
      [TABLE_NAMES.HX_RECORDS]: {
        id: 'read', hx_no: 'edit', flow_id: 'edit', baby_id: 'edit',
        hx_date: 'edit', hx_hours: 'edit', hx_amount: 'edit',
        process_status: 'edit', process_result: 'edit', operator: 'edit',
        process_time: 'edit', is_closed: 'edit', allow_partial_success: 'read',
        row_abnormal: 'read', abnormal_reason: 'no_perm', is_manual: 'edit',
        bl_ids: 'read', audit_ids: 'no_perm', remark: 'edit', created_at: 'read'
      },
      [TABLE_NAMES.BL_RECORDS]: {
        id: 'read', bl_no: 'edit', hx_id: 'edit', baby_id: 'edit',
        material_type: 'edit', material_desc: 'edit', submit_time: 'edit',
        submitter: 'edit', process_status: 'edit', process_result: 'edit',
        operator: 'edit', process_time: 'edit', created_at: 'read'
      },
      [TABLE_NAMES.AUDIT_LOGS]: {
        '*': 'no_perm'
      }
    },
    filters: {
      [TABLE_NAMES.HX_RECORDS]: { row_abnormal: '正常' },
      [TABLE_NAMES.FLOWS]: { record_status: '有效' }
    }
  },
  [ROLES.ADMIN]: {
    tables: {
      [TABLE_NAMES.BABIES]: 'edit',
      [TABLE_NAMES.FLOWS]: 'edit',
      [TABLE_NAMES.HX_RECORDS]: 'edit',
      [TABLE_NAMES.BL_RECORDS]: 'edit',
      [TABLE_NAMES.AUDIT_LOGS]: 'edit',
      [TABLE_NAMES.ROLES]: 'read',
      [TABLE_NAMES.VIEWS]: 'edit'
    },
    fields: {
      '*': { '*': 'edit' }
    },
    filters: {}
  }
};

const VISIBLE_FIELDS = {
  [ROLES.TEACHER]: {
    [TABLE_NAMES.HX_RECORDS]: [
      'id', 'hx_no', 'flow_id', 'baby_id', 'hx_date', 'hx_hours', 'hx_amount',
      'process_status', 'process_result', 'operator', 'process_time',
      'is_closed', 'row_abnormal', 'is_manual', 'bl_ids', 'remark', 'created_at'
    ],
    [TABLE_NAMES.FLOWS]: [
      'id', 'flow_no', 'baby_id', 'package_name', 'package_type', 'total_hours',
      'total_amount', 'purchase_date', 'valid_until', 'data_source', 'batch_no',
      'record_status', 'created_at'
    ]
  },
  [ROLES.ADMIN]: {
    [TABLE_NAMES.HX_RECORDS]: '*',
    [TABLE_NAMES.FLOWS]: '*',
    [TABLE_NAMES.AUDIT_LOGS]: '*'
  }
};

const VIEW_CONFIGS = {
  [ROLES.TEACHER]: {
    name: '夜班老师普通视图',
    description: '只显示必要业务字段，隐藏审计信息，过滤异常隔离行'
  },
  [ROLES.ADMIN]: {
    name: '主管审计视图',
    description: '显示所有字段，包含异常隔离行，可查看完整审计链路'
  }
};

module.exports = {
  ROLES,
  TABLE_NAMES,
  PERMISSIONS,
  VISIBLE_FIELDS,
  VIEW_CONFIGS
};
