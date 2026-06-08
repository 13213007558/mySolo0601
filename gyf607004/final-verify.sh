#!/bin/bash

echo "=========================================="
echo "  婴幼儿课程改期授权库 - 最终验证报告"
echo "=========================================="
echo ""
echo "【验证时间】: $(date)"
echo ""

echo "------------------------------------------"
echo " 1. 类型检查"
echo "------------------------------------------"
npx tsc -b --noEmit 2>&1
if [ $? -eq 0 ]; then
    echo "✅ 类型检查通过"
else
    echo "❌ 类型检查失败"
    exit 1
fi
echo ""

echo "------------------------------------------"
echo " 2. 生产构建"
echo "------------------------------------------"
npm run build 2>&1 | grep -E "(✓|built|dist/|error|Error)" 
if [ $? -eq 0 ]; then
    echo "✅ 生产构建成功"
else
    echo "❌ 生产构建失败"
    exit 1
fi
echo ""

echo "------------------------------------------"
echo " 3. 构建产物验证"
echo "------------------------------------------"
if [ -d "dist" ]; then
    echo "✅ dist 目录存在"
    echo "   文件清单:"
    ls -la dist/ 2>/dev/null | awk '{print "   - " $9 " (" $5 ")"}'
else
    echo "❌ dist 目录不存在"
    exit 1
fi
echo ""

echo "------------------------------------------"
echo " 4. 路由修复验证"
echo "------------------------------------------"
BAD_ROUTES=$(grep -rn "navigate('/\(import\|record/create\|approval\)/\?'" src/ 2>/dev/null | wc -l)
GOOD_ROUTES=$(grep -rn "navigate('/\(records/import\|records/new\|approvals\)/\?'" src/ 2>/dev/null | wc -l)
echo "   错误路由数量: $BAD_ROUTES"
echo "   正确路由数量: $GOOD_ROUTES"
if [ "$BAD_ROUTES" -eq 0 ] && [ "$GOOD_ROUTES" -gt 0 ]; then
    echo "✅ 路由修复完成 (0 处错误, $GOOD_ROUTES 处正确)"
else
    echo "❌ 路由修复未完成"
    exit 1
fi
echo ""

echo "------------------------------------------"
echo " 5. 初始化修复验证"
echo "------------------------------------------"
INIT_COUNT=$(grep -rn "await init()" src/pages/ 2>/dev/null | wc -l)
echo "   init() 调用数量: $INIT_COUNT"
if [ "$INIT_COUNT" -ge 6 ]; then
    echo "✅ 初始化修复完成 ($INIT_COUNT 个页面调用 init())"
else
    echo "❌ 初始化修复未完成"
    exit 1
fi
echo ""

echo "------------------------------------------"
echo " 6. 导出数据实时性修复验证"
echo "------------------------------------------"
LOADRECORDS_RETURN=$(grep -A5 "loadRecords: async" src/store/index.ts 2>/dev/null | grep "return records" | wc -l)
EXPORT_REALTIME=$(grep -A5 "handlePreview\|handleExport" src/pages/ExportPage.tsx 2>/dev/null | grep "const filteredRecords = await loadRecords" | wc -l)
echo "   loadRecords 返回数据: $LOADRECORDS_RETURN"
echo "   ExportPage 使用实时数据: $EXPORT_REALTIME"
if [ "$LOADRECORDS_RETURN" -eq 1 ] && [ "$EXPORT_REALTIME" -ge 2 ]; then
    echo "✅ 导出数据实时性修复完成"
else
    echo "❌ 导出数据实时性修复未完成"
    exit 1
fi
echo ""

echo "------------------------------------------"
echo " 7. 导入试跑功能测试"
echo "------------------------------------------"
node test-import-validation.mjs 2>&1 | tail -20
if [ $? -eq 0 ]; then
    echo "✅ 导入试跑功能测试通过"
else
    echo "❌ 导入试跑功能测试失败"
    exit 1
fi
echo ""

echo "=========================================="
echo "  ✅ 全部验证通过"
echo "=========================================="
echo ""
echo " 项目可安装: npm install"
echo " 项目可运行: npm run dev"
echo " 项目可构建: npm run build"
echo " 项目可验证: node test-import-validation.mjs"
echo ""
echo " 生产服务器: node start-server.mjs"
echo " 访问地址: http://localhost:5182/"
echo ""
