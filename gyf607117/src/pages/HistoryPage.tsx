import HistoryTimeline from '../components/History/HistoryTimeline';

const HistoryPage = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-industrial-text mb-2">操作历史</h1>
        <p className="text-industrial-muted">查看所有车位状态变更、截图补录、数据修正的操作记录</p>
      </div>
      <HistoryTimeline />
    </div>
  );
};

export default HistoryPage;
