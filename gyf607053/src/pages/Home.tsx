import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppStore } from '@/store/app'

export default function Home() {
  const user = useAppStore((s) => s.currentUser)
  useEffect(() => {
    document.title = '婴幼儿用品消毒清洗链 · 餐厅现场版'
  }, [])

  if (user) {
    const target =
      user.role === 'kitchen'
        ? '/kitchen'
        : '/onsite'
    return <Navigate to={target} replace />
  }
  return <Navigate to="/login" replace />
}
