import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Filter,
  Upload,
  Search,
  Download,
  X,
  ChevronDown,
  Baby,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import BabyCard from '@/components/BabyCard';
import { useStore } from '@/store/useStore';
import { ExportTableRow } from '@/types';

export default function Dashboard() {
  const navigate = useNavigate();
  const currentUser = useStore((s) => s.currentUser);
  const babies = useStore((s) => s.babies);
  const selectedDate = useStore((s) => s.selectedDate);
  const selectedClass = useStore((s) => s.selectedClass);
  const setSelectedDate = useStore((s) => s.setSelectedDate);
  const setSelectedClass = useStore((s) => s.setSelectedClass);
  const getBabiesByFamily = useStore((s) => s.getBabiesByFamily);
  const canViewFullDetail = useStore((s) => s.canViewFullDetail);
  const addAuditLog = useStore((s) => s.addAuditLog);
  const exportTableData = useStore((s) => s.exportTableData);
  const selectBaby = useStore((s) => s.selectBaby);

  const [showExportPanel, setShowExportPanel] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedRow, setSelectedRow] = useState<ExportTableRow | null>(null);

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const classes = useMemo(() => {
    const allClasses = [...new Set(babies.map((b) => b.className))];
    return ['all', ...allClasses];
  }, [babies]);

  const displayBabies = useMemo(() => {
    let list = babies;

    if (currentUser.role === 'elder' || currentUser.role === 'parent') {
      list = getBabiesByFamily(currentUser.id);
    }

    if (selectedClass !== 'all') {
      list = list.filter((b) => b.className === selectedClass);
    }

    if (searchText.trim()) {
      const text = searchText.trim().toLowerCase();
      list = list.filter(
        (b) => b.name.toLowerCase().includes(text) || b.className.toLowerCase().includes(text)
      );
    }

    return list;
  }, [babies, selectedClass, searchText, currentUser, getBabiesByFamily]);

  const handleExportLookup = (row: ExportTableRow) => {
    setSelectedRow(row);
    const matchedBaby = babies.find(
      (b) => b.name === row.babyName && b.className === row.className
    );

    if (matchedBaby) {
      addAuditLog({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'view_detail',
        targetId: matchedBaby.id,
        targetName: matchedBaby.name,
        time: new Date().toISOString().slice(0, 16).replace('T', ' '),
        result: 'success',
        detail: `通过导出表反查找到宝宝 ${matchedBaby.name}`,
      });
      selectBaby(matchedBaby.id);
      navigate(`/baby/${matchedBaby.id}`);
    }
  };

  const handleExportData = () => {
    addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'export',
      time: new Date().toISOString().slice(0, 16).replace('T', ' '),
      result: 'success',
      detail: `导出${selectedDate}晨检数据共${displayBabies.length}条记录`,
    });
    setShowExportPanel(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-medical-50/30">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-serif text-3xl font-bold text-gray-900 mb-2">
            晨检复核排程板
          </h1>
          <p className="text-gray-500">
            {currentUser.role === 'elder' || currentUser.role === 'parent'
              ? '查看家庭关联宝宝的晨检状态'
              : '查看今日所有宝宝晨检状态，支持导出表反查溯源'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 animate-slide-up">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-medical-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-medical-300 focus:border-medical-400"
              />
            </div>

            <div className="relative">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="bg-transparent text-sm focus:outline-none appearance-none pr-6 cursor-pointer"
                >
                  {classes.map((c) => (
                    <option key={c} value={c}>
                      {c === 'all' ? '全部班级' : c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3" />
              </div>
            </div>

            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索宝宝姓名或班级..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-medical-300 focus:border-medical-400"
              />
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {(currentUser.role === 'manager' || currentUser.role === 'supervisor') && (
                <>
                  <button
                    onClick={() => setShowExportPanel(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-medical-600 bg-medical-50 hover:bg-medical-100 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    导入导出表反查
                  </button>
                  <button
                    onClick={handleExportData}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-medical-500 hover:bg-medical-600 transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    导出数据
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {displayBabies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {displayBabies.map((baby, idx) => (
              <div
                key={baby.id}
                className="animate-slide-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <BabyCard
                  baby={baby}
                  showFullDetail={canViewFullDetail(baby.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Baby className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="font-serif text-xl text-gray-700 mb-2">暂无晨检数据</h3>
            <p className="text-gray-500 text-sm">当前筛选条件下没有找到宝宝记录</p>
          </div>
        )}
      </div>

      {showExportPanel && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="font-serif text-xl font-bold text-gray-900 mb-1">
                  导出表数据反查
                </h3>
                <p className="text-sm text-gray-500">
                  点击任意行可跳转到对应宝宝详情页
                </p>
              </div>
              <button
                onClick={() => setShowExportPanel(false)}
                className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <table className="w-full">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      姓名
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      班级
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      状态
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      体温
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      日期
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {exportTableData.map((row) => {
                    const matched = babies.find(
                      (b) => b.name === row.babyName && b.className === row.className
                    );
                    return (
                      <tr
                        key={`${row.babyName}-${row.className}`}
                        onClick={() => handleExportLookup(row)}
                        className={`border-b border-gray-50 hover:bg-medical-50/50 cursor-pointer transition-colors ${
                          selectedRow === row ? 'bg-medical-50' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-medical-100 to-medical-200 flex items-center justify-center text-sm font-bold text-medical-700">
                              {row.babyName.charAt(0)}
                            </div>
                            <span className="font-medium text-gray-800">
                              {row.babyName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {row.className}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              row.status === '正常'
                                ? 'bg-emerald-50 text-emerald-700'
                                : row.status === '体温偏高'
                                ? 'bg-amber-50 text-amber-700'
                                : row.status === '请假'
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-violet-50 text-violet-700'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {row.temperature}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {row.date}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportLookup(row);
                            }}
                            disabled={!matched}
                            className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-colors ${
                              matched
                                ? 'text-medical-600 bg-medical-50 hover:bg-medical-100'
                                : 'text-gray-400 bg-gray-50 cursor-not-allowed'
                            }`}
                          >
                            {matched ? '反查详情' : '未匹配'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
