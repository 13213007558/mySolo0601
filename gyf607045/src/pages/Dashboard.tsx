import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, VerificationStatus, STATUS_LABEL, VerificationRecord, PackageFlow } from '../types';
import {
  getVerificationRecords,
  getStatistics,
  importSampleData,
  hasImportedData,
  resetAllData,
  getPackageFlows,
} from '../store';
import ManualEntryModal from '../components/ManualEntryModal';

interface Props {
  user: User;
}

type TabType = 'records' | 'flows';

export default function Dashboard({ user }: Props) {
  const navigate = useNavigate();
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [flows, setFlows] = useState<PackageFlow[]>([]);
  const [tab, setTab] = useState<TabType>('records');
  const [showManualModal, setShowManualModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setRecords(getVerificationRecords(user.role));
    setFlows(getPackageFlows());
  }, [user, refreshKey]);

  const stats = getStatistics(user.role);

  const handleImport = () => {
    const res = importSampleData(user);
    alert(
      res.isReimport
        ? `样例数据已重新导入（旧记录已自动失效，不会出现多份有效结果，历史仍保留）\n导入批次：${res.batchId}\n新增流水：${res.flowsCount} 条，核销记录：${res.recordsCount} 条`
        : `样例数据导入成功\n导入批次：${res.batchId}\n导入流水：${res.flowsCount} 条，核销记录：${res.recordsCount} 条（含 1 条手工补录样例）`,
    );
    setRefreshKey((k) => k + 1);
  };

  const handleReset = () => {
    if (confirm('确定清空所有数据吗？服务重启后也不会保留（此操作演示数据持久化效果，刷新页面即可验证持久化')) {
      resetAllData();
      setRefreshKey((k) => k + 1);
    }
  };

  const handleManualEntrySuccess = () => {
    setShowManualModal(false);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div>
      {hasImportedData() && (
        <div className="alert alert-info">
          <span>💡</span>
          <div>
            数据已通过 localStorage 持久化保存，刷新页面或重启服务后数据仍然保留（照片说明、状态、整改记录均完整可用。
          </div>
        </div>
      )}

      <div className="toolbar">
        <div className="toolbar-left">
          {!hasImportedData() ? (
            <button className="btn btn-primary" onClick={handleImport}>
              📦 导入样例数据
            </button>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={handleImport}>
              🔄 重新导入样例
            </button>
            <button
              className="btn btn-warning"
              onClick={() => setShowManualModal(true)}
            >
              ➕ 手工补录
            </button>
            </>
          )}
          <button className="btn btn-danger btn-sm" onClick={handleReset}>
            🗑 清空数据
          </button>
        </div>
      </div>

      {records.length > 0 && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">总记录数</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat-card verified">
            <div className="stat-label">已核销</div>
            <div className="stat-value">{stats.verified}</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-label">待处理</div>
            <div className="stat-value">{stats.pending}</div>
          </div>
          <div className="stat-card rejected">
            <div className="stat-label">已驳回</div>
            <div className="stat-value">{stats.rejected}</div>
          </div>
          <div className="stat-card manual">
            <div className="stat-label">
              人工改判
              {user.role === 'nurse' && <span style={{ fontSize: 10, opacity: 0.6 }}>（不可见审计）</span>}
            </div>
            <div className="stat-value">{stats.manualOverride}</div>
          </div>
          <div className="stat-card partial">
            <div className="stat-label">部分成功</div>
            <div className="stat-value">{stats.partiallyVerified}</div>
          </div>
        </div>
      )}

      {records.length > 0 && (
        <div className="tabs">
          <button className={`tab-btn ${tab === 'records' ? 'active' : ''}`} onClick={() => setTab('records')}>
            核销记录（{records.length}）
          </button>
          <button className={`tab-btn ${tab === 'flows' ? 'active' : ''}`} onClick={() => setTab('flows')}>
            课包流水（{flows.length}）
          </button>
        </div>
      )}

      {records.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>暂无数据，请点击上方"导入样例数据"开始使用</p>
        </div>
      )}

      {tab === 'records' && records.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>宝宝姓名</th>
                <th>课包名称</th>
                <th>核销日期</th>
                <th>实际次数</th>
                <th>状态</th>
                <th>来源</th>
                <th>照片</th>
                <th>日期倒序</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{r.babyName}</td>
                  <td>{r.packageName}</td>
                  <td>{r.verifyDate}</td>
                  <td>{r.actualSessions}</td>
                  <td>
                    <span className={`status-badge ${r.status}`}>
                      {STATUS_LABEL[r.status as VerificationStatus]}
                    </span>
                  </td>
                  <td>
                    <span className={`source-tag ${r.source}`}>
                      {r.source === 'system_import' ? '系统导入' : '手工补录'}
                    </span>
                  </td>
                  <td>{r.photos.length} 张</td>
                  <td>
                    {r.dateOrderIssue ? (
                      <span style={{ color: '#d97706', fontWeight: 600 }}>⚠ 是（部分成功）</span>
                    ) : (
                      '否'
                    )}
                  </td>
                  <td>
                    <button
                      className="link-btn"
                      onClick={() => navigate(`/record/${r.id}`)}
                    >
                      查看详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'flows' && flows.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>宝宝姓名</th>
                <th>课包名称</th>
                <th>类型</th>
                <th>流水日期</th>
                <th>金额</th>
                <th>剩余/总次数</th>
                <th>来源</th>
                <th>关联核销</th>
              </tr>
            </thead>
            <tbody>
              {flows.map((f) => {
                const linked = records.filter(
                  (r) => r.packageFlowId === f.id,
                );
                return (
                  <tr key={f.id}>
                    <td>{f.babyName}</td>
                    <td>{f.packageName}</td>
                    <td>{f.packageType}</td>
                    <td>{f.flowDate}</td>
                    <td>¥{f.amount.toLocaleString()}</td>
                    <td>
                      {f.remainingSessions} / {f.totalSessions}
                    </td>
                    <td>
                      <span className={`source-tag ${f.source}`}>
                        {f.source === 'system_import' ? '系统导入' : '手工补录'}
                      </span>
                    </td>
                    <td>
                      {linked.length > 0 ? (
                        linked.map((r) => (
                          <div key={r.id}>
                            <button
                              className="link-btn"
                              onClick={() => navigate(`/record/${r.id}`)}
                            >
                              {STATUS_LABEL[r.status as VerificationStatus]}
                            </button>
                          </div>
                        ))
                      ) : (
                        <span style={{ color: '#9ca3af' }}>暂无</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showManualModal && (
        <ManualEntryModal
          user={user}
          onClose={() => setShowManualModal(false)}
          onSuccess={handleManualEntrySuccess}
        />
      )}
    </div>
  );
}
