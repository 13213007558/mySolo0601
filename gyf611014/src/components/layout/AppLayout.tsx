import { css, cx } from '../../../styled-system/css'
import { Sidebar } from './Sidebar'
import type { ReactNode } from 'react'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className={css({
      display: 'flex',
      minHeight: '100vh',
      bg: 'bg.default',
    })}>
      <Sidebar />
      <main className={css({
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      })}>
        {children}
      </main>
    </div>
  )
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  children?: ReactNode
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <header className={css({
      px: '8',
      py: '6',
      bg: 'white',
      borderBottom: '1px solid',
      borderColor: 'border',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    })}>
      <div>
        <h2 className={css({
          fontSize: 'xl',
          fontWeight: '600',
          color: 'text.primary',
          margin: 0,
        })}>{title}</h2>
        {subtitle && (
          <p className={css({
            fontSize: 'sm',
            color: 'text.muted',
            margin: '2px 0 0 0',
          })}>{subtitle}</p>
        )}
      </div>
      {children && (
        <div className={css({ display: 'flex', gap: '3', alignItems: 'center' })}>
          {children}
        </div>
      )}
    </header>
  )
}

interface PageContentProps {
  children: ReactNode
  className?: string
}

export function PageContent({ children, className }: PageContentProps) {
  return (
    <div className={cx(css({
      flex: 1,
      p: '8',
      overflowY: 'auto',
    }), className)}>
      {children}
    </div>
  )
}
