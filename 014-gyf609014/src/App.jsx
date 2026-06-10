import { useState, useMemo } from 'react';
import './App.css';
import {
  getAllHoles,
  addHole,
  updateHole,
  deleteHole,
  addRepairApplication,
  reviewRepairApplication,
  exportData,
  importData
} from './utils/storage';
import { initializeMockData } from './data/mockData';
import HoleCard from './components/HoleCard';
import HoleForm from './components/HoleForm';
import FilterBar from './components/FilterBar';
import StatsPanel from './components/StatsPanel';
import ProblemList from './components/ProblemList';

function App() {
  const [holes, setHoles] = useState(() => {
    initializeMockData();
    return getAllHoles();
  });
  const [filters, setFilters] = useState({
    floor: '',
    profession: '',
    issueType: '',
    repairStatus: '',
    keyword: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [editingHole, setEditingHole] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const loadHoles = () => {
    const data = getAllHoles();
    setHoles(data);
  };

  const filteredHoles = useMemo(() => {
    let result = [...holes];

    if (activeTab === 'problems') {
      result = result.filter(h => h.isProblem);
    } else if (activeTab === 'missing') {
      result = result.filter(h => h.issueType === 'missing');
    } else if (activeTab === 'deviation') {
      result = result.filter(h => h.issueType === 'deviation');
    } else if (activeTab === 'normal') {
      result = result.filter(h => h.issueType === 'normal');
    }

    if (filters.floor) {
      result = result.filter(h => h.floor === filters.floor);
    }
    if (filters.profession) {
      result = result.filter(h => h.profession === filters.profession);
    }
    if (filters.issueType) {
      result = result.filter(h => h.issueType === filters.issueType);
    }
    if (filters.repairStatus) {
      result = result.filter(h => {
        const apps = h.repairApplications || [];
        if (filters.repairStatus === 'none') {
          return apps.length === 0;
        }
        if (apps.length === 0) return false;
        return apps[apps.length - 1].status === filters.repairStatus;
      });
    }
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      result = result.filter(h =>
        h.code.toLowerCase().includes(kw) ||
        h.axis.toLowerCase().includes(kw) ||
        h.description?.toLowerCase().includes(kw)
      );
    }

    return result.sort((a, b) => {
      if (a.floor !== b.floor) return a.floor.localeCompare(b.floor);
      return a.code.localeCompare(b.code);
    });
  }, [holes, filters, activeTab]);

  const problemHoles = useMemo(() => {
    return holes.filter(h => h.isProblem);
  }, [holes]);

  const handleAddHole = () => {
    setEditingHole(null);
    setShowForm(true);
  };

  const handleEditHole = (hole) => {
    setEditingHole(hole);
    setShowForm(true);
  };

  const handleFormSubmit = (holeData) => {
    if (editingHole) {
      updateHole(editingHole.id, holeData);
    } else {
      addHole(holeData);
    }
    loadHoles();
    setShowForm(false);
    setEditingHole(null);
  };

  const handleDeleteHole = (id) => {
    deleteHole(id);
    loadHoles();
  };

  const handleAddRepair = (holeId, data) => {
    addRepairApplication(holeId, data);
    loadHoles();
  };

  const handleReviewRepair = (holeId, appId, decision) => {
    reviewRepairApplication(holeId, appId, decision);
    loadHoles();
  };

  const handleReapplyRepair = (holeId, data) => {
    addRepairApplication(holeId, data);
    loadHoles();
  };

  const handleFixProblem = (hole) => {
    setEditingHole(hole);
    setShowForm(true);
    setActiveTab('all');
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `洞口复核数据_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (importData(data)) {
          alert('导入成功！');
          loadHoles();
        } else {
          alert('导入失败：数据格式不正确');
        }
      } catch {
        alert('导入失败：文件解析错误');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetDemo = () => {
    if (confirm('确定要重置为演示数据吗？当前所有数据将被清除。')) {
      localStorage.clear();
      initializeMockData();
      loadHoles();
    }
  };

  const tabConfig = [
    { key: 'all', label: '全部', count: holes.length },
    { key: 'missing', label: '缺洞', count: holes.filter(h => h.issueType === 'missing').length },
    { key: 'deviation', label: '偏位', count: holes.filter(h => h.issueType === 'deviation').length },
    { key: 'normal', label: '正常', count: holes.filter(h => h.issueType === 'normal').length },
    { key: 'problems', label: '问题清单', count: problemHoles.length },
  ];

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">机电洞口预留复核台</h1>
          <p className="app-subtitle">对照结构图、洞口清单和现场照片，核对预留洞口尺寸、位置和补开申请</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleAddHole}>
            + 新增洞口
          </button>
          <button className="btn btn-secondary" onClick={handleExport}>
            导出数据
          </button>
          <label className="btn btn-secondary file-btn">
            导入数据
            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </label>
          <button className="btn btn-text" onClick={handleResetDemo}>
            重置演示数据
          </button>
        </div>
      </header>

      <main className="app-main">
        <StatsPanel holes={holes} />

        <div className="tabs">
          {tabConfig.map(tab => (
            <button
              key={tab.key}
              className={`tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              <span className="tab-count">{tab.count}</span>
            </button>
          ))}
        </div>

        <FilterBar filters={filters} onChange={setFilters} />

        {activeTab === 'problems' ? (
          <ProblemList problems={filteredHoles} onFix={handleFixProblem} />
        ) : (
          <div className="hole-grid">
            {filteredHoles.length === 0 ? (
              <div className="empty-state">
                <p>暂无符合条件的洞口记录</p>
                <button className="btn btn-primary" onClick={handleAddHole}>
                  + 添加第一条记录
                </button>
              </div>
            ) : (
              filteredHoles.map(hole => (
                <HoleCard
                  key={hole.id}
                  hole={hole}
                  onEdit={handleEditHole}
                  onDelete={handleDeleteHole}
                  onAddRepair={handleAddRepair}
                  onReview={handleReviewRepair}
                  onReapply={handleReapplyRepair}
                />
              ))
            )}
          </div>
        )}
      </main>

      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditingHole(null); }}>
          <div className="modal-content form-modal" onClick={(e) => e.stopPropagation()}>
            <HoleForm
              key={editingHole?.id || 'new'}
              hole={editingHole}
              onSubmit={handleFormSubmit}
              onCancel={() => { setShowForm(false); setEditingHole(null); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
