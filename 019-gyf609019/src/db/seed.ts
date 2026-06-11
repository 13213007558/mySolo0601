const photoBase = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image';

const evidencePhotos = {
  a1: `${photoBase}?prompt=roof%20puddle%20water%20after%20rain%20on%20concrete%20surface%20standing%20water%20drainage%20issue&image_size=landscape_4_3`,
  a2: `${photoBase}?prompt=flat%20roof%20water%20accumulation%20rain%20damage%20construction%20inspection&image_size=landscape_4_3`,
  b1: `${photoBase}?prompt=large%20area%20standing%20water%20on%20flat%20roof%20drainage%20problem%20aerial%20view&image_size=landscape_4_3`,
  b2: `${photoBase}?prompt=roof%20drain%20outlet%20blocked%20clogged%20water%20overflow%20building%20maintenance&image_size=landscape_4_3`,
  c1: `${photoBase}?prompt=slight%20water%20ponding%20on%20terrace%20roof%20minor%20drainage%20issue&image_size=landscape_4_3`,
  c2: `${photoBase}?prompt=roof%20terrace%20early%20stage%20water%20accumulation%20construction%20record&image_size=landscape_4_3`,
};

export const seedData = {
  zones: [
    {
      id: 'zone-a',
      name: 'A区-主屋面',
      drainageDirection: 'S' as const,
      minSlopePercent: 2,
      gridRows: 2,
      gridCols: 3,
      gridSpacingMm: 1000,
    },
    {
      id: 'zone-b',
      name: 'B区-裙楼屋面',
      drainageDirection: 'E' as const,
      minSlopePercent: 1.5,
      gridRows: 3,
      gridCols: 3,
      gridSpacingMm: 1000,
    },
    {
      id: 'zone-c',
      name: 'C区-露台',
      drainageDirection: 'N' as const,
      minSlopePercent: 2,
      gridRows: 2,
      gridCols: 2,
      gridSpacingMm: 1000,
    },
  ],

  measurePoints: [
    { id: 'mp-a-00', zoneId: 'zone-a', row: 0, col: 0, elevationMm: 30, isSupplemented: false, createdAt: '2024-05-20T08:00:00Z', label: 'A1' },
    { id: 'mp-a-01', zoneId: 'zone-a', row: 0, col: 1, elevationMm: 25, isSupplemented: false, createdAt: '2024-05-20T08:05:00Z', label: 'A2' },
    { id: 'mp-a-02', zoneId: 'zone-a', row: 0, col: 2, elevationMm: 20, isSupplemented: false, createdAt: '2024-05-20T08:10:00Z', label: 'A3' },
    { id: 'mp-a-10', zoneId: 'zone-a', row: 1, col: 0, elevationMm: 28, isSupplemented: false, createdAt: '2024-05-20T08:15:00Z', label: 'A4' },
    { id: 'mp-a-11', zoneId: 'zone-a', row: 1, col: 1, elevationMm: 22, isSupplemented: true, createdAt: '2024-05-25T10:00:00Z', label: 'A5' },
    { id: 'mp-a-12', zoneId: 'zone-a', row: 1, col: 2, elevationMm: 16, isSupplemented: false, createdAt: '2024-05-20T08:25:00Z', label: 'A6' },

    { id: 'mp-b-00', zoneId: 'zone-b', row: 0, col: 0, elevationMm: 40, isSupplemented: false, createdAt: '2024-05-18T09:00:00Z', label: 'B1' },
    { id: 'mp-b-01', zoneId: 'zone-b', row: 0, col: 1, elevationMm: 22, isSupplemented: false, createdAt: '2024-05-18T09:05:00Z', label: 'B2' },
    { id: 'mp-b-02', zoneId: 'zone-b', row: 0, col: 2, elevationMm: 18, isSupplemented: false, createdAt: '2024-05-18T09:10:00Z', label: 'B3' },
    { id: 'mp-b-10', zoneId: 'zone-b', row: 1, col: 0, elevationMm: 38, isSupplemented: false, createdAt: '2024-05-18T09:15:00Z', label: 'B4' },
    { id: 'mp-b-11', zoneId: 'zone-b', row: 1, col: 1, elevationMm: 20, isSupplemented: true, createdAt: '2024-05-22T14:00:00Z', label: 'B5' },
    { id: 'mp-b-12', zoneId: 'zone-b', row: 1, col: 2, elevationMm: 16, isSupplemented: false, createdAt: '2024-05-18T09:25:00Z', label: 'B6' },
    { id: 'mp-b-20', zoneId: 'zone-b', row: 2, col: 0, elevationMm: 36, isSupplemented: false, createdAt: '2024-05-18T09:30:00Z', label: 'B7' },
    { id: 'mp-b-21', zoneId: 'zone-b', row: 2, col: 1, elevationMm: 18, isSupplemented: true, createdAt: '2024-05-22T14:05:00Z', label: 'B8' },
    { id: 'mp-b-22', zoneId: 'zone-b', row: 2, col: 2, elevationMm: 14, isSupplemented: false, createdAt: '2024-05-18T09:40:00Z', label: 'B9' },

    { id: 'mp-c-00', zoneId: 'zone-c', row: 0, col: 0, elevationMm: 35, isSupplemented: false, createdAt: '2024-05-22T10:00:00Z', label: 'C1' },
    { id: 'mp-c-01', zoneId: 'zone-c', row: 0, col: 1, elevationMm: null, isSupplemented: false, createdAt: '2024-05-22T10:05:00Z', label: 'C2' },
    { id: 'mp-c-10', zoneId: 'zone-c', row: 1, col: 0, elevationMm: 15, isSupplemented: false, createdAt: '2024-05-22T10:10:00Z', label: 'C3' },
    { id: 'mp-c-11', zoneId: 'zone-c', row: 1, col: 1, elevationMm: 12, isSupplemented: false, createdAt: '2024-05-22T10:15:00Z', label: 'C4' },
  ],

  evidences: [
    { id: 'ev-a1', zoneId: 'zone-a', photoUrl: evidencePhotos.a1, description: 'A区东南角积水深度约2cm，雨后2小时仍未排尽', timestamp: '2024-06-01T16:30:00Z', isSupplemented: false },
    { id: 'ev-a2', zoneId: 'zone-a', photoUrl: evidencePhotos.a2, description: '补录：A区中部雨后积水照片，积水面积较大', timestamp: '2024-05-28T15:00:00Z', isSupplemented: true },
    { id: 'ev-b1', zoneId: 'zone-b', photoUrl: evidencePhotos.b1, description: 'B区西侧大面积积水，约3㎡', timestamp: '2024-06-02T17:00:00Z', isSupplemented: false },
    { id: 'ev-b2', zoneId: 'zone-b', photoUrl: evidencePhotos.b2, description: 'B区北侧排水口堵塞，水流无法排出', timestamp: '2024-06-03T09:30:00Z', isSupplemented: false },
    { id: 'ev-c1', zoneId: 'zone-c', photoUrl: evidencePhotos.c1, description: 'C区西侧轻微积水，雨后1小时基本排尽', timestamp: '2024-06-05T16:00:00Z', isSupplemented: false },
    { id: 'ev-c2', zoneId: 'zone-c', photoUrl: evidencePhotos.c2, description: '补录：C区早期积水记录，当时未及时拍照留存', timestamp: '2024-05-30T14:00:00Z', isSupplemented: true },
  ],

  suggestions: [
    { id: 'sug-a', zoneId: 'zone-a', currentContent: 'A区东南角坡度不足，建议重新找坡。补充：中部区域同样存在找坡问题，需一并处理。具体措施：\n1. A1-A4纵向坡度仅0.2%，远低于2%要求，需重新施工找坡层\n2. A5为补测点，补测后确认中部横向坡度也不达标\n3. 建议整体铲除找坡层，按2%最低坡度重新施工\n4. 排水口附近局部坡度可加大至3%加速排水', updatedAt: '2024-06-04T10:00:00Z' },
    { id: 'sug-b', zoneId: 'zone-b', currentContent: 'B区全面返工找坡层，西侧坡度调整为≥2%，北侧增设排水口并疏通现有排水口。具体措施：\n1. B1-B4-B7西侧纵向坡度仅0.2%，需重新施工\n2. B2-B5-B8中部存在坡度突变（18mm→2mm/m），需调整过渡\n3. 北侧排水口已堵塞，需疏通并增设一个排水口\n4. 建议找坡方向统一为向东，坡度≥1.5%', updatedAt: '2024-06-05T14:00:00Z' },
    { id: 'sug-c', zoneId: 'zone-c', currentContent: 'C区东侧测点缺失，暂无法完整评估。西侧坡度2.0%刚好达标，建议局部修正。具体措施：\n1. C2测点数据缺失，需尽快补测\n2. C3-C4横向坡度0.3%，不满足2%要求\n3. C1-C3纵向坡度2.0%刚达标，建议适当加大\n4. 待C2补测完成后重新评估整体找坡方案', updatedAt: '2024-06-06T09:00:00Z' },
  ],

  suggestionVersions: [
    { id: 'sv-a1', suggestionId: 'sug-a', content: 'A区东南角坡度不足，建议重新找坡。', versionNumber: 1, createdAt: '2024-06-01T18:00:00Z', changeNote: '初次建议' },
    { id: 'sv-a2', suggestionId: 'sug-a', content: 'A区东南角坡度不足，建议重新找坡。补充：中部区域同样存在找坡问题，需一并处理。具体措施：\n1. A1-A4纵向坡度仅0.2%，远低于2%要求，需重新施工找坡层\n2. A5为补测点，补测后确认中部横向坡度也不达标\n3. 建议整体铲除找坡层，按2%最低坡度重新施工\n4. 排水口附近局部坡度可加大至3%加速排水', versionNumber: 2, createdAt: '2024-06-04T10:00:00Z', changeNote: '补测后更新，增加中部区域处理建议' },

    { id: 'sv-b1', suggestionId: 'sug-b', content: 'B区西侧需调整排水方向。', versionNumber: 1, createdAt: '2024-06-02T18:00:00Z', changeNote: '初次建议' },
    { id: 'sv-b2', suggestionId: 'sug-b', content: 'B区西侧需调整排水方向，北侧排水口需疏通。', versionNumber: 2, createdAt: '2024-06-03T10:00:00Z', changeNote: '增加排水口疏通建议' },
    { id: 'sv-b3', suggestionId: 'sug-b', content: 'B区全面返工找坡层，西侧坡度调整为≥2%，北侧增设排水口并疏通现有排水口。具体措施：\n1. B1-B4-B7西侧纵向坡度仅0.2%，需重新施工\n2. B2-B5-B8中部存在坡度突变（18mm→2mm/m），需调整过渡\n3. 北侧排水口已堵塞，需疏通并增设一个排水口\n4. 建议找坡方向统一为向东，坡度≥1.5%', versionNumber: 3, createdAt: '2024-06-05T14:00:00Z', changeNote: '全面返工方案，增加具体施工措施' },

    { id: 'sv-c1', suggestionId: 'sug-c', content: 'C区需补全测点数据后评估。', versionNumber: 1, createdAt: '2024-06-05T18:00:00Z', changeNote: '初次建议' },
    { id: 'sv-c2', suggestionId: 'sug-c', content: 'C区东侧测点缺失，暂无法完整评估。西侧坡度2.0%刚好达标，建议局部修正。具体措施：\n1. C2测点数据缺失，需尽快补测\n2. C3-C4横向坡度0.3%，不满足2%要求\n3. C1-C3纵向坡度2.0%刚达标，建议适当加大\n4. 待C2补测完成后重新评估整体找坡方案', versionNumber: 2, createdAt: '2024-06-06T09:00:00Z', changeNote: '增加西侧评估和局部修正建议' },
  ],
};
