import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardCheck, AlertTriangle, CheckCircle, FileEdit, Plus, ArrowRight,
  Shield, RefreshCw, Eye, Info,
} from 'lucide-react';
import { appStore } from '@/store/app';
import HandleExceptionModal from '@/components/HandleExceptionModal';
import ManualRecordModal from '@/components/ManualRecordModal';
import type { ExceptionRecord } from '@shared/types';
import { EXCEPTION_TYPE_LABEL } from '@shared/types';

export default function Home() {
  const { stats, exceptions, records } = appStore();
  const [selectedException, setSelectedException] = useState<ExceptionRecord | null>(null);
  const [manualOpen, setManualOpen] = useState(false);

  const pending = exceptions.filter((e) => e.status === 'pending');
  const resolved = exceptions.filter((e) => e.status === 'resolved');

  const statCards = [
    { label: '今日消毒总数', value: stats?.totalToday ?? 0, icon: ClipboardCheck, color: 'from-primary-500 to-primary-700' },
    { label: '待处理异常', value: stats?.pendingExceptions ?? 0, icon: AlertTriangle, color: 'from-orange-500 to-accent-orange' },
    { label: '已完成数量', value: stats?.completed ?? 0, icon: CheckCircle, color: 'from-green-500 to-accent-green' },
    { label: '手工补录数', value: stats?.manualRecords ?? 0, icon: FileEdit, color: 'from-purple-500 to-purple-700' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif-sc text-2xl font-bold text-gray-800">夜班交接工作台</h2>
          <p className="text-sm text-gray-500 mt-1">今日 {new Date().toLocaleDateString('zh-CN')} · 处理消毒记录并同步至全系统</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setManualOpen(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-600 transition flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            手工补录
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className={`rounded-xl p-5 text-white bg-gradient-to-br ${card.color} shadow-lg relative overflow-hidden`}>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <card.icon className="w-24 h-24" />
            </div>
            <div className="flex items-start justify-between relative">
              <div>
                <p className="text-xs text-white/80 font-medium">{card.label}</p>
                <p className="text-4xl font-bold mt-2 font-serif-sc">{card.value}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <card.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-accent-orange" />
              <h3 className="font-serif-sc text-lg font-bold text-gray-800">异常记录列表</h3>
              <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
                {pending.length} 待处理
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            {pending.length === 0 && resolved.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>暂无异常记录</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">时间</th>
                    <th className="px-5 py-3 text-left font-medium">宝宝/班级</th>
                    <th className="px-5 py-3 text-left font-medium">异常类型</th>
                    <th className="px-5 py-3 text-left font-medium">原因</th>
                    <th className="px-5 py-3 text-left font-medium">状态</th>
                    <th className="px-5 py-3 text-right font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[...pending, ...resolved].slice(0, 10).map((e, idx) => (
                    <tr
                      key={e.id}
                      className={`${e.status === 'pending' ? 'bg-orange-50/40' : ''} hover:bg-gray-50 transition`}
                      style={idx === 0 && e.status === 'pending' ? { borderLeft: '4px solid #E8873A' } : undefined}
                    >
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                        {new Date(e.createTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-3">
                        <Link to={`/baby/${e.babyId}`} className="font-medium text-primary hover:underline">
                          {e.babyName}
                        </Link>
                        <span className="text-gray-400 text-xs ml-2">
                          {e.classId === 'c_small' ? '小班' : e.classId === 'c_middle' ? '中班' : '大班'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 text-xs font-medium border border-red-100">
                          {EXCEPTION_TYPE_LABEL[e.type]}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-600 max-w-xs truncate" title={e.reason}>
                        {e.reason}
                      </td>
                      <td className="px-5 py-3">
                        {e.status === 'pending' ? (
                          <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-700 text-xs font-semibold">待处理</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold">已处理</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/baby/${e.babyId}`}
                            className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-primary transition"
                            title="查看详情"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {e.status === 'pending' && (
                            <button
                              onClick={() => setSelectedException(e)}
                              className="px-3 py-1 rounded text-xs font-semibold bg-accent-orange text-white hover:bg-orange-600 transition flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" />
                              处理
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Info className="w-3 h-3" />
              处理异常后将自动同步：班级页 / 宝宝详情 / 后台接口 / 导出清单
            </div>
            <Link to="/audit" className="text-primary hover:underline flex items-center gap-1">
              查看审计记录 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-serif-sc text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileEdit className="w-5 h-5 text-primary" />
              补录前后对比样例
            </h3>

            <p className="text-xs text-gray-500 mb-4">
              夜班交接试跑演示：补录前缺少一条记录，补录后自动新增手工补录标记的记录。
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500">补录前（旧记录）</span>
                  <span className="text-xs text-gray-400">共 3 条</span>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {[
                    { time: '18:30', name: '小明', item: '贝亲奶瓶240ml', status: '已消毒' },
                    { time: '18:35', name: '小明', item: '不锈钢餐具套装', status: '已消毒' },
                    { time: '18:40', name: '小红', item: 'NUK奶瓶180ml', status: '已发放' },
                  ].map((r, i) => (
                    <div key={i} className="px-3 py-2 text-xs flex items-center gap-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-gray-400 font-mono">{r.time}</span>
                      <span className="text-gray-700 font-medium">{r.name}</span>
                      <span className="text-gray-500 flex-1 truncate">{r.item}</span>
                      <span className="px-1.5 py-0.5 rounded bg-green-50 text-green-600">{r.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center">
                <div className="w-0.5 h-4 bg-primary-300" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-primary">补录后（新增 1 条）</span>
                  <span className="text-xs text-gray-400">共 4 条</span>
                </div>
                <div className="border border-primary-200 rounded-lg overflow-hidden">
                  {[
                    { time: '18:30', name: '小明', item: '贝亲奶瓶240ml', status: '已消毒', manual: false },
                    { time: '18:35', name: '小明', item: '不锈钢餐具套装', status: '已消毒', manual: false },
                    { time: '18:40', name: '小红', item: 'NUK奶瓶180ml', status: '已发放', manual: false },
                    { time: '18:50', name: '小丽', item: '纯棉围兜', status: '已消毒', manual: true },
                  ].map((r, i) => (
                    <div
                      key={i}
                      className={`px-3 py-2 text-xs flex items-center gap-2 border-b border-gray-100 last:border-b-0 ${r.manual ? 'bg-yellow-50' : ''}`}
                    >
                      <span className={`font-mono ${r.manual ? 'text-yellow-700 font-semibold' : 'text-gray-400'}`}>{r.time}</span>
                      <span className={`font-medium ${r.manual ? 'text-yellow-800' : 'text-gray-700'}`}>{r.name}</span>
                      <span className={`flex-1 truncate ${r.manual ? 'text-yellow-700' : 'text-gray-500'}`}>
                        {r.item}
                      </span>
                      {r.manual && (
                        <span className="px-1.5 py-0.5 rounded bg-yellow-200 text-yellow-800 font-semibold">补录</span>
                      )}
                      <span className="px-1.5 py-0.5 rounded bg-green-50 text-green-600">{r.status}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-gray-500 mt-2">
                  <span className="font-semibold">黄色高亮行</span>为本次手工补录，自动标记来源并写入审计日志。
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-serif-sc text-lg font-bold text-gray-800 mb-3">快速导航</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/classes" className="p-3 rounded-lg bg-gray-50 hover:bg-primary-50 hover:border-primary-200 border border-gray-200 transition">
                <p className="text-sm font-semibold text-gray-800">班级管理</p>
                <p className="text-xs text-gray-500 mt-0.5">查看各班级消毒状态</p>
              </Link>
              <Link to="/audit" className="p-3 rounded-lg bg-gray-50 hover:bg-primary-50 hover:border-primary-200 border border-gray-200 transition">
                <p className="text-sm font-semibold text-gray-800">审计记录</p>
                <p className="text-xs text-gray-500 mt-0.5">操作历史与复查</p>
              </Link>
              <Link to="/export" className="p-3 rounded-lg bg-gray-50 hover:bg-primary-50 hover:border-primary-200 border border-gray-200 transition">
                <p className="text-sm font-semibold text-gray-800">数据导出</p>
                <p className="text-xs text-gray-500 mt-0.5">导出消毒清单</p>
              </Link>
              <button
                onClick={() => setManualOpen(true)}
                className="p-3 rounded-lg bg-gray-50 hover:bg-primary-50 hover:border-primary-200 border border-gray-200 transition text-left"
              >
                <p className="text-sm font-semibold text-gray-800">新增记录</p>
                <p className="text-xs text-gray-500 mt-0.5">手工补录消毒记录</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary" />
            <h3 className="font-serif-sc text-lg font-bold text-gray-800">近期消毒记录</h3>
            <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold">
              共 {records.length} 条
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-5 py-3 text-left font-medium">时间</th>
                <th className="px-5 py-3 text-left font-medium">宝宝</th>
                <th className="px-5 py-3 text-left font-medium">用品</th>
                <th className="px-5 py-3 text-left font-medium">状态</th>
                <th className="px-5 py-3 text-left font-medium">操作人</th>
                <th className="px-5 py-3 text-left font-medium">来源</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.slice(0, 8).map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(r.operateTime).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit', month: '2-digit', day: '2-digit' })}
                  </td>
                  <td className="px-5 py-3">
                    <Link to={`/baby/${r.babyId}`} className="font-medium text-primary hover:underline">
                      {r.babyName}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-700">{r.itemName}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      r.status === 'exception' ? 'bg-red-100 text-red-700' :
                      r.status === 'pending' ? 'bg-gray-100 text-gray-700' :
                      r.status === 'distributed' ? 'bg-blue-100 text-blue-700' :
                      r.status === 'recycled' ? 'bg-purple-100 text-purple-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {r.status === 'disinfected' ? '已消毒' :
                       r.status === 'distributed' ? '已发放' :
                       r.status === 'recycled' ? '已回收' :
                       r.status === 'exception' ? '异常' : '待处理'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{r.operatorName}</td>
                  <td className="px-5 py-3">
                    {r.isManual ? (
                      <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 text-xs font-semibold border border-yellow-200">手工补录</span>
                    ) : (
                      <span className="text-xs text-gray-400">正常录入</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <HandleExceptionModal record={selectedException} onClose={() => setSelectedException(null)} />
      <ManualRecordModal open={manualOpen} onClose={() => setManualOpen(false)} />
    </div>
  );
}
