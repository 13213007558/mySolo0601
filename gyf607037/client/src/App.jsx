import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Login from './pages/Login.jsx'
import ConsultantDashboard from './pages/ConsultantDashboard.jsx'
import RecordDetail from './pages/RecordDetail.jsx'
import ParentDashboard from './pages/ParentDashboard.jsx'
import SupervisorDashboard from './pages/SupervisorDashboard.jsx'
import { getCurrentUser, clearAuth } from './http.js'

function PrivateRoute({ children, allowedRoles }) {
  const user = getCurrentUser()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <div className="container"><div className="card"><div className="alert error">无权访问该页面</div></div></div>
  }
  return children
}

function Header() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [, setTick] = useState(0)
  useEffect(() => { setTick(t => t + 1) }, [])
  if (!user) return null

  const roleName = { consultant: '课程顾问', parent: '家长', supervisor: '主管' }[user.role]

  const homeLink = user.role === 'consultant' ? '/consultant'
    : user.role === 'parent' ? '/parent'
    : '/supervisor'

  return (
    <div className="header">
      <h1 onClick={() => navigate(homeLink)} style={{ cursor: 'pointer' }}>
        婴幼儿睡眠观察清洗链 · {roleName}端
      </h1>
      <div className="user">
        <span>{user.name}（{roleName}）</span>
        <button onClick={() => { clearAuth(); navigate('/login') }}>退出</button>
      </div>
    </div>
  )
}

export default function App() {
  const user = getCurrentUser()

  return (
    <div className="app">
      <Header />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          user ? <Navigate to={user.role === 'consultant' ? '/consultant' : user.role === 'parent' ? '/parent' : '/supervisor'} replace />
               : <Navigate to="/login" replace />
        } />
        <Route path="/consultant" element={
          <PrivateRoute allowedRoles={['consultant', 'supervisor']}><ConsultantDashboard /></PrivateRoute>
        } />
        <Route path="/records/:id" element={
          <PrivateRoute allowedRoles={['consultant', 'supervisor', 'parent']}><RecordDetail /></PrivateRoute>
        } />
        <Route path="/parent" element={
          <PrivateRoute allowedRoles={['parent']}><ParentDashboard /></PrivateRoute>
        } />
        <Route path="/supervisor" element={
          <PrivateRoute allowedRoles={['supervisor']}><SupervisorDashboard /></PrivateRoute>
        } />
      </Routes>
    </div>
  )
}
