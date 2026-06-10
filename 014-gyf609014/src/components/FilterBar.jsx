import { floors, professions } from '../data/mockData';

export default function FilterBar({ filters, onChange }) {
  const handleChange = (field, value) => {
    onChange && onChange({ ...filters, [field]: value });
  };

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label>楼层筛选</label>
        <select
          value={filters.floor || ''}
          onChange={(e) => handleChange('floor', e.target.value)}
        >
          <option value="">全部楼层</option>
          {floors.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>专业筛选</label>
        <select
          value={filters.profession || ''}
          onChange={(e) => handleChange('profession', e.target.value)}
        >
          <option value="">全部专业</option>
          {professions.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>问题类型</label>
        <select
          value={filters.issueType || ''}
          onChange={(e) => handleChange('issueType', e.target.value)}
        >
          <option value="">全部类型</option>
          <option value="normal">正常</option>
          <option value="missing">缺洞</option>
          <option value="deviation">偏位</option>
        </select>
      </div>

      <div className="filter-group">
        <label>补开状态</label>
        <select
          value={filters.repairStatus || ''}
          onChange={(e) => handleChange('repairStatus', e.target.value)}
        >
          <option value="">全部状态</option>
          <option value="none">未申请</option>
          <option value="pending">待审核</option>
          <option value="approved">已批准</option>
          <option value="rejected">已退回</option>
        </select>
      </div>

      <div className="filter-group">
        <label>搜索</label>
        <input
          type="text"
          value={filters.keyword || ''}
          onChange={(e) => handleChange('keyword', e.target.value)}
          placeholder="洞口编号/轴线"
        />
      </div>
    </div>
  );
}
