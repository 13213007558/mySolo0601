import { css, cx } from '../../../styled-system/css'
import { card } from '../../../styled-system/recipes'
import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'flat'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  children: ReactNode
}

export function Card({ variant = 'default', padding = 'md', children, className, ...props }: CardProps) {
  const cardClasses = card({ variant, padding })
  return (
    <div className={cx(cardClasses, className)} {...props}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cx(css({
      pb: '4',
      mb: '4',
      borderBottom: '1px solid',
      borderColor: 'border',
    }), className)}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: ReactNode
  className?: string
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3 className={cx(css({
      fontSize: 'lg',
      fontWeight: '600',
      color: 'text.primary',
      margin: 0,
    }), className)}>
      {children}
    </h3>
  )
}

interface CardBodyProps {
  children: ReactNode
  className?: string
}

export function CardBody({ children, className }: CardBodyProps) {
  return <div className={cx(className)}>{children}</div>
}

interface CardFooterProps {
  children: ReactNode
  className?: string
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cx(css({
      pt: '4',
      mt: '4',
      borderTop: '1px solid',
      borderColor: 'border',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '3',
    }), className)}>
      {children}
    </div>
  )
}
