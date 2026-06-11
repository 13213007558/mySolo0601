import { NavLink } from 'react-router-dom'
import { User } from 'lucide-react'
import { useCurrentOperator } from '@/hooks/useStore'
import styles from './Navbar.module.css'

export default function Navbar() {
  const operator = useCurrentOperator()

  return (
    <nav className={styles.navbar}>
      <div className={styles.left}>
        <span className={styles.title}>珍珠蚌层测厚仪</span>
        <div className={styles.links}>
          <NavLink
            to="/"
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.linkActive : ''}`
            }
          >
            仪表盘
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.linkActive : ''}`
            }
          >
            历史对比
          </NavLink>
        </div>
      </div>
      <div className={styles.operator}>
        <User size={18} />
        <span className={styles.operatorName}>{operator.name}</span>
        <span className={styles.operatorShift}>{operator.shift}</span>
      </div>
    </nav>
  )
}
