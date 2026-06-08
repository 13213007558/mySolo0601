export const sampleUsers = [
  {
    id: 'reception_001',
    name: '张前台',
    role: 'reception' as const,
    username: 'zhangqiantai'
  },
  {
    id: 'therapist_001',
    name: '李治疗师',
    role: 'therapist' as const,
    username: 'lizhiliaoshi'
  },
  {
    id: 'therapist_002',
    name: '王治疗师',
    role: 'therapist' as const,
    username: 'wangzhiliaoshi'
  },
  {
    id: 'supervisor_001',
    name: '刘主管',
    role: 'supervisor' as const,
    username: 'liuzhuguan'
  }
];

export const sampleChildren = [
  {
    name: '小明',
    birthDate: '2022-03-15',
    guardianName: '明爸爸',
    guardianPhone: '13800138001',
    balance: 5000
  },
  {
    name: '小红',
    birthDate: '2023-06-20',
    guardianName: '红妈妈',
    guardianPhone: '13800138002',
    balance: 3200
  },
  {
    name: '小刚',
    birthDate: '2021-11-08',
    guardianName: '刚爸爸',
    guardianPhone: '13800138003',
    balance: 800
  },
  {
    name: '小美',
    birthDate: '2022-09-12',
    guardianName: '美妈妈',
    guardianPhone: '13800138004',
    balance: 6500
  }
];

export const sampleCourses = [
  {
    name: '运动康复课',
    price: 300,
    durationMinutes: 45,
    type: 'rehabilitation' as const
  },
  {
    name: '感统训练课',
    price: 280,
    durationMinutes: 45,
    type: 'rehabilitation' as const
  },
  {
    name: '口腔清洁护理',
    price: 150,
    durationMinutes: 30,
    type: 'cleaning' as const
  },
  {
    name: '能力评估',
    price: 500,
    durationMinutes: 60,
    type: 'evaluation' as const
  }
];

export const generateSampleSchedules = (baseDate: string = '2026-06-08') => {
  const dates = [
    `${baseDate}T09:00:00.000Z`,
    `${baseDate}T10:00:00.000Z`,
    `${baseDate}T11:00:00.000Z`,
    `${baseDate}T14:00:00.000Z`,
    `${baseDate}T15:00:00.000Z`,
    `${baseDate}T16:00:00.000Z`
  ];

  return [
    {
      childIndex: 0,
      courseIndex: 0,
      therapistId: 'therapist_001',
      scheduledAt: dates[0],
      status: 'completed' as const,
      isManualEntry: false,
      photos: [
        { isMissing: false },
        { isMissing: false },
        { isMissing: false }
      ],
      feedback: '今天小明表现很好，完成了全部训练项目。平衡能力有明显提升，建议下周增加难度。'
    },
    {
      childIndex: 1,
      courseIndex: 1,
      therapistId: 'therapist_002',
      scheduledAt: dates[1],
      status: 'completed' as const,
      isManualEntry: false,
      photos: [
        { isMissing: false },
        { isMissing: true },
        { isMissing: false }
      ],
      feedback: '小红注意力不太集中，只完成了一半项目。需要家长配合在家练习专注力。'
    },
    {
      childIndex: 2,
      courseIndex: 0,
      therapistId: 'therapist_001',
      scheduledAt: dates[2],
      status: 'completed' as const,
      isManualEntry: false,
      photos: [
        { isMissing: false },
        { isMissing: true },
        { isMissing: true }
      ],
      feedback: '小刚今天情绪不好，训练配合度较低。下次建议家长提前来熟悉环境。'
    },
    {
      childIndex: 3,
      courseIndex: 2,
      therapistId: 'therapist_002',
      scheduledAt: dates[3],
      status: 'completed' as const,
      isManualEntry: false,
      photos: [
        { isMissing: true },
        { isMissing: true },
        { isMissing: true }
      ],
      feedback: '小美口腔清洁做得很好，牙齿状况有改善。继续保持良好的刷牙习惯。'
    },
    {
      childIndex: 0,
      courseIndex: 2,
      therapistId: 'therapist_001',
      scheduledAt: dates[4],
      status: 'completed' as const,
      isManualEntry: true,
      manualEntryReason: '前台补录：昨天系统故障未录入，已核实课程确实完成，有治疗师签字确认。',
      photos: [
        { isMissing: false },
        { isMissing: false },
        { isMissing: false }
      ],
      feedback: '小明口腔清洁配合度高，学会了正确的刷牙方法。表扬！'
    },
    {
      childIndex: 1,
      courseIndex: 3,
      therapistId: 'therapist_002',
      scheduledAt: dates[5],
      status: 'completed' as const,
      isManualEntry: false,
      photos: [
        { isMissing: false },
        { isMissing: false },
        { isMissing: false }
      ],
      feedback: '评估完成。小红大运动发育正常，精细动作稍弱，建议每周增加2次手工训练。'
    }
  ];
};

export const SAMPLE_DATA_FILE = 'sample_rehabilitation_data_v1.json';
