const fs = require("fs");
const p1 = "./src/data/mockData.ts";
let c1 = fs.readFileSync(p1, "utf8");
const o1 = "    operator: '王教练',\n    logs: [";
const n1 = "    operator: '王教练',\n    createdAt: '2024/6/4 11:00:00',\n    updatedAt: '2024/6/4 11:00:00',\n    isManual: true,\n    issues: [\n      { id: 'issue_mock_003_1', recordId: 'REC_mock_003', type: 'empty_name', field: 'babyName', reason: '宝宝姓名不能为空或过短，至少需要 2 个字符', severity: 'error' },\n      { id: 'issue_mock_003_2', recordId: 'REC_mock_003', type: 'invalid_phone', field: 'phone', reason: '手机号格式不正确，应为 11 位有效号码且以 1 开头', severity: 'error' },\n      { id: 'issue_mock_003_3', recordId: 'REC_mock_003', type: 'boundary_value', field: 'hours', reason: '课时数量为 0 或空值，属于异常边界值', severity: 'error' }\n    ],\n    logs: [";
c1 = c1.replace(o1, n1);
fs.writeFileSync(p1, c1, "utf8");
console.log("mockData fixed");
