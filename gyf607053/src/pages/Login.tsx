import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, ChefHat, UserCog, Users } from 'lucide-react'
import { api } from '../lib/api'
import { useAppStore, ROLE_LABELS } from '../store/app'
import { RoleBadge } from '../components/Badges'

const roleIcon: Record<string, React.ReactNode> = {
  waiter: <ChefHat size={20} />,
  kitchen: <ShieldCheck size={20} />,
  manager: <Users size={20} />,
  supervisor: <UserCog size={20} />,
}

const roleHome: Record<string, string> = {
  waiter: '/onsite',
  kitchen: '/kitchen',
  manager: '/onsite',
  supervisor: '/onsite',
}

export default function Login() {
  const navigate = useNavigate()
  const setCurrentUser = useAppStore((s) => s.setCurrentUser)
  const [users, setUsers] = useState<{ id: string; name: string; role: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.listUsers().then((u) => {
      setUsers(u)
      setLoading(false)
    })
  }, [])

  const selectUser = async (userId: string) => {
    const user = await api.login(userId)
    if (!user) return
    setCurrentUser(user)
    navigate(roleHome[user.role] || '/onsite')
  }

  return (
    <div className="min-h-dvh grid md:grid-cols-2">
      <div className="hidden md:flex items-end p-12 relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 30% 20%, rgba(94, 234, 212, 0.35), transparent 60%), radial-gradient(circle at 80% 80%, rgba(253, 186, 116, 0.25), transparent 60%)',
          }}
        />
        <div className="relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-2xl font-semibold mb-6">
            清
          </div>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">
            婴幼儿用品消毒清洗链
          </h1>
          <p className="text-white/70 max-w-sm">
            餐厅现场版 · 扫码借还 · 异常处理 · 隐私审计 · 实时同步
          </p>
          <div className="mt-10 space-y-3 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-200" />
              异常处理后，班级页、宝宝详情、后台接口、导出清单同步变化
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-200" />
              手机号格式混乱时允许部分成功导入
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-200" />
              隐私字段在页面、JSON、日志、导出中都按角色脱敏，导出泄露有审计
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-200" />
              现场手机操作，厨房/后场状态实时更新
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="md:hidden mb-8">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center text-xl font-semibold mb-4">
              清
            </div>
            <h2 className="text-2xl font-semibold">请选择角色登录</h2>
          </div>

          <div className="hidden md:block mb-10">
            <h2 className="text-2xl font-semibold mb-2">请选择角色登录</h2>
            <p className="muted">体验不同角色看到的脱敏级别不同</p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="card p-4 animate-pulseSoft">
                  <div className="h-5 w-32 bg-ink-100 rounded mb-2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((u) => {
                return (
                  <button
                    key={u.id}
                    onClick={() => selectUser(u.id)}
                    className="w-full text-left card p-4 hover:border-brand-300 hover:shadow-glow transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-colors">
                        {roleIcon[u.role]}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-ink-900">{u.name}</div>
                        <div className="mt-1"><RoleBadge role={u.role} /></div>
                      </div>
                      <div className="text-ink-500 group-hover:text-brand-600">→</div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
