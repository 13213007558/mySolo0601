function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
function speakScore(left, right) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window))
        return;
    const text = `${left} 比 ${right}`;
    try {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'zh-CN';
        utter.rate = 1.1;
        utter.pitch = 1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
    }
    catch (_a) {
        /* noop */
    }
}
function speakCard(type, side) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window))
        return;
    const map = {
        yellow: '黄牌',
        red: '红牌',
        black: '黑牌',
    };
    const sideText = side === 'left' ? '左方' : '右方';
    try {
        const utter = new SpeechSynthesisUtterance(`${sideText}${map[type]}`);
        utter.lang = 'zh-CN';
        utter.rate = 1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
    }
    catch (_a) {
        /* noop */
    }
}
function buildFIEXml(state) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4;
    const now = new Date().toISOString();
    const builder = [];
    builder.push('<?xml version="1.0" encoding="UTF-8"?>');
    builder.push('<FIE_BOUT_RESULT xmlns="http://www.fie.org/schemas/bout/1.0">');
    builder.push(`  <BOUT_ID>${((_a = state.config) === null || _a === void 0 ? void 0 : _a.id) || uid()}</BOUT_ID>`);
    builder.push(`  <COMPETITION>${escapeXml(((_b = state.config) === null || _b === void 0 ? void 0 : _b.competitionName) || '')}</COMPETITION>`);
    builder.push(`  <EVENT>${escapeXml(((_c = state.config) === null || _c === void 0 ? void 0 : _c.event) || '')}</EVENT>`);
    builder.push(`  <ROUND>${escapeXml(((_d = state.config) === null || _d === void 0 ? void 0 : _d.round) || '')}</ROUND>`);
    builder.push(`  <STRIP>${((_e = state.config) === null || _e === void 0 ? void 0 : _e.stripNumber) || 1}</STRIP>`);
    builder.push(`  <STARTED_AT>${state.startedAt ? new Date(state.startedAt).toISOString() : now}</STARTED_AT>`);
    builder.push(`  <ENDED_AT>${state.endedAt ? new Date(state.endedAt).toISOString() : now}</ENDED_AT>`);
    builder.push('  <FENCERS>');
    builder.push('    <FENCER side="LEFT">');
    builder.push(`      <NAME>${escapeXml(((_g = (_f = state.config) === null || _f === void 0 ? void 0 : _f.leftFencer) === null || _g === void 0 ? void 0 : _g.name) || 'Left')}</NAME>`);
    builder.push(`      <COUNTRY>${escapeXml(((_j = (_h = state.config) === null || _h === void 0 ? void 0 : _h.leftFencer) === null || _j === void 0 ? void 0 : _j.country) || '')}</COUNTRY>`);
    builder.push(`      <FINAL_SCORE>${((_l = (_k = state.config) === null || _k === void 0 ? void 0 : _k.leftFencer) === null || _l === void 0 ? void 0 : _l.score) || 0}</FINAL_SCORE>`);
    builder.push(`      <YELLOW_CARDS>${((_o = (_m = state.config) === null || _m === void 0 ? void 0 : _m.leftFencer) === null || _o === void 0 ? void 0 : _o.yellowCards) || 0}</YELLOW_CARDS>`);
    builder.push(`      <RED_CARDS>${((_q = (_p = state.config) === null || _p === void 0 ? void 0 : _p.leftFencer) === null || _q === void 0 ? void 0 : _q.redCards) || 0}</RED_CARDS>`);
    builder.push(`      <BLACK_CARD>${((_s = (_r = state.config) === null || _r === void 0 ? void 0 : _r.leftFencer) === null || _s === void 0 ? void 0 : _s.blackCard) ? 1 : 0}</BLACK_CARD>`);
    builder.push('    </FENCER>');
    builder.push('    <FENCER side="RIGHT">');
    builder.push(`      <NAME>${escapeXml(((_u = (_t = state.config) === null || _t === void 0 ? void 0 : _t.rightFencer) === null || _u === void 0 ? void 0 : _u.name) || 'Right')}</NAME>`);
    builder.push(`      <COUNTRY>${escapeXml(((_w = (_v = state.config) === null || _v === void 0 ? void 0 : _v.rightFencer) === null || _w === void 0 ? void 0 : _w.country) || '')}</COUNTRY>`);
    builder.push(`      <FINAL_SCORE>${((_y = (_x = state.config) === null || _x === void 0 ? void 0 : _x.rightFencer) === null || _y === void 0 ? void 0 : _y.score) || 0}</FINAL_SCORE>`);
    builder.push(`      <YELLOW_CARDS>${((_0 = (_z = state.config) === null || _z === void 0 ? void 0 : _z.rightFencer) === null || _0 === void 0 ? void 0 : _0.yellowCards) || 0}</YELLOW_CARDS>`);
    builder.push(`      <RED_CARDS>${((_2 = (_1 = state.config) === null || _1 === void 0 ? void 0 : _1.rightFencer) === null || _2 === void 0 ? void 0 : _2.redCards) || 0}</RED_CARDS>`);
    builder.push(`      <BLACK_CARD>${((_4 = (_3 = state.config) === null || _3 === void 0 ? void 0 : _3.rightFencer) === null || _4 === void 0 ? void 0 : _4.blackCard) ? 1 : 0}</BLACK_CARD>`);
    builder.push('    </FENCER>');
    builder.push('  </FENCERS>');
    builder.push('  <TOUCHES>');
    (state.touches || []).forEach((t, i) => {
        var _a, _b, _c;
        builder.push(`    <TOUCH index="${i + 1}">`);
        builder.push(`      <TIMESTAMP>${new Date(t.timestamp).toISOString()}</TIMESTAMP>`);
        builder.push(`      <FENCER>${((_a = t.fencerId) === null || _a === void 0 ? void 0 : _a.toUpperCase()) || 'NONE'}</FENCER>`);
        builder.push(`      <TYPE>${((_b = t.type) === null || _b === void 0 ? void 0 : _b.toUpperCase()) || 'NO_TOUCH'}</TYPE>`);
        builder.push(`      <LIGHT>${((_c = t.lightColor) === null || _c === void 0 ? void 0 : _c.toUpperCase()) || 'NONE'}</LIGHT>`);
        if (t.note)
            builder.push(`      <NOTE>${escapeXml(t.note)}</NOTE>`);
        builder.push('    </TOUCH>');
    });
    builder.push('  </TOUCHES>');
    builder.push('  <CARDS>');
    (state.cards || []).forEach((c) => {
        var _a, _b;
        builder.push('    <CARD>');
        builder.push(`      <TIMESTAMP>${new Date(c.timestamp).toISOString()}</TIMESTAMP>`);
        builder.push(`      <FENCER>${(_a = c.fencerId) === null || _a === void 0 ? void 0 : _a.toUpperCase()}</FENCER>`);
        builder.push(`      <TYPE>${(_b = c.type) === null || _b === void 0 ? void 0 : _b.toUpperCase()}</TYPE>`);
        if (c.reason)
            builder.push(`      <REASON>${escapeXml(c.reason)}</REASON>`);
        builder.push('    </CARD>');
    });
    builder.push('  </CARDS>');
    builder.push(`  <SEALED>${state.isSealed ? 1 : 0}</SEALED>`);
    if (state.sealedAt)
        builder.push(`  <SEALED_AT>${new Date(state.sealedAt).toISOString()}</SEALED_AT>`);
    builder.push('</FIE_BOUT_RESULT>');
    return builder.join('\n');
}
function escapeXml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

export { speakScore as a, buildFIEXml as b, formatTime as f, speakCard as s, uid as u };
//# sourceMappingURL=helpers-ksbpMhqy.js.map

//# sourceMappingURL=helpers-ksbpMhqy.js.map