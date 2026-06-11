import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: true,
  include: ['./src/**/*.{ts,tsx,js,jsx}', './index.html'],
  exclude: [],
  theme: {
    extend: {
      tokens: {
        colors: {
          primary: { value: '#0D9488' },
          'primary-dark': { value: '#0F766E' },
          'primary-light': { value: '#14B8A6' },
          accent: { value: '#F59E0B' },
          'accent-dark': { value: '#D97706' },
          danger: { value: '#EF4444' },
          success: { value: '#10B981' },
          warning: { value: '#F59E0B' },
          info: { value: '#3B82F6' },
          surface: { value: '#FFFFFF' },
          'surface-muted': { value: '#F8FAFC' },
          'surface-hover': { value: '#F1F5F9' },
          border: { value: '#E2E8F0' },
          'border-strong': { value: '#CBD5E1' },
          text: {
            primary: { value: '#0F172A' },
            secondary: { value: '#475569' },
            muted: { value: '#94A3B8' },
            inverse: { value: '#FFFFFF' },
          },
        },
        fonts: {
          display: { value: "'Noto Serif SC', 'Source Han Serif SC', Georgia, serif" },
          body: { value: "'Inter', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif" },
          mono: { value: "'JetBrains Mono', 'Fira Code', monospace" },
        },
        fontSizes: {
          xs: { value: '0.75rem' },
          sm: { value: '0.875rem' },
          md: { value: '1rem' },
          lg: { value: '1.125rem' },
          xl: { value: '1.25rem' },
          '2xl': { value: '1.5rem' },
          '3xl': { value: '1.875rem' },
          '4xl': { value: '2.25rem' },
        },
        spacing: {
          '1': { value: '0.25rem' },
          '2': { value: '0.5rem' },
          '3': { value: '0.75rem' },
          '4': { value: '1rem' },
          '5': { value: '1.25rem' },
          '6': { value: '1.5rem' },
          '8': { value: '2rem' },
          '10': { value: '2.5rem' },
          '12': { value: '3rem' },
          '16': { value: '4rem' },
          '20': { value: '5rem' },
        },
        radii: {
          sm: { value: '0.375rem' },
          md: { value: '0.5rem' },
          lg: { value: '0.75rem' },
          xl: { value: '1rem' },
          full: { value: '9999px' },
        },
        shadows: {
          sm: { value: '0 1px 2px 0 rgb(0 0 0 / 0.05)' },
          md: { value: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' },
          lg: { value: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' },
          xl: { value: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' },
        },
      },
      semanticTokens: {
        colors: {
          bg: {
            default: { value: '#F8FAFC' },
            canvas: { value: '#FFFFFF' },
            subtle: { value: '#F1F5F9' },
            muted: { value: '#E2E8F0' },
          },
          fg: {
            default: { value: '#0F172A' },
            muted: { value: '#64748B' },
            subtle: { value: '#94A3B8' },
            onPrimary: { value: '#FFFFFF' },
          },
          border: {
            default: { value: '#E2E8F0' },
            muted: { value: '#F1F5F9' },
            strong: { value: '#CBD5E1' },
          },
        },
      },
      recipes: {
        button: {
          description: '按钮组件样式',
          base: {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2',
            fontWeight: '500',
            borderRadius: 'md',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontSize: 'sm',
            height: '10',
            px: '4',
            _disabled: {
              opacity: '0.5',
              cursor: 'not-allowed',
            },
          },
          variants: {
            variant: {
              primary: {
                bg: 'primary',
                color: 'text.inverse',
                _hover: { bg: 'primary-dark' },
                _active: { bg: 'primary-dark' },
              },
              secondary: {
                bg: 'surface-muted',
                color: 'text.primary',
                border: '1px solid',
                borderColor: 'border',
                _hover: { bg: 'surface-hover' },
              },
              outline: {
                bg: 'transparent',
                color: 'primary',
                border: '1px solid',
                borderColor: 'primary',
                _hover: { bg: 'primary-light', color: 'white', borderColor: 'primary-light' },
              },
              ghost: {
                bg: 'transparent',
                color: 'text.primary',
                _hover: { bg: 'surface-hover' },
              },
              danger: {
                bg: 'danger',
                color: 'text.inverse',
                _hover: { bg: 'danger' },
              },
            },
            size: {
              sm: {
                height: '8',
                px: '3',
                fontSize: 'xs',
              },
              md: {
                height: '10',
                px: '4',
                fontSize: 'sm',
              },
              lg: {
                height: '12',
                px: '6',
                fontSize: 'md',
              },
            },
          },
          defaultVariants: {
            variant: 'primary',
            size: 'md',
          },
        },
        card: {
          description: '卡片组件样式',
          base: {
            bg: 'surface',
            borderRadius: 'xl',
            border: '1px solid',
            borderColor: 'border',
            overflow: 'hidden',
            transition: 'box-shadow 0.2s ease',
          },
          variants: {
            variant: {
              default: {
                boxShadow: 'sm',
              },
              elevated: {
                boxShadow: 'md',
              },
              flat: {
                boxShadow: 'none',
              },
            },
            padding: {
              none: {},
              sm: { p: '4' },
              md: { p: '6' },
              lg: { p: '8' },
            },
          },
          defaultVariants: {
            variant: 'default',
            padding: 'md',
          },
        },
        input: {
          description: '输入框组件样式',
          base: {
            width: 'full',
            height: '10',
            px: '3',
            fontSize: 'sm',
            borderRadius: 'md',
            border: '1px solid',
            borderColor: 'border',
            bg: 'surface',
            color: 'text.primary',
            transition: 'all 0.2s ease',
            outline: 'none',
            _placeholder: {
              color: 'text.muted',
            },
            _focus: {
              borderColor: 'primary',
              boxShadow: '0 0 0 3px rgb(13 148 136 / 0.1)',
            },
            _disabled: {
              bg: 'surface-muted',
              cursor: 'not-allowed',
              opacity: '0.7',
            },
          },
          variants: {
            size: {
              sm: {
                height: '8',
                px: '2',
                fontSize: 'xs',
              },
              md: {
                height: '10',
                px: '3',
                fontSize: 'sm',
              },
              lg: {
                height: '12',
                px: '4',
                fontSize: 'md',
              },
            },
            invalid: {
              true: {
                borderColor: 'danger',
                _focus: {
                  boxShadow: '0 0 0 3px rgb(239 68 68 / 0.1)',
                },
              },
            },
          },
          defaultVariants: {
            size: 'md',
          },
        },
        badge: {
          description: '徽章组件样式',
          base: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '1',
            px: '2',
            py: '1',
            fontSize: 'xs',
            fontWeight: '500',
            borderRadius: 'full',
            lineHeight: '1',
          },
          variants: {
            variant: {
              primary: {
                bg: 'primary',
                color: 'text.inverse',
              },
              success: {
                bg: 'success',
                color: 'text.inverse',
              },
              warning: {
                bg: 'warning',
                color: 'text.inverse',
              },
              danger: {
                bg: 'danger',
                color: 'text.inverse',
              },
              info: {
                bg: 'info',
                color: 'text.inverse',
              },
              subtle: {
                bg: 'surface-muted',
                color: 'text.secondary',
              },
            },
          },
          defaultVariants: {
            variant: 'primary',
          },
        },
      },
    },
  },
  outdir: 'styled-system',
  jsxFramework: 'react',
})
