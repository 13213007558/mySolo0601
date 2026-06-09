/**
 * 模拟数据生成器
 * 文化遗产数字化与数字藏品领域专用数据集
 * 为前端状态模拟提供真实感的业务数据
 */

// 文化遗产相关任务名称库
const culturalHeritageTasks = [
  '甲骨文特征提取训练',
  '敦煌壁画风格迁移推理',
  '青铜器3D纹理重建',
  '书法作品真伪鉴别',
  '古代瓷器断代分析',
  '古建筑构件识别',
  '古文字语义理解',
  '壁画病害检测',
  '文物数字化修复',
  '数字藏品版权追踪',
  '非遗技艺动作捕捉',
  '古代服饰复原渲染',
  '考古遗址三维重建',
  '古籍文献OCR识别',
  '壁画颜料成分分析',
  '青铜器铭文解读',
  '玉器微痕鉴定',
  '古建筑木结构检测',
  '古地图数字化校准',
  '传统音乐频谱分析'
];

// 边缘节点名称库
const edgeNodeNames = [
  '北京-故宫边缘节点',
  '西安-兵马俑边缘节点',
  '敦煌-莫高窟边缘节点',
  '洛阳-龙门石窟边缘节点',
  '南京-明孝陵边缘节点',
  '成都-三星堆边缘节点',
  '杭州-良渚边缘节点',
  '安阳-殷墟边缘节点',
  '大同-云冈石窟边缘节点',
  '天水-麦积山边缘节点',
  '上海-博物馆计算中心',
  '广州-南越王边缘节点',
  '武汉-楚文化边缘节点',
  '济南-龙山文化边缘节点',
  '郑州-商城遗址边缘节点'
];

// 失败原因库
const failureReasons = [
  '边缘节点网络超时',
  '硬件加密模块通信中断',
  '数据脱敏校验未通过',
  '联邦聚合计算节点失联',
  '安全边界越权访问拦截',
  '内存资源不足导致OOM',
  'GPU算力分配冲突',
  '数字藏品版权校验失败',
  '文化遗产数据权限不足',
  '密钥轮换期间服务中断',
  '梯度爆炸导致训练发散',
  '本地数据隐私等级不匹配'
];

// 数据敏感度等级
const sensitivityLevels = ['绝密', '机密', '秘密', '内部'];

// 任务优先级
const priorityLevels = ['critical', 'high', 'normal', 'low'];

// 生成唯一ID
function generateId(prefix) {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${year}-${random}`;
}

// 生成随机时间字符串
function randomTime() {
  const now = new Date();
  const offset = Math.floor(Math.random() * 3600000); // 1小时内
  const time = new Date(now.getTime() - offset);
  return time.toLocaleTimeString('zh-CN', { hour12: false });
}

// 生成随机日期时间
function randomDateTime() {
  const now = new Date();
  const offset = Math.floor(Math.random() * 86400000); // 24小时内
  return new Date(now.getTime() - offset).toISOString();
}

// 选择随机元素
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 生成执行轨迹
function generateExecutionTrace(status, retryCount) {
  const traces = [];
  const nodes = edgeNodeNames.slice(0, 5);
  
  traces.push({
    time: randomTime(),
    action: '任务启动',
    node: pickRandom(nodes),
    status: 'success'
  });
  
  traces.push({
    time: randomTime(),
    action: '数据加密传输',
    node: traces[0].node,
    status: 'success'
  });
  
  if (status === 'timeout' || status === 'failed') {
    traces.push({
      time: randomTime(),
      action: '联邦聚合计算',
      node: pickRandom(nodes.filter(n => n !== traces[0].node)),
      status: 'timeout'
    });
    
    for (let i = 1; i <= retryCount; i++) {
      traces.push({
        time: randomTime(),
        action: `自动重试第${i}次`,
        node: pickRandom(nodes),
        status: i < retryCount ? 'timeout' : 'pending'
      });
    }
  }
  
  return traces;
}

// 生成异常任务
export function generateAnomalyTask(status) {
  const retryCount = status === 'manual_intervention_required' ? 3 : Math.floor(Math.random() * 2) + 1;
  
  return {
    id: generateId('AT'),
    type: pickRandom(['federated_training', 'inference', 'data_processing', 'model_aggregation']),
    name: pickRandom(culturalHeritageTasks),
    status: status,
    retryCount: retryCount,
    maxRetries: 3,
    failedReason: pickRandom(failureReasons),
    timeoutAt: randomDateTime(),
    priority: pickRandom(priorityLevels),
    dataSensitivity: pickRandom(sensitivityLevels),
    executionTrace: generateExecutionTrace(status, retryCount),
    createdAt: randomDateTime(),
    assignedNode: pickRandom(edgeNodeNames)
  };
}

// 生成推理任务
export function generateInferenceTask(queueType) {
  const task = {
    id: generateId('INF'),
    name: pickRandom(culturalHeritageTasks.filter(t => t.includes('推理') || t.includes('鉴别') || t.includes('分析') || t.includes('检测'))),
    priority: pickRandom(priorityLevels),
    sensitivity: pickRandom(sensitivityLevels),
    createdAt: randomDateTime()
  };
  
  if (queueType === 'queued') {
    task.eta = `${Math.floor(Math.random() * 30) + 5}s`;
    task.position = Math.floor(Math.random() * 10) + 1;
  } else if (queueType === 'running') {
    task.progress = Math.floor(Math.random() * 80) + 10;
    task.node = pickRandom(edgeNodeNames).split('边缘节点')[0] + '-' + String(Math.floor(Math.random() * 20) + 1).padStart(2, '0');
    task.latency = `${Math.floor(Math.random() * 50) + 10}ms`;
    task.startedAt = randomDateTime();
  } else if (queueType === 'completed') {
    task.result = `${(Math.random() * 20 + 80).toFixed(1)}% 置信度`;
    task.duration = `${(Math.random() * 8 + 1).toFixed(1)}s`;
    task.completedAt = randomDateTime();
    task.success = Math.random() > 0.1;
  }
  
  return task;
}

// 生成边缘节点状态
export function generateEdgeNode() {
  const load = Math.floor(Math.random() * 100);
  const status = load > 90 ? 'warning' : (load < 20 ? 'idle' : 'healthy');
  
  return {
    id: 'edge-' + String(Math.floor(Math.random() * 900) + 100),
    name: pickRandom(edgeNodeNames),
    load: load,
    latency: Math.floor(Math.random() * 40) + 10,
    throughput: Math.floor(Math.random() * 1000) + 500,
    status: status,
    cpuUsage: Math.floor(Math.random() * 100),
    memoryUsage: Math.floor(Math.random() * 100),
    gpuUsage: Math.floor(Math.random() * 100),
    activeTasks: Math.floor(Math.random() * 15),
    location: pickRandom(['北京', '西安', '敦煌', '洛阳', '南京', '成都', '杭州'])
  };
}

// 生成RL调度决策
export function generateRLDecision() {
  const actions = [
    `将 ${Math.floor(Math.random() * 10) + 1}% 算力从 ${pickRandom(['DH', 'BJ', 'SH', 'GZ', 'XA'])} 节点转移至 ${pickRandom(['DH', 'BJ', 'SH', 'GZ', 'XA'])} 节点`,
    `提升 ${pickRandom(['BJ', 'SH', 'GZ', 'XA'])} 节点带宽配额 ${Math.floor(Math.random() * 15) + 5}%`,
    `调整 ${pickRandom(['BJ', 'SH', 'GZ', 'XA', 'DH'])} 节点存储优先级`,
    `触发 ${pickRandom(['BJ', 'SH', 'GZ', 'XA'])} 节点算力弹性扩容`,
    `优化 ${pickRandom(['推理任务', '训练任务', '聚合任务'])} 调度权重`
  ];
  
  const reasons = [
    '节点负载过高',
    '推理任务队列积压',
    '预测未来15分钟流量增长',
    '发现更优资源配置',
    '满足低延迟SLA要求',
    '平衡区域算力分布'
  ];
  
  return {
    time: randomTime(),
    action: pickRandom(actions),
    reason: pickRandom(reasons),
    reward: `+${(Math.random() * 5).toFixed(1)}`
  };
}

// 生成安全告警
export function generateSecurityAlert() {
  const types = [
    { type: 'suspicious_access', label: '可疑访问' },
    { type: 'boundary_violation', label: '边界越权' },
    { type: 'encryption_failure', label: '加密异常' },
    { type: 'key_rotation_alert', label: '密钥告警' },
    { type: 'data_leakage_risk', label: '泄露风险' }
  ];
  
  const sources = [
    '192.168.1.' + Math.floor(Math.random() * 255),
    '10.0.0.' + Math.floor(Math.random() * 255),
    '内部运维',
    '第三方API',
    '未知外部IP'
  ];
  
  const targets = [
    '甲骨文数据集',
    '敦煌壁画高清影像库',
    '青铜器3D模型库',
    '数字藏品版权管理',
    '联邦学习梯度数据',
    '用户隐私数据集'
  ];
  
  const typeInfo = pickRandom(types);
  const risk = pickRandom(['high', 'medium', 'low']);
  
  return {
    id: generateId('SEC'),
    time: randomTime(),
    type: typeInfo.type,
    typeLabel: typeInfo.label,
    source: pickRandom(sources),
    target: pickRandom(targets),
    risk: risk,
    status: risk === 'high' ? 'investigating' : pickRandom(['investigating', 'resolved', 'false_positive']),
    description: `${typeInfo.label}行为被检测，涉及${pickRandom(targets)}`
  };
}

// 生成数据集信息
export function generateDataset() {
  const datasetNames = [
    '甲骨文拓片数据集',
    '敦煌壁画高清影像',
    '青铜器3D扫描模型',
    '古籍文献数字化库',
    '古代建筑构件库',
    '非遗技艺视频库',
    '古代陶瓷标本库',
    '古文字字形数据库',
    '壁画病害图谱库',
    '考古遗址三维模型'
  ];
  
  return {
    id: generateId('DS'),
    name: pickRandom(datasetNames),
    items: Math.floor(Math.random() * 50000) + 1000,
    sensitivity: pickRandom(sensitivityLevels),
    authorized: Math.random() > 0.1,
    encryption: pickRandom(['AES-256', '国密SM4', '国密SM9', 'AES-128']),
    size: `${(Math.random() * 1000 + 100).toFixed(1)} GB`,
    updatedAt: randomDateTime(),
    provider: pickRandom(['故宫博物院', '敦煌研究院', '国家博物馆', '上海博物馆', '陕西历史博物馆'])
  };
}

// 生成训练任务
export function generateTrainingTask() {
  const taskNames = [
    '文物自动分类模型',
    '风格迁移生成模型',
    '图像修复对抗网络',
    '古文字识别模型',
    '病害检测分割模型',
    '三维重建神经网络',
    '版权追踪哈希模型',
    '真伪鉴别特征提取器'
  ];
  
  const statuses = ['training', 'paused', 'completed', 'failed'];
  const status = pickRandom(statuses);
  
  return {
    id: generateId('TR'),
    name: pickRandom(taskNames),
    progress: status === 'completed' ? 100 : (status === 'failed' ? Math.floor(Math.random() * 50) : Math.floor(Math.random() * 80) + 10),
    status: status,
    participants: Math.floor(Math.random() * 20) + 3,
    rounds: Math.floor(Math.random() * 100) + 10,
    currentRound: Math.floor(Math.random() * 50) + 1,
    accuracy: (Math.random() * 20 + 75).toFixed(2),
    startedAt: randomDateTime(),
    estimatedCompletion: status === 'training' ? `${Math.floor(Math.random() * 24) + 1}小时` : '已完成'
  };
}

// 生成完整的初始状态
export function generateInitialState() {
  return {
    overview: {
      totalNodes: 128,
      activeNodes: 115,
      totalTasks: 1024,
      successRate: 94.7,
      avgLatency: 23,
      securityAlerts: 3,
      uptime: '99.97%',
      dataProcessed: '12.8 TB'
    },
    
    anomalyTasks: [
      generateAnomalyTask('retry_pending'),
      generateAnomalyTask('manual_intervention_required'),
      generateAnomalyTask('timeout'),
      generateAnomalyTask('failed'),
      generateAnomalyTask('retry_pending'),
      generateAnomalyTask('manual_intervention_required'),
      generateAnomalyTask('recovered'),
      generateAnomalyTask('terminated')
    ],
    
    inferenceTasks: {
      queued: Array.from({ length: 5 }, () => generateInferenceTask('queued')),
      running: Array.from({ length: 3 }, () => generateInferenceTask('running')),
      completed: Array.from({ length: 4 }, () => generateInferenceTask('completed'))
    },
    
    edgeNodes: Array.from({ length: 8 }, () => generateEdgeNode()),
    
    rlBrain: {
      currentPolicy: pickRandom(['optimize_latency', 'optimize_throughput', 'balance_load', 'minimize_cost']),
      explorationRate: (Math.random() * 0.2 + 0.05).toFixed(2),
      totalReward: Math.floor(Math.random() * 200 + 700),
      rewardHistory: Array.from({ length: 12 }, (_, i) => Math.floor(700 + i * 10 + Math.random() * 20)),
      resourceAllocation: {
        compute: { '节点-BJ': 25, '节点-SH': 20, '节点-GZ': 18, '节点-XA': 22, '节点-DH': 15 },
        bandwidth: { '节点-BJ': 30, '节点-SH': 25, '节点-GZ': 20, '节点-XA': 15, '节点-DH': 10 },
        storage: { '节点-BJ': 20, '节点-SH': 22, '节点-GZ': 28, '节点-XA': 18, '节点-DH': 12 }
      },
      recentDecisions: Array.from({ length: 6 }, () => generateRLDecision())
    },
    
    security: {
      accessAttempts: Math.floor(Math.random() * 5000 + 1000),
      blockedAttempts: Math.floor(Math.random() * 20 + 1),
      encryptionStatus: 'active',
      hsmStatus: 'healthy',
      keyRotationStatus: 'normal',
      lastKeyRotation: randomDateTime(),
      recentAlerts: [
        generateSecurityAlert(),
        generateSecurityAlert(),
        generateSecurityAlert(),
        generateSecurityAlert(),
        generateSecurityAlert()
      ]
    },
    
    dataDomain: {
      datasets: Array.from({ length: 6 }, () => generateDataset()),
      trainingTasks: Array.from({ length: 4 }, () => generateTrainingTask()),
      totalDatasets: 156,
      totalDataSize: '256.4 TB',
      authorizedPartners: 28
    },
    
    workflow: {
      autoRetryEnabled: true,
      maxAutoRetries: 3,
      defaultTimeout: 300,
      pendingManualIntervention: 5,
      systemStatus: 'operational'
    },
    
    topology: {
      nodes: Array.from({ length: 12 }, (_, i) => ({
        id: `node-${i + 1}`,
        name: ['BJ', 'SH', 'GZ', 'XA', 'DH', 'LY', 'NJ', 'CD', 'HZ', 'AY', 'DT', 'TS'][i],
        x: 50 + (i % 4) * 200,
        y: 80 + Math.floor(i / 4) * 120,
        status: Math.random() > 0.1 ? 'healthy' : (Math.random() > 0.5 ? 'warning' : 'offline'),
        load: Math.floor(Math.random() * 100)
      })),
      connections: [
        { from: 'node-1', to: 'node-2', active: true },
        { from: 'node-1', to: 'node-3', active: true },
        { from: 'node-2', to: 'node-4', active: true },
        { from: 'node-2', to: 'node-5', active: Math.random() > 0.2 },
        { from: 'node-3', to: 'node-6', active: true },
        { from: 'node-4', to: 'node-7', active: true },
        { from: 'node-5', to: 'node-8', active: Math.random() > 0.3 },
        { from: 'node-6', to: 'node-9', active: true },
        { from: 'node-1', to: 'node-4', active: false },
        { from: 'node-3', to: 'node-5', active: true }
      ]
    }
  };
}

// 生成新的随机事件（用于实时更新模拟）
export function generateRandomEvent() {
  const eventTypes = ['task_timeout', 'task_recovered', 'new_alert', 'node_warning', 'rl_decision', 'inference_completed'];
  const type = pickRandom(eventTypes);
  
  switch (type) {
    case 'task_timeout':
      return { type, data: generateAnomalyTask('timeout') };
    case 'task_recovered':
      return { type, data: { taskId: generateId('AT'), message: '任务自动恢复成功' } };
    case 'new_alert':
      return { type, data: generateSecurityAlert() };
    case 'node_warning':
      return { type, data: { nodeId: 'edge-' + Math.floor(Math.random() * 100), message: '节点负载超过阈值' } };
    case 'rl_decision':
      return { type, data: generateRLDecision() };
    case 'inference_completed':
      return { type, data: generateInferenceTask('completed') };
    default:
      return { type: 'unknown', data: {} };
  }
}
