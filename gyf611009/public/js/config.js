function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return `h_${Math.abs(hash).toString(16)}`;
}
const WINES = [
    {
        blindId: 'A01',
        realName: 'Château Margaux',
        realProducer: 'Château Margaux',
        realVintage: 2015,
        sipLimit: 5,
    },
    {
        blindId: 'A02',
        realName: 'Penfolds Grange',
        realProducer: 'Penfolds',
        realVintage: 2018,
        sipLimit: 5,
    },
    {
        blindId: 'A03',
        realName: 'Opus One',
        realProducer: 'Opus One Winery',
        realVintage: 2019,
        sipLimit: 5,
    },
    {
        blindId: 'A04',
        realName: 'Domaine de la Romanée-Conti',
        realProducer: 'DRC',
        realVintage: 2017,
        sipLimit: 5,
    },
    {
        blindId: 'A05',
        realName: 'Vega Sicilia Único',
        realProducer: 'Vega Sicilia',
        realVintage: 2012,
        sipLimit: 5,
    },
    {
        blindId: 'A06',
        realName: 'Sassicaia',
        realProducer: 'Tenuta San Guido',
        realVintage: 2016,
        sipLimit: 5,
    },
];
const SUPERVISORS = [
    { id: 'sv_001', name: '王监审', pinHash: simpleHash('1234') },
    { id: 'sv_002', name: '李监审', pinHash: simpleHash('5678') },
];
const JUDGES = [
    { id: 'jg_001', name: '张评委', seatNumber: 1 },
    { id: 'jg_002', name: '陈评委', seatNumber: 2 },
    { id: 'jg_003', name: '刘评委', seatNumber: 3 },
    { id: 'jg_004', name: '赵评委', seatNumber: 4 },
    { id: 'jg_005', name: '钱评委', seatNumber: 5 },
    { id: 'jg_006', name: '孙评委', seatNumber: 6 },
];
export const DEFAULT_CONFIG = {
    competitionName: '2026 年度中国精品酒庄盲品大赛',
    sipLimitPerWine: 5,
    maxScorePerDimension: 25,
    supervisors: SUPERVISORS,
    wines: WINES,
    judges: JUDGES,
    sensorEnabled: false,
    sensorTolerance: 5,
};
export function verifyPin(supervisorId, pin) {
    const sv = SUPERVISORS.find((s) => s.id === supervisorId);
    if (!sv)
        return false;
    return sv.pinHash === simpleHash(pin);
}
//# sourceMappingURL=config.js.map