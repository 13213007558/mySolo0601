import { css } from '../../../styled-system/css'
import { useAppStore } from '@/store/appStore'
import type { PageType } from '@/types'
import { 
  LayoutDashboard, 
  Upload, 
  PenTool, 
  Layers, 
  AlertTriangle, 
  ListTodo, 
  FileSpreadsheet,
  Shell,
  Settings
} from 'lucide-react'

const navItems: { id: PageType; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: '数据概览', icon: LayoutDashboard },
  { id: 'upload', label: '显微拍照上传', icon: Upload },
  { id: 'annotation', label: '生长纹圈选', icon: PenTool },
  { id: 'batches', label: '批次档案', icon: Layers },
  { id: 'inspection', label: '送检工单', icon: AlertTriangle },
  { id: 'queue', label: '批量处理', icon: ListTodo },
  { id: 'export', label: '补贴申报导出', icon: FileSpreadsheet },
]

export function Sidebar() {
  const { currentPage, setCurrentPage } = useAppStore()

  return (
    <aside className={css({
      width: '260px',
      minWidth: '260px',
      height: '100vh',
      bg: 'white',
      borderRight: '1px solid',
      borderColor: 'border',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
    })}>
      <div className={css({
        p: '6',
        pb: '5',
        borderBottom: '1px solid',
        borderColor: 'border',
        display: 'flex',
        alignItems: 'center',
        gap: '3',
      })}>
        <div className={css({
          width: '40px',
          height: '40px',
          borderRadius: 'lg',
          bg: 'primary',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        })}>
          <Shell size={22} />
        </div>
        <div>
          <h1 className={css({
            fontSize: 'lg',
            fontWeight: '700',
            color: 'text.primary',
            margin: 0,
            lineHeight: '1.2',
          })}>牡蛎壳环计数端</h1>
          <p className={css({
            fontSize: 'xs',
            color: 'text.muted',
            margin: 0,
            mt: '1',
          })}>Oyster Growth Ring Counter</p>
        </div>
      </div>

      <nav className={css({
        flex: 1,
        py: '4',
        px: '3',
        overflowY: 'auto',
      })}>
        <div className={css({
          px: '3',
          py: '2',
          fontSize: 'xs',
          fontWeight: '500',
          color: 'text.muted',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        })}>
          工作流程
        </div>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={css({
                width: 'full',
                display: 'flex',
                alignItems: 'center',
                gap: '3',
                px: '3',
                py: '2.5',
                mt: '1',
                borderRadius: 'md',
                fontSize: 'sm',
                fontWeight: isActive ? '500' : '400',
                color: isActive ? 'primary' : 'text.secondary',
                bg: isActive ? 'primary/10' : 'transparent',
                cursor: 'pointer',
                border: 'none',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                _hover: {
                  bg: isActive ? 'primary/15' : 'surface-hover',
                  color: isActive ? 'primary' : 'text.primary',
                },
              })}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className={css({
        p: '4',
        borderTop: '1px solid',
        borderColor: 'border',
      })}>
        <button className={css({
          width: 'full',
          display: 'flex',
          alignItems: 'center',
          gap: '3',
          px: '3',
          py: '2.5',
          borderRadius: 'md',
          fontSize: 'sm',
          color: 'text.secondary',
          bg: 'transparent',
          cursor: 'pointer',
          border: 'none',
          _hover: {
            bg: 'surface-hover',
            color: 'text.primary',
          },
        })}>
          <Settings size={18} />
          <span>系统设置</span>
        </button>
      </div>
    </aside>
  )
}
