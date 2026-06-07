import { useRef, useState } from 'react';
import { X, ImagePlus, Upload } from 'lucide-react';
import { compressImage } from '@/utils/helpers';

export interface PhotoInput {
  dataUrl: string;
  description: string;
}

interface Props {
  value: PhotoInput[];
  onChange: (val: PhotoInput[]) => void;
  max?: number;
}

export function PhotoUploader({ value, onChange, max = 3 }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    if (value.length >= max) return;
    setLoading(true);
    const picked = Array.from(files).slice(0, max - value.length);
    const next: PhotoInput[] = [];
    for (const f of picked) {
      try {
        const dataUrl = await compressImage(f);
        next.push({ dataUrl, description: '' });
      } catch {
        /* ignore */
      }
    }
    onChange([...value, ...next]);
    setLoading(false);
    if (ref.current) ref.current.value = '';
  };

  const updateDesc = (idx: number, desc: string) => {
    onChange(value.map((p, i) => (i === idx ? { ...p, description: desc } : p)));
  };

  const remove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {value.map((p, idx) => (
          <div key={idx} className="relative rounded-xl2 border border-muted overflow-hidden bg-white group">
            <img src={p.dataUrl} alt="" className="w-full h-32 object-cover" />
            <button
              type="button"
              onClick={() => remove(idx)}
              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
            <input
              type="text"
              className="w-full px-3 py-2 text-xs border-t border-muted outline-none focus:bg-cream"
              placeholder="照片说明（可选）"
              value={p.description}
              onChange={(e) => updateDesc(idx, e.target.value)}
            />
          </div>
        ))}
        {value.length < max && (
          <button
            type="button"
            onClick={() => ref.current?.click()}
            className="h-48 rounded-xl2 border-2 border-dashed border-muted text-gray-400 flex flex-col items-center justify-center gap-2 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
          >
            {loading ? (
              <Upload className="animate-pulse" size={28} />
            ) : (
              <ImagePlus size={28} />
            )}
            <span className="text-xs">上传照片（{value.length}/{max}）</span>
          </button>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
