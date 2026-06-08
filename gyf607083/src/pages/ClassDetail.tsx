import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Users, 
  Baby, 
  AlertTriangle, 
  Clock, 
  ChevronRight,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { StatusBadge } from '../components/StatusBadge';
import { RecordStatus, STATUS_LABELS, ITEM_TYPE_LABELS } from '../../shared/types';

export const ClassDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { classes, babies, supplyRecords, loading, loadClasses, loadBabies, loadSupplyRecords, refreshKey } = useStore();
  const [statusFilter, setStatusFilter] = useState<RecordStatus | 'all'>('all');

  const classData = classes.find(c => c.id === id);
  const classBabies = babies.filter(b => b.classId === id);
  const classRecords = supplyRecords.filter(r => r.classId === id);
  
  const filteredRecords = statusFilter === 'all' 
    ? classRecords 
    : classRecords.filter(r => r.status === statusFilter);

  useEffect(() => {
    if (id) {
      loadClasses();
      loadBabies(id);
      loadSupplyRecords({ classId: id });
    }
  }, [id, refreshKey]);

  if (!classData) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">班级不存在</p>
        <button onClick={() => navigate('/classes')} className="mt-4 text-blue-600 hover:underline">
          返回班级列表
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button onClick={() => navigate('/classes')} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4 transition-colors">
          <ArrowLeft size={20} />
          返回班级列表
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{classData.name}</h2>
            <p className="text-gray-500">班主任：{classData.teacherName}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
              <Baby size={18} className="text-blue-600" />
              <span className="text-blue-900 font-medium">{classData.babyCount} 位宝宝</span>
            </div>
            {classData.exceptionCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg">
                <AlertTriangle size={18} className="text-red-600" />
                <span className="text-red-900 font-medium">{classData.exceptionCount} 条异常</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users size={20} className="text-blue-600" />
              宝宝列表
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {loading.babies ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
              ) : classBabies.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无宝宝数据</p>
              ) : (
                classBabies.map(baby => (
                  <Link
                    key={baby.id}
                    to={`/baby/${baby.id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-teal-400 rounded-full flex items-center justify-center text-white font-medium">
                        {baby.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 group-hover:text-blue-600">{baby.name}</p>
                        <p className="text-xs text-gray-500">{baby.age} 岁</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-800">用品发放记录</h3>
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部状态</option>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading.supplyRecords ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : filteredRecords.length === 0 ? (
              <p className="text-gray-500 text-center py-12">暂无记录</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">宝宝姓名</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">物品名称</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">类型</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">是否消毒</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">创建时间</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map(record => (
                      <tr key={record.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <Link to={`/baby/${record.babyId}`} className="text-blue-600 hover:underline">
                            {record.babyName}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-gray-800">{record.itemName}</td>
                        <td className="py-3 px-4 text-gray-600">{ITEM_TYPE_LABELS[record.itemType]}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-xs ${record.sterilized ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {record.sterilized ? '是' : '否'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={record.status} showManualTag isManual={record.isManual} />
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-sm">
                          {new Date(record.createdAt).toLocaleString('zh-CN')}
                        </td>
                        <td className="py-3 px-4">
                          <Link 
                            to={`/baby/${record.babyId}`}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            查看详情
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassDetail;
