import { cx } from '../../../styled-system/css'
import { badge } from '../../../styled-system/recipes'
import type { HTMLAttributes, ReactNode } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'subtle'
  children: ReactNode
}

export function Badge({ variant = 'primary', children, className, ...props }: BadgeProps) {
  const badgeClasses = badge({ variant })
  return (
    <span className={cx(badgeClasses, className)} {...props}>
      {children}
    </span>
  )
}
