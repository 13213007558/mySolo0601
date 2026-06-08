import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, AlertTriangle, Clock, CheckCircle, ChevronRight, RefreshCw } from 'lucide-react';
import { useStore } from '../store/useStore';

export const ClassList: React.FC = () => {
  const { classes, loading, loadClasses, refreshKey } = useStore();

  useEffect(() => {
    loadClasses();
  }, [refreshKey]);

  if (loading.classes) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">班级管理</h2>
        <p className="text-gray-500">查看所有班级的用品发放情况和异常统计</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map(cls => (
          <Link
            key={cls.id}
            to={`/classes/${cls.id}`}
            className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300 overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/50 to-teal-100/50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                    {cls.name}
                  </h3>
                  <p className="text-sm text-gray-500">班主任：{cls.teacherName}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">{cls.babyCount}</div>
                  <div className="text-xs text-gray-500">宝宝数</div>
                </div>
                <div className="text-center p-2 bg-amber-50 rounded-lg">
                  <div className="text-2xl font-bold text-amber-600">{cls.pendingCount}</div>
                  <div className="text-xs text-amber-600">待处理</div>
                </div>
                <div className="text-center p-2 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{cls.rejectedCount}</div>
                  <div className="text-xs text-red-600">已拒绝</div>
                </div>
              </div>

              {cls.exceptionCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg mb-4">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-700">
                    <strong>{cls.exceptionCount}</strong> 条异常待处理
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={12} />
                  <span>更新于 {new Date(cls.updatedAt).toLocaleString('zh-CN')}</span>
                </div>
                <div className="flex items-center gap-1 text-blue-600 font-medium text-sm group-hover:gap-2 transition-all">
                  查看详情
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h4 className="font-bold text-amber-900 mb-1">重要提示</h4>
            <p className="text-sm text-amber-800">
              <strong>王小满</strong>的奶瓶记录曾因"未清洁用品再次发放"问题被查找半小时。
              请在处理异常时务必确认用品已清洁，并记录详细处理原因。
              状态变更历史会永久保存，便于后续追溯。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassList;
