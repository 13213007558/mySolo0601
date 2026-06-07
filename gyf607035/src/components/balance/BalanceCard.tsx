import { useAppStore } from "@/store/useAppStore";
import { TrendingDown, Wallet, AlertTriangle, PiggyBank } from "lucide-react";
import { formatMoney } from "@/data/mockData";

export const BalanceCard = () => {
  const { balance } = useAppStore();
  const isNegative = balance.remainingBalance < 0;
  const usedPct = Math.min(
    100,
    Math.max(0, (balance.verifiedAmount / balance.initialBalance) * 100)
  );

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-6 shadow-lg animate-fade-in-up stagger-1 ${
        isNegative
          ? "bg-gradient-to-br from-danger-500 via-danger-600 to-danger-400 animate-pulse-border"
          : "bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700"
      }`}
    >
      <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -left-6 -bottom-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <PiggyBank className="w-4 h-4" />
              <span>{balance.month} · 费用余额监控墙</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-white/70 text-lg">剩余</span>
              <span
                className={`font-display text-5xl text-white ${
                  isNegative ? "animate-pulse" : ""
                }`}
              >
                {formatMoney(balance.remainingBalance)}
              </span>
            </div>
            {isNegative && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-medium backdrop-blur">
                <AlertTriangle className="w-3.5 h-3.5" />
                月底余额为负，请立即复核！
              </div>
            )}
          </div>

          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-white/80 text-xs mb-2">
            <span className="flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              已核销 {usedPct.toFixed(1)}%
            </span>
            <span>月初 {formatMoney(balance.initialBalance)}</span>
          </div>
          <div className="h-2 rounded-full bg-white/15 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isNegative ? "bg-white" : "bg-white/80"
              }`}
              style={{ width: `${Math.min(usedPct, 100)}%` }}
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-white/10 backdrop-blur px-3 py-2.5">
            <div className="text-[11px] text-white/70">月初余额</div>
            <div className="text-sm font-semibold text-white mt-0.5">
              {formatMoney(balance.initialBalance)}
            </div>
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur px-3 py-2.5">
            <div className="text-[11px] text-white/70">已核销</div>
            <div className="text-sm font-semibold text-white mt-0.5">
              {formatMoney(balance.verifiedAmount)}
            </div>
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur px-3 py-2.5">
            <div className="text-[11px] text-white/70">剩余额度</div>
            <div
              className={`text-sm font-semibold mt-0.5 ${
                isNegative ? "text-yellow-200" : "text-white"
              }`}
            >
              {formatMoney(balance.remainingBalance)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
