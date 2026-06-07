import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import http, { setAuth } from '../http.js'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  async function submit(e) {
    e.preventDefault()
    setErr('')
    try {
      const { data } = await http.post('/auth/login', { username, password })
      setAuth(data.token, data.user)
      const from = location.state?.from?.pathname || (
        data.user.role === 'consultant' ? '/consultant' :
        data.user.role === 'parent' ? '/parent' : '/supervisor'
      )
      navigate(from, { replace: true })
    } catch (e) {
      setErr(e.response?.data?.error || '登录失败')
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-box" onSubmit={submit}>
        <h1>婴幼儿睡眠观察清洗链</h1>
        <p className="sub">试听顾问版 · 统一登录</p>
        {err && <div className="alert error">{err}</div>}
        <div className="form-row">
          <label>用户名</label>
          <input value={username} onChange={e => setUsername(e.target.value)} autoFocus placeholder="consultant1 / parent1 / supervisor" />
        </div>
        <div className="form-row">
          <label>密码</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="123456" />
        </div>
        <button className="btn" type="submit">登录</button>
        <div className="login-hint">
          <strong>默认测试账号（密码均为 123456）：</strong><br />
          顾问端：consultant1（王顾问） / consultant2（李顾问）<br />
          家长端：parent1（张妈妈） / parent2（刘妈妈）<br />
          主管端：supervisor（赵主管）
        </div>
      </form>
    </div>
  )
}
