import type { Athlete } from '../types';

export const ATHLETES: Athlete[] = [
  { id: 'ath-001', name: '林小雪',    country: '中国',   flag: '🇨🇳', isuId: 'ISU-CHN-0021', bladeQr: 'BLD-CHN-001-08', suspension: [] },
  { id: 'ath-002', name: '张雨婷',    country: '中国',   flag: '🇨🇳', isuId: 'ISU-CHN-0033', bladeQr: 'BLD-CHN-002-08', suspension: [
    { startDate: '2026-01-10', endDate: '2026-06-30', reason: '赛外兴奋剂检测阳性', status: 'active' }
  ]},
  { id: 'ath-003', name: '曲春雨',    country: '中国',   flag: '🇨🇳', isuId: 'ISU-CHN-0045', bladeQr: 'BLD-CHN-003-08', suspension: [] },
  { id: 'ath-004', name: '范可新',    country: '中国',   flag: '🇨🇳', isuId: 'ISU-CHN-0057', bladeQr: 'BLD-CHN-004-08', suspension: [] },
  { id: 'ath-005', name: 'Suzanne Schulting', country: '荷兰', flag: '🇳🇱', isuId: 'ISU-NED-0112', bladeQr: 'BLD-NED-011-08', suspension: [] },
  { id: 'ath-006', name: 'Xandra Velzeboer', country: '荷兰', flag: '🇳🇱', isuId: 'ISU-NED-0128', bladeQr: 'BLD-NED-012-08', suspension: [] },
  { id: 'ath-007', name: '崔敏静 (Choi Min-jeong)', country: '韩国', flag: '🇰🇷', isuId: 'ISU-KOR-0203', bladeQr: 'BLD-KOR-020-08', suspension: [] },
  { id: 'ath-008', name: '金雅朗 (Kim A-lang)',   country: '韩国', flag: '🇰🇷', isuId: 'ISU-KOR-0215', bladeQr: 'BLD-KOR-021-08', suspension: [] },
  { id: 'ath-009', name: 'Sofia Prosvirnova',  country: '俄罗斯', flag: '🇷🇺', isuId: 'ISU-RUS-0301', bladeQr: 'BLD-RUS-030-08', suspension: [] },
  { id: 'ath-010', name: 'Emma Kim Boutin',         country: '加拿大', flag: '🇨🇦', isuId: 'ISU-CAN-0402', bladeQr: 'BLD-CAN-040-08', suspension: [] },
  { id: 'ath-011', name: 'Florence Brunelle',      country: '加拿大', flag: '🇨🇦', isuId: 'ISU-CAN-0418', bladeQr: 'BLD-CAN-041-08', suspension: [] },
  { id: 'ath-012', name: '武大靖',     country: '中国',   flag: '🇨🇳', isuId: 'ISU-CHN-0069', bladeQr: 'BLD-CHN-005-08', suspension: [] }
];

export const ATHLETES_BY_QR: Record<string, Athlete> = ATHLETES.reduce((acc, a) => {
  acc[a.bladeQr] = a;
  return acc;
}, {} as Record<string, Athlete>);
