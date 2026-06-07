import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import Button from './Button';

const SHIFT_OPTIONS = ['早班', '中班', '白班', '夜班'];

const formSchema = z.object({
  babyName: z.string().min(1, '请输入宝宝姓名'),
  babyId: z.string().min(1, '请输入宝宝编号'),
  originalShift: z.string().min(1, '请选择原班次'),
  originalDate: z.string().min(1, '请选择原日期'),
  targetShift: z.string().min(1, '请选择改期班次'),
  targetDate: z.string().min(1, '请选择改期日期'),
  reason: z.string().min(1, '请输入改期原因'),
  sourceFileName: z.string().min(1, '请输入来源文件名'),
});

export type RecordFormValues = z.infer<typeof formSchema>;

interface RecordFormProps {
  defaultValues?: Partial<RecordFormValues>;
  onSubmit: (values: RecordFormValues) => void;
  loading?: boolean;
  submitText?: string;
}

interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ label, error, required, children }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-status-red ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-status-red">{error}</p>}
    </div>
  );
}

export default function RecordForm({
  defaultValues,
  onSubmit,
  loading,
  submitText = '提交',
}: RecordFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      babyName: '',
      babyId: '',
      originalShift: '',
      originalDate: '',
      targetShift: '',
      targetDate: '',
      reason: '',
      sourceFileName: '',
      ...defaultValues,
    },
  });

  const inputClass = (err?: string) =>
    cn(
      'w-full rounded-md border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors',
      err
        ? 'border-status-red focus:border-status-red focus:ring-status-red/20'
        : 'border-gray-300 focus:border-ink-blue focus:ring-ink-blue/20 bg-white'
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="宝宝姓名" required error={errors.babyName?.message}>
          <input
            type="text"
            placeholder="请输入宝宝姓名"
            className={inputClass(errors.babyName?.message)}
            {...register('babyName')}
          />
        </Field>

        <Field label="宝宝编号" required error={errors.babyId?.message}>
          <input
            type="text"
            placeholder="如：B001"
            className={inputClass(errors.babyId?.message)}
            {...register('babyId')}
          />
        </Field>

        <Field label="原班次" required error={errors.originalShift?.message}>
          <select
            className={inputClass(errors.originalShift?.message)}
            {...register('originalShift')}
          >
            <option value="">请选择班次</option>
            {SHIFT_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <Field label="原日期" required error={errors.originalDate?.message}>
          <input
            type="date"
            className={inputClass(errors.originalDate?.message)}
            {...register('originalDate')}
          />
        </Field>

        <Field label="改期班次" required error={errors.targetShift?.message}>
          <select
            className={inputClass(errors.targetShift?.message)}
            {...register('targetShift')}
          >
            <option value="">请选择班次</option>
            {SHIFT_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <Field label="改期日期" required error={errors.targetDate?.message}>
          <input
            type="date"
            className={inputClass(errors.targetDate?.message)}
            {...register('targetDate')}
          />
        </Field>

        <Field label="来源文件名" required error={errors.sourceFileName?.message}>
          <input
            type="text"
            placeholder="如：换班申请_20260607.xlsx"
            className={inputClass(errors.sourceFileName?.message)}
            {...register('sourceFileName')}
          />
        </Field>

        <div className="md:col-span-2">
          <Field label="改期原因" required error={errors.reason?.message}>
            <textarea
              rows={3}
              placeholder="请输入改期原因说明"
              className={cn(inputClass(errors.reason?.message), 'resize-y')}
              {...register('reason')}
            />
          </Field>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={loading}>
          {submitText}
        </Button>
      </div>
    </form>
  );
}
