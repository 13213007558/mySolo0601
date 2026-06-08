"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = generateId;
exports.now = now;
exports.formatCurrency = formatCurrency;
exports.formatDate = formatDate;
exports.deepClone = deepClone;
exports.calculateAge = calculateAge;
function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
function now() {
    return new Date().toISOString();
}
function formatCurrency(amount) {
    return `¥${amount.toFixed(2)}`;
}
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
function calculateAge(birthDate) {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}
//# sourceMappingURL=utils.js.map