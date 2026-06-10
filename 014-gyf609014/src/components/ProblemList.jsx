export default function ProblemList({ problems, onFix }) {
  if (!problems || problems.length === 0) {
    return (
      <div className="problem-list empty">
        <p>暂无问题记录</p>
      </div>
    );
  }

  return (
    <div className="problem-list">
      <h3 className="section-title">
        问题清单
        <span className="count-badge">{problems.length}</span>
      </h3>
      <div className="problem-table-wrap">
        <table className="problem-table">
          <thead>
            <tr>
              <th>洞口编号</th>
              <th>楼层</th>
              <th>轴线</th>
              <th>专业</th>
              <th>原始尺寸</th>
              <th>问题原因</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {problems.map(hole => (
              <tr key={hole.id} className="problem-row">
                <td className="code">{hole.code}</td>
                <td>{hole.floor}</td>
                <td>{hole.axis}</td>
                <td>{hole.profession}</td>
                <td className="size-raw">{hole.sizeRaw}</td>
                <td className="reason">
                  <span className="tag tag-problem">
                    {hole.problemReason || '尺寸解析失败'}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => onFix && onFix(hole)}
                  >
                    修正
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
