import { useAppStore } from '@/store/useAppStore'
import { calcStats } from '@/utils/statistics'
import { OPERATORS } from '@/mock/data'
import type { Mussel, ReInspectionOrder, Operator, ThicknessStats, PoolHistoryEntry } from '@/types'
import { POOL_HISTORY } from '@/mock/data'

export function useCurrentMussel(): Mussel | null {
  const mussels = useAppStore((s) => s.mussels)
  const currentMusselId = useAppStore((s) => s.currentMusselId)
  return mussels.find((m) => m.id === currentMusselId) ?? null
}

export function useCurrentStats(): ThicknessStats {
  const mussel = useCurrentMussel()
  return calcStats(mussel?.points ?? [])
}

export function useCurrentOrders(): ReInspectionOrder[] {
  const mussel = useCurrentMussel()
  const orders = useAppStore((s) => s.reInspectionOrders)
  if (!mussel) return []
  return orders.filter((o) => o.musselId === mussel.id)
}

export function useCurrentOperator(): Operator {
  const opId = useAppStore((s) => s.currentOperatorId)
  return OPERATORS.find((o) => o.id === opId) ?? OPERATORS[0]
}

export function usePoolHistory(poolId: string): PoolHistoryEntry[] {
  return POOL_HISTORY[poolId] ?? []
}
