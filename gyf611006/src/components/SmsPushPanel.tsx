import React from 'react';
import { MessageSquare, Send, CheckCircle2, Loader2, Building2, Phone } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { nearbyEnterprises } from '../data/enterprises';

export const SmsPushPanel: React.FC = () => {
  const { smsStatus, pushSms } = useAppStore();

  const handlePush = async () => {
    if (smsStatus.isPushing) return;
    await pushSms();
  };

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-dark-200 flex items-center gap-2">
          <MessageSquare size={14} className="text-green-400" />
          SMS 通知推送
        </h3>
        {smsStatus.lastPushTime && (
          <span className="text-xs text-dark-500">
            上次推送: {formatTime(smsStatus.lastPushTime)}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {nearbyEnterprises.map((ent, index) => {
          const isPushed = smsStatus.lastPushTime && index < smsStatus.pushedCount;
          
          return (
            <div
              key={ent.id}
              className={`p-3 rounded-lg border transition-all ${
                isPushed
                  ? 'bg-safety-500/10 border-safety-500/30'
                  : 'bg-dark-800 border-dark-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <div className={`w-8 h-8 rounded flex items-center justify-center ${
                    isPushed ? 'bg-safety-500/20' : 'bg-dark-700'
                  }`}>
                    <Building2
                      size={14}
                      className={isPushed ? 'text-safety-400' : 'text-dark-400'}
                    />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${
                      isPushed ? 'text-safety-300' : 'text-dark-200'
                    }`}>
                      {ent.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-dark-500">
                      <span className="flex items-center gap-1">
                        <Phone size={10} />
                        {ent.phone}
                      </span>
                      <span>{ent.distance} · {ent.distance}m</span>
                    </div>
                  </div>
                </div>
                {isPushed && (
                  <CheckCircle2 size={16} className="text-safety-400" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={handlePush}
        disabled={smsStatus.isPushing}
        className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
          smsStatus.isPushing
            ? 'bg-dark-700 text-dark-400 cursor-wait'
            : 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30 active:scale-[0.98]'
        }`}
      >
        {smsStatus.isPushing ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>推送中 ({smsStatus.pushedCount}/{smsStatus.totalCount})</span>
          </>
        ) : (
          <>
            <Send size={18} />
            <span>一键推送安全通知</span>
          </>
        )}
      </button>

      {smsStatus.lastPushTime && !smsStatus.isPushing && (
        <p className="text-xs text-center text-safety-400 mt-2">
          ✓ 已成功向 {smsStatus.pushedCount} 家企业发送通知
        </p>
      )}

      <p className="text-xs text-center text-dark-500 mt-2">
        通知内容：园区发生化学品泄漏，请立即启动应急预案
      </p>
    </div>
  );
};
