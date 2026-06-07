import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import http from '../http.js'

export default function ParentDashboard() {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    http.get('/parents-summary').then(r => {
      setRecords(r.data.records)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="container">
      <div className="card">
        <h2>宝宝睡眠观察汇总表</h2>
        <p style={{ fontSize: 13, color: '#636e72', marginBottom: 16 }}>仅展示已归档的最终结果，中间处理流程由顾问和主管在顾问端查看并留痕。</p>
        {loading ? <div className="empty">加载中...</div> :
          records.length === 0 ? <div className="empty">暂无已归档的观察记录</div> :
            <table>
              <thead>
                <tr><th>标题</th><th>宝宝</th><th>班级</th><th>睡眠质量</th><th>睡眠时长</th><th>完成时间</th><th>操作</th></tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td>{r.title}</td>
                    <td>{r.baby_name}</td>
                    <td>{r.class_name}</td>
                    <td>{r.sleep_quality || '-'}</td>
                    <td>{r.sleep_duration || '-'}</td>
                    <td>{r.updated_at}</td>
                    <td><span className="link-btn" onClick={() => navigate(`/records/${r.id}`)}>查看详情</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>
    </div>
  )
}
