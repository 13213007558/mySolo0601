import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { ChevronLeft, FilePlus2, Sparkles, CheckCircle2 } from 'lucide-react';
import { CATEGORY_EMOJI, type ExpenseCategory } from '../../shared/types';
import { formatDate } from '../utils/helpers';

const CATEGORIES: ExpenseCategory[] = ['奶粉', '尿不湿', '医疗', '辅食', '其他'];

export default function SupplementPage() {
  const navigate = useNavigate();
  const { records, supplementRecord, currentUserName, addRecord } =
    useAppStore();

  const [originalId, setOriginalId] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('奶粉');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [dueDate, setDueDate] = useState(formatDate(new Date().toISOString()));
  const [phone, setPhone] = useState('');
  const [remark, setRemark] = useState('');
  const [mode, setMode] = useState<'supplement' | 'new'>('new');
  const [success, setSuccess] = useState(false);

  const supplementableRecords = records.filter(
    (r) => !r.isSupplement && r.status !== 'supplemented' && !r.isDeleted,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) return;

    if (mode === 'supplement' && originalId) {
      supplementRecord(
        originalId,
        {
          category,
          amount: amountNum,
          merchant,
          dueDate,
          phone: phone || undefined,
          status: 'verified',
        },
        remark || '手工补录',
        currentUserName,
      );
    } else {
      addRecord({
        category,
        amount: amountNum,
        merchant,
        dueDate,
        phone: phone || undefined,
        status: 'pending',
        sampleKey: `manual-${Date.now()}-${category}`,
      });
    }
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen pb-16">
        <div className="container mx-auto px-4 pt-6 max-w-xl">
          <div className="card text-center py-10 animate-scale-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mb-5">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h3 className="font-display text-2xl text-gray-800 mb-2">
              {mode === 'supplement' ? '补录成功 ✨' : '录入成功 🎉'}
            </h3>
            <p className="text-gray-500 mb-6">
              {mode === 'supplement'
                ? '已保存补录前后差异快照，主管可随时复查'
                : '已添加到提醒墙等待核销'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => navigate('/dashboard')} className="btn-primary">
                回到提醒墙
              </button>
              <button
                onClick={() => {
                  setSuccess(false);
                  setAmount('');
                  setMerchant('');
                  setRemark('');
                  setPhone('');
                }}
                className="btn-secondary"
              >
                继续录入
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <div className="container mx-auto px-4 pt-6 max-w-xl">
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-ghost mb-5 -ml-2 text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          返回提醒墙
        </button>

        <div className="mb-6 animate-fade-in-up">
          <h2 className="font-display text-2xl text-gray-800 mb-1 flex items-center gap-2">
            <FilePlus2 className="w-6 h-6 text-warm-orange" />
            {mode === 'supplement' ? '手工补录费用' : '录入新费用'}
          </h2>
          <p className="text-sm text-gray-500">
            {mode === 'supplement'
              ? '补录会保留原记录快照，方便主管比对差异'
              : '按真实票据填写，月底不会突然变负'}
          </p>
        </div>

        <div className="card animate-scale-in">
          <div className="flex items-center gap-2 mb-6 p-1 bg-cream-50 rounded-xl">
            <button
              onClick={() => setMode('new')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'new'
                  ? 'bg-white text-warm-orange shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              ✨ 新增费用
            </button>
            <button
              onClick={() => setMode('supplement')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'supplement'
                  ? 'bg-white text-violet-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🔁 补录旧账
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'supplement' && (
              <div>
                <label className="label-field flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  对应原记录（原记录会标记为已补录）
                </label>
                <select
                  value={originalId}
                  onChange={(e) => setOriginalId(e.target.value)}
                  required={mode === 'supplement'}
                  className="input-field"
                >
                  <option value="">请选择原记录...</option>
                  {supplementableRecords.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.category} ¥{r.amount} - {r.merchant} ({r.dueDate})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="label-field">费用类别</label>
              <div className="grid grid-cols-5 gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`
                      flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs font-medium
                      transition-all border-2
                      ${
                        category === c
                          ? 'border-warm-orange bg-cream-50 text-warm-orange shadow-sm'
                          : 'border-transparent bg-cream-50/50 text-gray-600 hover:bg-cream-50'
                      }
                    `}
                  >
                    <span className="text-xl">{CATEGORY_EMOJI[c]}</span>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label-field">金额 (元)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="例如：388.00"
                  required
                  className="input-field font-display text-lg text-warm-orange"
                />
              </div>
              <div>
                <label className="label-field">到期日</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="label-field">商家名称</label>
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="例如：爱婴室母婴店"
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="label-field">联系手机号（可选）</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="11位手机号，格式不对会提示"
                className="input-field font-mono"
              />
            </div>

            {mode === 'supplement' && (
              <div>
                <label className="label-field">补录原因</label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="例如：6月7日遗漏的网购记录"
                  rows={2}
                  className="input-field resize-none"
                />
              </div>
            )}

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn-ghost flex-1"
              >
                取消
              </button>
              <button
                type="submit"
                className={
                  mode === 'supplement'
                    ? 'flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-violet-500 text-white font-medium shadow-card hover:bg-violet-600 hover:shadow-card-hover active:scale-[0.97] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2'
                    : 'btn-primary flex-1'
                }
              >
                {mode === 'supplement' ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    提交补录
                  </>
                ) : (
                  <>
                    <FilePlus2 className="w-4 h-4" />
                    提交录入
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
