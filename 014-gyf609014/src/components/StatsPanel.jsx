export default function StatsPanel({ holes }) {
  const total = holes.length;
  const normal = holes.filter(h => h.issueType === 'normal').length;
  const missing = holes.filter(h => h.issueType === 'missing').length;
  const deviation = holes.filter(h => h.issueType === 'deviation').length;
  const problems = holes.filter(h => h.isProblem).length;

  const pendingRepair = holes.filter(h => {
    const apps = h.repairApplications || [];
    if (apps.length === 0) return false;
    return apps[apps.length - 1].status === 'pending';
  }).length;

  const approvedRepair = holes.filter(h => {
    const apps = h.repairApplications || [];
    if (apps.length === 0) return false;
    return apps[apps.length - 1].status === 'approved';
  }).length;

  const rejectedRepair = holes.filter(h => {
    const apps = h.repairApplications || [];
    if (apps.length === 0) return false;
    return apps[apps.length - 1].status === 'rejected';
  }).length;

  return (
    <div className="stats-panel">
      <div className="stat-card stat-total">
        <div className="stat-value">{total}</div>
        <div className="stat-label">洞口总数</div>
      </div>
      <div className="stat-card stat-normal">
        <div className="stat-value">{normal}</div>
        <div className="stat-label">正常</div>
      </div>
      <div className="stat-card stat-missing">
        <div className="stat-value">{missing}</div>
        <div className="stat-label">缺洞</div>
      </div>
      <div className="stat-card stat-deviation">
        <div className="stat-value">{deviation}</div>
        <div className="stat-label">偏位</div>
      </div>
      <div className="stat-card stat-problem">
        <div className="stat-value">{problems}</div>
        <div className="stat-label">问题清单</div>
      </div>
      <div className="stat-card stat-pending">
        <div className="stat-value">{pendingRepair}</div>
        <div className="stat-label">待审核补开</div>
      </div>
      <div className="stat-card stat-approved">
        <div className="stat-value">{approvedRepair}</div>
        <div className="stat-label">已批准补开</div>
      </div>
      <div className="stat-card stat-rejected">
        <div className="stat-value">{rejectedRepair}</div>
        <div className="stat-label">已退回补开</div>
      </div>
    </div>
  );
}
