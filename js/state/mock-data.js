/**
 * 临床试验数字化管理 - 模拟数据生成器
 * 包含多角色、临床试验项目、转码任务、审计日志等完整数据模型
 */

// 临床试验项目名称（专业术语转通俗文案）
const trialProjects = [
  '新型降压药物三期临床试验',
  '糖尿病患者血糖监测系统验证',
  '肿瘤靶向药物安全性评估',
  '儿童疫苗免疫原性研究',
  '阿尔茨海默症早期筛查工具开发',
  '心血管支架术后康复方案优化',
  '呼吸系统疾病远程监控平台',
  '中医药治疗失眠临床研究',
  '骨科植入物长期疗效观察',
  '眼科激光手术适应症扩展研究'
];

// 角色定义（专业术语 → 可理解的界面文案）
const roles = [
  { id: 'pi', name: '项目负责人', description: '临床试验的总负责人，审批关键决策' },
  { id: 'crc', name: '临床协调员', description: '负责受试者招募、数据采集和日常协调' },
  { id: 'dm', name: '数据管理员', description: '负责数据质量控制和数据库管理' },
  { id: 'cra', name: '监查员', description: '负责监查试验过程，确保合规性' },
  { id: 'sa', name: '统计分析师', description: '负责试验数据的统计分析和报告' }
];

// 人员列表
const teamMembers = [
  { id: 'u001', name: '张明华', role: 'pi', avatar: '张', department: '心血管内科' },
  { id: 'u002', name: '李雪梅', role: 'crc', avatar: '李', department: '临床研究中心' },
  { id: 'u003', name: '王建国', role: 'dm', avatar: '王', department: '数据管理部' },
  { id: 'u004', name: '陈芳', role: 'cra', avatar: '陈', department: '质量保证部' },
  { id: 'u005', name: '刘伟', role: 'sa', avatar: '刘', department: '生物统计室' },
  { id: 'u006', name: '赵晓燕', role: 'crc', avatar: '赵', department: '内分泌科' },
  { id: 'u007', name: '孙志强', role: 'pi', avatar: '孙', department: '肿瘤科' },
  { id: 'u008', name: '周琳', role: 'cra', avatar: '周', department: '质量保证部' }
];

// 临床试验任务状态流转
const taskStatuses = [
  { id: 'draft', name: '草稿', color: 'slate', transitions: ['pending'] },
  { id: 'pending', name: '待处理', color: 'amber', transitions: ['review', 'rejected'] },
  { id: 'review', name: '审核中', color: 'blue', transitions: ['approved', 'rejected', 'pending'] },
  { id: 'approved', name: '已批准', color: 'emerald', transitions: ['processing', 'rejected'] },
  { id: 'processing', name: '处理中', color: 'cyan', transitions: ['completed', 'failed'] },
  { id: 'completed', name: '已完成', color: 'green', transitions: [] },
  { id: 'rejected', name: '已驳回', color: 'red', transitions: ['pending', 'draft'] },
  { id: 'failed', name: '失败', color: 'red', transitions: ['pending', 'processing'] }
];

// 任务优先级
const priorities = [
  { id: 'high', name: '紧急', color: 'red' },
  { id: 'medium', name: '常规', color: 'amber' },
  { id: 'low', name: '低', color: 'green' }
];

// 全链路追踪节点类型
const traceNodeTypes = [
  { id: 'data_entry', name: '数据录入', icon: '📝' },
  { id: 'quality_check', name: '质量检查', icon: '✅' },
  { id: 'review', name: '审核', icon: '👁️' },
  { id: 'approval', name: '审批', icon: '✅' },
  { id: 'transcoding', name: '转码处理', icon: '🎬' },
  { id: 'analysis', name: '统计分析', icon: '📊' },
  { id: 'report', name: '报告生成', icon: '📄' },
  { id: 'archiving', name: '归档', icon: '📦' }
];

// 音视频转码状态
const transcodingStatuses = [
  { id: 'queued', name: '排队中', color: 'slate' },
  { id: 'processing', name: '处理中', color: 'blue' },
  { id: 'paused', name: '已暂停', color: 'yellow' },
  { id: 'completed', name: '已完成', color: 'emerald' },
  { id: 'failed', name: '失败', color: 'red' }
];

// 转码流水线阶段
const pipelineStages = [
  { id: 'upload', name: '文件上传', description: '原始音视频文件接收' },
  { id: 'validate', name: '格式校验', description: '文件完整性和格式检查' },
  { id: 'extract', name: '数据提取', description: '提取关键帧和音频轨道' },
  { id: 'transcode', name: '编码转换', description: '多格式转码处理' },
  { id: 'encrypt', name: '加密处理', description: '脱敏和加密保护' },
  { id: 'deliver', name: '结果分发', description: '转码结果交付存储' }
];

// 安全操作类型
const auditActions = [
  { id: 'view', name: '查看', risk: 'low' },
  { id: 'edit', name: '编辑', risk: 'medium' },
  { id: 'delete', name: '删除', risk: 'high' },
  { id: 'export', name: '导出', risk: 'high' },
  { id: 'approve', name: '审批', risk: 'high' },
  { id: 'download', name: '下载', risk: 'medium' },
  { id: 'share', name: '分享', risk: 'high' },
  { id: 'login', name: '登录', risk: 'low' }
];

// 数据敏感度等级
const sensitivityLevels = [
  { id: 'public', name: '公开', color: 'green' },
  { id: 'internal', name: '内部', color: 'blue' },
  { id: 'confidential', name: '机密', color: 'amber' },
  { id: 'restricted', name: '限制', color: 'red' }
];

/**
 * 生成初始状态数据
 */
export function generateInitialState() {
  const now = new Date();
  
  // 生成临床试验项目
  const projects = trialProjects.map((name, index) => ({
    id: `proj-${String(index + 1).padStart(3, '0')}`,
    name,
    status: ['active', 'active', 'active', 'completed', 'paused'][index % 5],
    progress: Math.floor(Math.random() * 60) + 30,
    principalInvestigator: teamMembers[index % teamMembers.length],
    startDate: new Date(now.getTime() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    estimatedEndDate: new Date(now.getTime() + Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subjectCount: Math.floor(Math.random() * 200) + 50,
    siteCount: Math.floor(Math.random() * 10) + 3,
    budget: `¥${(Math.random() * 500 + 100).toFixed(1)}万`,
    priority: priorities[index % priorities.length].id,
    description: `本研究旨在评估${name.replace('临床试验', '').replace('研究', '')}的安全性和有效性，为临床应用提供科学依据。`,
    sensitivity: ['confidential', 'restricted', 'confidential', 'internal', 'restricted'][index % 5]
  }));

  // 生成协作任务（看板数据）
  const tasks = generateTasks(projects);

  // 生成全链路追踪数据
  const traces = generateTraceData(projects);

  // 生成音视频转码任务
  const transcodingTasks = generateTranscodingTasks();

  // 生成审计日志
  const auditLogs = generateAuditLogs();

  // 生成权限矩阵
  const permissionMatrix = generatePermissionMatrix();

  return {
    currentUser: teamMembers[0],
    projects,
    tasks,
    traces,
    transcodingTasks,
    auditLogs,
    permissionMatrix,
    roles,
    teamMembers,
    priorities,
    taskStatuses,
    sensitivityLevels,
    pipelineStages,
    stats: {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'active').length,
      totalTasks: tasks.length,
      pendingTasks: tasks.filter(t => t.status === 'pending' || t.status === 'review').length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      transcodingToday: Math.floor(Math.random() * 50) + 20,
      dataVolume: `${(Math.random() * 50 + 10).toFixed(1)} TB`,
      activeUsers: Math.floor(Math.random() * 30) + 15
    }
  };
}

/**
 * 生成协作任务
 */
function generateTasks(projects) {
  const taskTypes = [
    { name: '受试者入组审核', type: 'review' },
    { name: '病例报告表数据录入', type: 'data_entry' },
    { name: '严重不良事件报告', type: 'safety' },
    { name: '试验方案修订审批', type: 'approval' },
    { name: '数据质疑处理', type: 'data_query' },
    { name: '监查报告提交', type: 'monitoring' },
    { name: '统计分析计划制定', type: 'stats' },
    { name: '知情同意书更新', type: 'document' },
    { name: '药物清点记录', type: 'pharmacy' },
    { name: '实验室数据核对', type: 'lab' },
    { name: '试验物资申请', type: 'logistics' },
    { name: '中期分析报告', type: 'analysis' }
  ];

  const tasks = [];
  const statusFlow = ['draft', 'pending', 'review', 'approved', 'processing', 'completed'];
  
  for (let i = 0; i < 24; i++) {
    const project = projects[i % projects.length];
    const statusIndex = Math.floor(Math.random() * statusFlow.length);
    const assigneeIndex = i % teamMembers.length;
    
    tasks.push({
      id: `task-${String(i + 1).padStart(4, '0')}`,
      title: taskTypes[i % taskTypes.length].name,
      type: taskTypes[i % taskTypes.length].type,
      description: `这是项目【${project.name}】中的${taskTypes[i % taskTypes.length].name}任务，请相关负责人及时处理。`,
      projectId: project.id,
      projectName: project.name,
      status: statusFlow[statusIndex],
      priority: priorities[Math.floor(Math.random() * priorities.length)].id,
      assignee: teamMembers[assigneeIndex],
      assigner: teamMembers[(i + 2) % teamMembers.length],
      dueDate: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
      comments: Math.floor(Math.random() * 15),
      attachments: Math.floor(Math.random() * 8),
      traceId: `trace-${String(i + 1).padStart(6, '0')}`,
      subtasks: [
        { id: 'st1', title: '收集相关资料', completed: Math.random() > 0.3 },
        { id: 'st2', title: '执行检查验证', completed: Math.random() > 0.5 },
        { id: 'st3', title: '提交审核确认', completed: Math.random() > 0.7 }
      ],
      activityLog: generateActivityLog()
    });
  }
  
  return tasks;
}

/**
 * 生成活动日志
 */
function generateActivityLog() {
  const actions = [
    '创建了任务',
    '更新了任务描述',
    '更改了优先级',
    '添加了评论',
    '上传了附件',
    '提交了审核',
    '批准了任务',
    '驳回了任务',
    '完成了子任务'
  ];
  
  const logs = [];
  const count = Math.floor(Math.random() * 5) + 2;
  
  for (let i = 0; i < count; i++) {
    logs.push({
      id: `log-${i}`,
      userId: teamMembers[i % teamMembers.length].id,
      userName: teamMembers[i % teamMembers.length].name,
      userRole: teamMembers[i % teamMembers.length].role,
      action: actions[i % actions.length],
      timestamp: new Date(Date.now() - (count - i) * 60 * 60 * 1000).toISOString(),
      details: i === 0 ? '任务初始化' : null
    });
  }
  
  return logs;
}

/**
 * 生成全链路追踪数据
 */
function generateTraceData(projects) {
  const traces = [];
  
  for (let i = 0; i < 8; i++) {
    const project = projects[i % projects.length];
    const nodes = [];
    
    // 生成流程节点
    traceNodeTypes.forEach((nodeType, nodeIndex) => {
      const isCompleted = nodeIndex < Math.floor(Math.random() * (traceNodeTypes.length - 1)) + 2;
      const isActive = nodeIndex === Math.floor(Math.random() * traceNodeTypes.length);
      
      nodes.push({
        id: `node-${nodeType.id}`,
        type: nodeType.id,
        name: nodeType.name,
        icon: nodeType.icon,
        status: isActive ? 'active' : (isCompleted ? 'completed' : 'pending'),
        startTime: isCompleted || isActive ? new Date(Date.now() - (traceNodeTypes.length - nodeIndex) * 2 * 60 * 60 * 1000).toISOString() : null,
        endTime: isCompleted ? new Date(Date.now() - (traceNodeTypes.length - nodeIndex - 1) * 2 * 60 * 60 * 1000).toISOString() : null,
        operator: isCompleted || isActive ? teamMembers[nodeIndex % teamMembers.length] : null,
        duration: isCompleted ? `${Math.floor(Math.random() * 120) + 30} 分钟` : null,
        dataSize: isCompleted ? `${(Math.random() * 500 + 50).toFixed(0)} MB` : null
      });
    });
    
    traces.push({
      id: `trace-${String(i + 1).padStart(6, '0')}`,
      projectId: project.id,
      projectName: project.name,
      taskName: `${['病例报告表', '实验室数据', '受试者影像', '访视记录', '安全性报告'][i % 5]} #${i + 1001}`,
      startTime: nodes[0].startTime,
      currentStage: nodes.find(n => n.status === 'active')?.name || '已完成',
      progress: Math.round(nodes.filter(n => n.status === 'completed').length / nodes.length * 100),
      status: nodes.some(n => n.status === 'active') ? 'running' : (nodes.every(n => n.status === 'completed') ? 'completed' : 'paused'),
      dataType: ['CRF数据', '医学影像', '实验室检验', '电子日志', '音频记录'][i % 5],
      sensitivity: ['internal', 'confidential', 'restricted'][i % 3],
      checkpoints: nodes,
      events: generateTraceEvents(i)
    });
  }
  
  return traces;
}

/**
 * 生成追踪事件
 */
function generateTraceEvents(traceIndex) {
  const eventTypes = [
    { type: 'info', message: '数据已成功上传' },
    { type: 'info', message: '通过格式校验' },
    { type: 'warning', message: '检测到缺失字段，已自动补全' },
    { type: 'info', message: '质量检查通过' },
    { type: 'success', message: '审核已通过' },
    { type: 'info', message: '转码处理开始' },
    { type: 'warning', message: '转码速度低于预期，已自动调整编码参数' },
    { type: 'success', message: '转码完成，输出5种格式' },
    { type: 'info', message: '加密处理完成' },
    { type: 'success', message: '数据已安全归档' }
  ];
  
  return eventTypes.slice(0, Math.floor(Math.random() * 4) + 4).map((e, idx) => ({
    id: `evt-${traceIndex}-${idx}`,
    ...e,
    timestamp: new Date(Date.now() - (eventTypes.length - idx) * 15 * 60 * 1000).toISOString()
  }));
}

/**
 * 生成音视频转码任务
 */
function generateTranscodingTasks() {
  const mediaTypes = [
    { type: 'video', name: '手术录像', resolution: '4K', duration: '2小时15分钟' },
    { type: 'video', name: '患者访谈', resolution: '1080P', duration: '45分钟' },
    { type: 'audio', name: '问诊录音', resolution: '高清', duration: '30分钟' },
    { type: 'video', name: '操作培训', resolution: '720P', duration: '1小时20分钟' },
    { type: 'video', name: '遥测试验', resolution: '4K', duration: '3小时' },
    { type: 'audio', name: '专家研讨', resolution: '高清', duration: '2小时' },
    { type: 'video', name: '病例讨论', resolution: '1080P', duration: '1小时' },
    { type: 'video', name: '康复训练', resolution: '720P', duration: '40分钟' }
  ];
  
  const tasks = [];
  
  for (let i = 0; i < 12; i++) {
    const media = mediaTypes[i % mediaTypes.length];
    const statusIndex = Math.floor(Math.random() * transcodingStatuses.length);
    const status = transcodingStatuses[statusIndex];
    
    tasks.push({
      id: `trans-${String(i + 1).padStart(5, '0')}`,
      name: media.name,
      mediaType: media.type,
      originalFormat: ['MP4', 'AVI', 'MOV', 'WAV', 'MP3'][i % 5],
      targetFormats: ['MP4 (H.264)', 'MP4 (H.265)', 'WebM', 'OGG', '音频提取'].slice(0, Math.floor(Math.random() * 3) + 2),
      resolution: media.resolution,
      duration: media.duration,
      sourceSize: `${(Math.random() * 10 + 1).toFixed(1)} GB`,
      status: status.id,
      statusName: status.name,
      progress: status.id === 'completed' ? 100 : (status.id === 'queued' ? 0 : Math.floor(Math.random() * 80) + 10),
      currentStage: pipelineStages[Math.min(statusIndex, pipelineStages.length - 1)].id,
      createdAt: new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000).toISOString(),
      startedAt: status.id !== 'queued' ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString() : null,
      completedAt: status.id === 'completed' ? new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000).toISOString() : null,
      estimatedTime: status.id === 'processing' ? `${Math.floor(Math.random() * 30) + 5} 分钟` : null,
      createdBy: teamMembers[i % teamMembers.length],
      priority: ['high', 'medium', 'medium', 'low'][i % 4],
      speed: status.id === 'processing' ? `${(Math.random() * 50 + 20).toFixed(0)} MB/s` : null,
      error: status.id === 'failed' ? '源文件损坏，无法读取关键帧' : null,
      outputPath: status.id === 'completed' ? `/transcoded/${String(i + 1).padStart(5, '0')}/` : null,
      checksum: status.id === 'completed' ? `SHA256:${Math.random().toString(36).substr(2, 16)}...` : null
    });
  }
  
  return tasks;
}

/**
 * 生成审计日志
 */
function generateAuditLogs() {
  const resources = [
    { type: 'project', name: '临床试验项目' },
    { type: 'task', name: '协作任务' },
    { type: 'document', name: '电子文档' },
    { type: 'data', name: '受试者数据' },
    { type: 'media', name: '音视频资料' },
    { type: 'report', name: '分析报告' },
    { type: 'system', name: '系统设置' }
  ];
  
  const logs = [];
  
  for (let i = 0; i < 30; i++) {
    const action = auditActions[i % auditActions.length];
    const resource = resources[Math.floor(Math.random() * resources.length)];
    const user = teamMembers[i % teamMembers.length];
    
    logs.push({
      id: `audit-${String(i + 1).padStart(6, '0')}`,
      timestamp: new Date(Date.now() - i * 45 * 60 * 1000).toISOString(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: action.id,
      actionName: action.name,
      riskLevel: action.risk,
      resourceType: resource.type,
      resourceName: resource.name,
      resourceId: `${resource.type}-${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`,
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      status: ['success', 'success', 'success', 'denied'][i % 4],
      details: i % 4 === 3 ? '权限不足，操作被拒绝' : `${action.name}了${resource.name}`,
      sessionId: `sess-${Math.random().toString(36).substr(2, 12)}`
    });
  }
  
  return logs;
}

/**
 * 生成权限矩阵
 */
export function generatePermissionMatrix() {
  const resources = [
    { id: 'project_view', name: '查看项目' },
    { id: 'project_edit', name: '编辑项目' },
    { id: 'project_approve', name: '审批项目' },
    { id: 'task_view', name: '查看任务' },
    { id: 'task_edit', name: '编辑任务' },
    { id: 'task_approve', name: '审批任务' },
    { id: 'data_view', name: '查看数据' },
    { id: 'data_edit', name: '编辑数据' },
    { id: 'data_export', name: '导出数据' },
    { id: 'media_view', name: '查看音视频' },
    { id: 'media_upload', name: '上传音视频' },
    { id: 'media_download', name: '下载音视频' },
    { id: 'audit_view', name: '查看审计日志' },
    { id: 'user_manage', name: '用户管理' },
    { id: 'role_manage', name: '角色管理' }
  ];
  
  const matrix = {};
  
  roles.forEach(role => {
    matrix[role.id] = {};
    resources.forEach(resource => {
      // 根据角色设置合理的权限
      const allowed = shouldHavePermission(role.id, resource.id);
      matrix[role.id][resource.id] = allowed;
    });
  });
  
  return {
    roles,
    resources,
    matrix
  };
}

/**
 * 根据角色判断是否应有权限
 */
function shouldHavePermission(roleId, resourceId) {
  const permissions = {
    pi: {
      allowed: ['project_view', 'project_edit', 'project_approve', 'task_view', 'task_edit', 'task_approve', 
                'data_view', 'data_edit', 'data_export', 'media_view', 'media_upload', 'media_download', 'audit_view'],
      denied: ['user_manage', 'role_manage']
    },
    crc: {
      allowed: ['project_view', 'task_view', 'task_edit', 'data_view', 'data_edit', 'media_view', 'media_upload'],
      denied: ['project_edit', 'project_approve', 'task_approve', 'data_export', 'media_download', 'audit_view', 'user_manage', 'role_manage']
    },
    dm: {
      allowed: ['project_view', 'task_view', 'task_edit', 'data_view', 'data_edit', 'data_export', 'media_view', 'audit_view'],
      denied: ['project_edit', 'project_approve', 'task_approve', 'media_upload', 'media_download', 'user_manage', 'role_manage']
    },
    cra: {
      allowed: ['project_view', 'task_view', 'task_edit', 'data_view', 'media_view', 'audit_view'],
      denied: ['project_edit', 'project_approve', 'task_approve', 'data_edit', 'data_export', 'media_upload', 'media_download', 'user_manage', 'role_manage']
    },
    sa: {
      allowed: ['project_view', 'task_view', 'data_view', 'data_export', 'media_view', 'audit_view'],
      denied: ['project_edit', 'project_approve', 'project_edit', 'task_edit', 'task_approve', 'data_edit', 'media_upload', 'media_download', 'user_manage', 'role_manage']
    }
  };
  
  const rolePerm = permissions[roleId];
  if (rolePerm) {
    if (rolePerm.allowed.includes(resourceId)) return true;
    if (rolePerm.denied.includes(resourceId)) return false;
  }
  
  // 默认拒绝
  return false;
}

/**
 * 生成随机模拟事件
 */
export function generateRandomEvent() {
  const eventTypes = [
    { type: 'task', action: 'status_change', message: '任务状态已更新' },
    { type: 'transcoding', action: 'complete', message: '转码任务已完成' },
    { type: 'transcoding', action: 'progress', message: '转码进度更新' },
    { type: 'trace', action: 'stage_complete', message: '追踪节点已完成' },
    { type: 'audit', action: 'new_entry', message: '新的审计记录' },
    { type: 'notification', action: 'new_comment', message: '收到新评论' }
  ];
  
  const event = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  
  return {
    ...event,
    id: `evt-${Date.now()}`,
    timestamp: new Date().toISOString(),
    data: {
      taskId: `task-${String(Math.floor(Math.random() * 24) + 1).padStart(4, '0')}`,
      projectId: `proj-${String(Math.floor(Math.random() * 10) + 1).padStart(3, '0')}`
    }
  };
}
