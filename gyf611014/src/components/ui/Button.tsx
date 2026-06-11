import { css, cx } from '../../../styled-system/css'
import { button } from '../../../styled-system/recipes'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  loading?: boolean
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  leftIcon, 
  rightIcon, 
  loading,
  disabled,
  children,
  className,
  ...props 
}: ButtonProps) {
  const btnClasses = button({ variant, size })
  
  return (
    <button
      className={cx(btnClasses, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className={css({
          width: '16px',
          height: '16px',
          border: '2px solid',
          borderColor: 'currentColor',
          borderTopColor: 'transparent',
          borderRadius: 'full',
          animation: 'spin 0.8s linear infinite',
        })} />
      )}
      {!loading && leftIcon}
      {children}
      {rightIcon}
    </button>
  )
}
